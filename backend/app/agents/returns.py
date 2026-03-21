"""
Returns Agent — computes per-fund and portfolio XIRR using pyxirr.
Follows the cashflow polarity rules defined in Section 4.1 of the spec.
"""
from datetime import date, datetime
from typing import Any, Dict, List, Optional, Tuple

try:
    from pyxirr import xirr as _pyxirr
    PYXIRR_AVAILABLE = True
except ImportError:
    PYXIRR_AVAILABLE = False

from app.agents.base import BaseAgent

# ---------------------------------------------------------------------------
# Cashflow polarity rules (Section 4.1)
# ---------------------------------------------------------------------------
_NEGATIVE_TYPES = {
    "PURCHASE", "PURCHASE_SIP",
    "SWITCH_IN", "SWITCH_IN_MERGER",
    "STAMP_DUTY_TAX", "TDS_TAX", "STT_TAX",
}
_POSITIVE_TYPES = {
    "REDEMPTION",
    "SWITCH_OUT", "SWITCH_OUT_MERGER",
    "DIVIDEND_PAYOUT",
}
_SKIP_TYPES = {
    "DIVIDEND_REINVESTMENT", "SEGREGATION", "MISC",
}

# For PORTFOLIO XIRR, internal transfers between funds must be excluded.
_PORTFOLIO_EXCLUDE = {
    "SWITCH_IN", "SWITCH_IN_MERGER",
    "SWITCH_OUT", "SWITCH_OUT_MERGER",
    "DIVIDEND_REINVESTMENT", "SEGREGATION", "MISC",
}


def _to_date(val) -> Optional[date]:
    if isinstance(val, datetime):
        return val.date()
    if isinstance(val, date):
        return val
    return None


def _safe_xirr(dates: List[date], amounts: List[float]) -> Optional[float]:
    """Wrap pyxirr with silent=True; return None on any failure."""
    if not PYXIRR_AVAILABLE:
        return None
    if len(dates) < 2:
        return None
    try:
        result = _pyxirr(dates, amounts, silent=True)
        if result is None or (isinstance(result, float) and (result != result)):  # NaN guard
            return None
        return float(result)
    except Exception:
        return None


def compute_fund_xirr(fund: Dict[str, Any]) -> Dict[str, Any]:
    """
    Compute XIRR for a single normalised fund dict.
    Returns a dict compatible with the FundXIRR API schema.
    """
    dates: List[date] = []
    amounts: List[float] = []

    transactions = fund.get("transactions") or []
    first_date: Optional[date] = None

    for txn in transactions:
        txn_type = (txn.get("type") or "").upper()
        amount = txn.get("amount") or 0
        txn_date = _to_date(txn.get("date"))

        if txn_date is None or txn_type in _SKIP_TYPES:
            continue

        try:
            amount = float(amount)
        except (TypeError, ValueError):
            continue

        if txn_type in _NEGATIVE_TYPES:
            dates.append(txn_date)
            amounts.append(-amount)
        elif txn_type in _POSITIVE_TYPES:
            dates.append(txn_date)
            amounts.append(+amount)

        if first_date is None or txn_date < first_date:
            first_date = txn_date

    # Synthetic final cashflow: current market value
    current_value = float(fund.get("current_value") or 0)
    today = date.today()

    if current_value > 0 and dates:
        dates.append(today)
        amounts.append(+current_value)

    holding_days = (today - first_date).days if first_date else 0

    if len(dates) < 2 or sum(1 for a in amounts if a < 0) == 0:
        return {
            "rate": None,
            "display": "Insufficient data",
            "status": "failed",
            "holding_period_days": holding_days,
            "holding_period_short": holding_days < 365,
        }

    rate = _safe_xirr(dates, amounts)
    if rate is None:
        return {
            "rate": None,
            "display": "Could not compute",
            "status": "failed",
            "holding_period_days": holding_days,
            "holding_period_short": holding_days < 365,
        }

    return {
        "rate": rate,
        "display": f"{rate*100:.2f}%",
        "status": "success",
        "holding_period_days": holding_days,
        "holding_period_short": holding_days < 365,
    }


def compute_portfolio_xirr(funds: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Portfolio-level XIRR: concatenate all cashflows excluding internal transfers
    (SWITCH_IN/OUT) and DIVIDEND_REINVESTMENT, then add per-fund synthetic redemptions.
    """
    dates: List[date] = []
    amounts: List[float] = []

    for fund in funds:
        for txn in (fund.get("transactions") or []):
            txn_type = (txn.get("type") or "").upper()
            txn_date = _to_date(txn.get("date"))
            amount = txn.get("amount") or 0

            if txn_type in _PORTFOLIO_EXCLUDE or txn_date is None:
                continue

            try:
                amount = float(amount)
            except (TypeError, ValueError):
                continue

            if txn_type in _NEGATIVE_TYPES:
                dates.append(txn_date)
                amounts.append(-amount)
            elif txn_type in _POSITIVE_TYPES:
                dates.append(txn_date)
                amounts.append(+amount)

        # Synthetic redemption per fund
        cv = float(fund.get("current_value") or 0)
        if cv > 0:
            dates.append(date.today())
            amounts.append(+cv)

    if len(dates) < 2 or sum(1 for a in amounts if a < 0) == 0:
        return {"rate": None, "display": "Insufficient data", "status": "failed"}

    rate = _safe_xirr(dates, amounts)
    if rate is None:
        return {"rate": None, "display": "Could not compute", "status": "failed"}

    return {"rate": rate, "display": f"{rate*100:.2f}%", "status": "success"}


class ReturnsAgent(BaseAgent):
    """
    Owns XIRR computation for every fund and the portfolio as a whole.
    Never fetches external data — only consumes normalised fund dicts.
    """

    agent_name = "returns_agent"

    async def run(self, funds: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """
        Returns:
            (enriched_funds, portfolio_xirr)
            Each fund dict is enriched with a 'xirr' key.
        """
        total = len(funds)
        self.emit_running(f"Computing returns for {total} funds…", step=1, total_steps=total + 1)

        enriched = []
        for i, fund in enumerate(funds, start=1):
            xirr_result = compute_fund_xirr(fund)
            enriched_fund = {**fund, "xirr": xirr_result}
            enriched.append(enriched_fund)

            status = xirr_result.get("status")
            display = xirr_result.get("display", "N/A")
            name = fund.get("scheme_name", "Unknown")[:40]

            if status == "success":
                self.emit_progress(
                    f"{name}: {display}",
                    step=i,
                    total_steps=total + 1,
                )
            else:
                self.emit_progress(
                    f"{name}: {display}",
                    step=i,
                    total_steps=total + 1,
                )

        # Portfolio-level XIRR
        portfolio_xirr = compute_portfolio_xirr(enriched)
        p_display = portfolio_xirr.get("display", "N/A")

        self.emit_completed(
            f"Portfolio XIRR: {p_display}",
            severity="success" if portfolio_xirr.get("status") == "success" else "warning",
        )

        return enriched, portfolio_xirr