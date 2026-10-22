# Technical Architecture — TidySheet v1

**Status:** Phase Three deliverable (per mission §6)
**Written:** 2026-10-22
**Source of truth:** `docs/market-validation.md`, `docs/product-spec.md`

---

## 1. Design constraints

| Constraint | Decision driver |
| --- | --- |
| ₹0 capital | Static site only; no server, no DB, no paid API, no domain purchase needed |
| Data must not leave the device | All parse/process/compare steps run in the browser |
| Non-technical users | Must run with zero installs — a URL is the product; not a Python app requiring setup |
| Solitude of maintenance | One developer runs & maintains it; minimal moving parts |
| Trustworthiness | Verifiable open-source core logic + automated tests |
| Organic discovery | Fast page + open source (GitHub) + SEO landing pages |

## 2. Stack decision

| Layer | Choice | Why chosen / why not the alternatives |
| --- | --- | --- |
| App type | **Pure static web app (SPA-lite, no routing)** | Only architecture that satisfies ''no backend'', ''runs on any device'', and ''not require sign-up''. Python / Streamlit rejected: requires per-user installs, needs a server to host, and contradicts the privacy story. Desktop-only (Electron/Tauri) rejected for v1: heavier build/sign infrastructure, complicates zero-cost distribution (code-signing certs are paid). |
| Language | **TypeScript** (strict mode, no `any` leaks) | Catches diff-engine bugs at compile time; still outputs plain static JS. |
| Build tool | **Vite** | Static output with zero config; dev server + ES modules; tree-shakes. |
| UI framework | **Vanilla DOM + small template helpers** (no React/Vue/Svelte) | The page is one flow with steps (upload → options → preview → export). A framework buys nothing here but bundle weight and upgrade churn. UI code stays about ~8 small modules. |
| Styling | **Single hand-written CSS file** with CSS custom properties | No Tailwind build step; accessible color tokens via `prefers-color-scheme`; small enough to audit. |
| CSV parser | **papaparse** (MIT) — acknowledge this as the single runtime dependency | Battle-tested for RFC 4180 corners (quotes-in-quotes, CR-only, BOM, multiline). Writing our own is *possible* but user data correctness is not something to gamble on; MIT + tiny size + no server = fits all constraints. |
| Encoding detection | Own small utility (BOM sniff + UTF-16 zero-byte heuristics), built into load path | ~40 lines, fully unit-tested; avoids another dependency. |
| Core logic (dedupe / diff / clean) | **Pure TypeScript functions**, zero DOM and zero papaparse imports | Runs identically in the browser worker and in Node tests. This is the correctness core the whole product stands on. |
| Concurrency | **Web Worker** for parse+dedupe+diff of files > ~2 MB | Keeps the UI thread responsive; visible cancel button. |
| Export | Own RFC 4180 serializer (small, tested) for CSV/TSV; **SheetJS CE added only in v1.1** for .xlsx read→ write | SheetJS CE is Apache-2.0; kept out of v1 to keep launch scope honest. |
| Testing | **Node built-in test runner (`node:test`)** + `tsx` (devDependency) for TS execution | No Jest config needed; fast; the core modules have no browser APIs so they test cleanly in Node. |
| Hosting | **GitHub Pages** (free for public repos) via Actions; `npm run build` → `dist/` | Free hosting tier is real and sufficient for a static site; the product's own terms note this is free *today*, not permanently guaranteed. |

**Final dependency inventory**

- Runtime: `papaparse` (pinned exact version)
- Dev: `vite`, `typescript`, `tsx`
- Nothing else. No cloud SDKs.

## 3. Module layout

```
csv-excel-tools/
├── .github/workflows/pages.yml      # build + deploy to GitHub Pages
├── docs/                            # all phase documents (this repo's deliverables)
├── src/
│   ├── core/                        # pure logic — no browser/node APIs
│   │   ├── types.ts                 # Table, Cell, CompareOptions, etc.
│   │   ├── errors.ts                # typed validation error taxonomy
│   │   ├── normalize.ts             # encodings/BOM, header/ID-column heuristics
│   │   │                            # casing/trim/empty-token logic + limits
│   │   ├── dedupe.ts                # key resolution, keep-rules, removal plan
│   │   ├── diff.ts                  # key/composite keying, added/removed/changed
│   │   ├── report.ts                # change-report rows and CSV export text
│   │   └── clean.ts                 # trim/collapse/empty-token transformations
│   ├── format/
│   │   ├── csv.ts                   # parse/papaparse wrapper
│   │   └── csv-write.ts             # RFC 4180 serializer + TSV mode
│   ├── ui/                          # DOM only; calls engine via workers.ts
│   │   ├── app.ts                   # step machine for the single page flow
│   │   ├── components.ts            # small DOM builder helpers (textContent-safe)
│   │   ├── uploadZone.ts            # drag&drop + validation messages
│   │   ├── optionPanel.ts           # key/mode/options UI
│   │   ├── previewTable.ts          # preview grid (capped rows)
│   │   └── confirmPanel.ts          # destructive-action confirmation
│   ├── worker/
│   │   └── worker.ts                # runs parser + engine off the UI thread
│   ├── main.ts                      # entry: builds UI, registry of steps
│   └── styles.css
├── tests/                           # node:test suites for src/core + src/format
│   ├── csv.test.ts
│   ├── dedupe.test.ts
│   ├── diff.test.ts
│   ├── clean.test.ts
│   ├── normalize.test.ts
│   └── report.test.ts
├── package.json / package-lock.json # dependency record (lockfile present)
├── tsconfig.json / vite.config.ts
├── index.html                       # single-page app markup & SEO meta
└── README.md
```

**Separation promise:** `src/core` has **no** DOM APIs and **no** `papaparse` calls:
it operates on plain arrays/objects. `src/format` is the only module that talks to
a CSV library. `src/ui` never computes diffs itself — it always calls `src/core`.
Testing never spins up a DOM.

## 4. Dataflow (single page, four steps)

```
[1] FILE SELECT      user drops 1–2 files
        │            (100 MB/file hard cap; >2 MB → worker mode)
        ▼
[2] VALIDATE         encoding sniff → parse → header/dup-column/
        │            empty-file/delimiter checks → errors rendered
        ▼
[3] OPERATE          user picks mode:
        │              single file → CLEAN and/or DEDUPE
        │              two files   → COMPARE (key or composite key)
        │            settings → preview (limited rows) → count summary
        ▼
[4] CONFIRM & EXPORT destructive ops require a visible Confirm button;
                     exports: cleaned file, removed-rows, change report
```

Note: steps re-run when any input changes; no stale hidden state. Dropped files are
held only in memory of the tab; closing the tab discards everything.

## 5. Threat model & security controls

| Risk | Control |
| --- | --- |
| Uploaded content executed as code | Never: file text is parsed as data only. No `eval`, no `new Function`, no dynamic `<script>`. All DOM insertion via `textContent`/`createElement`; project-wide lint to forbid `innerHTML` with dynamic data. |
| ReDoS / pathological parser input | papaparse is linear; our own utilities (encoding sniff, delimiters) are bounded scans; no regex backtracking over user data in hot paths. |
| Resource exhaustion (huge/monster files) | Hard cap 100 MB per file, default; 2,000,000-row guard; parse happens in a worker so the UI thread never hangs; explicit error guides the user to trim. |
| Path leakage in errors | Error messages never echo absolute paths; filenames only, as the user selected them. |
| XSS via crafted CSV content | Every value rendered with `textContent`; attribute values from booleans only (never file strings). |
| Server-side request forgery | No URL loading; no fetch except same-origin static assets (see 5a). |
| Data exfiltration | No cookies/localStorage involving file data; page makes no network call carrying file content — verifiable one-line audit: `grep -r 'fetch(' src | grep -v 'exact asset loads'` and the browser network panel. Will also be verifiable by saving the page and using it with networking off. |
| Supply chain | Two small, well-known dependencies, both pinned by lockfile; `npm audit` documented as a maintenance task. |
| CSP | `<meta http-equiv="Content-Security-Policy">` with `default-src 'self'; script-src 'self'; worker-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'`. |

## 6. Testing strategy

- `src/core` (dedupe, diff, clean, normalize, report): exhaustive `node:test`
  suites — covering the exact matrix from mission §8 (empty, malformed, dupes,
  missing values, dup identifiers, composite keys, column order changes, row
  order changes, Unicode, dates-as-text, leading zeros, big-file guards,
  export↔re-import round trip, extension checks).
- `src/format`: parser wrapper tests against a corpus of tricky fixtures
  (quoted multi-line, CR-only, BOMs, semicolon/tab/pipe delimiters).
- UI: manual QA checklist in `docs/testing-report.md` (documented per release).
- CI (when repository goes GitHub): run `npm test` on push; pages.yml only deploys
  from a passing build. **Public publication of the repository is an owner decision
  and does not happen without authorization** (mission §12).

## 7. Reproducible setup

```bash
git clone https://github.com/<owner>/csv-excel-tools     # (if published)
cd csv-excel-tools
npm ci            # exact lockfile install
npm run dev       # http://localhost:5173
npm test          # node:test suites via tsx
npm run build     # outputs dist/ (static, deployable)
```

No accounts, environment variables, secrets, or network access needed at build time.
The build works fully offline once dependencies are installed.

## 8. Cost & operating model

| Item | Cost |
| --- | --- |
| Development machine (already owned) | ₹0 incremental |
| Hosting: GitHub Pages public repo | ₹0 (subject to GitHub's own terms; documented as free-today) |
| Domain: optional later; the GitHub Pages URL works without one | ₹0 until chosen |
| Dependencies | 0 — all open-source; no paid APIs |
| Maintenance | human time only |

Anything genuinely "necessary" and paid would need explicit owner approval first —
none is planned for v1.
