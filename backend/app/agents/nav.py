"""
NAV Agent — fetches current and historical NAVs from mfapi.in with disk caching.
All mfapi.in communication is owned exclusively by this agent.
"""
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple
import asyncio

try:
    import httpx
    HTTPX_AVAILABLE = True
except ImportError:
    HTTPX_AVAILABLE = False

try:
    import diskcache
    DISKCACHE_AVAILABLE = True
except ImportError:
    DISKCACHE_AVAILABLE = False

from app.agents.base import BaseAgent
from app.config import settings

MFAPI_BASE = "https://api.mfapi.in"
_CACHE: Optional[Any] = None   # module-level singleton


def _get_cache():
    global _CACHE
    if _CACHE is None and DISKCACHE_AVAILABLE:
        _CACHE = diskcache.Cache(settings.NAV_CACHE_DIR)
    return _CACHE


def _cache_get(key: str) -> Optional[Any]:
    c = _get_cache()
    if c is None:
        return None
    try:
        return c.get(key)
    except Exception:
        return None


def _cache_set(key: str, value: Any) -> None:
    c = _get_cache()
    if c is None:
        return
    try:
        ttl = settings.NAV_CACHE_TTL_HOURS * 3600
        c.set(key, value, expire=ttl)
    except Exception:
        pass


def _parse_mfapi_date(date_str: str) -> Optional[date]:
    """Parse 'DD-MM-YYYY' from mfapi response."""
    try:
        return datetime.strptime(date_str, "%d-%m-%Y").date()
    except (ValueError, TypeError):
        return None


class NAVAgent(BaseAgent):
    """
    Fetches NAVs for all schemes from mfapi.in.
    Caches responses with a 6-hour TTL using diskcache.
    """

    agent_name = "nav_agent"

    async def run(self, funds: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Enrich each fund with 'meta' (category, fund house) and
        'nav_history' (list of {date, nav} dicts from mfapi.in).
        Returns the enriched fund list.
        """
        total = len(funds)
        self.emit_running(f"Fetching NAVs for {total} schemes…", step=0, total_steps=total)

        if not HTTPX_AVAILABLE:
            self.emit_warning("httpx not installed — using CAS valuation data only")
            return funds

        enriched = []
        async with httpx.AsyncClient(timeout=15.0) as client:
            tasks = [self._fetch_fund_nav(client, fund, i + 1, total)
                     for i, fund in enumerate(funds)]
            results = await asyncio.gather(*tasks, return_exceptions=True)

        for fund, result in zip(funds, results):
            if isinstance(result, Exception):
                self.emit_warning(f"NAV fetch failed for {fund.get('scheme_name', '')[:30]}: {result}")
                enriched.append(fund)
            else:
                enriched.append(result)

        self.emit_completed(f"All {total} NAVs fetched", severity="success")
        return enriched

    async def _fetch_fund_nav(
        self,
        client: "httpx.AsyncClient",
        fund: Dict[str, Any],
        step: int,
        total: int,
    ) -> Dict[str, Any]:
        amfi_code = fund.get("amfi_code") or ""
        scheme_name = fund.get("scheme_name", "Unknown")[:35]

        if not amfi_code:
            self.emit_progress(f"No AMFI code for {scheme_name}", step=step, total_steps=total)
            return fund

        # ── Try cache first ──────────────────────────────────────────────────
        cache_key = f"nav_{amfi_code}"
        cached = _cache_get(cache_key)
        if cached:
            self.emit_progress(f"{scheme_name} (cached)", step=step, total_steps=total)
            return {**fund, **cached}

        # ── Fetch from mfapi.in ──────────────────────────────────────────────
        try:
            resp = await client.get(f"{MFAPI_BASE}/mf/{amfi_code}")
            resp.raise_for_status()
            payload = resp.json()
        except Exception as e:
            # Fallback: use CAS valuation data that the parser already extracted
            self.emit_progress(f"{scheme_name}: mfapi failed ({e}), using CAS NAV", step=step, total_steps=total)
            return fund

        meta = payload.get("meta") or {}
        raw_data = payload.get("data") or []

        # Parse NAV history: [{date, nav}, …] sorted newest-first by mfapi
        nav_history: List[Dict[str, Any]] = []
        for entry in raw_data:
            d = _parse_mfapi_date(entry.get("date", ""))
            try:
                nav_val = float(entry.get("nav", 0))
            except (TypeError, ValueError):
                continue
            if d:
                nav_history.append({"date": d, "nav": nav_val})

        # Latest NAV: first entry (mfapi returns newest-first)
        current_nav = nav_history[0]["nav"] if nav_history else fund.get("current_nav") or 0

        enrichment = {
            "category": meta.get("scheme_category") or fund.get("category") or "",
            "amc": meta.get("fund_house") or fund.get("amc") or "",
            "scheme_name": meta.get("scheme_name") or fund.get("scheme_name") or "",
            "current_nav": current_nav,
            "current_value": (fund.get("units") or 0) * current_nav
                             if current_nav and (fund.get("units") or 0) > 0
                             else fund.get("current_value") or 0,
            "nav_history": nav_history,
        }

        _cache_set(cache_key, enrichment)
        self.emit_progress(f"{scheme_name}: NAV {current_nav:.2f}", step=step, total_steps=total)
        return {**fund, **enrichment}

    # -----------------------------------------------------------------------
    # Utility methods (used by BenchmarkAgent)
    # -----------------------------------------------------------------------

    @staticmethod
    async def fetch_historical_nav(
        amfi_code: str,
        client: Optional["httpx.AsyncClient"] = None,
    ) -> List[Dict[str, Any]]:
        """
        Fetch full NAV history for a given AMFI code.
        Returns list of {date, nav} sorted newest-first.
        """
        cache_key = f"nav_{amfi_code}"
        cached = _cache_get(cache_key)
        if cached and "nav_history" in cached:
            return cached["nav_history"]

        close_client = client is None
        if client is None:
            if not HTTPX_AVAILABLE:
                return []
            client = httpx.AsyncClient(timeout=15.0)
        try:
            resp = await client.get(f"{MFAPI_BASE}/mf/{amfi_code}")
            resp.raise_for_status()
            payload = resp.json()
        except Exception:
            return []
        finally:
            if close_client:
                await client.aclose()

        raw_data = payload.get("data") or []
        history = []
        for entry in raw_data:
            d = _parse_mfapi_date(entry.get("date", ""))
            try:
                nav_val = float(entry.get("nav", 0))
            except (TypeError, ValueError):
                continue
            if d:
                history.append({"date": d, "nav": nav_val})

        return history

    @staticmethod
    def nav_on_date(
        history: List[Dict[str, Any]],
        target: date,
    ) -> Optional[float]:
        """
        Return the NAV closest to `target` date from a sorted-newest-first list.
        Searches within ±7 days.
        """
        if not history:
            return None
        best = None
        best_diff = timedelta(days=8)
        for entry in history:
            d = entry["date"]
            diff = abs(d - target)
            if diff < best_diff:
                best_diff = diff
                best = entry["nav"]
        return best
