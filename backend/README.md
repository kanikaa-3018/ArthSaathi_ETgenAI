# ArthSaathi Backend (FastAPI)

## Python version (important)

Use **Python 3.11 or 3.12** (64-bit).  
Avoid **3.14+** for local installs: NumPy/Pandas often have **no pre-built wheels** yet, so `pip` compiles from source and can take **30+ minutes** or fail.

Check your version:

```bash
python --version
```

If you see 3.13 or 3.14, install **3.12** from [python.org](https://www.python.org/downloads/) (check “Add python.exe to PATH” on Windows).

---

## Setup (Windows — Git Bash or PowerShell)

From this `backend` folder:

### Option A — Windows `py` launcher (recommended)

```bash
py -3.12 --version
py -3.12 -m venv .venv
```

Activate:

- **Git Bash:** `source .venv/Scripts/activate`
- **PowerShell:** `.venv\Scripts\Activate.ps1`

Then:

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Option B — `python3.12` on PATH

```bash
python3.12 -m venv .venv
source .venv/Scripts/activate   # Git Bash
pip install -r requirements.txt
```

---

## Run the API

```bash
cd backend
source .venv/Scripts/activate   # if not already
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Health: `http://localhost:8000/api/health`
- Docs: `http://localhost:8000/docs`

**Mentor & planning APIs:** `POST /api/chat` (SSE), `POST /api/goals/calculate`, `POST /api/tax/insights` — see OpenAPI docs.

---

## Local NAV cache (gitignored)

The NAV agent uses [diskcache](https://pypi.org/project/diskcache/) under **`backend/cache/`** (SQLite `cache.db` plus `*.val` value files). This folder is **not committed** — it is recreated when you run the API. Override location with `NAV_CACHE_DIR` in `app/config.py` / settings if needed.

---

## Environment (optional)

Create `backend/.env` if you need to override defaults (see `app/config.py`):

- `CORS_ORIGINS` — comma-separated frontend origins (e.g. `http://localhost:8080`)
- `SUPABASE_URL` — same value as frontend `VITE_SUPABASE_URL`
- `SUPABASE_ANON_KEY` — same value as frontend `VITE_SUPABASE_ANON_KEY` (used for `/auth/v1/user` token validation fallback)
- `SUPABASE_JWT_SECRET` — optional legacy HS256 secret if your project uses symmetric JWT signing
- LLM keys — optional for advisor/chat features (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_API_KEY`)
- `ANTHROPIC_MODEL`, `OPENAI_CHAT_MODEL`, `GEMINI_CHAT_MODEL` — optional; defaults match `app/config.py` (change if your API account uses different model IDs)

**Note:** Mentor chat uses the `google-generativeai` PyPI package (`import google.generativeai`). Google has announced deprecation in favour of `google-genai`; upgrade paths should be tracked from [Google’s Gemini API docs](https://ai.google.dev/gemini-api/docs) when you migrate.

---

## Troubleshooting

| Issue | What to do |
|--------|------------|
| `pip install` very slow on numpy/pandas | Use Python **3.11/3.12**, delete `.venv`, recreate venv, reinstall |
| `No module named uvicorn` | Activate `.venv` first, then `pip install -r requirements.txt` |
| CORS errors from browser | Add your Vite URL to `CORS_ORIGINS` in `.env` |
| Accidentally staged `backend/cache/` | Remove from git: `git rm -r --cached backend/cache` — folder stays local only |
