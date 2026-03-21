"""
Parser Agent — wraps casparser to extract structured portfolio data from a CAS PDF.
Emits events so the Agent Orchestration Panel can show real-time progress.
"""
import os
import tempfile
from typing import Any, Dict, Optional

try:
    import casparser
    from casparser.exceptions import IncorrectPasswordError
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
                    # casparser.read_cas_pdf is synchronous — run in executor
                    loop = asyncio.get_event_loop()
                    data = await loop.run_in_executor(
                        None, lambda: casparser.read_cas_pdf(temp_path, password)
                    )

                    # casparser may return a Pydantic model — convert to dict
                    if hasattr(data, "dict"):
                        data = data.dict()
                    elif hasattr(data, "model_dump"):
                        data = data.model_dump()

                    folio_count, fund_count = self._count_funds(data)
                    self.emit_completed(
                        f"Found {fund_count} funds across {folio_count} folios",
                        severity="success",
                    )
                    return data

                except Exception as e:
                    err_str = str(e).lower()
                    if "password" in err_str or "incorrect" in err_str or "decrypt" in err_str:
                        raise ValueError(
                            "WRONG_PASSWORD: Incorrect password. "
                            "CAS statements use your PAN as password (e.g., ABCDE1234F)."
                        ) from e
                    # Otherwise fall through to custom parser
                    self.emit_warning(f"casparser could not parse PDF ({type(e).__name__}), trying text extraction…")

            # ── Step 2b: try text extraction for MF Central ──────────────────
            if PDFMINER_AVAILABLE:
                try:
                    loop = asyncio.get_event_loop()
                    text = await loop.run_in_executor(
                        None, lambda: extract_text(temp_path)
                    )
                    pdf_type = self._detect_pdf_type(text)
                    self.emit_progress(f"Detected PDF type: {pdf_type}", step=2, total_steps=2)

                    if pdf_type == "mfcentral":
                        data = self._parse_mfcentral(text)
                        folio_count, fund_count = self._count_funds(data)
                        self.emit_completed(
                            f"Found {fund_count} funds across {folio_count} folios (MF Central format)",
                            severity="success",
                        )
                        return data
                except Exception as e:
                    self.emit_warning(f"Text extraction failed: {e}")

            # ── Step 2c: nothing worked ──────────────────────────────────────
            self.emit_error("Could not parse PDF. Please upload a CAMS/KFintech detailed CAS.")
            raise ValueError(
                "PARSE_FAILED: Could not parse the uploaded PDF. "
                "Only digital (non-scanned) CAMS and KFintech detailed CAS statements are supported."
            )

        finally:
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)

    # -----------------------------------------------------------------------
    # Internal helpers
    # -----------------------------------------------------------------------

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

    @staticmethod
    def _extract_investor_name(text: str) -> str:
        lines = text.split("\n")
        for i, line in enumerate(lines):
            if "PAN:" in line and i + 1 < len(lines):
                return lines[i + 1].strip()
        return "Unknown"

    def _parse_mfcentral(self, text: str) -> Dict[str, Any]:
        """Light-weight text parser for MF Central statements."""
        funds = []
        lines = text.split("\n")
        investor_name = self._extract_investor_name(text)
        current_fund: Dict[str, Any] = {}

        for line in lines:
            line = line.strip()
            if not line:
                continue

            if "Mutual Fund" in line:
                current_fund = {"amc": line}

            elif "FOLIO NO" in line or "Folio No" in line:
                parts = line.split(":")
                if len(parts) > 1:
                    current_fund["folio"] = parts[-1].strip()

            elif ("Fund" in line and "Growth" in line) or "Direct" in line:
                current_fund["scheme_name"] = line
                current_fund["amfi"] = ""

            elif "Valuation on" in line or "Market Value" in line:
                try:
                    val_str = line.split("INR")[-1].replace(",", "").strip()
                    current_fund["current_value"] = float(val_str.split()[0])
                    if "scheme_name" in current_fund:
                        funds.append({**current_fund})
                    current_fund = {}
                except (ValueError, IndexError):
                    pass

        return {
            "investor_info": {"name": investor_name, "email": "", "mobile": ""},
            "folios": [{"folio": f.get("folio", ""), "amc": f.get("amc", ""), "schemes": [f]} for f in funds],
            "statement_period": {"from": "", "to": ""},
        }