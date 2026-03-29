"""
Resolve missing AMFI scheme codes after CAS parse.

Many PDFs (incl. MFCentral / casparser) leave ``amfi`` empty while providing ISIN
and scheme name.  Without a code, NAV / overlap / benchmark cannot run.

Strategy:
  1) Official AMFI open-ended scheme CSV (ISIN + ``Scheme NAV Name`` + category).
  2) Normalized exact match on scheme name.
  3) Curated aliases for common CAS labels that no longer match AMFI names (renamed funds).
"""
from __future__ import annotations

import csv
import io
import re
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

try:
    import httpx

    HTTPX_AVAILABLE = True
except ImportError:
    HTTPX_AVAILABLE = False

from app.config import settings

_AMFI_CSV_URL = "https://portal.amfiindia.com/DownloadSchemeData_Po.aspx?mf=0"
_ISIN_RE = re.compile(r"INF[A-Z0-9]{9,12}", re.IGNORECASE)

# CAS / investor statement labels -> AMFI scheme code (when CSV name match fails).
# Keys use ``_norm_cas_key`` so they align with normalized PDF scheme strings.
_CAS_SCHEME_CODE_ALIASES: Dict[str, str] = {
    "hdfc top 100 fund - regular plan - growth": "102000",
    "icici prudential bluechip fund - regular plan - growth": "108466",
    "sbi bluechip fund - regular plan - growth": "103504",
    "axis midcap fund - regular plan - growth": "114564",
    "mirae asset large & midcap fund - direct plan - growth": "118834",
    "uti nifty 50 index fund - direct plan - growth": "120716",
}

_master_file_mtime: float = 0.0
_master_ttl_seconds: int = int(7 * 24 * 3600)
_rows_cache: List[Dict[str, str]] = []
_isin_to_code: Dict[str, str] = {}
_nav_norm_to_code_cat: Dict[str, Tuple[str, str]] = {}


def _cache_path() -> Path:
    return Path(settings.NAV_CACHE_DIR).resolve() / "amfi_scheme_master.csv"


def _norm_cas_key(name: str) -> str:
    s = (name or "").lower()
    s = re.sub(r"[–—−]", "-", s)
    s = re.sub(r"[^a-z0-9\-\s&]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def _norm_nav_match(name: str) -> str:
    return _norm_cas_key(name)


def _ensure_master_rows() -> None:
    global _master_file_mtime, _rows_cache, _isin_to_code, _nav_norm_to_code_cat
    path = _cache_path()
    path.parent.mkdir(parents=True, exist_ok=True)

    need_fetch = not path.is_file()
    if path.is_file():
        age_sec = time.time() - path.stat().st_mtime
        if age_sec > float(_master_ttl_seconds):
            need_fetch = True

    if need_fetch and HTTPX_AVAILABLE:
        try:
            with httpx.Client(timeout=60.0, follow_redirects=True) as client:
                r = client.get(_AMFI_CSV_URL)
                r.raise_for_status()
                path.write_bytes(r.content)
        except Exception:
            pass

    if not path.is_file():
        _rows_cache = []
        _isin_to_code = {}
        _nav_norm_to_code_cat = {}
        return

    mtime = path.stat().st_mtime
    if _rows_cache and mtime <= _master_file_mtime:
        return

    raw = path.read_text(encoding="utf-8", errors="replace")
    reader = csv.reader(io.StringIO(raw))
    header = next(reader, None)
    if not header:
        _rows_cache = []
        _isin_to_code = {}
        _nav_norm_to_code_cat = {}
        return

    # Column positions from AMFI export (stable in practice).
    idx_code = 1
    idx_cat = 4
    idx_nav_name = 5
    idx_isin = len(header) - 1

    rows: List[Dict[str, str]] = []
    isin_map: Dict[str, str] = {}
    nav_map: Dict[str, Tuple[str, str]] = {}
    for parts in reader:
        if len(parts) <= idx_isin:
            continue
        code = (parts[idx_code] or "").strip()
        if not code.isdigit():
            continue
        nav = (parts[idx_nav_name] or "").strip()
        cat = (parts[idx_cat] or "").strip()
        isin_blob = (parts[idx_isin] or "").strip().upper()
        rows.append({"code": code, "nav_name": nav, "category": cat})
        for isin in _ISIN_RE.findall(isin_blob):
            isin_map[isin.upper()] = code
        nn = _norm_nav_match(nav)
        if nn:
            nav_map[nn] = (code, cat)

    _rows_cache = rows
    _isin_to_code = isin_map
    _nav_norm_to_code_cat = nav_map
    _master_file_mtime = mtime


def resolve_amfi_and_category(
    scheme_name: str,
    isin: Optional[str],
    current_amfi: str,
    current_category: str,
) -> Tuple[str, str]:
    """
    Return ``(amfi_code, category)`` with unknown fields taken from the AMFI master
    when the CAS omitted them.  ``category`` is only filled from master when empty.
    """
    amfi = (current_amfi or "").strip()
    if amfi.isdigit():
        amfi = str(int(amfi))
    cat = (current_category or "").strip()
    isin_u = (isin or "").strip().upper()

    if amfi and cat:
        return amfi, cat
    if amfi and not cat:
        return amfi, cat

    _ensure_master_rows()

    cas_key = _norm_cas_key(scheme_name)

    # 1) Curated CAS labels (demo / renamed schemes). Runs before ISIN so bogus PDF
    #    ISINs cannot steal the mapping.
    if not amfi and cas_key in _CAS_SCHEME_CODE_ALIASES:
        amfi = _CAS_SCHEME_CODE_ALIASES[cas_key]

    # 2) Exact match on AMFI "Scheme NAV Name" (normalized).
    if not amfi:
        nn = _norm_nav_match(scheme_name)
        hit = _nav_norm_to_code_cat.get(nn)
        if hit:
            amfi, mc = hit
            if not cat and mc:
                cat = mc

    # 3) Official ISIN column (real CAS; synthetic PDFs may still mis-hit).
    if not amfi and isin_u and isin_u in _isin_to_code:
        amfi = _isin_to_code[isin_u]

    if amfi and not cat:
        # Category from any row with same code (first match).
        for row in _rows_cache:
            if row["code"] == amfi and row.get("category"):
                cat = row["category"]
                break

    return amfi, cat


def refresh_master_cache_best_effort() -> None:
    """Force re-parse / re-download on next resolve (for tests)."""
    global _master_file_mtime
    _master_file_mtime = 0.0
    p = _cache_path()
    if p.is_file():
        try:
            p.unlink()
        except OSError:
            pass
