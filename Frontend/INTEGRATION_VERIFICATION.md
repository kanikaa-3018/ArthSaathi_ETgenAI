# Backend–frontend integration — manual verification

Use this checklist after changing analyze/report code. Backend: `http://localhost:8000` (or set `VITE_API_URL`). Frontend: usual Vite dev port.

## 1. Sample path (judges’ primary demo)

1. Open `/analyze`.
2. Click **Try sample data** (or equivalent).
3. Confirm **Analyze processing** shows **live** agent rows (names/messages from SSE), not only timed placeholders.
4. After completion, confirm navigation to **`/analyze/report`**.
5. Confirm report sections populate from **real** payload (XIRR, funds, charts — not the static demo dataset unless you opened `/demo`).

## 2. Upload path (real CAS)

1. Upload a valid CAMS/KFintech PDF with correct password.
2. Confirm SSE stream and full report as above.
3. Trigger errors and confirm **`/analyze/error`**:
   - Wrong password → `WRONG_PASSWORD`
   - Non-PDF → `INVALID_FILE_TYPE` (or backend equivalent)
   - Oversized file → `FILE_TOO_LARGE`

## 3. Session / deep link

1. Complete an analysis so **`/analyze/report`** works.
2. **Refresh** the report page — expect redirect to **`/analyze`** with a hint (no mock report).
3. Open **`/analyze/report`** in a new tab without running analysis — same redirect.

## 4. Demo route (explicit mock)

- **`/demo`** must still show the curated **`mockData`** report with the demo banner.

## 5. Stream lifecycle

- Navigate **Back to Upload** during processing — request should **abort** (no duplicate streams after starting again).
