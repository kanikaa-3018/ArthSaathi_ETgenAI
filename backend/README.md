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

---

## Local NAV cache (gitignored)

The NAV agent uses [diskcache](https://pypi.org/project/diskcache/) under **`backend/cache/`** (SQLite `cache.db` plus `*.val` value files). This folder is **not committed** — it is recreated when you run the API. Override location with `NAV_CACHE_DIR` in `app/config.py` / settings if needed.

---

## Environment (optional)

Create `backend/.env` if you need to override defaults (see `app/config.py`):

- `CORS_ORIGINS` — comma-separated frontend origins (e.g. `http://localhost:8080`)
- LLM keys — optional for advisor/chat features

---

## Troubleshooting

| Issue | What to do |
|--------|------------|
| `pip install` very slow on numpy/pandas | Use Python **3.11/3.12**, delete `.venv`, recreate venv, reinstall |
| `No module named uvicorn` | Activate `.venv` first, then `pip install -r requirements.txt` |
| CORS errors from browser | Add your Vite URL to `CORS_ORIGINS` in `.env` |
| Accidentally staged `backend/cache/` | Remove from git: `git rm -r --cached backend/cache` — folder stays local only |
