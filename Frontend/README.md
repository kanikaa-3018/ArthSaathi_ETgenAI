# ArthSaathi Frontend

**Backend:** run the API separately — see [`../backend/README.md`](../backend/README.md). Use **Python 3.11 or 3.12** for fast `pip install` (avoid 3.14+ for local dev).

Unified frontend for ArthSaathi with:

- Landing experience at `/`
- Product analysis flow at `/analyze` → processing → **report** with **goal planner**, **tax insights**, and **AI mentor** sidebar

Set **`VITE_API_URL`** to your API origin if not using `http://localhost:8000` (e.g. in `.env.development`).

## Scripts

- `pnpm dev` - start local development server
- `pnpm build` - create production build
- `pnpm preview` - preview production build
