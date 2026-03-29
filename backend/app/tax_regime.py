"""
Tax regime comparison — Old vs New regime calculator (FY 2025-26 style slabs).
See repo root hackathon docs / ArthSaathi ARCHITECTURE for API context.
"""
from __future__ import annotations

from typing import Any, Dict, List

from app.utils import format_inr


def _old_regime_tax(taxable: float) -> float:
    if taxable <= 250000:
        return 0.0
    tax = 0.0
    if taxable > 250000:
        tax += min(taxable - 250000, 250000) * 0.05
    if taxable > 500000:
        tax += min(taxable - 500000, 500000) * 0.20
    if taxable > 1000000:
        tax += (taxable - 1000000) * 0.30
    # Rebate u/s 87A (old regime): nil tax if taxable income ≤ ₹5L (illustrative)
    if taxable <= 500000:
        return 0.0
    return tax


def _new_regime_tax(taxable: float) -> float:
    if taxable <= 1200000:
        return 0.0
    slabs = [
        (400000, 0.00),
        (400000, 0.05),
        (400000, 0.10),
        (400000, 0.15),
        (400000, 0.20),
        (400000, 0.25),
        (float("inf"), 0.30),
    ]
    tax = 0.0
    remaining = taxable
    for width, rate in slabs:
        chunk = min(remaining, width)
        tax += chunk * rate
        remaining -= chunk
        if remaining <= 0:
            break
    return tax


def _hra_exemption(basic: float, hra_received: float, rent_paid: float, is_metro: bool) -> float:
    if rent_paid <= 0 or hra_received <= 0:
        return 0.0
    metro_pct = 0.50 if is_metro else 0.40
    rent_excess = max(0.0, rent_paid - 0.10 * basic)
    return float(max(0.0, min(hra_received, rent_excess, metro_pct * basic)))


def compare_regimes(
    gross_salary: float,
    hra_received_annual: float = 0,
    rent_paid_annual: float = 0,
    is_metro: bool = True,
    section_80c: float = 0,
    section_80d: float = 0,
    section_80ccd1b: float = 0,
    home_loan_interest: float = 0,
    elss_from_portfolio: float = 0,
    lta_exemption_annual: float = 0,
    education_loan_interest_80e: float = 0,
    other_old_regime_deductions: float = 0,
) -> Dict[str, Any]:
    basic = gross_salary * 0.40

    # Section 10(5) LTA — illustrative: reduce gross for Old Regime only (capped)
    lta_ex = min(max(0.0, lta_exemption_annual), 200000.0)
    gross_old_base = max(0.0, gross_salary - lta_ex)

    old_std = 50000.0
    hra_exempt = _hra_exemption(basic, hra_received_annual, rent_paid_annual, is_metro)
    total_80c = min(section_80c + elss_from_portfolio, 150000)
    total_80d = min(section_80d, 100000)
    total_80ccd = min(section_80ccd1b, 50000)
    total_24b = min(home_loan_interest, 200000)
    # 80E: education-loan interest has no statutory cap; only ensure non-negative.
    total_80e = max(0.0, education_loan_interest_80e)
    other_old = min(max(0.0, other_old_regime_deductions), 150000.0)

    old_deductions = (
        old_std
        + hra_exempt
        + total_80c
        + total_80d
        + total_80ccd
        + total_24b
        + total_80e
        + other_old
    )
    old_taxable = max(0.0, gross_old_base - old_deductions)
    old_tax = _old_regime_tax(old_taxable)
    old_cess = old_tax * 0.04
    old_total = round(old_tax + old_cess)

    new_std = 75000.0
    new_deductions = new_std
    # New regime: no LTA/80E/other chapter VI-A (illustrative model)
    new_taxable = max(0.0, gross_salary - new_deductions)
    new_tax = _new_regime_tax(new_taxable)
    new_cess = new_tax * 0.04
    new_total = round(new_tax + new_cess)

    if old_total <= new_total:
        recommendation = "old"
        savings = new_total - old_total
    else:
        recommendation = "new"
        savings = old_total - new_total

    tips: List[str] = []
    if elss_from_portfolio > 0:
        tips.append(
            f"Your ELSS investments of {format_inr(elss_from_portfolio)} qualify under 80C in the Old Regime"
        )
    if section_80ccd1b > 0:
        tips.append("NPS additional ₹50K deduction (80CCD1B) is valuable in Old Regime")
    if hra_exempt > 0:
        tips.append(f"HRA exemption of {format_inr(round(hra_exempt))} reduces your Old Regime tax")
    if lta_ex > 0:
        tips.append(f"LTA exemption of {format_inr(round(lta_ex))} reduces Old Regime gross (illustrative)")
    if total_80e > 0:
        tips.append("Education loan interest (80E) reduces Old Regime taxable income")
    if other_old > 0:
        tips.append("Other chapter VI-A style deductions applied in Old Regime only (capped)")
    if gross_salary <= 1275000:
        tips.append("At your income, New Regime may give zero tax (rebate u/s 87A up to ₹12.75L gross)")

    return {
        "old_regime": {
            "gross_income": gross_salary,
            "lta_exemption": round(lta_ex),
            "gross_after_lta": round(gross_old_base),
            "standard_deduction": old_std,
            "hra_exemption": round(hra_exempt),
            "section_80c": total_80c,
            "section_80d": total_80d,
            "section_80ccd1b": total_80ccd,
            "home_loan_24b": total_24b,
            "education_loan_80e": round(total_80e),
            "other_deductions": round(other_old),
            "total_deductions": round(old_deductions),
            "taxable_income": round(old_taxable),
            "tax_before_cess": round(old_tax),
            "cess_4pct": round(old_cess),
            "total_tax": old_total,
        },
        "new_regime": {
            "gross_income": gross_salary,
            "standard_deduction": new_std,
            "total_deductions": new_deductions,
            "taxable_income": round(new_taxable),
            "tax_before_cess": round(new_tax),
            "cess_4pct": round(new_cess),
            "total_tax": new_total,
        },
        "recommendation": recommendation,
        "savings": savings,
        "savings_display": format_inr(savings),
        "tips": tips,
    }
