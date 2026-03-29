"""
Overlap Agent — computes pairwise weighted overlap between equity fund holdings.
Uses data/holdings.json (curated static dataset) — no external calls at runtime.
"""
import json
import os
from typing import Any, Dict, List, Optional

from app.agents.base import BaseAgent
from app.utils import normalize_amfi_code

_HOLDINGS_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "holdings.json")
_HOLDINGS_CACHE: Optional[Dict[str, Any]] = None


def _load_holdings() -> Dict[str, Any]:
    global _HOLDINGS_CACHE
    if _HOLDINGS_CACHE is not None:
        return _HOLDINGS_CACHE
    try:
        path = os.path.abspath(_HOLDINGS_PATH)
        with open(path, "r", encoding="utf-8") as f:
            _HOLDINGS_CACHE = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        _HOLDINGS_CACHE = {}
    return _HOLDINGS_CACHE or {}


def _holdings_for_amfi(
    holdings_db: Dict[str, Any],
    amfi_raw: Any,
) -> Optional[List[Dict]]:
    """Resolve holdings.json entry; try normalized and alternate string keys."""
    if amfi_raw is None or amfi_raw == "":
        return None
    candidates = [
        normalize_amfi_code(amfi_raw),
        str(amfi_raw).strip(),
    ]
    seen: set[str] = set()
    ordered = []
    for c in candidates:
        if c and c not in seen:
            seen.add(c)
            ordered.append(c)
    for key in ordered:
        block = holdings_db.get(key)
        if block is not None:
            return block
    return None


def _weighted_overlap(holdings_a: List[Dict], holdings_b: List[Dict]) -> float:
    """
    overlap(A, B) = Σ min(weight_A[stock], weight_B[stock]) for stock ∈ (A ∩ B)
    Weights are in percentage points (0-100).
    """
    map_a = {h["isin"]: h["weight"] for h in holdings_a if h.get("isin")}
    map_b = {h["isin"]: h["weight"] for h in holdings_b if h.get("isin")}
    common = set(map_a.keys()) & set(map_b.keys())
    return sum(min(map_a[isin], map_b[isin]) for isin in common)


def _overlap_level(pct: float) -> str:
    if pct < 15:
        return "Low"
    elif pct < 30:
        return "Moderate"
    elif pct < 50:
        return "High"
    return "Very High"


def _is_equity(fund: Dict[str, Any]) -> bool:
    cat = (fund.get("category") or "").lower()
    # Pure debt / liquid sleeves (exclude from stock overlap)
    if any(
        k in cat
        for k in (
            "liquid fund",
            "overnight fund",
            "money market",
            "gilt fund",
            "credit risk",
            "corporate bond",
            "banking and psu",
            "ultra short duration",
            "low duration",
            "short duration",
            "medium to long duration",
            "dynamic bond",
            "floater",
        )
    ):
        return False

    return (
        "equity" in cat
        or "elss" in cat
        or "large cap" in cat
        or "mid cap" in cat
        or "small cap" in cat
        or "flexi cap" in cat
        or "multi cap" in cat
        or "focused" in cat
        or "contra" in cat
        or "value" in cat
        or "large & mid" in cat
        or "hybrid" in cat
        or "balanced" in cat
        or "arbitrage" in cat
        or "index fund" in cat
        or "sectoral" in cat
        or "thematic" in cat
        or "equity savings" in cat
        or "multi asset" in cat
        or "dynamic asset" in cat
        or "solution oriented" in cat
        or "retirement fund" in cat
        or "children" in cat
    ) and "debt" not in cat


class OverlapAgent(BaseAgent):
    """
    Computes pairwise fund overlap and concentration analysis.
    Loads holdings.json at first call — nothing is fetched at runtime.
    """

    agent_name = "overlap_agent"

    async def run(self, funds: List[Dict[str, Any]]) -> Dict[str, Any]:
        holdings_db = _load_holdings()
        equity_funds = [f for f in funds if _is_equity(f)]
        total_equity_value = sum(f.get("current_value") or 0 for f in equity_funds)

        self.emit_running(
            f"Analyzing overlap across {len(equity_funds)} equity funds…",
            step=1,
            total_steps=3,
        )

        if len(equity_funds) < 2:
            self.emit_completed(
                "Less than 2 equity funds — skipping overlap matrix",
                severity="info",
            )
            concentration = self._concentration(equity_funds, holdings_db, total_equity_value)
            return {
                "max_pairwise_overlap": None,
                "overlap_level": None,
                "matrix": [],
                "top_concentrated_stocks": concentration,
                "concentration_warnings": [],
            }

        # ── Pairwise overlap matrix ──────────────────────────────────────────
        matrix: List[Dict[str, Any]] = []
        max_overlap = 0.0
        max_pair = ("", "")

        for i in range(len(equity_funds)):
            for j in range(i + 1, len(equity_funds)):
                fund_a = equity_funds[i]
                fund_b = equity_funds[j]

                amfi_a = fund_a.get("amfi_code") or ""
                amfi_b = fund_b.get("amfi_code") or ""

                h_a = _holdings_for_amfi(holdings_db, amfi_a)
                h_b = _holdings_for_amfi(holdings_db, amfi_b)

                if h_a is None or h_b is None:
                    matrix.append({
                        "fund_a": fund_a.get("scheme_name"),
                        "fund_b": fund_b.get("scheme_name"),
                        "overlap": None,
                        "level": "N/A",
                        "holdings_available": False,
                    })
                    continue

                overlap_pct = _weighted_overlap(h_a, h_b)
                level = _overlap_level(overlap_pct)
                if overlap_pct > max_overlap:
                    max_overlap = overlap_pct
                    max_pair = (fund_a.get("scheme_name", ""), fund_b.get("scheme_name", ""))

                matrix.append({
                    "fund_a": fund_a.get("scheme_name"),
                    "fund_b": fund_b.get("scheme_name"),
                    "overlap": round(overlap_pct, 2),
                    "level": level,
                    "holdings_available": True,
                })

        self.emit_progress("Computing stock concentration…", step=2, total_steps=3)
        concentration = self._concentration(equity_funds, holdings_db, total_equity_value)

        # Warnings
        warnings: List[str] = []
        if max_overlap > 0:
            level = _overlap_level(max_overlap)
            severity = "warning" if max_overlap >= 30 else "info"
            if max_overlap >= 50:
                severity = "critical"
            msg = (
                f"{max_overlap:.1f}% overlap between "
                f"{max_pair[0][:25]} and {max_pair[1][:25]}"
            )
            self.emit_completed(msg, severity=severity)
        else:
            self.emit_completed("Overlap analysis complete", severity="success")

        for stock in concentration:
            if stock.get("warning"):
                warnings.append(
                    f"{stock['name']} — {stock['effective_weight']:.1f}% of equity portfolio"
                )

        return {
            "max_pairwise_overlap": round(max_overlap, 2) if max_overlap > 0 else None,
            "overlap_level": _overlap_level(max_overlap) if max_overlap > 0 else None,
            "matrix": matrix,
            "top_concentrated_stocks": concentration,
            "concentration_warnings": warnings,
        }

    # -----------------------------------------------------------------------

    @staticmethod
    def _concentration(
        equity_funds: List[Dict[str, Any]],
        holdings_db: Dict[str, Any],
        total_equity_value: float,
    ) -> List[Dict[str, Any]]:
        """Aggregate effective stock weight across all equity funds in portfolio."""
        stock_map: Dict[str, Dict[str, Any]] = {}

        for fund in equity_funds:
            amfi = fund.get("amfi_code") or ""
            holdings = _holdings_for_amfi(holdings_db, amfi) or []
            fund_value = fund.get("current_value") or 0
            if total_equity_value == 0:
                continue
            fund_weight_pct = fund_value / total_equity_value * 100

            for h in holdings:
                isin = h.get("isin") or ""
                name = h.get("name") or h.get("isin") or ""
                stock_weight = h.get("weight") or 0
                effective = (stock_weight / 100) * fund_weight_pct

                if isin in stock_map:
                    stock_map[isin]["effective_weight"] += effective
                else:
                    stock_map[isin] = {
                        "name": name,
                        "isin": isin,
                        "effective_weight": effective,
                    }

        result = sorted(stock_map.values(), key=lambda x: x["effective_weight"], reverse=True)[:10]
        for s in result:
            s["effective_weight"] = round(s["effective_weight"], 2)
            s["warning"] = s["effective_weight"] > 10
        return result
