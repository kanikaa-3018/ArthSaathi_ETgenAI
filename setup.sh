#!/usr/bin/env bash
set -e

echo ""
echo "  ArthSaathi (अर्थसाथी) — Setup"
echo "  ================================"
echo ""

# ---- Python check ----
PYTHON=""
for cmd in python3.12 python3.11 python3; do
  if command -v "$cmd" &>/dev/null; then
    V=$("$cmd" -c 'import sys; print(f"{sys.version_info.minor}")')
    if [ "$V" -ge 11 ] && [ "$V" -le 12 ]; then
      PYTHON="$cmd"
      break
    fi
  fi
done

if [ -z "$PYTHON" ]; then
  echo "ERROR: Python 3.11 or 3.12 required."
  echo "       Found: $(python3 --version 2>&1 || echo 'none')"
  echo "       Install: https://www.python.org/downloads/"
  exit 1
fi
echo "[ok] Python: $($PYTHON --version)"

# ---- Node check ----
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js 18+ required. Install: https://nodejs.org/"
  exit 1
fi
echo "[ok] Node: $(node --version)"

# ---- pnpm check ----
if ! command -v pnpm &>/dev/null; then
  echo "[..] pnpm not found, installing..."
  npm install -g pnpm
fi
echo "[ok] pnpm: $(pnpm --version)"

# ---- Backend ----
echo ""
echo "--- Backend setup ---"
cd backend
if [ ! -d "venv" ]; then
  $PYTHON -m venv venv
  echo "[ok] Created venv"
fi

# Activate (Linux/Mac)
source venv/bin/activate 2>/dev/null || {
  # Windows Git Bash
  source venv/Scripts/activate 2>/dev/null || {
    echo "ERROR: Could not activate venv"
    exit 1
  }
}

pip install --upgrade pip -q
pip install -r requirements.txt -q
echo "[ok] Backend dependencies installed"

if [ ! -f "data/ter_data.csv" ]; then
  echo "[..] Downloading TER tracker (data/ter_data.csv)…"
  curl -fsSL "https://raw.githubusercontent.com/captn3m0/india-mutual-fund-ter-tracker/main/data.csv" -o "data/ter_data.csv" || echo "[warn] TER CSV download failed — CostAgent will use category averages only"
fi
cd ..

# ---- Frontend ----
echo ""
echo "--- Frontend setup ---"
cd Frontend
pnpm install 2>/dev/null
echo "[ok] Frontend dependencies installed"
cd ..

# ---- Done ----
echo ""
echo "  Setup complete. To run:"
echo ""
echo "  Terminal 1 (backend):"
echo "    cd backend && source venv/bin/activate"
echo "    python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"
echo ""
echo "  Terminal 2 (frontend):"
echo "    cd Frontend && pnpm dev"
echo ""
echo "  Open: http://localhost:5173"
echo "  Click 'Try Sample Data' to test without a CAS PDF."
echo ""
echo "  Optional: cp backend/.env.example backend/.env"
echo "            (add LLM API keys for AI mentor — works without them)"
echo ""
