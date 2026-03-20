# Frontend Checklist

## Phase 1 - Routing and App Shell

- [x] Restore `src/App.tsx` and route structure
- [x] Add dedicated routes for upload, processing, report, error, demo
- [x] Add global scroll reset on route change
- [ ] Validate all CTA transitions manually

## Phase 2 - Upload Validation UX

- [x] Validate PDF-only uploads
- [x] Validate max file size (10 MB)
- [x] Validate password presence before analyze
- [x] Show inline validation errors in upload card
- [ ] Add loading state for analyze button (mock)

## Phase 3 - Error and Fallback UI

- [x] Add error code mapping page with query-param based variants
- [x] Add report-level fallback blocks for unavailable sections
- [x] Add section placeholders for overlap/benchmark/projection unavailable states

## Phase 4 - Design and Responsive Polish

- [ ] Align spacing/typography consistently with landing style
- [ ] Refine mobile table and chart behavior
- [ ] Improve button hierarchy and interaction states

## Phase 5 - Demo Readiness

- [x] Keep demo route visually distinct from report route
- [ ] Add deterministic demo reset controls
- [ ] Validate full demo narration flow from landing to report

## Phase 6 - Integration Readiness

- [ ] Add frontend API types and adapter stubs
- [ ] Add SSE event model interfaces
- [ ] Add mock-to-live integration switch point
