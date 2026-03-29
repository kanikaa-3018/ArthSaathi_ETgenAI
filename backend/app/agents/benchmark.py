"""
Benchmark Agent — maps each equity fund to a benchmark index fund, computes CAGR alpha.
Uses data/benchmark_map.json for category → AMFI code mapping.
"""
import json
import os
from datetime import date, timedelta
from typing import Any, Dict, List, Optional

from app.agents.base import BaseAgent
from app.agents.nav import NAVAgent

_BENCHMARK_MAP_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "benchmark_map.json")
_bm_map_cache: Optional[Dict[str, Any]] = None

# Static fallback map (Section 3.6) in case benchmark_map.json isn't present
_DEFAULT_BENCHMARK_MAP = {
    "Large Cap": {"name": "Nifty 50 TRI", "amfi_code": "120716"},
    "Mid Cap": {"name": "Nifty Midcap 150 TRI", "amfi_code": "147622"},
    "Small Cap": {"name": "Nifty Smallcap 250 TRI", "amfi_code": "147623"},
    "Flexi Cap": {"name": "Nifty 500 TRI", "amfi_code": "147625"},
    "Multi Cap": {"name": "Nifty 500 TRI", "amfi_code": "147625"},
    "ELSS": {"name": "Nifty 500 TRI", "amfi_code": "147625"},
    "Value": {"name": "Nifty 500 TRI", "amfi_code": "147625"},
    "Contra": {"name": "Nifty 500 TRI", "amfi_code": "147625"},
    "Focused": {"name": "Nifty 500 TRI", "amfi_code": "147625"},
    "Large & Mid Cap": {"name": "Nifty LargeMidcap 250 TRI", "amfi_code": "150490"},
    "Large & Mid": {"name": "Nifty LargeMidcap 250 TRI", "amfi_code": "150490"},
}


def _load_benchmark_map() -> Dict[str, Any]:
    global _bm_map_cache
    if _bm_map_cache is not None:
        return _bm_map_cache
    try:
        path = os.path.abspath(_BENCHMARK_MAP_PATH)
        with open(path, encoding="utf-8") as f:
            _bm_map_cache = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        _bm_map_cache = {}
    return _bm_map_cache or {}


def _pick_longest_map_match(cat: str, mapping: Dict[str, Any]) -> Optional[Dict[str, str]]:
    """
    Prefer the longest category key that appears as a substring of `cat`.
    Avoids matching \"Mid Cap\" inside \"Large & Mid Cap\" before the right rule.
    """
    best: Optional[Dict[str, str]] = None
    best_len = -1
    for key, val in mapping.items():
        kl = key.lower()
        if kl not in cat:
            continue
        if len(key) > best_len:
            best_len = len(key)
            if isinstance(val, dict) and "name" in val and "amfi_code" in val:
                best = {"name": str(val["name"]), "amfi_code": str(val["amfi_code"])}
    return best


def _map_category_to_benchmark(category: str) -> Optional[Dict[str, str]]:
    """Return {name, amfi_code} for a fund category, or None for debt."""
    cat = category.lower()

    # Debt/cash → skip benchmark (keep in sync with overlap debt exclusions where sensible)
    if any(
        k in cat
        for k in [
            "debt",
            "liquid fund",
            "overnight fund",
            "money market",
            "gilt",
            "credit risk",
            "corporate bond",
            "floater",
            "ultra short duration",
            "low duration",
            "short duration",
            "medium duration",
            "long duration",
            "dynamic bond",
            "banking and psu",
            "bond fund",
        ]
    ):
        return None

    picked = _pick_longest_map_match(cat, _load_benchmark_map())
    if picked:
        return picked

    picked = _pick_longest_map_match(cat, _DEFAULT_BENCHMARK_MAP)
    if picked:
        return picked

    # Labels often missing from benchmark_map.json — run AFTER maps so
    # "Large & Mid Cap" matches Nifty LargeMidcap 250, not the "mid cap" needle.
    extra_rules: List[tuple] = [
        ("index fund", {"name": "Nifty 50 TRI", "amfi_code": "120716"}),
        ("etf", {"name": "Nifty 50 TRI", "amfi_code": "120716"}),
        ("nifty 50", {"name": "Nifty 50 TRI", "amfi_code": "120716"}),
        ("nifty 100", {"name": "Nifty 500 TRI", "amfi_code": "147625"}),
        ("hybrid", {"name": "Nifty 500 TRI", "amfi_code": "147625"}),
        ("balanced", {"name": "Nifty 500 TRI", "amfi_code": "147625"}),
        ("multi asset", {"name": "Nifty 500 TRI", "amfi_code": "147625"}),
        ("dynamic asset", {"name": "Nifty 500 TRI", "amfi_code": "147625"}),
        ("sectoral", {"name": "Nifty 500 TRI", "amfi_code": "147625"}),
        ("thematic", {"name": "Nifty 500 TRI", "amfi_code": "147625"}),
        ("fof", {"name": "Nifty 500 TRI", "amfi_code": "147625"}),
        ("fund of fund", {"name": "Nifty 500 TRI", "amfi_code": "147625"}),
        ("solution oriented", {"name": "Nifty 500 TRI", "amfi_code": "147625"}),
        ("retirement", {"name": "Nifty 500 TRI", "amfi_code": "147625"}),
    ]
    for needle, bench in extra_rules:
        if needle in cat:
            return bench

    # Broad equity sleeve only — avoid "… Fund" debt names that lack "equity" but contain "fund"
    if "equity" in cat:
        return {"name": "Nifty 500 TRI", "amfi_code": "147625"}

    return None


def _compute_cagr(nav_start: float, nav_end: float, days: int) -> Optional[float]:
    if nav_start <= 0 or nav_end <= 0 or days <= 0:
        return None
    return (nav_end / nav_start) ** (365.0 / days) - 1


class BenchmarkAgent(BaseAgent):
    """
    Computes benchmark CAGR and alpha for each equity fund.
    Debt funds receive benchmark: null.
    """

    agent_name = "benchmark_agent"

    async def run(self, funds: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        total = len(funds)
        self.emit_running(f"Comparing {total} funds against benchmarks…", step=1, total_steps=total)

        # Pre-fetch benchmark histories (unique AMFI codes)
        needed_codes: Dict[str, str] = {}
        for fund in funds:
            bm = _map_category_to_benchmark(fund.get("category") or "")
            if bm:
                needed_codes[bm["amfi_code"]] = bm["name"]

        benchmark_histories: Dict[str, List[Dict]] = {}
        for amfi_code in needed_codes:
            hist = await NAVAgent.fetch_historical_nav(amfi_code)
            benchmark_histories[amfi_code] = hist

        enriched = []
        for i, fund in enumerate(funds, start=1):
            category = fund.get("category") or ""
            bm = _map_category_to_benchmark(category)

            if bm is None:
                enriched.append({**fund, "benchmark": None})
                self.emit_progress(
                    f"{fund.get('scheme_name','')[:35]}: debt fund — skipping benchmark",
                    step=i,
                    total_steps=total,
                )
                continue

            bm_amfi = bm["amfi_code"]
            bm_name = bm["name"]
            hist = benchmark_histories.get(bm_amfi) or []

            # Fund's first transaction date
            txns = fund.get("transactions") or []
            first_date: Optional[date] = None
            for txn in txns:
                d = txn.get("date")
                if isinstance(d, date) and (first_date is None or d < first_date):
                    first_date = d

            # CAS sometimes omits txn history rows; use oldest NAV in mfapi history as horizon proxy
            if first_date is None:
                nh = fund.get("nav_history") or []
                if nh:
                    first_date = nh[-1].get("date")

            # Benchmark CAGR from investor's first transaction to today
            fund_xirr_rate = (fund.get("xirr") or {}).get("rate")
            bm_cagr: Optional[float] = None
            alpha: Optional[float] = None

            if first_date and hist:
                today = date.today()
                days = (today - first_date).days
                nav_start = NAVAgent.nav_on_date(hist, first_date)
                nav_end = hist[0]["nav"] if hist else None  # newest nav

                if nav_start and nav_end and days >= 14:
                    bm_cagr = _compute_cagr(nav_start, nav_end, days)

            if bm_cagr is not None and fund_xirr_rate is not None:
                alpha = fund_xirr_rate - bm_cagr

            # Build result
            if bm_cagr is None:
                bm_result = {
                    "name": bm_name,
                    "return": None,
                    "alpha": None,
                    "alpha_display": "Benchmark data unavailable",
                    "outperformed": None,
                }
                self.emit_progress(
                    f"{fund.get('scheme_name','')[:35]}: benchmark NAV unavailable",
                    step=i,
                    total_steps=total,
                )
            else:
                bm_result = {
                    "name": bm_name,
                    "return": round(bm_cagr, 4),
                    "alpha": round(alpha, 4) if alpha is not None else None,
                    "alpha_display": (
                        f"{alpha*100:+.2f}%" if alpha is not None else "N/A"
                    ),
                    "outperformed": alpha > 0 if alpha is not None else None,
                }
                alpha_str = bm_result["alpha_display"]
                severity = "success" if (alpha or 0) >= 0 else "warning"
                self.emit_progress(
                    f"{fund.get('scheme_name','')[:30]}: alpha {alpha_str}",
                    step=i,
                    total_steps=total,
                )

            enriched.append({**fund, "benchmark": bm_result})

        self.emit_completed("Benchmark comparison complete", severity="success")
        return enriched
