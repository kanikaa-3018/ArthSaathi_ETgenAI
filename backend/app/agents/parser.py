"""
Parser Agent — wraps casparser to extract structured portfolio data from a CAS PDF.
Emits events so the Agent Orchestration Panel can show real-time progress.

Supports:
  - CAMS / KFintech CAS (via casparser library)
  - MFCentral Detail CAS v1.x (custom text-based parser using pdfminer)
"""
import os
import re
import tempfile
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

try:
    import casparser
    CASPARSER_AVAILABLE = True
except ImportError:
    CASPARSER_AVAILABLE = False

try:
    from pdfminer.high_level import extract_text
    PDFMINER_AVAILABLE = True
except ImportError:
    PDFMINER_AVAILABLE = False

from app.agents.base import BaseAgent
import asyncio


class ParserAgent(BaseAgent):
    """
    Owns CAS PDF parsing.
    Writes a temp file → calls casparser → normalises output → deletes temp file.
    Falls back to a text-based parser for MF Central PDFs if casparser fails.
    """

    agent_name = "parser_agent"

    async def run(self, file_bytes: bytes, password: str) -> Dict[str, Any]:
        """
        Parse a CAS PDF and return the raw casparser dict.

        Raises:
            ValueError: wrong password, parse failure, or unsupported format.
        """
        self.emit_running("Parsing CAS statement…", step=1, total_steps=2)

        temp_path: Optional[str] = None
        try:
            # ── Step 1: write bytes to a temp file ──────────────────────────
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                tmp.write(file_bytes)
                temp_path = tmp.name

            # ── Step 2a: try casparser ───────────────────────────────────────
            if CASPARSER_AVAILABLE:
                try:
                    loop = asyncio.get_running_loop()
                    data = await loop.run_in_executor(
                        None, lambda p=temp_path, pw=password: casparser.read_cas_pdf(p, pw)
                    )

                    if hasattr(data, "dict"):
                        data = data.dict()
                    elif hasattr(data, "model_dump"):
                        data = data.model_dump()

                    folio_count, fund_count = self._count_funds(data)
                    # MFCentral PDFs often parse as empty via casparser — force text fallback
                    if fund_count > 0:
                        self.emit_completed(
                            f"Found {fund_count} funds across {folio_count} folios",
                            severity="success",
                        )
                        return data
                    self.emit_warning(
                        "casparser returned no schemes (common for MFCentral CAS); trying text extraction…"
                    )

                except Exception as e:
                    err_str = str(e).lower()
                    if "password" in err_str or "incorrect" in err_str or "decrypt" in err_str:
                        raise ValueError(
                            "WRONG_PASSWORD: Incorrect password. "
                            "CAS statements use your PAN as password (e.g., ABCDE1234F)."
                        ) from e
                    self.emit_warning(f"casparser could not parse PDF ({type(e).__name__}), trying text extraction…")

            # ── Step 2b: text extraction fallback (MFCentral + others) ───────
            if PDFMINER_AVAILABLE:
                try:
                    loop = asyncio.get_running_loop()
                    text = await loop.run_in_executor(
                        None, lambda p=temp_path, pw=password: extract_text(p, password=pw)
                    )
                    if not text or len(text.strip()) < 50:
                        text = await loop.run_in_executor(
                            None, lambda p=temp_path: extract_text(p)
                        )
                    pdf_type = self._detect_pdf_type(text)
                    self.emit_progress(f"Detected PDF type: {pdf_type}", step=2, total_steps=2)

                    data = self._parse_cas_text(text)
                    folio_count, fund_count = self._count_funds(data)
                    if fund_count > 0:
                        self.emit_completed(
                            f"Found {fund_count} funds across {folio_count} folios ({pdf_type} format)",
                            severity="success",
                        )
                        return data
                except Exception as e:
                    self.emit_warning(f"Text extraction failed: {e}")

            # ── Step 2c: nothing worked ──────────────────────────────────────
            self.emit_error("Could not parse PDF. Please upload a CAMS/KFintech/MFCentral detailed CAS.")
            raise ValueError(
                "PARSE_FAILED: Could not parse the uploaded PDF. "
                "Supported formats: CAMS, KFintech, and MFCentral detailed CAS statements."
            )

        finally:
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)

    # ───────────────────────────────────────────────────────────────────────
    # Helpers
    # ───────────────────────────────────────────────────────────────────────

    @staticmethod
    def _count_funds(data: Dict[str, Any]):
        folios = data.get("folios") or []
        fund_count = sum(len(f.get("schemes") or []) for f in folios)
        return len(folios), fund_count

    @staticmethod
    def _detect_pdf_type(text: str) -> str:
        if "MFCentral" in text or "mfcentral" in text.lower():
            return "mfcentral"
        if "CAMS" in text:
            return "cams"
        if "KFintech" in text or "Karvy" in text:
            return "kfintech"
        return "unknown"

    # ───────────────────────────────────────────────────────────────────────
    # Regex patterns for MFCentral / generic CAS text parsing
    # ───────────────────────────────────────────────────────────────────────

    _RE_PAN = re.compile(r"PAN\s*:\s*([A-Z]{5}\d{4}[A-Z])")
    _RE_EMAIL = re.compile(r"Email\s*:\s*([\w.+-]+@[\w.-]+)")
    _RE_MOBILE = re.compile(r"Mobile\s*:\s*(\d{10})")
    _RE_PERIOD_FROM = re.compile(r"From\s+Date\s*:\s*([\d]+-\w+-\d{4})")
    _RE_PERIOD_TO = re.compile(r"To\s+Date\s*:\s*([\d]+-\w+-\d{4})")
    _RE_FOLIO = re.compile(r"FOLIO\s+NO\s*:\s*([\w/]+)", re.IGNORECASE)
    _RE_ISIN = re.compile(r"ISIN\s*:\s*(INF[\w]+)")
    _RE_ADVISOR = re.compile(r"\(Advisor\s*:\s*([^)]+)\)")
    _RE_OPENING = re.compile(r"Opening\s+Unit\s+Balance\s*:\s*([\d,.]+)")
    _RE_CLOSING = re.compile(r"Closing\s+Unit\s+Balance\s*:\s*([\d,.]+)")
    _RE_NAV_LINE = re.compile(r"Nav\s+as\s+on\s+[\w-]+\s*:\s*INR\s+([\d,.]+)")
    _RE_VALUATION = re.compile(r"Valuation\s+on\s+([\w-]+)\s*:\s*INR\s+([\d,.]+)")
    _RE_DATE = re.compile(r"^\d{1,2}-[A-Za-z]{3}-\d{4}$", re.IGNORECASE)
    _RE_TXN_TYPE = re.compile(
        r"(Systematic Investment|Systematic Withdrawal|Purchase|Redemption|"
        r"Switch In|Switch Out|Dividend Payout|Dividend Reinvestment|"
        r"IDCW Payout|IDCW Reinvestment|Stamp Duty|STT|Miscellaneous)",
        re.IGNORECASE,
    )

    @staticmethod
    def _pfloat(s: str) -> float:
        """Parse a string like '12,28,489.04' into float."""
        return float(s.replace(",", "").strip())

    @staticmethod
    def _parse_date_str(s: str) -> str:
        """Convert '01-Jan-2025' / '1-JAN-2025' to ISO '2025-01-01'."""
        s = s.strip()
        if re.match(r"^\d{1,2}-[A-Za-z]{3}-\d{4}$", s, re.IGNORECASE):
            d, mon, y = s.split("-")
            mon = mon.capitalize()
            s = f"{d}-{mon}-{y}"
        for fmt in ("%d-%b-%Y", "%d-%B-%Y", "%d/%m/%Y", "%Y-%m-%d"):
            try:
                return datetime.strptime(s, fmt).strftime("%Y-%m-%d")
            except ValueError:
                continue
        return s

    def _extract_investor_info(self, text: str) -> Dict[str, str]:
        pan_m = self._RE_PAN.search(text)
        email_m = self._RE_EMAIL.search(text)
        mobile_m = self._RE_MOBILE.search(text)
        pan = pan_m.group(1) if pan_m else ""

        name = "Unknown"
        lines = text.split("\n")
        for i, line in enumerate(lines):
            if "PAN:" in line:
                for j in range(i + 1, min(i + 5, len(lines))):
                    candidate = lines[j].strip()
                    if candidate and not candidate.startswith(("S/o", "D/o", "W/o", "Mobile", "Email", "KYC")):
                        name = candidate
                        break
                break

        return {
            "name": name,
            "email": email_m.group(1) if email_m else "",
            "mobile": mobile_m.group(1) if mobile_m else "",
            "pan": pan,
        }

    def _extract_period(self, text: str) -> Dict[str, str]:
        from_m = self._RE_PERIOD_FROM.search(text)
        to_m = self._RE_PERIOD_TO.search(text)
        return {
            "from": self._parse_date_str(from_m.group(1)) if from_m else "",
            "to": self._parse_date_str(to_m.group(1)) if to_m else "",
        }

    def _is_scheme_line(self, line: str) -> bool:
        return bool(self._RE_ISIN.search(line)) or ("Advisor:" in line and "Fund" in line)

    def _extract_scheme_name(self, line: str) -> Tuple[str, str, str]:
        isin_m = self._RE_ISIN.search(line)
        isin = isin_m.group(1) if isin_m else ""
        advisor_m = self._RE_ADVISOR.search(line)
        advisor = advisor_m.group(1).strip() if advisor_m else ""
        name = line
        if advisor_m:
            name = name[:advisor_m.start()].strip()
        if isin_m:
            name = name[:isin_m.start()].strip()
        name = re.sub(r"\s*\(?\s*$", "", name).strip()
        return name, isin, advisor

    def _parse_transactions_block(self, lines: List[str]) -> List[Dict[str, Any]]:
        """
        Parse transactions from MFCentral column-extracted text.

        pdfminer extracts the table column-by-column, so we get:
        - Dates and txn types interleaved
        - Then all amount values
        - Then all NAV values
        - Then all balance values
        - Then all unit values
        """
        dates: List[str] = []
        txn_types: List[str] = []
        numbers: List[float] = []

        skip_strings = {
            "Date", "Transaction", "Amount (INR)", "Units",
            "Price", "(INR)", "Unit Balance", "---",
        }

        for line in lines:
            line = line.strip()
            if not line or line in skip_strings:
                continue
            if "No Transaction" in line or "No Folios" in line:
                return []
            if "Opening Unit Balance" in line or "Closing Unit Balance" in line:
                continue
            if "Nav as on" in line or "Valuation on" in line:
                continue
            if "KYC" in line or "Page " in line or "MFCentral" in line:
                continue
            if "Consolidated Account" in line or "SoA Holdings" in line or "Demat Holdings" in line:
                continue

            if self._RE_DATE.match(line):
                dates.append(line)
                continue

            txn_m = self._RE_TXN_TYPE.match(line)
            if txn_m:
                txn_types.append(txn_m.group(0))
                continue

            cleaned = line.replace(",", "")
            try:
                numbers.append(float(cleaned))
            except ValueError:
                pass

        if not dates:
            return []

        n = len(dates)
        while len(txn_types) < n:
            txn_types.append("Systematic Investment")

        # Reconstruct columns from grouped numbers
        if len(numbers) >= n * 4:
            amounts = numbers[0:n]
            navs = numbers[n:2*n]
            balances = numbers[2*n:3*n]
            units = numbers[3*n:4*n]
        elif len(numbers) >= n * 3:
            amounts = numbers[0:n]
            navs = numbers[n:2*n]
            balances = numbers[2*n:3*n]
            units = [round(a / p, 3) if p else 0 for a, p in zip(amounts, navs)]
        elif len(numbers) >= n * 2:
            amounts = numbers[0:n]
            navs = numbers[n:2*n]
            units = [round(a / p, 3) if p else 0 for a, p in zip(amounts, navs)]
            balances = [0.0] * n
        elif len(numbers) >= n:
            amounts = numbers[0:n]
            navs = [0.0] * n
            units = [0.0] * n
            balances = [0.0] * n
        else:
            return []

        transactions = []
        for i in range(n):
            raw = txn_types[i].lower()
            if "systematic investment" in raw or (
                "purchase" in raw and "dividend" not in raw and "idcw" not in raw
            ):
                t = "PURCHASE_SIP" if "systematic" in raw else "PURCHASE"
            elif "redemption" in raw or "withdrawal" in raw:
                t = "REDEMPTION"
            elif "switch in" in raw:
                t = "SWITCH_IN"
            elif "switch out" in raw:
                t = "SWITCH_OUT"
            elif "dividend" in raw or "idcw" in raw:
                if "reinvestment" in raw or "reinvest" in raw:
                    t = "DIVIDEND_REINVESTMENT"
                else:
                    t = "DIVIDEND_PAYOUT"
            elif "stamp duty" in raw:
                t = "STAMP_DUTY_TAX"
            elif "securities transaction tax" in raw or raw.strip() == "stt":
                t = "STT_TAX"
            elif "miscellaneous" in raw or raw.strip() == "misc":
                t = "MISC"
            else:
                t = "MISC"

            transactions.append({
                "type": t,
                "date": self._parse_date_str(dates[i]),
                "amount": amounts[i],
                "units": units[i] if i < len(units) else 0,
                "nav": navs[i] if i < len(navs) else 0,
                "balance": balances[i] if i < len(balances) else 0,
            })

        return transactions

    def _parse_cas_text(self, text: str) -> Dict[str, Any]:
        """
        Full text parser for MFCentral Detail CAS and other CAS-like PDFs.
        Produces the same schema as casparser so all downstream agents work.
        """
        investor_info = self._extract_investor_info(text)
        statement_period = self._extract_period(text)

        lines = text.split("\n")
        folios: List[Dict[str, Any]] = []

        current_amc = ""
        current_folio = ""
        current_scheme: Optional[Dict[str, Any]] = None
        scheme_lines: List[str] = []
        collecting_txns = False

        def _flush_scheme():
            nonlocal current_scheme, scheme_lines, collecting_txns
            if not current_scheme:
                return
            txns = self._parse_transactions_block(scheme_lines)
            current_scheme["transactions"] = txns

            folio_entry = None
            for f in folios:
                if f["folio"] == current_folio:
                    folio_entry = f
                    break
            if folio_entry is None:
                folio_entry = {"folio": current_folio, "amc": current_amc, "schemes": []}
                folios.append(folio_entry)
            folio_entry["schemes"].append(current_scheme)

            current_scheme = None
            scheme_lines = []
            collecting_txns = False

        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue

            # Skip page footers and repeated headers
            if "MFCentralDetailCAS" in stripped or (stripped.startswith("Page ") and " of " in stripped):
                continue
            if stripped == "Consolidated Account Statement":
                continue
            if stripped in ("SoA Holdings", "Demat Holdings"):
                continue

            # AMC header: line ending with "Mutual Fund" or "MF"
            if re.match(r".+\s+(Mutual Fund|MF)\s*$", stripped) and "FOLIO" not in stripped:
                _flush_scheme()
                current_amc = stripped
                continue

            # Folio line
            folio_m = self._RE_FOLIO.search(stripped)
            if folio_m:
                _flush_scheme()
                current_folio = folio_m.group(1).strip()
                continue

            # Scheme line (contains ISIN or "Advisor:")
            if self._is_scheme_line(stripped):
                _flush_scheme()
                name, isin, advisor = self._extract_scheme_name(stripped)
                is_direct = "direct" in name.lower()

                current_scheme = {
                    "scheme": name,
                    "isin": isin,
                    "amfi": "",
                    "advisor": advisor,
                    "plan": "direct" if is_direct else "regular",
                    "close": 0.0,
                    "valuation": {"date": "", "nav": 0.0, "value": 0.0},
                    "transactions": [],
                }
                collecting_txns = True
                scheme_lines = []
                continue

            # Closing unit balance
            close_m = self._RE_CLOSING.search(stripped)
            if close_m and current_scheme is not None:
                current_scheme["close"] = self._pfloat(close_m.group(1))
                continue

            # NAV line
            nav_m = self._RE_NAV_LINE.search(stripped)
            if nav_m and current_scheme is not None:
                current_scheme["valuation"]["nav"] = self._pfloat(nav_m.group(1))
                continue

            # Valuation line (marks end of scheme data block)
            val_m = self._RE_VALUATION.search(stripped)
            if val_m and current_scheme is not None:
                current_scheme["valuation"]["date"] = self._parse_date_str(val_m.group(1))
                current_scheme["valuation"]["value"] = self._pfloat(val_m.group(2))
                continue

            # Collect lines for transaction parsing
            if collecting_txns and current_scheme is not None:
                scheme_lines.append(stripped)

        # Flush the last scheme
        _flush_scheme()

        # For funds with no transactions but with a valuation,
        # synthesize a purchase so XIRR has something to compute
        period_from = statement_period.get("from", "")
        for folio in folios:
            for scheme in folio.get("schemes", []):
                if not scheme.get("transactions") and scheme.get("valuation", {}).get("value"):
                    val = scheme["valuation"]
                    scheme["transactions"] = [{
                        "type": "PURCHASE",
                        "date": period_from or val.get("date", ""),
                        "amount": val["value"],
                        "units": scheme.get("close", 0),
                        "nav": val.get("nav", 0),
                        "balance": scheme.get("close", 0),
                    }]

        return {
            "investor_info": investor_info,
            "folios": folios,
            "statement_period": statement_period,
        }
