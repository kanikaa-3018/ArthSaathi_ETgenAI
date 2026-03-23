# ArthSaathi — Architecture (ET AI Hackathon 2026)

## High-level

```
┌─────────────┐     HTTPS/SSE      ┌──────────────────┐
│  Vite React │ ◄────────────────► │ FastAPI (Python) │
│  Frontend   │   POST /api/analyze│ 9 agents +       │
│             │   GET  /analyze/test│ orchestrator     │
└─────────────┘                    └────────┬───────────┘
                                          │
                                          ▼
                                 ┌────────────────┐
                                 │ CAS PDF parse  │
                                 │ NAV / XIRR /   │
                                 │ overlap / TER  │
                                 └────────────────┘
```

## User flow

1. **Landing** → **Upload** (CAS PDF + password) or **Try sample data** (fixture pipeline).
2. **Processing** — SSE `agent_update` events until `result` (full `AnalysisData` JSON).
3. **Report** — charts, metrics, **Goal planner**, **Tax insights** (POST JSON), **AI Mentor** (SSE chat with portfolio context).

## Backend modules

| Area | Location |
|------|----------|
| API routes | `backend/app/main.py` |
| Orchestrator + agents | `backend/app/orchestrator.py`, `backend/app/agents/` |
| Goal math | `backend/app/goals.py` |
| Tax heuristics | `backend/app/tax_insights.py` |
| Mentor chat | `backend/app/chat_service.py` (LLM cascade + rule fallback) |
| Settings | `backend/app/config.py` |

## Frontend

| Area | Location |
|------|----------|
| Routes | `Frontend/src/App.tsx` |
| Analysis state | `Frontend/src/context/analysis-context.tsx` |
| SSE analyze | `Frontend/src/pages/AnalyzeProcessing.tsx` |
| Report + mentor | `Frontend/src/pages/AnalyzeReport.tsx`, `MentorChat.tsx`, `ReportSections.tsx` |

## Data

- **No database** — stateless analysis; optional **diskcache** for NAV under `backend/cache/` (gitignored).
- **Secrets** — `.env` for LLM keys (`ANTHROPIC_API_KEY`, etc.); never commit.

## Deployment

- **Backend:** `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- **Frontend:** `VITE_API_URL=http://localhost:8000` (or production API URL).

See `backend/README.md` and `Frontend/README.md` for setup.
