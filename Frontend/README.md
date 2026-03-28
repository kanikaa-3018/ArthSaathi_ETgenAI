# ArthSaathi Frontend

**Backend:** run the API separately — see [`../backend/README.md`](../backend/README.md). Use **Python 3.11 or 3.12** for fast `pip install` (avoid 3.14+ for local dev). Use **Node.js 20+** for the frontend (required by the current `@supabase/supabase-js` dependency tree).

Unified frontend for ArthSaathi with:

- Landing experience at `/`
- Product analysis flow at `/analyze` → processing → **report** with **goal planner**, **tax insights**, and **AI mentor** sidebar

Set **`VITE_API_URL`** to your API origin if not using `http://localhost:8000` (e.g. in `.env.development`).

## Dev server URL

`vite.config.ts` sets **`server.port: 8080`**, so after `pnpm dev` or `npm run dev` open **http://localhost:8080/** (not 5173). If you change the port, add the same origin to Supabase **redirect URLs** and backend **CORS**.

## Scripts

- `pnpm dev` - start local development server (http://localhost:8080)
- `pnpm build` - create production build
- `pnpm preview` - preview production build
