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
    monthly_expenses_override: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Returns the JSON shape expected by POST /api/goals/calculate.
    """
    now_y = _now_year()
    years_remaining = max(0, target_year - now_y)
    years_to_retire = max(0, retirement_age - current_age)

    # --- Resolve target_amount by goal_type --------------------------------
    if goal_type == "retirement":
        if monthly_expenses_override is not None and monthly_expenses_override > 0:
            monthly_expenses = float(monthly_expenses_override)
        else:
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
    # Effective monthly rate (matches yearly_roadmap simulation)
    monthly_growth_eff = ((1 + r) ** (1 / 12)) - 1
    projected_corpus = portfolio_value * ((1 + r) ** years_remaining)

    # SIP matches the roadmap loop: deposit at month start, then apply monthly growth (annuity due).
    if monthly_sip_possible > 0 and years_remaining > 0:
        n = years_remaining * 12
        sip_corpus = monthly_sip_possible * (
            ((1 + monthly_growth_eff) ** n - 1) / monthly_growth_eff
        ) * (1 + monthly_growth_eff)
        projected_corpus += sip_corpus

    shortfall = max(0.0, inflation_adjusted_target - projected_corpus)
    on_track = shortfall <= 0

    additional_sip = 0.0
    if shortfall > 0 and years_remaining > 0:
        n = years_remaining * 12
        denom = (
            ((1 + monthly_growth_eff) ** n - 1) / monthly_growth_eff * (1 + monthly_growth_eff)
        )
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

    forward_rate = r
    monthly_growth_rate = monthly_growth_eff

    retirement_target_expl = (
        "Retirement corpus = 25 × annual expenses at retirement age, with expenses inflated from "
        + (
            "submitted monthly retirement expenses (override)."
            if goal_type == "retirement"
            and monthly_expenses_override is not None
            and monthly_expenses_override > 0
            else "50% of current monthly income (default when no override is sent)."
        )
    )

    # Year-end snapshots (monthly compounding loop; one row per year-end)
    yearly_roadmap: list[dict[str, Any]] = []
    if years_remaining > 0:
        running_corpus = portfolio_value
        monthly_sip = monthly_sip_possible
        for month in range(1, years_remaining * 12 + 1):
            running_corpus += monthly_sip
            running_corpus *= 1 + monthly_growth_rate
            if month % 12 == 0:
                year = month // 12
                yearly_roadmap.append(
                    {
                        "month": month,
                        "year": year,
                        "age": current_age + year,
                        "corpus": round(running_corpus),
                        "corpus_display": format_inr(round(running_corpus)),
                        "cumulative_invested": round(portfolio_value + monthly_sip * month),
                    }
                )

    income_for_emergency = monthly_income if monthly_income > 0 else 50000.0
    monthly_expenses_ef = income_for_emergency * 0.50
    emergency_target = monthly_expenses_ef * 6
    emergency_rec = (
        f"Maintain {format_inr(round(emergency_target))} in liquid funds before aggressive investing"
    )
    if monthly_income <= 0:
        emergency_rec += (
            " (assuming ₹50,000 monthly income; update your income for a personalised target)"
        )
    emergency_fund_check = {
        "target": round(emergency_target),
        "target_display": format_inr(round(emergency_target)),
        "monthly_expenses_estimate": round(monthly_expenses_ef),
        "recommendation": emergency_rec,
    }

    equity_pct = max(20, min(80, 100 - current_age))
    debt_pct = 100 - equity_pct
    asset_allocation = {
        "equity_pct": equity_pct,
        "debt_pct": debt_pct,
        "rule": "100 minus age (bounded 20–80% equity)",
        "note": f"At age {current_age}, suggested {equity_pct}% equity / {debt_pct}% debt (illustrative)",
    }

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
            "retirement_target": retirement_target_expl,
            "sip_future_value": (
                "SIP FV matches the roadmap: m=(1+r)^(1/12)-1, monthly deposit then growth "
                "(annuity due): SIP × ((1+m)^n-1)/m × (1+m)."
            ),
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
        "yearly_roadmap": yearly_roadmap,
        "emergency_fund_check": emergency_fund_check,
        "asset_allocation": asset_allocation,
    }
