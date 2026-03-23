"""
Goal-based financial planning — pure math, no external APIs.
Spec: EXECUTION_PLAN.md §2.2
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from app.utils import format_inr


def _now_year() -> int:
    return datetime.now(timezone.utc).year


def compute_goal(
    goal_type: str,
    target_amount: Optional[float],
    target_year: int,
    current_age: int,
    monthly_income: float,
    monthly_sip_possible: float,
    portfolio_value: float,
    portfolio_xirr: float,
    inflation_rate: float = 0.06,
    retirement_age: int = 55,
) -> Dict[str, Any]:
    """
    Returns the JSON shape expected by POST /api/goals/calculate.
    """
    now_y = _now_year()
    years_remaining = max(0, target_year - now_y)
    years_to_retire = max(0, retirement_age - current_age)

    # --- Resolve target_amount by goal_type --------------------------------
    if goal_type == "retirement":
        monthly_expenses = monthly_income * 0.5
        annual_expenses_today = monthly_expenses * 12
        annual_expenses_at_retirement = annual_expenses_today * (
            (1 + inflation_rate) ** years_to_retire
        )
        resolved_target = annual_expenses_at_retirement * 25
    elif goal_type == "child_education":
        base_cost = 2_500_000.0
        years = max(0, target_year - now_y)
        resolved_target = base_cost * ((1 + inflation_rate) ** years)
    elif goal_type == "house":
        base_cost = 10_000_000.0 * 0.20
        years = max(0, target_year - now_y)
        resolved_target = base_cost * ((1 + inflation_rate) ** years)
    elif goal_type == "emergency_fund":
        resolved_target = monthly_income * 6
    elif goal_type == "custom":
        if target_amount is None or target_amount <= 0:
            resolved_target = portfolio_value
        else:
            resolved_target = float(target_amount)
    else:
        resolved_target = (target_amount or 0) or portfolio_value

    # Child/house/retirement targets are already in "goal-year" rupees; custom can inflate from today
    if goal_type == "custom":
        inflation_adjusted_target = resolved_target * ((1 + inflation_rate) ** years_remaining)
    else:
        inflation_adjusted_target = resolved_target

    # --- Projected corpus ---------------------------------------------------
    r = max(portfolio_xirr, 0.001)
    projected_corpus = portfolio_value * ((1 + r) ** years_remaining)

    if monthly_sip_possible > 0 and years_remaining > 0:
        monthly_rate = r / 12
        n = years_remaining * 12
        # FV of annuity
        sip_corpus = monthly_sip_possible * (
            ((1 + monthly_rate) ** n - 1) / monthly_rate
        )
        projected_corpus += sip_corpus

    shortfall = max(0.0, inflation_adjusted_target - projected_corpus)
    on_track = shortfall <= 0

    additional_sip = 0.0
    if shortfall > 0 and years_remaining > 0:
        monthly_rate = r / 12
        n = years_remaining * 12
        denom = ((1 + monthly_rate) ** n - 1) / monthly_rate
        if denom > 0:
            additional_sip = shortfall / denom

    # Illustrative 4% withdrawal on projected corpus — not personal financial advice
    monthly_income_in_retirement = (projected_corpus * 0.04) / 12

    recommendations = [
        f"Your inflation-adjusted goal corpus is about {format_inr(inflation_adjusted_target)}.",
        f"Using historical portfolio XIRR ({portfolio_xirr*100:.2f}%) as a constant forward rate (illustrative only), "
        f"you project about {format_inr(projected_corpus)} by {target_year} — past performance is not a forecast.",
    ]
    if shortfall > 0:
        recommendations.append(
            f"Closing the gap may require roughly {format_inr(additional_sip)}/month in additional SIP "
            f"(assuming the same return rate — illustrative only)."
        )
    else:
        recommendations.append(
            "You appear broadly on track versus this goal — revisit yearly as markets and income change."
        )

    return {
        "goal": {
            "type": goal_type,
            "target_amount": round(resolved_target, 2),
            "target_amount_display": format_inr(resolved_target),
            "target_year": target_year,
            "years_remaining": years_remaining,
            "inflation_adjusted_target": round(inflation_adjusted_target, 2),
            "inflation_adjusted_display": format_inr(inflation_adjusted_target),
        },
        "current_trajectory": {
            "projected_corpus": round(projected_corpus, 2),
            "projected_display": format_inr(projected_corpus),
            "monthly_income_in_retirement": round(monthly_income_in_retirement, 2),
            "on_track": on_track,
        },
        "methodology": {
            "forward_rate": (
                "Uses submitted portfolio_xirr as a flat annual return for all future years — standard in hackathon specs "
                "but economically naive; real planning uses scenarios."
            ),
            "retirement_target": (
                "Retirement corpus = 25 × annual expenses at retirement age, with expenses inflated from 50% of current monthly income."
            ),
            "sip_future_value": "Ordinary annuity FV: SIP × ((1+r/12)^(12n)-1)/(r/12).",
        },
        "gap_analysis": {
            "shortfall": round(shortfall, 2),
            "shortfall_display": format_inr(shortfall),
            "additional_monthly_sip_needed": round(additional_sip, 2),
            "additional_sip_display": f"{format_inr(additional_sip)}/month",
            "alternative": (
                "Increase SIP, improve net returns (e.g. direct plans), or extend the target year — "
                "consult a SEBI-registered advisor for a personalised plan."
            ),
        },
        "recommendations": recommendations,
    }
