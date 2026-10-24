# Publication Checklist — TidySheet v1

**Date:** 2026-10-24
**Status:** Ready for owner authorization. No publication has been performed.

## 1. Final files to publish

All 38 tracked files (verified via `git ls-files`):

- `.github/workflows/pages.yml` — GitHub Pages deployment workflow
- `.gitignore` — excludes node_modules, dist, OS/editor noise
- `README.md` — project documentation (MIT declared)
- `SECURITY.md` — security policy
- `index.html` — single-page app entry + CSP + OG tags
- `package.json` / `package-lock.json` — dependency record (lockfile present)
- `tsconfig.json` / `vite.config.ts` — build configuration
- `src/**` — 20 TypeScript/CSS source files
- `tests/**` — 5 test files (53 tests)
- `docs/**` — 13 documentation files

**Not published (correctly excluded):** `node_modules/`, `dist/`, `.vscode/`, logs.

## 2. License decision

- README.md declares **MIT**.
- package.json declares `"license": "MIT"`.
- No `LICENSE` file exists in the repository.
- **OWNER DECISION REQUIRED:** Confirm that MIT is the intended license. If confirmed, add a `LICENSE` file with the standard MIT text before publication. If a different license is preferred, update README.md and package.json accordingly.

## 3. Repository owner and intended repository name

- **Owner:** (to be specified by owner)
- **Intended repository name:** `tidysheet` (or owner's preference)
- **Branch:** `main` (local, no remote yet)
- **Visibility:** Public (required for free GitHub Pages)

## 4. Required GitHub permissions

- Create a public repository under the owner's account.
- Push the `main` branch.
- Enable GitHub Pages (Settings → Pages → Source: GitHub Actions).
- The workflow uses `permissions: contents: read, pages: write, id-token: write` (OIDC-based, no stored secrets needed).

## 5. Steps to publish the main branch

```bash
# 1. Owner creates the repository on GitHub (public, no template, no README)
# 2. From the local project directory:
git remote add origin https://github.com/<owner>/tidysheet.git
git push -u origin main

# 3. Verify push succeeded:
git log --oneline -1
git ls-remote origin
```

## 6. Steps to enable GitHub Pages

1. Go to repository Settings → Pages.
2. Under "Source", select "GitHub Actions".
3. The workflow `.github/workflows/pages.yml` will trigger automatically on push to `main`.
4. Monitor the Actions tab for build/deploy completion.
5. The site will be available at `https://<owner>.github.io/tidysheet/`.

## 7. How to verify the deployed site

1. Open the deployed URL in Chrome and Firefox.
2. Verify the page loads with correct title and description.
3. Drop a test CSV → complete a dedupe → download the result.
4. Drop two test CSVs → compare → download the change report.
5. Open DevTools → Network tab → verify no requests carry file content.
6. Open DevTools → Console → verify no errors.
7. Test on a mobile-width viewport.
8. Verify the URL is accessible without authentication.

## 8. How to roll back a failed deployment

```bash
# Revert the last commit and push:
git revert HEAD
git push origin main
# GitHub Pages will redeploy the previous version automatically.
# No database, no migrations, no state to roll back.
```

Alternatively, re-run a previous successful workflow from the Actions tab.

## 9. Remaining documented QA limitations

- Firefox compatibility: not tested (Firefox not installed).
- Screen-reader testing: not performed (no AT available).
- Accessibility audit (axe/Lighthouse): not run.
- 50MB+ file testing in browser: not performed.
- Export download trigger in headless: code path verified by inspection only.
- Network-panel privacy verification: static review + CDP network monitoring (localhost + data: URIs only; no external requests).
- Offline operation: verified after worker warm-up; initial cold load requires network.
- Professional security audit: not performed.
- Composite-key multi-select in UI: single-select dropdowns (engine supports composites).

## 10. Sensitive content audit results

- **No secrets, credentials, tokens, or API keys found** in tracked files.
- **No personal information** (emails, phone numbers, addresses) in tracked files.
- **No local absolute paths** in tracked files.
- **No temporary test artifacts** in tracked files.
- **No private data** in test fixtures (all synthetic).
- The only `innerHTML` match is in a code comment.
- All `secret`/`token`/`credential` matches are in security documentation context, not actual secrets.

**Classification: PASS** — no sensitive content found.

## 11. Deployment configuration verification

| Check | Result |
| --- | --- |
| Workflow branch matches repo branch (`main`) | ✅ PASS |
| Build command (`npm ci && npm test && npm run build`) | ✅ PASS |
| Deploy path (`dist/`) matches Vite `outDir` | ✅ PASS |
| `base: "./"` works with GitHub Pages sub-path | ✅ PASS |
| No secrets required for build | ✅ PASS |
| Workflow uses OIDC (no stored secrets) | ✅ PASS |
| Permissions follow least-privilege (`contents: read`, `pages: write`, `id-token: write`) | ✅ PASS |
| Concurrency control prevents overlapping deploys | ✅ PASS |
| Deployment instructions match workflow | ✅ PASS |

**Classification: PASS** — deployment configuration is consistent and correct.

## 12. Licensing verification

- README.md: "MIT" (line 49).
- package.json: `"license": "MIT"`.
- No `LICENSE` file exists in the repository.
- **OWNER DECISION REQUIRED:** Confirm MIT license intent. If confirmed, add `LICENSE` file with standard MIT text before publication.

## 13. Final classification summary

| Finding | Classification |
| --- | --- |
| Automated tests (53/53 pass) | PASS |
| TypeScript typecheck (0 errors) | PASS |
| Production build (success) | PASS |
| Browser smoke tests (Chrome headless + CDP) | PASS |
| Privacy (no fetch/storage/analytics in source) | PASS |
| Network privacy (localhost + data: URIs only) | PASS |
| Deployment configuration | PASS |
| Sensitive content audit | PASS |
| No LICENSE file | OWNER DECISION REQUIRED |
| Firefox not tested | BLOCKER (manual) |
| Screen-reader testing not performed | BLOCKER (manual) |
| Accessibility audit not run | WARNING |
| 50MB+ file not tested in browser | WARNING |
| Owner authorization to publish | OWNER DECISION REQUIRED |
| Tutorial publication | OWNER DECISION REQUIRED |

## 14. Exact owner decisions required to proceed

1. **Confirm MIT license** (or specify alternative) → add `LICENSE` file.
2. **Authorize public repository creation** on GitHub.
3. **Authorize GitHub Pages enablement** (Settings → Pages → Source: GitHub Actions).
4. **Authorize push to remote** (`git push -u origin main`).
5. **Confirm repository name** (`tidysheet` or alternative).
6. **Confirm at least one tutorial** will be published before or shortly after launch.

**No publication, push, or external action has been performed.** The repository is ready for your explicit authorization.