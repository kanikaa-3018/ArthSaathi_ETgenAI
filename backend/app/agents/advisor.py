"""
Advisor Agent — LLM abstraction layer + rule-based fallback.
Inputs: all analysis results. Outputs: markdown rebalancing plan.
LLM priority: ANTHROPIC_API_KEY → OPENAI_API_KEY → GOOGLE_API_KEY → rule engine.
"""
import json
from typing import Any, Dict, List, Optional

from app.agents.base import BaseAgent
from app.config import settings
from app.utils import format_inr

SYSTEM_PROMPT = """You are an educational portfolio analyst reviewing an Indian mutual fund portfolio (not a SEBI-registered investment advisor). You have been given the complete quantitative analysis — XIRR, overlap, expense drag, benchmark alpha, health score, and wealth gap projection. Your job is to produce a clear, actionable rebalancing plan.

RULES:
1. Begin with: "This analysis is for educational purposes. Consult a SEBI-registered investment advisor before making changes."
2. Never recommend specific fund names to buy. Describe the TYPE needed (e.g., "a direct-plan Nifty 50 index fund with TER below 0.30%").
3. Always recommend switching regular to direct plans when applicable. Quantify the savings.
4. When overlap exceeds 30%, recommend consolidating. Say which to keep (higher alpha, lower TER).
5. When a fund has negative alpha over 3+ years, recommend replacing with category index fund.
6. When TER exceeds 1.5% equity / 0.8% debt, flag as high cost.
7. Write in second person ("Your portfolio..."). Plain English. Define any term on first use.
8. Indian number formatting (lakhs, crores). ₹ symbol.
9. Every recommendation includes quantified impact ("This saves ₹X per year").
10. Exactly 4 sections, each 3-5 sentences. No bullet points — paragraphs only.

SECTIONS:
## What's Working Well
## The Biggest Problem
## Three Things to Do This Week
## What This Saves You"""


def _serialize_for_llm(analysis: Dict[str, Any]) -> str:
    """Convert analysis dict to a compact JSON string for the LLM user message."""
    # Only include key fields to stay within token limits
    summary = {
        "portfolio_xirr": analysis.get("portfolio_xirr"),
        "health_score": analysis.get("health_score"),
        "expense_summary": analysis.get("expense_summary"),
        "overlap_analysis": {
            k: v for k, v in (analysis.get("overlap_analysis") or {}).items()
            if k != "matrix"  # matrix can be large
        } if analysis.get("overlap_analysis") else None,
        "wealth_projection_gap_10yr": (analysis.get("wealth_projection") or {}).get("gap_at_10yr"),
        "funds": [
            {
                "scheme_name": f.get("scheme_name"),
                "is_direct": f.get("is_direct"),
                "current_value": f.get("current_value"),
                "xirr": f.get("xirr"),
                "benchmark": f.get("benchmark"),
                "expense": {k: v for k, v in (f.get("expense") or {}).items()
                            if k in ("estimated_ter", "annual_drag_rupees", "potential_annual_savings")},
            }
            for f in (analysis.get("funds") or [])
        ],
    }
    return json.dumps(summary, default=str, ensure_ascii=False)


def _llm_routing_meta(provider: str) -> tuple[str, str]:
    """Rubric / API: normalized provider id + concrete model id for UI badge."""
    if provider == "claude":
        return "anthropic", settings.ANTHROPIC_MODEL or "claude"
    if provider == "gpt4o":
        return "openai", settings.OPENAI_CHAT_MODEL or "gpt-4o"
    if provider == "gemini":
        return "google", settings.GEMINI_CHAT_MODEL or "gemini-2.0-flash"
    return "rule_engine", "deterministic"


class AdvisorAgent(BaseAgent):
    """
    LLM-powered rebalancing advisor.
    Falls back to a rule engine if no API key is configured.
    """

    agent_name = "advisor_agent"

    async def run(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        self.emit_running("Generating AI rebalancing plan…", step=1, total_steps=2)

        user_message = (
            "Here is the complete quantitative analysis for this portfolio. "
            "Please write the rebalancing plan following the exact format described:\n\n"
            + _serialize_for_llm(analysis)
        )

        # ── Try LLM providers in priority order ────────────────────────────
        content: Optional[str] = None
        provider: str = "rule_engine"

        if settings.ANTHROPIC_API_KEY:
            content, provider = await self._call_anthropic(user_message)

        if content is None and settings.OPENAI_API_KEY:
            content, provider = await self._call_openai(user_message)

        if content is None and settings.GOOGLE_API_KEY:
            content, provider = await self._call_gemini(user_message)

        if content is None:
            content = self._rule_based_plan(analysis)
            provider = "rule_engine"
            ai_generated = False
        else:
            ai_generated = True

        self.emit_completed("Rebalancing plan ready", severity="success")
        llm_provider, llm_model = _llm_routing_meta(provider)
        return {
            "ai_generated": ai_generated,
            "ai_provider": provider,
            "llm_provider": llm_provider,
            "llm_model": llm_model,
            "content": content,
        }

    # -----------------------------------------------------------------------
    async def _call_anthropic(self, user_message: str):
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
            self.emit_progress("Using Claude for analysis…", step=2, total_steps=2)
            response = client.messages.create(
                model=settings.ANTHROPIC_MODEL,
                max_tokens=1500,
                temperature=0.3,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_message}],
            )
            return response.content[0].text, "claude"
        except Exception as e:
            self.emit_warning(f"Claude failed: {e}")
            return None, "claude"

    async def _call_openai(self, user_message: str):
        try:
            from openai import OpenAI
            model_id = settings.OPENAI_CHAT_MODEL or "gpt-4o"
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            self.emit_progress(f"Using OpenAI ({model_id}) for analysis…", step=2, total_steps=2)
            response = client.chat.completions.create(
                model=model_id,
                max_tokens=1500,
                temperature=0.3,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_message},
                ],
            )
            return response.choices[0].message.content, "gpt4o"
        except Exception as e:
            self.emit_warning(f"OpenAI advisor call failed: {e}")
            return None, "gpt4o"

    async def _call_gemini(self, user_message: str):
        try:
            from google import genai
            from google.genai import types

            model_id = settings.GEMINI_CHAT_MODEL or "gemini-2.0-flash"
            client = genai.Client(api_key=settings.GOOGLE_API_KEY)
            self.emit_progress(f"Using Gemini ({model_id}) for analysis…", step=2, total_steps=2)
            response = await client.aio.models.generate_content(
                model=model_id,
                contents=user_message,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    temperature=0.3,
                    max_output_tokens=1500,
                ),
            )
            return (response.text or "").strip(), "gemini"
        except Exception as e:
            self.emit_warning(f"Gemini failed: {e}")
            return None, "gemini"

    # -----------------------------------------------------------------------
    def _rule_based_plan(self, analysis: Dict[str, Any]) -> str:
        """Generate a concrete plan directly from computation results."""
        funds = analysis.get("funds") or []
        expense = analysis.get("expense_summary") or {}
        health = analysis.get("health_score") or {}
        overlap = analysis.get("overlap_analysis") or {}
        projection = analysis.get("wealth_projection") or {}

        regular_count = expense.get("regular_plan_count", 0)
        annual_savings = expense.get("total_potential_annual_savings", 0)
        annual_drag = expense.get("total_annual_drag", 0)
        gap_10 = projection.get("gap_at_10yr", 0)

        # Best/worst funds
        best_fund = max(
            (f for f in funds if (f.get("benchmark") or {}).get("alpha") is not None),
            key=lambda f: (f.get("benchmark") or {}).get("alpha", -99),
            default=None,
        )
        worst_fund = min(
            (f for f in funds if (f.get("benchmark") or {}).get("alpha") is not None),
            key=lambda f: (f.get("benchmark") or {}).get("alpha", 99),
            default=None,
        )

        best_name = (best_fund or {}).get("scheme_name", "your best-performing fund") if best_fund else "your top fund"
        worst_name = (worst_fund or {}).get("scheme_name", "your worst-performing fund") if worst_fund else "your weakest fund"
        worst_alpha = ((worst_fund or {}).get("benchmark") or {}).get("alpha_display", "N/A") if worst_fund else "N/A"

        max_overlap = overlap.get("max_pairwise_overlap") or 0
        overlap_matrix = overlap.get("matrix") or []
        top_overlap_pair = ""
        if overlap_matrix:
            top = max(
                (r for r in overlap_matrix if r.get("overlap") is not None),
                key=lambda r: r.get("overlap", 0),
                default=None,
            )
            if top:
                top_overlap_pair = f"{top['fund_a'][:25]} and {top['fund_b'][:25]}"

        return f"""This analysis is for educational purposes. Consult a SEBI-registered investment advisor before making changes.

## What's Working Well

Your portfolio currently holds {len(funds)} funds across multiple categories, showing a structured investment approach. {best_name[:40]} is your strongest performer, generating positive alpha above its benchmark. Your portfolio XIRR of {(analysis.get("portfolio_xirr") or {}).get("display", "N/A")} reflects the compounding power of consistent SIP investing. The health score of {health.get("score", 0)}/100 (Grade {health.get("grade", "N/A")}) confirms there is meaningful room to optimise what you already have.

## The Biggest Problem

Your portfolio is losing {format_inr(annual_drag)} every single year to Total Expense Ratios (TER) — the annual fee each fund deducts from your investment, reducing your actual returns. {"Of your " + str(len(funds)) + " funds, " + str(regular_count) + " are regular plans — these charge a distribution commission of 0.8–1.5% per year above what a direct plan would cost." if regular_count > 0 else "Expense drag is compounding silently against you."} {"Additionally, " + top_overlap_pair + " share " + str(max_overlap) + "% of the same stocks — this is portfolio duplication, not diversification." if max_overlap > 30 and top_overlap_pair else ""} Over 10 years, the gap between your current trajectory and an optimised portfolio is {format_inr(gap_10)}.

## Three Things to Do This Week

First, switch your {regular_count} regular plan fund{"s" if regular_count != 1 else ""} to their direct-plan equivalents — the identical fund managed by the same AMC but without distributor commission. This alone saves {format_inr(annual_savings)} per year and can be done through any direct platform (Zerodha Coin, Groww Direct, or directly via the AMC website) within 2–3 days. Second, {"consolidate the overlap between " + top_overlap_pair[:50] + " by redeeming the one with higher TER and lower alpha, and redirecting that SIP into a direct-plan Nifty 50 or Nifty 500 index fund with TER below 0.30%." if max_overlap > 30 and top_overlap_pair else "review your fund list for any with consistent negative alpha and consider replacing them with a low-cost index fund in the same category."}  Third, review {worst_name[:40]} which is generating alpha of {worst_alpha} — a consistent underperformer relative to a simple index fund; consider switching its SIP to a direct-plan index fund in the same category.

## What This Saves You

Switching to direct plans saves {format_inr(annual_savings)} per year — every year, compounding alongside your portfolio. Over 10 years, taking all three actions in this plan could add {format_inr(gap_10)} to your final portfolio value compared to making no changes. That is not market return — that is the same markets, same investments, just eliminating unnecessary fees and redundancy. The fee counter at the top of this report shows you the cost in real time: every second you delay costs money that could otherwise be compounding for you.
"""
