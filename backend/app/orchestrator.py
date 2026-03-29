"""
Orchestrator — runs the full ArthSaathi agent pipeline.

Pipeline order:
  1. ParserAgent
  2. NAVAgent
  3. Parallel: ReturnsAgent, OverlapAgent, CostAgent, BenchmarkAgent, ProjectionAgent
  4. HealthAgent
  5. AdvisorAgent

Streams AgentEvents to the frontend via SSE.
Assembles the final AnalysisResponse JSON.
"""
import asyncio
import time
from typing import Any, AsyncGenerator, Dict

from app.agents.base import AgentEvent
from app.agents.parser import ParserAgent
from app.agents.nav import NAVAgent
from app.agents.returns import ReturnsAgent
from app.agents.overlap import OverlapAgent
from app.agents.cost import CostAgent
from app.agents.benchmark import BenchmarkAgent
from app.agents.projection import ProjectionAgent
from app.agents.health import HealthAgent
from app.agents.advisor import AdvisorAgent
from app.utils import normalize_cas_data, mask_pan

COMPLIANCE_DISCLAIMER = (
    "This report is AI-generated financial analysis for educational and informational purposes only. "
    "It does not constitute investment advice, tax advice, or a recommendation to buy, sell, or hold any security. "
    "ArthSaathi is not a SEBI-registered investment advisor. "
    "Past performance does not guarantee future results. "
    "Consult a SEBI-registered investment advisor before making financial decisions."
)


async def run_pipeline(
    file_bytes: bytes,
    password: str,
    event_queue: asyncio.Queue,
) -> Dict[str, Any]:
    """
    Execute the full analysis pipeline.
    Events are pushed to event_queue — the caller drains it for SSE.
    Returns the complete analysis dict on success.
    Raises ValueError with an error_code prefix on known failures.
    """
    t0 = time.monotonic()

    # ── Helper: announce each agent as queued ──────────────────────────────
    def _queued(name: str) -> None:
        event_queue.put_nowait(AgentEvent(
            agent=name, status="queued", message=f"{name} queued", severity="info"
        ))

    for name in [
        "parser_agent", "nav_agent", "returns_agent",
        "overlap_agent", "cost_agent", "benchmark_agent",
        "projection_agent", "health_agent", "advisor_agent",
    ]:
        _queued(name)

    # ── 1. Parser ──────────────────────────────────────────────────────────
    parser = ParserAgent(event_queue)
    raw_data = await parser.run(file_bytes, password)

    # Normalize to internal fund list
    funds = normalize_cas_data(raw_data)
    if not funds:
        raise ValueError("PARSE_FAILED: No fund data found in the uploaded CAS statement.")

    # Investor metadata
    investor_info = raw_data.get("investor_info") or {}
    statement_period = raw_data.get("statement_period") or {}

    # ── 2. NAV Agent ────────────────────────────────────────────────────────
    nav_agent = NAVAgent(event_queue)
    funds = await nav_agent.run(funds)

    # ── 3. Parallel computation agents ─────────────────────────────────────
    returns_agent = ReturnsAgent(event_queue)
    overlap_agent = OverlapAgent(event_queue)

    # Returns and Overlap can run fully in parallel
    (funds_with_xirr, portfolio_xirr), overlap_result = await asyncio.gather(
        returns_agent.run(funds),
        overlap_agent.run(funds),
    )
    funds = funds_with_xirr  # enrich

    # Cost and Benchmark need the xirr-enriched funds; run them in parallel
    cost_agent = CostAgent(event_queue)
    benchmark_agent = BenchmarkAgent(event_queue)

    (funds_with_cost, expense_summary), funds_with_benchmark = await asyncio.gather(
        cost_agent.run(funds),
        benchmark_agent.run(funds),
    )

    # Merge cost and benchmark results into a single fund list
    cost_map = {f.get("scheme_name"): f.get("expense") for f in funds_with_cost}
    funds = [
        {**f, "expense": cost_map.get(f.get("scheme_name")) or {}}
        for f in funds_with_benchmark
    ]

    # ── 4. Projection Agent ─────────────────────────────────────────────────
    projection_agent = ProjectionAgent(event_queue)
    portfolio_xirr_rate = portfolio_xirr.get("rate") or 0.10  # fallback 10%
    total_current_value = sum(f.get("current_value") or 0 for f in funds)

    wealth_projection = await projection_agent.run(
        current_value=total_current_value,
        portfolio_xirr=portfolio_xirr_rate,
        expense_summary=expense_summary,
        funds=funds,
    )

    # ── 5. Health Score ─────────────────────────────────────────────────────
    health_agent = HealthAgent(event_queue)
    health_score = await health_agent.run(
        funds=funds,
        portfolio_xirr=portfolio_xirr,
        overlap_analysis=overlap_result,
        expense_summary=expense_summary,
    )

    # ── 6. Assemble partial response for the Advisor ────────────────────────
    partial = _assemble_response(
        investor_info=investor_info,
        statement_period=statement_period,
        funds=funds,
        portfolio_xirr=portfolio_xirr,
        overlap_result=overlap_result,
        expense_summary=expense_summary,
        health_score=health_score,
        wealth_projection=wealth_projection,
        processing_ms=int((time.monotonic() - t0) * 1000),
    )

    # ── 7. Advisor Agent ────────────────────────────────────────────────────
    advisor_agent = AdvisorAgent(event_queue)
    rebalancing_plan = await advisor_agent.run(partial)

    # ── 8. Final response ───────────────────────────────────────────────────
    partial["rebalancing_plan"] = rebalancing_plan
    partial["processing_time_ms"] = int((time.monotonic() - t0) * 1000)
    return partial


# ---------------------------------------------------------------------------
# Response assembly
# ---------------------------------------------------------------------------

def _assemble_response(
    investor_info: Dict,
    statement_period: Dict,
    funds: list,
    portfolio_xirr: Dict,
    overlap_result: Dict,
    expense_summary: Dict,
    health_score: Dict,
    wealth_projection: Dict,
    processing_ms: int,
) -> Dict[str, Any]:
    """Build the full API response dict from agent outputs."""

    total_value = sum(f.get("current_value") or 0 for f in funds)
    total_invested = sum(f.get("invested_value") or 0 for f in funds)

    equity_value = sum(
        f.get("current_value") or 0
        for f in funds
        if not _is_debt_fund(f)
    )
    debt_value = total_value - equity_value
    equity_pct = round(equity_value / total_value * 100, 1) if total_value else 0
    debt_pct = round(debt_value / total_value * 100, 1) if total_value else 0

    regular_count = sum(1 for f in funds if not f.get("is_direct"))
    direct_count = sum(1 for f in funds if f.get("is_direct"))

    # Serialise funds
    fund_list = []
    for f in funds:
        fund_list.append({
            "scheme_name": f.get("scheme_name"),
            "amfi_code": f.get("amfi_code"),
            "folio": f.get("folio"),
            "amc": f.get("amc"),
            "category": f.get("category"),
            "is_direct": f.get("is_direct", False),
            "units": f.get("units"),
            "current_nav": f.get("current_nav"),
            "current_value": f.get("current_value"),
            "invested_value": f.get("invested_value"),
            "absolute_return_pct": _absolute_return(f),
            "xirr": f.get("xirr"),
            "benchmark": f.get("benchmark"),
            "expense": f.get("expense"),
            "overlap": {
                "holdings_available": bool(f.get("amfi_code")),
                "top_holdings": [],  # populated if holdings.json has data for this fund
            },
        })

    # Mask PAN
    pan_raw = investor_info.get("pan") or ""
    pan_masked = mask_pan(pan_raw) if pan_raw else None

    return {
        "status": "success",
        "compliance_disclaimer": COMPLIANCE_DISCLAIMER,
        "processing_time_ms": processing_ms,
        "investor": {
            "name": investor_info.get("name") or "Investor",
            "email": investor_info.get("email") or "",
            "pan_masked": pan_masked,
        },
        "statement_period": {
            "from": str(statement_period.get("from") or ""),
            "to": str(statement_period.get("to") or ""),
        },
        "portfolio_summary": {
            "total_current_value": round(total_value, 2),
            "total_invested": round(total_invested, 2),
            "total_funds": len(funds),
            "total_folios": len({f.get("folio") for f in funds if f.get("folio")}),
            "equity_allocation_pct": equity_pct,
            "debt_allocation_pct": debt_pct,
            "regular_plan_count": regular_count,
            "direct_plan_count": direct_count,
        },
        "portfolio_xirr": portfolio_xirr,
        "funds": fund_list,
        "overlap_analysis": overlap_result,
        "expense_summary": expense_summary,
        "health_score": health_score,
        "wealth_projection": wealth_projection,
    }


def _is_debt_fund(fund: Dict) -> bool:
    cat = (fund.get("category") or "").lower()
    return any(k in cat for k in ["debt", "liquid", "overnight", "money market", "gilt", "credit risk"])


def _absolute_return(fund: Dict) -> float:
    invested = fund.get("invested_value") or 0
    current = fund.get("current_value") or 0
    if invested <= 0:
        return 0.0
    return round((current - invested) / invested * 100, 2)
