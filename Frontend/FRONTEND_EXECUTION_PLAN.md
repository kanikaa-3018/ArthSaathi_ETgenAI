# Frontend Execution Plan

## Goal

Complete all frontend-only work from the ArthSaathi spec before backend integration starts.

## Current Baseline

- Landing page exists.
- Product mock UI components exist.
- Mock data exists.
- Routing and error-state structure need completion/hardening.

## Phase Plan

### Phase 1 - App Structure and Navigation (in progress)

- Restore and stabilize route architecture.
- Add explicit pages for:
  - upload
  - processing
  - report
  - demo
  - error
- Ensure all CTAs and navigation links resolve to working routes.

### Phase 2 - Upload and Validation UX

- Enforce frontend constraints:
  - PDF only
  - max 10 MB
  - password required
- Add inline validation errors and clear reset behavior.

### Phase 3 - Error and Fallback UI States

- Implement separate error presentations for:
  - wrong password
  - parse failure
  - invalid file type
  - file too large
  - generic failure
- Add section-level "data unavailable" placeholders in report sections.

### Phase 4 - Design-System Parity and Responsive Polish

- Ensure product pages match landing visual language consistently.
- Tighten spacing, typography hierarchy, and control styles.
- Improve mobile/tablet readability for table/chart-heavy sections.

### Phase 5 - Demo Readiness

- Keep demo and report visually distinct.
- Ensure deterministic demo route and presentation-safe defaults.

### Phase 6 - Backend Integration Readiness (frontend side only)

- Add frontend API contract types and request/response adapters.
- Prepare SSE event model/store interface (mock source now, backend source later).

## Definition of Done (frontend-only)

- All listed routes render correctly and link correctly.
- Upload validation works without backend.
- Error pages are explicit and reusable.
- Demo mode is presentation-ready.
- No linter errors in touched files.
- Production build passes.
