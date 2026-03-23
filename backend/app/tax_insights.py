"""
Heuristic tax-related hints from portfolio analysis (educational — not tax advice).

Important limitations (no hidden assumptions):
- CAS / this pipeline does not provide purchase dates, tax regime, or grandfathering per lot.
- ``current_value - invested_value`` is not the same as taxable capital gains (average cost, grandfathering, etc.).
- Equity-oriented vs debt-oriented labels come from **scheme category strings** in the CAS — not AMFI/RTA tax classification.
- Hybrid funds: for many hybrid categories, long-term holding is **> 24 months** (we use ~730 days from CAS ``holding_period_days``).
- Listed equity MF: long-term is commonly **> 12 months** — we use **> 365 days** as a proxy from CAS days only.

Rates cited follow the hackathon spec (FY 2025–26 narrative): equity LTCG 12.5% above ₹1.25L exemption, equity STCG 20%.
Confirm against current law before any real decision.
"""
from __future__ import annotations

from typing import Any, Dict, List, Literal

from app.utils import format_inr

LTCG_EXEMPT_ANNUAL = 125_000.0
EQUITY_LTCG_RATE = 0.125
EQUITY_STCG_RATE = 0.20

# Minimum holding days from CAS (approximate) to treat as "long term" for heuristic buckets
LT_EQUITY_DAYS = 365  # CAS day-count proxy for “more than 12 months”
LT_HYBRID_DAYS = 730  # CAS day-count proxy for “more than 24 months”


def _is_debt_category(category: str) -> bool:
    c = (category or "").lower()
    return any(x in c for x in ("debt", "liquid", "bond", "gilt", "money market", "overnight"))


def _is_hybrid_category(category: str) -> bool:
    c = (category or "").lower()
    return any(
        x in c
        for x in (
            "hybrid",
            "balanced",
            "multi asset",
            "dynamic asset",
            "aggressive hybrid",
            "conservative hybrid",
            "equity savings",
            "arbitrage",
        )
    )


def _is_equity_category(category: str) -> bool:
    c = (category or "").lower()
    if _is_debt_category(category) or _is_hybrid_category(category):
        return False
    if any(
        x in c
        for x in (
            "equity",
            "elss",
            "large cap",
            "mid cap",
            "small cap",
            "multi cap",
            "flexi cap",
            "value",
            "contra",
            "index fund",
            "etf",
            "fof",
            "sector",
            "thematic",
        )
    ):
        return True
    if "cap" in c:
        return True
    return False


def _fund_bucket(category: str) -> Literal["debt", "hybrid", "equity", "unknown"]:
    if _is_debt_category(category):
        return "debt"
    if _is_hybrid_category(category):
        return "hybrid"
    if _is_equity_category(category):
        return "equity"
    return "unknown"


def _long_term_threshold_days(bucket: str) -> int | None:
    if bucket == "debt":
        return None
    if bucket == "hybrid":
        return LT_HYBRID_DAYS
    if bucket in ("equity", "unknown"):
        return LT_EQUITY_DAYS
    return None


def compute_tax_insights(analysis: Dict[str, Any]) -> Dict[str, Any]:
    funds = analysis.get("funds") or []

    total_unrealized = 0.0
    debt_unrealized = 0.0
    # Gains bucketed for **equity-oriented STCG/LTCG style** heuristics only (not debt slab tax)
    equity_style_unrealized = 0.0
    equity_lt_gain = 0.0
    equity_st_gain = 0.0
    unknown_bucket_gain = 0.0

    for f in funds:
        cv = float(f.get("current_value") or 0)
        inv = float(f.get("invested_value") or 0)
        gain = max(0.0, cv - inv)
        total_unrealized += gain

        cat = f.get("category") or ""
        days = int((f.get("xirr") or {}).get("holding_period_days") or 0)
        bucket = _fund_bucket(cat)
        lt_days = _long_term_threshold_days(bucket)

        if bucket == "debt":
            debt_unrealized += gain
            continue

        if bucket == "unknown":
            unknown_bucket_gain += gain

        equity_style_unrealized += gain
        is_long = lt_days is not None and days > lt_days
        if is_long:
            equity_lt_gain += gain
        else:
            equity_st_gain += gain

    taxable_ltcg = max(0.0, equity_lt_gain - LTCG_EXEMPT_ANNUAL)
    est_ltcg_tax = taxable_ltcg * EQUITY_LTCG_RATE
    est_stcg_tax = equity_st_gain * EQUITY_STCG_RATE

    harvesting: List[Dict[str, str]] = []

    if equity_lt_gain > 0 and equity_lt_gain <= LTCG_EXEMPT_ANNUAL:
        harvesting.append(
            {
                "title": "₹1.25 lakh LTCG exemption (heuristic)",
                "detail": (
                    f"Estimated long-term equity-oriented gains (~{format_inr(equity_lt_gain)}) fall under the "
                    f"annual ₹1.25 lakh exemption in a simplified model — real tax depends on actual realised gains in the year."
                ),
            }
        )
    elif equity_lt_gain > LTCG_EXEMPT_ANNUAL:
        harvesting.append(
            {
                "title": "LTCG above exemption (illustrative)",
                "detail": (
                    f"If all long-term equity-oriented gains were realised in one year, incremental LTCG tax "
                    f"(after ₹1.25L) at ~12.5% is roughly {format_inr(est_ltcg_tax)}. "
                    "This ignores carry-forward, set-off, and purchase lots."
                ),
            }
        )

    if equity_st_gain > 0:
        harvesting.append(
            {
                "title": "Shorter holding (equity-oriented) — STCG heuristic",
                "detail": (
                    f"Schemes treated as equity/hybrid/unknown with holding ≤ threshold: rough STCG at ~20% on those gains "
                    f"≈ {format_inr(est_stcg_tax)} if realised today. Hybrid funds use a >24-month threshold in this model."
                ),
            }
        )

    if debt_unrealized > 0:
        harvesting.append(
            {
                "title": "Debt / liquid funds",
                "detail": (
                    "Debt gains are often taxed at your income-tax slab for many units (especially post–Apr 2023 acquisitions). "
                    "Pre-2023 lots can follow different rules. This tool does not compute slab tax."
                ),
            }
        )

    if unknown_bucket_gain > 0:
        harvesting.append(
            {
                "title": "Unclassified scheme categories",
                "detail": (
                    f"~{format_inr(unknown_bucket_gain)} in gains came from categories we could not map cleanly to debt/hybrid/equity "
                    "from the CAS string — those are included in the equity-style STCG/LTCG heuristic with a >12-month long-term threshold."
                ),
            }
        )

    harvesting.append(
        {
            "title": "Loss harvesting",
            "detail": (
                "Realised capital losses may offset realised gains in some cases — confirm with a tax advisor and Form 26AS / contract notes."
            ),
        }
    )

    summary = (
        f"Unrealised gain proxy (sum of max(0, current − invested) per scheme): {format_inr(total_unrealized)}. "
        f"Debt-tagged: {format_inr(debt_unrealized)}; equity/hybrid/unknown (for rate heuristics): {format_inr(equity_style_unrealized)}."
    )

    return {
        "summary": summary,
        "estimates": {
            "total_unrealized_gains": round(total_unrealized, 2),
            "equity_style_unrealized_gains": round(equity_style_unrealized, 2),
            "debt_unrealized_gains": round(debt_unrealized, 2),
            "rough_ltcg_tax_if_realized_long_term_equity": round(est_ltcg_tax, 2),
            "rough_stcg_tax_if_realized_short_term_equity": round(est_stcg_tax, 2),
            "ltcg_exemption_annual": LTCG_EXEMPT_ANNUAL,
        },
        "harvesting": harvesting,
        "methodology": {
            "gain_proxy": "Per-scheme max(0, current_value - invested_value) from analysis JSON — not statutory capital gains.",
            "holding_proxy": "xirr.holding_period_days vs thresholds: equity/unknown >365d; hybrid >730d; debt excluded from 12.5%/20% heuristic.",
            "rates": "LTCG 12.5% on taxable long-term equity-oriented gains above ₹1.25L/year; STCG 20% on short-term equity-oriented gains — illustrative.",
        },
        "disclaimer": (
            "Indicative only — not tax advice. Fund taxation depends on acquisition date, regime, and CBDT rules in force. "
            "Consult a qualified tax professional."
        ),
    }
