# Security Review — TidySheet v1

**Date:** 2026-10-22
**Scope:** Static source + production build review. No browser runtime or dynamic testing was
performed in this environment (no browser installed).

## Method

- Automated grep-equivalent scan of `src/` and `index.html` for: `innerHTML`, `eval`,
  `new Function`, `fetch(`, `localStorage`, `sessionStorage`, `indexedDB`, `document.cookie`,
  analytics/tracking identifiers (`analytics`, `gtag`, `tracking`, `sentry`, `hotjar`).
- Review of `index.html` CSP meta tag.
- Review of `src/worker/worker.ts`, `src/ui/workers.ts`, `src/ui/components.ts`, `src/ui/app.ts`.
- Review of limits in `src/core/normalize.ts` (`LIMITS`).
- Review of error taxonomy in `src/core/errors.ts`.
- Build artifact inspection (`dist/`).

## Findings

### Privacy claims

| Claim | Evidence | Status |
| --- | --- | --- |
| "Nothing is uploaded" | No `fetch(`, no XHR, no WebSocket in src. Worker receives `ArrayBuffer` from already-loaded `File`. | Supported by static review. Runtime network-panel verification is manual (checklist). |
| "No cookies / localStorage" | No `document.cookie`, `localStorage`, `sessionStorage`, `indexedDB` in src. | Supported by static review. |
| "No telemetry/analytics" | No analytics/tracking identifiers in src or index.html. | Supported. |
| "Works offline after first load" | Static assets only; no runtime fetch of data. Vite build emits self-contained JS/CSS/worker. | Supported by build structure; runtime verification manual. |
| "CSP enforced" | Meta tag present with `default-src 'self'`, `script-src 'self'`, `worker-src 'self' blob:`, `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'none'`. | Present. Note: `style-src` is not explicitly set, so it falls back to `default-src 'self'` — fine because styles are a single local file. |

### XSS / injection

- All DOM construction goes through `el()` in `src/ui/components.ts`, which uses
  `createElement` + `textContent`/`setAttribute`. No `innerHTML` with dynamic data.
  The only `innerHTML` textual match is in a code comment.
- File-derived strings are never interpolated into HTML or attributes as markup.
- **Residual risk:** `setAttribute` is called with attribute names from a fixed
  allow-list in `el()` (class, and arbitrary names from attrs). Attribute *values*
  come from caller-supplied strings for things like `href`/`download` in
  `downloadText`, which uses a Blob URL (not file content) — safe.

### Resource exhaustion

- Hard cap 100 MB per file enforced before parse (`SIZE_LIMIT`).
- Hard cap 1,000,000 rows per table enforced after parse (`ROW_LIMIT`).
- Parsing runs in a Web Worker so the UI thread stays responsive.
- PapaParse is linear; our utilities (encoding sniff, delimiter handling) are bounded
  scans. No regex backtracking over user data in hot paths.
- **No streaming parser** — entire file is held in memory. For 50 MB+ files this
  can exhaust memory on low-end devices. Documented limitation.

### Error handling / data leakage

- `ValidationError` carries a code + optional detail record; UI maps codes to
  friendly messages from `ERROR_MESSAGES`. No stack traces or absolute paths surface.
- File names (user-selected) may appear in messages; acceptable.
- Worker errors are caught and converted to `{ ok: false, code, message }`.

### Export integrity

- Serializer (`src/format/csv-write.ts`) follows RFC 4180 quoting rules; round-trip
  test passes. BOM prepended for Excel compatibility.
- Leading zeros preserved (cells are strings throughout).

### Dependency / supply chain

- Runtime: papaparse 5.7.0 (MIT). Dev: vite 6.4.5, typescript 5.6.3, tsx 4.19.x,
  @types/papaparse 5.3.14.
- `npm ci` reports 0 vulnerabilities.
- esbuild postinstall scripts are pending approval (npm allow-scripts warning) —
  this does not affect the build because the platform binary is provided by the
  optional `@esbuild/win32-x64` dependency. Verified: build succeeds.

## Scope and limitations of these claims

- **Static review only.** No runtime browser testing was performed (no browser
  available). Network-panel, CSP-violation, and offline verification are manual
  steps in `docs/manual-qa-checklist.md`.
- **No penetration testing** was performed.
- **No fuzzing** of the CSV parser beyond the existing 53 tests.
- **Performance claims** are based on Node.js measurements (see performance
  section of release-readiness.md); browser performance may differ.

## Recommendations before launch

1. Execute the manual privacy checklist in a real browser with DevTools open.
2. Add a `LICENSE` file (MIT, matching README) — confirm with owner.
3. Confirm the branch name (`main`) matches the deployment workflow.
4. Re-run `npm audit` periodically.
5. Consider lowering the documented row limit further if browser memory issues
   appear in manual testing.
