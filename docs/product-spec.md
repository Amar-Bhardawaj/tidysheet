# Product Spec — TidySheet (working name)

**Status:** Phase Two deliverable (per mission §5)
**Written:** 2026-10-22
**Source of truth:** `docs/market-validation.md` (Phase One)

---

## 1. Name candidates

| Candidate | Verdict |
| --- | --- |
| **TidySheet** | **Working pick.** Descriptive (tidy your sheet), brandable, "tidy" is what shop-floor spreadsheet people say. Two syllables, safe for SEO titles. |
| SheetSweep | Alt; stronger "action" feel, less memorable. |
| PlainSheet | Alt; reads like spreadsheet language, weaker verb angle. |
| Cleanly | Too generic; likely trademark collisions in cleaning products. |
| KeepColumns | Tool-paints-the-job name; usable as a feature page title instead. |

Launch may rename the repository without code changes (self-contained).

## 2. Target user profile

**Primary:** A non-developer professional who regularly receives recurring CSV/Excel
exports (reports, exports from CRMs, e-commerce feeds, payroll, bookkeeping software)
and needs to (a) remove duplicates, (b) tidy text columns, (c) produce a rigorous
diff/audit between two exports, then hand the cleaned file or the change report to
someone else (a boss, a client, a system import).

- Comfortable with Excel, formulas are OK but avoid it.
- Will not install VBA/macros. Will not run a terminal.
- Cares about not uploading client/payroll data anywhere.
- Currently uses Excel's "Remove Duplicates," Data > Filter, two windows, and paid
  tools only when forced.
- **Secondary:** developer, QA, data folks — appreciate correct semantics; will pick
  the tool for their non-technical colleagues.

## 3. Problem statement

> "Every month I get the same two-file problem: two exports that should be identical
> but aren't, or one export full of duplicate rows with messy spacing, and if I use
> Excel I either silently lose IDs/leading zeros or spend ages finding which rows
> actually changed by scrolling."

## 4. Value proposition

**TidySheet** = "Your two-file export, sorted out, on your computer, in 30 seconds."

- Nothing is uploaded. The page is a static site; save the file and it works offline.
- Correct-by-design matching (by your chosen ID / email / composite key, not row order).
- Duplicate keys are detected and handled loudly, never silently.
- Every change is explained and previewed before it is applied.
- Exports: cleaned file + change-report CSV you can hand to a colleague.

## 5. Primary user journey (v1)

1. Arrives from search → sees one clear page, no signup, no ads.
2. Drops the first CSV. App begins validation.
3. Drops the second file, or picks **"This file only"** mode for single-file tasks
   (dedupe / clean).
4. App proposes:
   - detected delimiter/separator,
   - headers (assumed first row),
   - an ID-like column suggestion,
   - duplicate count inside each file,
5. **Mode A (dedupe)**: user picks key column(s) + keep-rule (first / last / longest),
   sees a preview with rows marked red/green/kept, one click downloads the cleaned file
   and a "removed rows" report.
6. **Mode B (compare)**: user picks a key (or composite) column per file; clicks
   Compare. App classifies rows: added / removed / changed / unchanged, plus duplicate
   key warnings. Preview table (limited rows for large data) with changed-cell
   highlights.
7. User clicks **Download diff report** (CSV, summary + detail section) and optionally
   a merged "keep-current" table.
8. User closes the page. No account, no history saved by the app.

## 6. Functional requirements — v1 (Must have)

- F1: accept up to 2 CSV / TSV / TXT tab-delimited files, 2 – 100 MB each (documented
  soft limit; hard cap 100 MB per file by default with an in-app guidance on limit).
- F2: robust RFC 4180 parsing incl. quoted values, multi-line quoted fields,
  separators (`,` / `;` / tab / pipe) auto-detected and user-overridable.
- F3: header detection: first non-empty row used as header. Rejects when duplicate
  column names → error with clearly offered rename strategy.
- F4: characters encodings UTF-8, UTF-8-BOM, UTF-16 LE/BE auto-detect; Latin-1 fallback.
- F5: file validation errors per mission (empty, malformed, no-header, size, extension
  mismatch) with clearly worded messages.
- F6: duplicates removal — user chooses full-row (default) or specific column(s);
  keep-rule: first / last / longest row (value-count heuristic). Preview count +
  list of rows to be removed before apply. Undo-in-session via re-load of file.
- F7: compare two files — one or composite key (primary; per-row ordering does not
  produce changes). Added / removed / changed / unchanged counts and report table.
- F8: **duplicate-key warning**: if either file has duplicated values in the chosen
  key, ui shows a distinct warning listing the offending values and count, and
  explains what will happen (first-wins in this tool by default with explicit confirm
  step).
- F9: change report export = CSV with columns: `status, key, source_row_a,
  source_row_b, changed_column_count, changes_summary`; plus detail blocks per row
  with old → new for each changed cell.
- F10: cleaned-file export (post-dedupe/clean) + full removed-rows export.
- F11: text cleanup (Must but conservative): trim leading/trailing whitespace
  (default off), collapse repeated internal whitespace (default off), and normalize
  "empty-like" tokens (default list: empty string, `""`, `N/A`, `null`, `None`,
  `-`, `—`, `#N/A`) to empty — each column-level toggleable, with a before/after
  preview. **Never** rewrites ID-like columns (leading zeros protected by default).
- F12: privacy — the page never sends file contents anywhere; load is static assets
  only. On page-load network calls only for static assets. Measurable offline after
  first load? — served once and saved-to-disk works offline.
- F13: informative empty states, editable/broken input re-selection and file-size
  guidance.

## 7. Non-goals for v1 (Explicitly out of scope)

- .xlsx read (ship immediately after launch; specced below)
- Formula-aware diff, multi-sheet Excel
- Merging (Phase 2), saved rules, batching, accounts, cloud sync, AI, payments
- Changing types (number/currency formatting)
- URL fetching of files (avoids SSRF, no server anyway)

## 8. Feature phase list

| Phase | Status |
| --- | --- |
| V1 (this repo, launch): CSV/TSV only | dedupe, clean, diff-by-key, exports, local-only |
| **V1.1 (immediate post-launch):** .xlsx/xlsx+BOM reading, sheet select | same features; export **write .xlsx** (pure client-side via SheetJS CE) |
| V1.2: merge (union by key, column-name reconciliation) | user selects merge vs concat |
| V1.3: date-format wizard (careful & safe, opt-in per column) | never on ID-like columns without user confirm |
| V2 hypotheses (not built until user signals): handle of 100k-row fast path with Web Worker, "saved rules" profile, offline desktop (PWA) packaging | none |

## 9. Nonfunctional requirements

- **NFR-privacy:** no telemetry on browsing. No cookies, no localStorage except UI
  state opt-in (never file contents — if the user reloads the page, must re-upload).
  Explained verbatim on the page.
- **NFR-correctness:** the diff engine's key-based logic unit-tested extensively:
  order independence, composite keys, duplicate keys, Unicode, CRLF/CR-only,
  escapes, trailing/leading space deltas, and no-false-positive cases.
- **NFR-robustness:** files over the limit → explicit error + tips. No memory-hogs
  on the UI thread: parse in a Web Worker chunked by row count; UI remains responsive
  and a hard cancel button is visible during processing of large files.
- **NFR-performant:** parse of 50 MB (≈450k rows: 6 columns) should complete < 20 s on
  a modern laptop; 10 MB row+diff on a 4-thread machine should complete < 5 s.
- **NFR-accessible:** keyboard-navigable; screenreader-friendly roles/ARIA; color
  never the sole indicator for state.
- **NFR-portable:** works in Chromium and Firefox on Windows and macOS at minimum.

## 10. Monetization hypothesis (not built; documented)

- Free tier = complete CSV/TSV toolkit. Nothing at launch requires payment.
- POSSIBLE paid tier only after usage data exists:
  - one-time desktop/offline bundle (bigger memory, ~$10–20 / ₹149–299 one-time) —
    would remain small, no subscription;
  - possibly "report pack" features (XLSX styled change report) as digital extras
    only if users actually ask.
- No payments, no gateway, no account until evidence of willingness to pay exists.

## 11. Acceptance criteria (Measured at shipping time)

- AC1: two identical files → diff report shows 0 changes. (Test)
- AC2: 70-sample mixed CRLF/quoted/multi-line file parse → expected row count.
- AC3: reorder rows in file B → no "changed" classification (except when truly
  changed).
- AC4: duplicate keys present → explicit warning; not a silent first-wins on diff;
  explicit detection of duplicate keys in the report.
- AC5: dedupe by chosen column keeps first/last per selection; other columns not
  considered; cleaned file row count matches preview count.
- AC6: packed auto-detected whitespace/empty-token cleaning never modifies columns
  the user marks excluded; ID-like columns checked with leading zeros intact.
- AC7: change report re-opens in Excel with the same counts as shown on screen.
- AC8: page has no cookies/localStorage interplay; a "works offline" claim can be
  demonstrated by saving the page and loading with the network disconnected.
- AC9: no console errors in the default flows.
- AC10: the page passes basic accessibility (keyboard: all interactive elements
  reachable and usable, no requires-mouse).

## 12. Known limitations (stated openly in-app)

- Excel (.xlsx) not supported in v1.
- Formula-aware comparison, styled excel reports — not in v1.
- Files are never edited silently: exports reflect only the operations you
  explicitly previewed and confirmed.
- Memory-bound: comprehensive files > 100 MB will not load; use your own breaker
  (or request offline desktop version later).
- Deterministic only with literal values; text is compared byte-for-byte after
  optional whitespace normalization; numbers are compared as strings, not parsed
  mathematically (rules out "1.0 vs 1" matching) — deliberate behavior, since such
  matches would risk false positives in envelopes, pricing, etc.

## 13. First-visit understanding test (target)

Someone who has never seen the app can:
1. say what the app does within 2 seconds of reading its hero text;
2. drop a file and understand the next step without a manual;
3. complete dedupe or compare on the first try;
4. find the privacy statement within one click;
5. understand the no-cookies/localStorage claim within one click.
