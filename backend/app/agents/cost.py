"""
Cost Agent — TER lookup and expense drag computation (Section 4.3).
Lookup chain: ter_data.csv → category_average from ter_estimates.json.
"""
import csv
import json
import os
from typing import Any, Dict, List, Optional

from app.agents.base import BaseAgent

_TER_CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "ter_data.csv")
_TER_ESTIMATES_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "ter_estimates.json")

_ter_csv_cache: Optional[Dict[str, float]] = None
_ter_estimates_cache: Optional[Dict[str, Any]] = None


def _load_ter_csv() -> Dict[str, float]:
    """Load captn3m0 TER tracker CSV. Returns {amfi_code: ter_decimal}."""
    global _ter_csv_cache
    if _ter_csv_cache is not None:
        return _ter_csv_cache
    result: Dict[str, float] = {}
    try:
        path = os.path.abspath(_TER_CSV_PATH)
        with open(path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                code = str(row.get("amfi_code") or row.get("schemeCode") or "").strip()
                ter_raw = row.get("ter") or row.get("TER") or row.get("expense_ratio") or ""
                if code and ter_raw:
                    try:
                        val = float(str(ter_raw).replace("%", "").strip())
                        # Stored as percentage in CSV (e.g. 0.75 means 0.75%), convert to decimal
                        result[code] = val / 100 if val > 1 else val
                    except ValueError:
                        pass
    except (FileNotFoundError, Exception):
        pass
    _ter_csv_cache = result
    return result


def _load_ter_estimates() -> Dict[str, Any]:
    """Load category-level TER fallbacks."""
    global _ter_estimates_cache
    if _ter_estimates_cache is not None:
        return _ter_estimates_cache
    try:
        path = os.path.abspath(_TER_ESTIMATES_PATH)
        with open(path, encoding="utf-8") as f:
            _ter_estimates_cache = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        _ter_estimates_cache = {}
    return _ter_estimates_cache or {}


def _category_ter_key(category: str, is_direct: bool) -> str:
    """Map a fund category string to an estimates JSON key."""
    cat = category.lower()
    if "large cap" in cat:
        key = "Large Cap"
    elif "mid cap" in cat:
        key = "Mid Cap"
    elif "small cap" in cat:
        key = "Small Cap"
    elif "flexi cap" in cat or "multi cap" in cat:
        key = "Flexi Cap"
    elif "elss" in cat:
        key = "ELSS"
    elif "index" in cat:
        key = "Index Fund"
    elif "debt" in cat or "liquid" in cat or "overnight" in cat or "money market" in cat:
        key = "Debt Short"
    else:
        key = "Flexi Cap"  # catch-all
    return key


def get_fund_ter(amfi_code: str, category: str, is_direct: bool) -> Dict[str, Any]:
    """
    Lookup chain:
      1. ter_data.csv (captn3m0 tracker)
      2. Category average from ter_estimates.json
    Returns {ter, source, direct_ter}.
    """
    ter_csv = _load_ter_csv()
    ter_estimates = _load_ter_estimates()

    # 1 — TER tracker CSV
    if amfi_code and amfi_code in ter_csv:
        ter = ter_csv[amfi_code]
        key = _category_ter_key(category, is_direct)
        estimates = ter_estimates.get(key) or {}
        direct_ter = estimates.get("direct_ter", ter) if not is_direct else ter
        return {"ter": ter, "source": "ter_tracker", "direct_ter": direct_ter}

    # 2 — Category average
    key = _category_ter_key(category, is_direct)
    estimates = ter_estimates.get(key) or {}
    if is_direct:
        ter = estimates.get("direct_ter", 0.007)
        direct_ter = ter
    else:
        ter = estimates.get("regular_ter", 0.018)
        direct_ter = estimates.get("direct_ter", 0.007)

    return {"ter": ter, "source": "category_average", "direct_ter": direct_ter}


def compute_expense_drag(fund: Dict[str, Any], fund_xirr: Optional[float] = None) -> Dict[str, Any]:
    """
    Compute annual drag, 10-year projected drag, and savings from switching to direct.
    """
    amfi_code = fund.get("amfi_code") or ""
    category = fund.get("category") or ""
    is_direct = fund.get("is_direct", False)
    current_value = float(fund.get("current_value") or 0)

    ter_info = get_fund_ter(amfi_code, category, is_direct)
    ter = ter_info["ter"]
    direct_ter = ter_info["direct_ter"]
    source = ter_info["source"]

    # Annual drag
    annual_drag = current_value * ter

    # 10-year projected drag
    rate = fund_xirr if (fund_xirr is not None and fund_xirr > 0) else 0.10
    projected_10yr = sum(current_value * ((1 + rate) ** yr) * ter for yr in range(1, 11))

    # Savings if switching to direct
    ter_diff = max(0.0, ter - direct_ter)
    potential_annual = current_value * ter_diff
    potential_10yr = sum(current_value * ((1 + rate) ** yr) * ter_diff for yr in range(1, 11))

    return {
        "estimated_ter": round(ter, 4),
        "ter_source": source,
        "annual_drag_rupees": round(annual_drag),
        "projected_10yr_drag_rupees": round(projected_10yr),
        "direct_plan_ter": round(direct_ter, 4),
        "potential_annual_savings": round(potential_annual),
        "potential_10yr_savings": round(potential_10yr),
    }


class CostAgent(BaseAgent):
    """
    Owns TER lookup and expense drag computation.
    Never computes XIRR — reads it from the fund dict if available.
    """

    agent_name = "cost_agent"

    async def run(self, funds: List[Dict[str, Any]]) -> Dict[str, Any]:
        total = len(funds)
        self.emit_running(f"Analyzing expense ratios for {total} funds…", step=1, total_steps=total + 1)

        enriched_funds = []
        total_annual_drag = 0
        total_projected_10yr = 0
        total_potential_annual = 0
        total_potential_10yr = 0
        total_value = 0
        weighted_ter_sum = 0
        regular_count = 0
        direct_count = 0

        for i, fund in enumerate(funds, start=1):
            xirr_rate = (fund.get("xirr") or {}).get("rate")
            expense = compute_expense_drag(fund, fund_xirr=xirr_rate)

            enriched = {**fund, "expense": expense}
            enriched_funds.append(enriched)

            cv = float(fund.get("current_value") or 0)
            total_annual_drag += expense["annual_drag_rupees"]
            total_projected_10yr += expense["projected_10yr_drag_rupees"]
            total_potential_annual += expense["potential_annual_savings"]
            total_potential_10yr += expense["potential_10yr_savings"]
            total_value += cv
            weighted_ter_sum += cv * expense["estimated_ter"]

            if fund.get("is_direct"):
                direct_count += 1
            else:
                regular_count += 1

            self.emit_progress(
                f"{fund.get('scheme_name', '')[:35]}: TER {expense['estimated_ter']*100:.2f}%",
                step=i,
                total_steps=total + 1,
            )

        weighted_avg_ter = (weighted_ter_sum / total_value) if total_value > 0 else 0.0

        # Severity
        severity = "info"
        if total_annual_drag > 50000:
            severity = "critical"
        elif total_annual_drag > 20000:
            severity = "warning"

        from app.utils import format_inr
        self.emit_completed(
            f"₹{total_annual_drag:,.0f}/year lost to expense fees",
            severity=severity,
        )

        expense_summary = {
            "total_annual_drag": round(total_annual_drag),
            "total_projected_10yr_drag": round(total_projected_10yr),
            "total_potential_annual_savings": round(total_potential_annual),
            "total_potential_10yr_savings": round(total_potential_10yr),
            "regular_plan_count": regular_count,
            "direct_plan_count": direct_count,
            "weighted_average_ter": round(weighted_avg_ter, 4),
        }

        return enriched_funds, expense_summary
