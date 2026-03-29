"""
Shared utility functions for ArthSaathi backend.
"""
from datetime import datetime, date
from typing import Optional, List, Dict, Any
import re


# ---------------------------------------------------------------------------
# INR formatting (server-side, for AI advisor fallback text)
# ---------------------------------------------------------------------------

def format_inr(value: float) -> str:
    """Format a number as Indian currency string."""
    abs_val = abs(value)
    sign = "-" if value < 0 else ""
    if abs_val >= 1e7:
        return f"{sign}₹{abs_val/1e7:.2f} Cr"
    elif abs_val >= 1e5:
        return f"{sign}₹{abs_val/1e5:.2f} L"
    else:
        return f"{sign}₹{int(abs_val):,}"


def format_pct(rate: float) -> str:
    """Format as percentage string."""
    return f"{rate*100:.2f}%"


# ---------------------------------------------------------------------------
# PAN masking
# ---------------------------------------------------------------------------

def mask_pan(pan: str) -> str:
    """ABCDE1234F → ABCDE****F"""
    if not pan or len(pan) < 4:
        return pan or ""
    return pan[:5] + "****" + pan[-1]


# ---------------------------------------------------------------------------
# Date parsing helpers
# ---------------------------------------------------------------------------

_DATE_FMTS = ["%d-%m-%Y", "%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d"]


def parse_date(value) -> Optional[date]:
    """Parse a date from various string formats or pass-through date/datetime."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if isinstance(value, str):
        for fmt in _DATE_FMTS:
            try:
                return datetime.strptime(value, fmt).date()
            except ValueError:
                continue
    return None


# ---------------------------------------------------------------------------
# CAS data normalisation
# ---------------------------------------------------------------------------


def normalize_amfi_code(raw: Any) -> str:
    """
    Canonical AMFI scheme code for API URLs and holdings.json keys.
    Trims whitespace; strips leading zeros on pure-digit codes (PDFs may vary).
    """
    if raw is None:
        return ""
    s = str(raw).strip()
    if not s:
        return ""
    if s.isdigit():
        return str(int(s))
    return s


# Transaction types that produce negative cashflows (money OUT from investor)
_NEGATIVE_TYPES = {
    "PURCHASE", "PURCHASE_SIP",
    "SWITCH_IN", "SWITCH_IN_MERGER",
    "STAMP_DUTY_TAX", "TDS_TAX", "STT_TAX",
}

# Transaction types that produce positive cashflows (money IN to investor)
_POSITIVE_TYPES = {
    "REDEMPTION",
    "SWITCH_OUT", "SWITCH_OUT_MERGER",
    "DIVIDEND_PAYOUT",
}

# Skip these for cashflow computation
_SKIP_TYPES = {
    "DIVIDEND_REINVESTMENT", "SEGREGATION", "MISC",
}


def normalize_cas_data(raw: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Normalise the raw casparser output into a flat list of scheme dicts
    with consistent field names consumed by all computation agents.
    """
    funds: List[Dict[str, Any]] = []

    folios = raw.get("folios") or []
    for folio in folios:
        folio_number = folio.get("folio") or folio.get("number") or ""
        amc = folio.get("amc") or folio.get("fund_house") or ""

        schemes = folio.get("schemes") or []
        for scheme in schemes:
            # Support both casparser Pydantic model (already dict-ified) and
            # legacy dict structures
            if hasattr(scheme, "dict"):
                scheme = scheme.dict()

            # Advisor / plan-type detection
            advisor = scheme.get("advisor") or ""
            is_direct = (
                advisor.upper() == "DIRECT"
                or "DIRECT" in (scheme.get("scheme") or scheme.get("scheme_name") or "").upper()
            )

            # Valuation block (casparser format)
            valuation = scheme.get("valuation") or {}
            current_nav = float(valuation.get("nav") or scheme.get("current_nav") or 0)
            current_value = float(valuation.get("value") or scheme.get("current_value") or 0)
            close_units = float(scheme.get("close") or scheme.get("units") or 0)

            # Build normalised transaction list
            raw_txns = scheme.get("transactions") or []
            transactions: List[Dict[str, Any]] = []
            total_invested = 0.0

            for txn in raw_txns:
                if hasattr(txn, "dict"):
                    txn = txn.dict()

                txn_type = str(txn.get("type") or "").upper()
                amount_raw = txn.get("amount") or 0
                try:
                    amount = abs(float(amount_raw))
                except (TypeError, ValueError):
                    amount = 0.0

                txn_date = parse_date(txn.get("date"))
                if txn_date is None or amount == 0:
                    continue

                # Track invested amount
                if txn_type in _NEGATIVE_TYPES:
                    if txn_type in {"PURCHASE", "PURCHASE_SIP"}:
                        total_invested += amount

                transactions.append({
                    "type": txn_type,
                    "date": txn_date,
                    "amount": amount,
                    "units": float(txn.get("units") or 0),
                    "nav": float(txn.get("nav") or 0),
                    "balance": float(txn.get("balance") or 0),
                })

            fund = {
                "scheme_name": scheme.get("scheme") or scheme.get("scheme_name") or "Unknown",
                "amfi_code": normalize_amfi_code(
                    scheme.get("amfi") or scheme.get("amfi_code") or "",
                ),
                "folio": folio_number,
                "amc": amc,
                "is_direct": is_direct,
                "advisor": advisor,
                "units": close_units,
                "current_nav": current_nav,
                "current_value": current_value,
                "invested_value": total_invested,
                "transactions": transactions,
                # Filled in later by other agents:
                "category": scheme.get("category") or "",
            }
            funds.append(fund)

    return funds