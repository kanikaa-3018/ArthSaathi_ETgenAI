"""
AI Mentor chat — SSE token stream with LLM cascade + rule-based fallback.

SDK references (verify when upgrading majors):
- Anthropic: async stream via ``async for event in stream`` + ``content_block_delta`` / ``text_delta``
  (see anthropic Python SDK streaming docs).
- OpenAI: ``AsyncOpenAI.chat.completions.create`` (Responses API not used here).
- Google Generative AI: ``GenerativeModel.start_chat`` for multi-turn history.
"""
from __future__ import annotations

import json
import logging
from typing import Any, AsyncGenerator, Dict, List, Tuple

from app.config import settings
from app.utils import format_inr

logger = logging.getLogger(__name__)

CHAT_SYSTEM_PROMPT = """You are ArthSaathi (अर्थसाथी), an AI financial mentor. You have the user's mutual fund portfolio analysis.
Answer using THEIR specific data — never generic boilerplate.

RULES:
1. Reference specific fund names, amounts, and percentages when relevant.
2. Indian number formatting (₹ lakhs / ₹ crores).
3. Keep responses concise — 3–6 sentences unless the user asks for detail.
4. When recommending actions, quantify impact where data allows.
5. Never recommend specific funds to buy — describe the category/type.
6. If asked outside portfolio data, say you can only advise from the uploaded analysis and suggest a SEBI-registered advisor.
7. Warm, professional tone.

PORTFOLIO CONTEXT (JSON excerpt):
{portfolio_context_json}
"""


def _compact_context(portfolio_context: Dict[str, Any]) -> str:
    raw = json.dumps(portfolio_context, indent=2, default=str)
    return raw[:12000]


def rule_based_chat(message: str, portfolio_context: Dict[str, Any]) -> str:
    """Deterministic answers from structured analysis — works with zero API keys."""
    msg = (message or "").lower()
    ps = portfolio_context
    summary = ps.get("portfolio_summary") or {}
    expense = ps.get("expense_summary") or {}
    xirr = (ps.get("portfolio_xirr") or {}).get("display", "N/A")
    health = ps.get("health_score") or {}
    funds = ps.get("funds") or []
    n_funds = summary.get("total_funds", len(funds))
    value = summary.get("total_current_value", 0)
    equity_pct = summary.get("equity_allocation_pct", 0)
    drag = expense.get("total_annual_drag", 0)
    savings = expense.get("total_potential_annual_savings", 0)
    overlap = ps.get("overlap_analysis") or {}
    max_ov = overlap.get("max_pairwise_overlap")

    if any(k in msg for k in ("large cap", "allocation", "diversif", "heavy", "tilt")):
        return (
            f"Your portfolio is roughly {equity_pct:.1f}% equity vs {100-equity_pct:.1f}% non-equity (from CAS categories). "
            f"Across {n_funds} schemes, watch overlap in similar categories — check the overlap matrix for pairs above ~30%. "
            f"Portfolio XIRR is {xirr}. Adjust allocation only after your goals and risk appetite — this is educational guidance, not advice."
        )

    if any(k in msg for k in ("retire", "retirement", "fire")):
        wp = ps.get("wealth_projection") or {}
        g10 = wp.get("gap_at_10yr", 0)
        return (
            f"Your portfolio is about {format_inr(value)} with XIRR {xirr}. "
            f"The wealth gap section shows roughly {format_inr(g10)} difference vs an optimised path over 10 years — mainly from costs and overlap. "
            f"Use the Goal Planner on this page for a retirement corpus check with inflation."
        )

    if any(k in msg for k in ("tax", "ltcg", "stcg", "capital gain")):
        return (
            "Tax depends on fund type, holding period, and purchase history. For listed equity MF, LTCG on gains above ₹1.25 lakh "
            "in a year is often taxed at 12.5% (with many caveats); STCG on equity-oriented funds held for a shorter period is often 20%. "
            "Debt taxation is commonly at slab for units acquired under post–Apr 2023 rules — but old lots can differ. "
            "See Tax Insights for a rough heuristic from your CAS; confirm with a CA before acting."
        )

    if any(k in msg for k in ("fee", "expense", "ter", "cost", "drag")):
        return (
            f"Annual expense drag is about {format_inr(drag)}. Switching regular plans to direct where possible could save "
            f"about {format_inr(savings)} per year according to this analysis — same funds, lower distributor commission."
        )

    if "overlap" in msg:
        if max_ov is not None:
            return (
                f"Maximum pairwise overlap in your portfolio is about {max_ov:.0f}%. "
                "High overlap means different funds hold similar stocks — you may be paying multiple TERs for the same exposure."
            )
        return "Open the overlap heatmap on this report — it shows which fund pairs share underlying holdings."

    if any(k in msg for k in ("first", "what should i do", "next", "priority", "action")):
        return (
            f"Three practical steps from your data: (1) Address fee drag — ~{format_inr(drag)}/yr in TERs; direct plans save ~{format_inr(savings)}. "
            f"(2) Health score is {health.get('score', 'N/A')}/100 — review the rebalancing plan. "
            f"(3) If overlap is high, consolidate duplicate exposures. Consult a SEBI-registered advisor before switching."
        )

    return (
        f"Here's a quick snapshot: {n_funds} funds, about {format_inr(value)} total value, portfolio XIRR {xirr}, "
        f"health score {health.get('score', 'N/A')}/100. Ask about fees, overlap, taxes, or goals — I'll stick to this portfolio's numbers."
    )


async def _anthropic_stream_text_deltas(stream: Any) -> AsyncGenerator[str, None]:
    """Iterate Anthropic ``AsyncMessageStream`` — SDK 0.49+ uses events, not ``text_stream``."""
    async for event in stream:
        if getattr(event, "type", None) != "content_block_delta":
            continue
        delta = getattr(event, "delta", None)
        if delta is None:
            continue
        if getattr(delta, "type", None) == "text_delta":
            t = getattr(delta, "text", "") or ""
            if t:
                yield t


async def stream_chat_events(
    user_message: str,
    portfolio_context: Dict[str, Any],
    history: List[Dict[str, str]],
) -> AsyncGenerator[Tuple[str, str], None]:
    """
    Yields tuples of (event_name, json_data_str).
    event_name is 'token' or 'done'.
    """
    system = CHAT_SYSTEM_PROMPT.format(portfolio_context_json=_compact_context(portfolio_context))
    messages: List[Dict[str, Any]] = []
    for h in history[-10:]:
        role = h.get("role", "user")
        content = h.get("content", "")
        if role in ("user", "assistant"):
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": user_message})

    # 1) Anthropic streaming (official pattern: async for event in stream)
    if settings.ANTHROPIC_API_KEY:
        try:
            import anthropic

            client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            async with client.messages.stream(
                model=settings.ANTHROPIC_MODEL,
                max_tokens=900,
                temperature=0.35,
                system=system,
                messages=messages,
            ) as stream:
                full = ""
                async for text in _anthropic_stream_text_deltas(stream):
                    full += text
                    yield ("token", json.dumps({"content": text}))
                try:
                    final = (await stream.get_final_text()).strip()
                except Exception:
                    final = full.strip()
                full = final or full.strip()
            yield (
                "done",
                json.dumps(
                    {
                        "content": full,
                        "llm_provider": "anthropic",
                        "llm_model": settings.ANTHROPIC_MODEL,
                    },
                ),
            )
            return
        except Exception as e:
            logger.warning("Anthropic chat stream failed, trying next provider: %s", e, exc_info=True)

    # 2) OpenAI (non-stream; chunk for UI — same text as one completion)
    if settings.OPENAI_API_KEY:
        try:
            from openai import AsyncOpenAI

            aclient = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            resp = await aclient.chat.completions.create(
                model=settings.OPENAI_CHAT_MODEL,
                max_tokens=800,
                temperature=0.35,
                messages=[{"role": "system", "content": system}, *messages],
            )
            full = (resp.choices[0].message.content or "").strip()
            for i in range(0, len(full), 48):
                yield ("token", json.dumps({"content": full[i : i + 48]}))
            yield ("done", json.dumps({"content": full, "provider": "openai"}))
            return
        except Exception as e:
            logger.warning("OpenAI chat failed, trying next provider: %s", e, exc_info=True)

    # 3) Gemini with multi-turn history (start_chat)
    if settings.GOOGLE_API_KEY:
        try:
            import google.generativeai as genai

            genai.configure(api_key=settings.GOOGLE_API_KEY)
            model = genai.GenerativeModel(
                model_name=settings.GEMINI_CHAT_MODEL,
                system_instruction=system,
            )
            gemini_hist: List[Dict[str, Any]] = []
            for h in history[-10:]:
                role = h.get("role")
                content = h.get("content", "")
                if role == "user":
                    gemini_hist.append({"role": "user", "parts": [content]})
                elif role == "assistant":
                    gemini_hist.append({"role": "model", "parts": [content]})

            chat = model.start_chat(history=gemini_hist)
            response = await chat.send_message_async(
                user_message,
                generation_config={"temperature": 0.35, "max_output_tokens": 800},
            )
            full = (response.text or "").strip()
            for i in range(0, len(full), 48):
                yield ("token", json.dumps({"content": full[i : i + 48]}))
            yield (
                "done",
                json.dumps(
                    {
                        "content": full,
                        "llm_provider": "google",
                        "llm_model": settings.GEMINI_CHAT_MODEL,
                    },
                ),
            )
            return
        except Exception as e:
            logger.warning("Gemini chat failed, using rule engine: %s", e, exc_info=True)

    full = rule_based_chat(user_message, portfolio_context)
    yield ("token", json.dumps({"content": full}))
    yield (
        "done",
        json.dumps(
            {"content": full, "llm_provider": "rule_engine", "llm_model": "deterministic"},
        ),
    )
