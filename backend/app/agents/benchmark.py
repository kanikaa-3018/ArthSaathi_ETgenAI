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


def _map_category_to_benchmark(category: str) -> Optional[Dict[str, str]]:
    """Return {name, amfi_code} for a fund category, or None for debt."""
    cat = category.lower()

    # Debt/cash → skip benchmark
    if any(k in cat for k in ["debt", "liquid", "overnight", "money market", "gilt", "credit risk"]):
        return None

    bm_map = _load_benchmark_map()
    # Try loaded JSON first
    for key, val in bm_map.items():
        if key.lower() in cat:
            return val

    # Fall back to static map
    for key, val in _DEFAULT_BENCHMARK_MAP.items():
        if key.lower() in cat:
            return val

    # Unknown equity → Nifty 500 catch-all
    if "equity" in cat or "fund" in cat:
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

            # Benchmark CAGR from investor's first transaction to today
            fund_xirr_rate = (fund.get("xirr") or {}).get("rate")
            bm_cagr: Optional[float] = None
            alpha: Optional[float] = None

            if first_date and hist:
                today = date.today()
                days = (today - first_date).days
                nav_start = NAVAgent.nav_on_date(hist, first_date)
                nav_end = hist[0]["nav"] if hist else None  # newest nav

                if nav_start and nav_end and days > 30:
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
