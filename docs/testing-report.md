# Testing Report — TidySheet v1

**Date:** 2026-10-22
**Test command:** `npm test` (tsx --test tests/*.test.ts)
**Result:** **53 / 53 tests passed** (0 failed, 0 skipped). Duration 1.27 s.
**Type check:** `npx tsc --noEmit` — clean (0 errors).
**Production build:** `npm run build` — succeeded (Vite, 14 modules, JS 20.9 KB, worker 33.3 KB, CSS 5.2 KB).

## Automated test inventory (by file)

| File | Tests | Focus |
| --- | --- | --- |
| tests/csv.test.ts | 12 | parsing, quoting, delimiters, empty file, duplicate headers, leading zeros, unicode, CR-only, BOM, header-only, extra cells, sniffEncoding |
| tests/dedupe.test.ts | 11 | full-row, key-column, composite key, keep rules (first/last/longest), case sensitivity, trim, groups, no-dupes, immutability |
| tests/diff.test.ts | 15 | identical files, reordered rows, added/removed, changed cell detail, composite key, column reordering, duplicate-key warnings, whitespace/case sensitivity, unicode, leading zeros, date-as-text, missing values, empty tables |
| tests/clean.test.ts | 9 | trim, collapse, empty-token normalization, excluded columns, leading-zero protection, numeric-string safety, immutability, no-op, examples |
| tests/report.test.ts | 6 | CSV round trip, quoting, BOM, diff report counts/detail, removed-rows export, duplicate-key warning in report |

## Coverage of the mission §8 matrix

| Required case | Covered? | Where |
| --- | --- | --- |
| Empty input | Yes | csv.test.ts "empty file throws EMPTY_FILE" |
| Malformed input | Partially | parser error path exercised by irregularities notice; full malformed-bytes not covered (manual QA) |
| Duplicate records | Yes | dedupe.test.ts |
| Missing values | Yes | diff.test.ts "empty/missing values reported as change"; clean empty-token tests |
| Duplicate identifiers | Yes | diff.test.ts "duplicate keys warned" |
| Composite keys | Yes | dedupe.test.ts + diff.test.ts |
| Different column orders | Yes | diff.test.ts "different column order between files" |
| Different row orders | Yes | diff.test.ts "reordered rows → no false changes" |
| Unicode text | Yes | csv.test.ts + diff.test.ts |
| Dates and time values | Yes (as text, no silent normalization) | diff.test.ts "date/time values compared as text" |
| Leading zeros | Yes | csv.test.ts + diff.test.ts + clean.test.ts |
| Large files within documented limits | Partially | logic is O(n) and runs in a worker; no 1M-row fixture in CI (manual) |
| Export and re-import consistency | Yes | report.test.ts "csv-write: round trip" |
| Invalid file extensions / unsupported content | Partially | UI accept attribute + binary sniff (containsNul/looksBinary) unit-tested indirectly; manual QA for full UX |

## Security checks performed

- No `eval`, `new Function`, or dynamic `<script>` anywhere in src (verified by grep).
- All DOM insertion uses `textContent` / `createElement`; no `innerHTML` with dynamic data (verified by grep).
- CSP meta tag present in index.html with `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'none'`.
- No network call carrying file content: worker only receives ArrayBuffer from the already-loaded File; no fetch in src (verified by grep).
- No cookies / localStorage usage in src (verified by grep).
- Hard caps: 100 MB per file, 2,000,000 rows, enforced before parse.
- Binary sniff rejects NUL-byte content (xlsx/zip) with a clear message.
- Error messages never echo absolute paths (only user-selected file names).

## Manual QA checklist (to be executed before public launch)

- [ ] Drop a 3-row file; complete dedupe in < 30 s on first visit.
- [ ] Drop two files; complete a diff in < 30 s.
- [ ] Reorder rows in file B → no false "changed".
- [ ] Identical files → 0 changes.
- [ ] Duplicate keys present → warning visible and named.
- [ ] Leading-zero ID column survives clean (excluded) and dedupe.
- [ ] Save page to disk; reload with network disabled → app still works.
- [ ] Keyboard-only completion of the main flow.
- [ ] Screen-reader smoke (NVDA) on the preview table.
- [ ] Chrome + Firefox on Windows and macOS.
- [ ] No console errors in default flows.
- [ ] Network panel shows no requests carrying file content.

## Known defects and limitations

1. **Excel (.xlsx) not supported in v1** — documented in-app and in README. Planned as v1.1.
2. **Formula-aware comparison not supported** — cells are compared as text.
3. **Numbers/dates compared as text** — deliberate, documented.
4. **Malformed-bytes UX** is a notice, not a hard error, in some edge cases.
5. **No automated browser/UI tests** — manual QA only for v1; Playwright-based E2E is a v1.2 candidate.
6. **No streaming parse for > ~100 MB files** — hard cap instead.
7. **Composite-key selection in the UI** relies on single-select dropdowns; true multi-select is a v1.1 UX improvement (engine already supports composite keys).
8. **No saved rules / profiles** — every session starts fresh (by design for v1 privacy).

## Verdict

Core engine correctness is well covered (53 passing tests). The main residual risk is
UI-level behavior on real browsers, which is captured in the manual QA checklist
above and must be executed before any public link is shared.
