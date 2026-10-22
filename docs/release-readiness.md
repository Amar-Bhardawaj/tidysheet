# Release Readiness — TidySheet v1

**Date:** 2026-10-22
**Final status: READY FOR OWNER REVIEW** (not "RELEASE CANDIDATE VERIFIED" because
browser-based manual QA was not performed in this environment).

## 1. Commands executed and results

| Command | Result |
| --- | --- |
| `npm ci` | Success (0 vulnerabilities; esbuild postinstall pending approval, build unaffected) |
| `npm test` | **53 / 53 passed**, 0 failed, 0 skipped (1.13 s) |
| `npx tsc --noEmit` | Clean (0 errors) |
| `npm run build` | Success (Vite, 14 modules, JS 20.9 KB, worker 33.3 KB, CSS 5.2 KB) |

## 2. Files inspected

README.md, package.json, docs/product-spec.md, docs/architecture.md,
docs/testing-report.md, docs/deployment-guide.md, docs/market-validation.md,
docs/pricing-strategy.md, docs/launch-plan.md, docs/90-day-roadmap.md,
src/** (all), index.html, .github/workflows/pages.yml, tests/**.

## 3. Files changed in this phase

- `src/core/normalize.ts` — `MAX_ROWS` 2,000,000 → 1,000,000 (evidence-based).
- `README.md`, `docs/testing-report.md`, `docs/pricing-strategy.md`,
  `docs/launch-plan.md` — updated row-limit references.
- `index.html` — added OpenGraph + Twitter card meta tags.
- `SECURITY.md` — created.
- `.github/workflows/pages.yml` — already present (verified).
- `docs/security-review.md`, `docs/manual-qa-checklist.md`,
  `docs/release-readiness.md` — created.
- Branch renamed `master` → `main` (local only).

No dependencies added or upgraded. No features added (no .xlsx, payments,
auth, cloud sync, or profiles).

## 4. Automated tests passed/failed

- 53 passed, 0 failed. See docs/testing-report.md for inventory.

## 5. Browser and accessibility checks completed

- **Not performed.** No browser is installed in this environment and no browser
  automation tooling is available. A full manual checklist is provided in
  `docs/manual-qa-checklist.md`. Do not claim browser QA passed.

## 6. Privacy and security findings

See `docs/security-review.md`. Summary: static review supports the privacy
claims (no fetch, no storage, no analytics, CSP present). Runtime verification
is manual and pending.

## 7. Large-file performance findings

Measured in Node.js 24 (tsx) on the developer machine, engine only (no UI/worker
overhead):

| Rows | Input size | Parse | Dedupe | Clean | Diff (reordered) |
| --- | --- | --- | --- | --- | --- |
| 100,000 | 5.2 MB | 377 ms | 201 ms | 62 ms | 620 ms |
| 500,000 | 27.7 MB | 3.4 s | 1.0 s | 0.5 s | 5.9 s |
| 1,000,000 | 56.2 MB | 8.4 s | 4.0 s | 1.4 s | 5.9 s |

Conclusion: 100 MB file cap ≈ ~900k rows for typical 6-column data, so the
previous 2,000,000-row limit was unreachable and misleading. Lowered to
1,000,000. Browser performance will be slower and memory-constrained; the
Web Worker keeps the UI responsive. 2M-row testing was not performed and is
not recommended.

## 8. Remaining launch blockers

1. **Manual browser QA** (privacy network-panel, CSP violations, offline
   verification, keyboard, screen reader, responsive) — checklist provided.
2. **Owner authorization** to make the repo public and enable GitHub Pages.
3. **LICENSE file** — README declares MIT; owner must confirm before adding.
4. **Branch alignment** — renamed to `main` locally; no remote yet.
5. At least one tutorial published (content plan in docs/launch-plan.md).
6. SECURITY.md review against shipped build.

## 9. Exact local commands to run

```bash
cd csv-excel-tools
npm ci
npm run dev        # http://localhost:5173
npm test           # 53 tests
npx tsc --noEmit   # type check
npm run build      # dist/
npx vite preview   # serve dist/ locally
```

## 10. Exact steps to publish (after authorization)

```bash
git remote add origin https://github.com/<owner>/tidysheet.git
git push -u origin main
# Then in GitHub: Settings → Pages → Source: GitHub Actions
# (workflow already in .github/workflows/pages.yml)
```

## Final status

**READY FOR OWNER REVIEW** — automated checks pass; browser manual QA and
owner authorization remain before public launch.
