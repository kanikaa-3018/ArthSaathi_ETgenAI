"""
Health Score Agent — 4-dimension scoring (Section 4.6).
Takes pre-computed results from all other agents — never duplicates computation.
"""
from typing import Any, Dict, List, Optional

from app.agents.base import BaseAgent


def _grade(score: int) -> tuple:
    """Return (grade_letter, label)."""
    if score >= 80:
        return "A", "Excellent"
    elif score >= 60:
        return "B", "Good"
    elif score >= 40:
        return "C", "Needs Attention"
    elif score >= 20:
        return "D", "Poor"
    return "F", "Critical"


class HealthAgent(BaseAgent):
    """Computes portfolio health score from pre-computed agent results."""

    agent_name = "health_agent"

    async def run(
        self,
        funds: List[Dict[str, Any]],
        portfolio_xirr: Dict[str, Any],
        overlap_analysis: Optional[Dict[str, Any]],
        expense_summary: Dict[str, Any],
    ) -> Dict[str, Any]:
        self.emit_running("Calculating portfolio health score…", step=1, total_steps=1)

        # ── 1. Diversification (30 pts) ─────────────────────────────────────
        equity_funds = [f for f in funds if not _is_debt(f)]

        if len(equity_funds) == 1:
            div_score = 15
            div_reason = "Only 1 equity fund — neutral score"
        elif overlap_analysis is None:
            div_score = 15
            div_reason = "Overlap data unavailable"
        else:
            max_overlap = overlap_analysis.get("max_pairwise_overlap") or 0
            if max_overlap < 15:
                div_score = 30
                div_reason = f"Low overlap ({max_overlap:.1f}%)"
            elif max_overlap < 30:
                div_score = 20
                div_reason = f"Moderate overlap ({max_overlap:.1f}%)"
            elif max_overlap < 50:
                div_score = 10
                div_reason = f"High overlap ({max_overlap:.1f}%)"
            else:
                div_score = 0
                div_reason = f"Very high overlap ({max_overlap:.1f}%)"

        # ── 2. Cost Efficiency (25 pts) ──────────────────────────────────────
        w_ter = expense_summary.get("weighted_average_ter") or 0
        if w_ter < 0.005:
            cost_score = 25
            cost_reason = f"Excellent TER ({w_ter*100:.2f}%)"
        elif w_ter < 0.010:
            cost_score = 20
            cost_reason = f"Good TER ({w_ter*100:.2f}%)"
        elif w_ter < 0.015:
            cost_score = 12
            cost_reason = f"Average TER ({w_ter*100:.2f}%)"
        elif w_ter < 0.020:
            cost_score = 5
            cost_reason = f"High TER ({w_ter*100:.2f}%)"
        else:
            cost_score = 0
            cost_reason = f"Very high TER ({w_ter*100:.2f}%)"

        # ── 3. Performance (25 pts) ──────────────────────────────────────────
        p_xirr_rate = portfolio_xirr.get("rate")
        # Average benchmark return from funds
        bm_returns = [
            (f.get("benchmark") or {}).get("return")
            for f in funds
            if (f.get("benchmark") or {}).get("return") is not None
        ]
        avg_bm = sum(bm_returns) / len(bm_returns) if bm_returns else None

        if p_xirr_rate is None or avg_bm is None:
            perf_score = 12
            perf_reason = "Benchmark comparison unavailable"
        else:
            diff = p_xirr_rate - avg_bm
            if diff > 0.02:
                perf_score = 25
                perf_reason = f"Portfolio outperforms benchmark by {diff*100:.1f}%"
            elif diff >= 0:
                perf_score = 20
                perf_reason = f"Portfolio matches benchmark (+{diff*100:.1f}%)"
            elif diff >= -0.02:
                perf_score = 10
                perf_reason = f"Portfolio slightly below benchmark ({diff*100:.1f}%)"
            else:
                perf_score = 0
                perf_reason = f"Portfolio underperforms benchmark ({diff*100:.1f}%)"

        # ── 4. Risk Management (20 pts) ──────────────────────────────────────
        cats = {_broad_cat(f) for f in funds}
        amcs = {}
        for f in funds:
            amc = f.get("amc") or "Unknown"
            amcs[amc] = amcs.get(amc, 0) + (f.get("current_value") or 0)
        total_val = sum(amcs.values()) or 1
        max_amc_pct = max(amcs.values()) / total_val if amcs else 1

        has_equity_and_debt = "equity" in cats and "debt" in cats
        risk_score = 0
        risk_parts = []

        risk_score += 10 if has_equity_and_debt else 5
        risk_parts.append("equity+debt mix" if has_equity_and_debt else "equity only")

        risk_score += 5 if len(cats) >= 3 else 2
        risk_parts.append(f"{len(cats)} categories")

        risk_score += 5 if max_amc_pct <= 0.5 else 0
        conc_pct = max_amc_pct * 100
        risk_parts.append(f"top AMC {conc_pct:.0f}%")

        risk_reason = ", ".join(risk_parts)

        # ── Total ────────────────────────────────────────────────────────────
        total_score = div_score + cost_score + perf_score + risk_score
        grade, label = _grade(total_score)

        self.emit_completed(
            f"Health score: {total_score}/100 — Grade {grade} ({label})",
            severity="success" if total_score >= 60 else "warning" if total_score >= 40 else "critical",
        )

        return {
            "score": total_score,
            "grade": grade,
            "label": label,
            "breakdown": {
                "diversification": {"score": div_score, "max": 30, "reason": div_reason},
                "cost_efficiency": {"score": cost_score, "max": 25, "reason": cost_reason},
                "performance": {"score": perf_score, "max": 25, "reason": perf_reason},
                "risk_management": {"score": risk_score, "max": 20, "reason": risk_reason},
            },
        }


def _is_debt(fund: Dict[str, Any]) -> bool:
    cat = (fund.get("category") or "").lower()
    return any(k in cat for k in ["debt", "liquid", "overnight", "money market", "gilt"])


def _broad_cat(fund: Dict[str, Any]) -> str:
    cat = (fund.get("category") or "").lower()
    if any(k in cat for k in ["debt", "liquid", "overnight", "money market", "gilt"]):
        return "debt"
    elif "equity" in cat or "elss" in cat or "cap" in cat or "flexi" in cat:
        return "equity"
    return "other"
