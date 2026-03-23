# CAS PDF samples for manual testing

The pipeline expects a **detailed** CAMS or KFintech **CAS PDF** (password is usually your PAN in `ABCDE1234F` form).

For hackathon / judges **without a real CAS**:

- Use **Try sample data** in the UI — runs `GET /api/analyze/test` on `tests/sample_cas_parsed.json` (full 9-agent SSE + report).

To test **real upload** locally:

1. Export a CAS PDF from your registrar / MFCentral / AMC.
2. Upload via **Analyze** with the correct password.
3. Do **not** commit personal CAS PDFs to git.

Optional: keep anonymised fixtures under `tests/fixtures/` **only if** stripped of PII — still avoid committing real statements.
