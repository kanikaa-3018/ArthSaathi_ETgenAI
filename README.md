# ArthSaathi (अर्थसाथी) — AI Money Mentor

**ET AI Hackathon 2026 · Problem Statement 9**

Upload a CAMS/KFintech CAS PDF → watch **9 analysis agents** stream live → review **wealth, overlap, fees, goals, tax hints**, and chat with the **AI mentor**.

## Quick start

1. **Backend** (Python **3.11 or 3.12** recommended)  
   See [`backend/README.md`](backend/README.md) — install deps, run:

   ```bash
   cd backend
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Frontend**  
   See [`Frontend/README.md`](Frontend/README.md):

   ```bash
   cd Frontend
   pnpm install
   # optional: echo VITE_API_URL=http://localhost:8000 > .env.development
   pnpm dev
   ```

3. Open the app, go to **Analyze** → **Try sample data** (or upload a CAS PDF).

## Docs

- **[ARCHITECTURE.md](ARCHITECTURE.md)** — diagram + module map (submission-ready).
- **[EXECUTION_PLAN.md](../EXECUTION_PLAN.md)** (parent folder) — full PRD, demo script, submission checklist.

## API highlights

| Endpoint | Purpose |
|----------|---------|
| `POST /api/analyze` | CAS upload → SSE + final JSON |
| `GET /api/analyze/test` | Same pipeline on built-in fixture |
| `POST /api/chat` | Mentor chat (SSE) |
| `POST /api/goals/calculate` | Goal planner JSON |
| `POST /api/tax/insights` | Tax / harvesting hints from analysis |

## License / disclaimer

Educational demo — not SEBI-registered investment or tax advice.
