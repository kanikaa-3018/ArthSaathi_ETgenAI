"""
FastAPI application entry point for ArthSaathi backend.

Endpoints:
  POST /api/analyze     — Upload CAS PDF, stream SSE agent events, return final JSON
  GET  /api/analyze/test — Full pipeline on fixture JSON (SSE, dev/demo)
  POST /api/chat        — AI mentor chat (SSE token stream)
  POST /api/goals/calculate — Goal planner (pure math JSON)
  POST /api/tax/insights — Tax harvesting / LTCG hints from analysis JSON
  POST /api/tax/regime-compare — Old vs new regime (salary inputs, pure math)
  GET  /api/sample      — Return pre-computed sample analysis
  GET  /api/health      — Health check
  GET  /                — Ping
"""
import asyncio
import json
import os
import time
from typing import AsyncGenerator, Literal

from fastapi import Body, Depends, FastAPI, File, Form, Header, HTTPException, Request, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

from app.config import settings
from app.auth import (
    authenticate_user,
    create_access_token,
    get_user_from_token,
    register_user,
)
from app.chat_service import stream_chat_events
from app.goals import compute_goal
from app.orchestrator import run_pipeline
from app.tax_insights import compute_tax_insights
from app.tax_regime import compare_regimes
from app.agents.overlap import _load_holdings   # for health endpoint

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="ArthSaathi Backend",
    description="AI-powered mutual fund portfolio analysis with multi-agent orchestration",
    version=settings.APP_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# LLM provider name for health endpoint
def _llm_provider() -> str:
    if settings.ANTHROPIC_API_KEY:
        return "claude"
    if settings.OPENAI_API_KEY:
        return "gpt4o"
    if settings.GOOGLE_API_KEY:
        return "gemini"
    return "rule_engine"


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/")
def root():
    return {"message": "ArthSaathi Backend Running 🚀", "version": settings.APP_VERSION}


# ---------------------------------------------------------------------------
# Auth (new feature)
# ---------------------------------------------------------------------------


def get_current_user(authorization: str = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    token = authorization.split(" ", 1)[1]
    user = get_user_from_token(token)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    return user


class AuthRegisterBody(BaseModel):
    username: str
    email: str
    password: str


class AuthLoginBody(BaseModel):
    username: str
    password: str


@app.post("/api/auth/register")
def auth_register(body: AuthRegisterBody):
    try:
        user = register_user(body.username, body.email, body.password)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    token = create_access_token(user["username"])
    return {"detail": "User created", "access_token": token, "token_type": "bearer"}


@app.post("/api/auth/login")
def auth_login(body: AuthLoginBody):
    user = authenticate_user(body.username, body.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(user["username"])
    return {"detail": "Login successful", "access_token": token, "token_type": "bearer"}


@app.get("/api/auth/me")
def auth_me(current_user=Depends(get_current_user)):
    return {"username": current_user.get("username"), "email": current_user.get("email")}


# ---------------------------------------------------------------------------
# Mentor chat, goals, tax (EXECUTION_PLAN Part 9)
# ---------------------------------------------------------------------------


class GoalsCalculateBody(BaseModel):
    goal_type: Literal["retirement", "child_education", "house", "emergency_fund", "custom"] = Field(
        ...,
        description="Goal preset used by compute_goal",
    )
    target_amount: float | None = None
    target_year: int
    current_age: int
    monthly_income: float = 0
    monthly_sip_possible: float = 0
    portfolio_value: float
    portfolio_xirr: float
    inflation_rate: float = 0.06


@app.post("/api/goals/calculate")
def goals_calculate(body: GoalsCalculateBody, current_user=Depends(get_current_user)):
    """Goal planner — pure math."""
    result = compute_goal(
        goal_type=body.goal_type,
        target_amount=body.target_amount,
        target_year=body.target_year,
        current_age=body.current_age,
        monthly_income=body.monthly_income,
        monthly_sip_possible=body.monthly_sip_possible,
        portfolio_value=body.portfolio_value,
        portfolio_xirr=body.portfolio_xirr,
        inflation_rate=body.inflation_rate,
    )
    return JSONResponse(content=result)


@app.post("/api/tax/insights")
def tax_insights_endpoint(payload: dict = Body(...), current_user=Depends(get_current_user)):
    """Rough tax harvesting / LTCG context from analysis JSON."""
    analysis = payload.get("analysis") if "analysis" in payload else payload
    return JSONResponse(content=compute_tax_insights(analysis))


class TaxRegimeBody(BaseModel):
    gross_salary: float = Field(ge=0)
    hra_received_annual: float = Field(0, ge=0)
    rent_paid_annual: float = Field(0, ge=0)
    is_metro: bool = True
    section_80c: float = Field(0, ge=0)
    section_80d: float = Field(0, ge=0)
    section_80ccd1b: float = Field(0, ge=0)
    home_loan_interest: float = Field(0, ge=0)
    elss_from_portfolio: float = Field(0, ge=0)


@app.post("/api/tax/regime-compare")
def tax_regime_compare(body: TaxRegimeBody):
    """Old vs new tax regime — pure math."""
    result = compare_regimes(
        gross_salary=body.gross_salary,
        hra_received_annual=body.hra_received_annual,
        rent_paid_annual=body.rent_paid_annual,
        is_metro=body.is_metro,
        section_80c=body.section_80c,
        section_80d=body.section_80d,
        section_80ccd1b=body.section_80ccd1b,
        home_loan_interest=body.home_loan_interest,
        elss_from_portfolio=body.elss_from_portfolio,
    )
    return JSONResponse(content=result)


@app.post("/api/chat")
async def chat_endpoint(request: Request, current_user=Depends(get_current_user)):
    """
    AI Mentor chat. POST JSON body; response is text/event-stream (SSE).
    Events: token (partial text), done (full message).
    """
    body = await request.json()
    message = (body.get("message") or "").strip()
    portfolio_context = body.get("portfolio_context") or {}
    history = body.get("conversation_history") or []

    if not message:
        raise HTTPException(status_code=400, detail="message is required")
    if len(message) > 8000:
        raise HTTPException(status_code=400, detail="message too long (max 8000 chars)")

    async def _gen():
        async for ev_name, data_str in stream_chat_events(message, portfolio_context, history):
            yield {"event": ev_name, "data": data_str}

    return EventSourceResponse(_gen())


@app.get("/api/health")
def health():
    holdings = _load_holdings()
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "llm_provider": _llm_provider(),
        "holdings_fund_count": len(holdings),
    }


@app.get("/api/analyze/test")
async def analyze_test(request: Request, current_user=Depends(get_current_user)):
    """
    DEV ONLY — Runs the full agent pipeline using the pre-parsed JSON fixture
    at tests/sample_cas_parsed.json. No PDF upload needed.
    Streams the same SSE events as POST /api/analyze.
    """
    fixture_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "tests", "sample_cas_parsed.json")
    )
    if not os.path.exists(fixture_path):
        raise HTTPException(status_code=404, detail="Fixture not found: run test setup first.")

    with open(fixture_path, encoding="utf-8") as f:
        raw_cas = json.load(f)

    event_queue: asyncio.Queue = asyncio.Queue(maxsize=200)

    # Patch the parser to return the fixture directly instead of reading a PDF
    from app.agents.base import AgentEvent
    from app.utils import normalize_cas_data, mask_pan
    from app.orchestrator import (
        NAVAgent, ReturnsAgent, OverlapAgent, CostAgent,
        BenchmarkAgent, ProjectionAgent, HealthAgent, AdvisorAgent,
        _assemble_response,
    )
    import time as _time

    async def _test_pipeline():
        t0 = _time.monotonic()

        # Emit parser done (skip actual parsing)
        event_queue.put_nowait(AgentEvent(
            agent="parser_agent", status="completed",
            message="Loaded fixture: sample_cas_parsed.json (6 funds, 2 folios)",
            severity="success", step=1, total_steps=1,
        ))

        funds = normalize_cas_data(raw_cas)
        investor_info = raw_cas.get("investor_info") or {}
        statement_period = raw_cas.get("statement_period") or {}

        # NAV
        nav_agent = NAVAgent(event_queue)
        funds = await nav_agent.run(funds)

        # Returns + Overlap (parallel)
        returns_agent = ReturnsAgent(event_queue)
        overlap_agent = OverlapAgent(event_queue)
        (funds_xirr, portfolio_xirr), overlap_result = await asyncio.gather(
            returns_agent.run(funds),
            overlap_agent.run(funds),
        )
        funds = funds_xirr

        # Cost + Benchmark (parallel)
        cost_agent = CostAgent(event_queue)
        bm_agent = BenchmarkAgent(event_queue)
        (funds_cost, expense_summary), funds_bm = await asyncio.gather(
            cost_agent.run(funds),
            bm_agent.run(funds),
        )
        cost_map = {f.get("scheme_name"): f.get("expense") for f in funds_cost}
        funds = [{**f, "expense": cost_map.get(f.get("scheme_name")) or {}} for f in funds_bm]

        # Projection
        total_val = sum(f.get("current_value") or 0 for f in funds)
        p_rate = portfolio_xirr.get("rate") or 0.10
        wealth_proj = await ProjectionAgent(event_queue).run(
            current_value=total_val,
            portfolio_xirr=p_rate,
            expense_summary=expense_summary,
            funds=funds,
        )

        # Health
        health = await HealthAgent(event_queue).run(
            funds=funds,
            portfolio_xirr=portfolio_xirr,
            overlap_analysis=overlap_result,
            expense_summary=expense_summary,
        )

        # Assemble partial + Advisor
        partial = _assemble_response(
            investor_info=investor_info,
            statement_period=statement_period,
            funds=funds,
            portfolio_xirr=portfolio_xirr,
            overlap_result=overlap_result,
            expense_summary=expense_summary,
            health_score=health,
            wealth_projection=wealth_proj,
            processing_ms=int((_time.monotonic() - t0) * 1000),
        )
        plan = await AdvisorAgent(event_queue).run(partial)
        partial["rebalancing_plan"] = plan
        partial["processing_time_ms"] = int((_time.monotonic() - t0) * 1000)
        return partial

    async def _generator():
        task = asyncio.create_task(_test_pipeline())
        while True:
            done = task.done()
            while not event_queue.empty():
                try:
                    ev = event_queue.get_nowait()
                    yield {"event": "agent_update", "data": json.dumps(ev.to_dict(), default=str)}
                except asyncio.QueueEmpty:
                    break
            if done:
                while not event_queue.empty():
                    try:
                        ev = event_queue.get_nowait()
                        yield {"event": "agent_update", "data": json.dumps(ev.to_dict(), default=str)}
                    except asyncio.QueueEmpty:
                        break
                if task.exception():
                    yield {"event": "error", "data": json.dumps({"error": str(task.exception())})}
                else:
                    yield {"event": "result", "data": json.dumps(task.result(), default=str)}
                break
            await asyncio.sleep(0.05)

    return EventSourceResponse(_generator())


@app.get("/api/sample")
def get_sample():
    """Return a pre-computed sample analysis for demo/development."""
    sample_path = os.path.join(
        os.path.dirname(__file__), "..", "data", "sample_result.json"
    )
    sample_path = os.path.abspath(sample_path)

    if os.path.exists(sample_path):
        with open(sample_path, encoding="utf-8") as f:
            return JSONResponse(content=json.load(f))

    # Minimal placeholder response if sample file not yet generated
    return JSONResponse(content={
        "status": "success",
        "processing_time_ms": 0,
        "investor": {"name": "Sample Investor", "email": "", "pan_masked": "ABCDE****F"},
        "portfolio_summary": {
            "total_current_value": 3245670.0,
            "total_invested": 2640000.0,
            "total_funds": 6,
            "total_folios": 2,
            "equity_allocation_pct": 82.3,
            "debt_allocation_pct": 17.7,
            "regular_plan_count": 4,
            "direct_plan_count": 2,
        },
        "portfolio_xirr": {"rate": 0.1284, "display": "12.84%", "status": "success"},
        "funds": [],
        "overlap_analysis": None,
        "expense_summary": {
            "total_annual_drag": 40697,
            "total_projected_10yr_drag": 680000,
            "total_potential_annual_savings": 23900,
            "total_potential_10yr_savings": 395000,
            "regular_plan_count": 4,
            "direct_plan_count": 2,
            "weighted_average_ter": 0.0158,
        },
        "health_score": {"score": 41, "grade": "C", "label": "Needs Attention", "breakdown": {}},
        "wealth_projection": {
            "current_path": [{"year": i, "value": round(3245670 * (1.1284 ** i), 2)} for i in range(21)],
            "optimised_path": [{"year": i, "value": round(3245670 * (1.1502 ** i), 2)} for i in range(21)],
            "gap_at_10yr": 2264740.0,
            "gap_at_20yr": 8847320.0,
            "assumptions": {
                "current_xirr": 0.1284,
                "optimised_xirr": 0.1502,
                "ter_savings_applied": 0.0118,
                "alpha_improvement_applied": 0.005,
            },
        },
        "rebalancing_plan": {
            "ai_generated": False,
            "ai_provider": "rule_engine",
            "content": "## What's Working Well\n\nSample analysis. Upload your CAS to get a personalized plan.\n\n## The Biggest Problem\n\nRegular plans are costing ₹40,697/year.\n\n## Three Things to Do This Week\n\nSwitch to direct plans.\n\n## What This Saves You\n\n₹23,900/year.",
        },
    })


@app.post("/api/analyze")
async def analyze(
    request: Request,
    file: UploadFile = File(...),
    password: str = Form(...),
    current_user=Depends(get_current_user),
):
    """
    Upload a CAS PDF and receive a stream of SSE agent events followed
    by the final analysis JSON as a special 'result' event.

    Content-Type: text/event-stream
    """
    # ── Validate file ───────────────────────────────────────────────────────
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        # Be lenient — some browsers send octet-stream for PDFs
        filename = file.filename or ""
        if not filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=415,
                detail={"status": "error", "error_code": "INVALID_FILE_TYPE",
                        "message": "Only PDF files are accepted."},
            )

    file_bytes = await file.read()

    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if len(file_bytes) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail={"status": "error", "error_code": "FILE_TOO_LARGE",
                    "message": f"File exceeds {settings.MAX_FILE_SIZE_MB} MB limit."},
        )

    # ── Set up event queue ──────────────────────────────────────────────────
    event_queue: asyncio.Queue = asyncio.Queue(maxsize=200)

    async def _generator() -> AsyncGenerator[dict, None]:
        """
        Runs the pipeline in a background task and streams events.
        Sends a final 'result' event with the complete JSON.
        """
        pipeline_task = asyncio.create_task(
            run_pipeline(file_bytes, password, event_queue)
        )

        result = None
        error = None

        while True:
            # Check if pipeline finished AND queue is drained
            done = pipeline_task.done()

            # Drain available events
            drained = False
            while not event_queue.empty():
                try:
                    event: "AgentEvent" = event_queue.get_nowait()
                    yield {
                        "event": "agent_update",
                        "data": json.dumps(event.to_dict(), default=str),
                    }
                    drained = True
                except asyncio.QueueEmpty:
                    break

            if done:
                # Drain any remaining events one more time
                while not event_queue.empty():
                    try:
                        event = event_queue.get_nowait()
                        yield {
                            "event": "agent_update",
                            "data": json.dumps(event.to_dict(), default=str),
                        }
                    except asyncio.QueueEmpty:
                        break

                # Check for exception
                exc = pipeline_task.exception()
                if exc:
                    error = exc
                else:
                    result = pipeline_task.result()
                break

            await asyncio.sleep(0.05)

        # Emit final result or error
        if result is not None:
            yield {
                "event": "result",
                "data": json.dumps(result, default=str),
            }
        else:
            err_str = str(error) if error else "Unknown error"
            if "WRONG_PASSWORD" in err_str:
                code = "WRONG_PASSWORD"
                msg = "Incorrect password. CAS statements use your PAN as password (e.g., ABCDE1234F)."
                status = 422
            elif "PARSE_FAILED" in err_str:
                code = "PARSE_FAILED"
                msg = "Could not parse the uploaded PDF. Please use a CAMS or KFintech detailed CAS statement."
                status = 422
            else:
                code = "INTERNAL_ERROR"
                msg = err_str[:200]
                status = 500

            yield {
                "event": "error",
                "data": json.dumps({"status": "error", "error_code": code, "message": msg}),
            }

    return EventSourceResponse(_generator())