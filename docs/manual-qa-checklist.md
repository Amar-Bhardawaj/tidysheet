# Manual QA Checklist — TidySheet v1

**Status:** Not yet executed in a real browser. This environment has no installed
browser (Chrome/Edge/Firefox) and no browser automation tooling (Playwright/
Puppeteer/Cypress). All items below are documented for execution by the owner
or a reviewer before public launch.

## Environment setup

1. `npm ci` (verify 0 vulnerabilities).
2. `npm run dev` → open http://localhost:5173 in Chrome and Firefox.
3. Open DevTools → Network tab, filter "All", clear before each test.
4. Open DevTools → Console; expect no errors.

## CSV parsing

- [ ] Valid comma-delimited CSV parses with correct headers and row count.
- [ ] Semicolon-delimited CSV: auto-detect or manual override works.
- [ ] Tab-delimited TSV parses.
- [ ] Quoted field with comma inside survives intact.
- [ ] Quoted field with embedded newline survives intact.
- [ ] UTF-8 BOM file: header is not prefixed with BOM character.
- [ ] Unicode/non-English text (accented, Cyrillic, emoji) preserved.
- [ ] Empty file → clear "empty file" error, no crash.
- [ ] Malformed input → clear error or notice, no crash.
- [ ] Duplicate column headers → renamed with "(2)" notice.
- [ ] Missing values → shown as empty cells, not shifted.
- [ ] Extra cells in a row → kept, not truncated.
- [ ] Leading zeros in IDs/postal codes preserved.
- [ ] File > 100 MB → size-limit error before parse.

## Duplicate removal

- [ ] Full-row duplicates removed; count matches preview.
- [ ] Key-column dedupe removes rows sharing that key.
- [ ] Keep-first keeps first occurrence.
- [ ] Keep-last keeps last occurrence.
- [ ] Keep "most complete" keeps the row with most data.
- [ ] Missing keys: rows with blank key are grouped together (verify behavior is acceptable).
- [ ] Duplicate identifiers (same key, different other columns) → grouped, not silently dropped.
- [ ] Preview count == exported row count.
- [ ] Removed-rows report lists correct source row numbers and full values.
- [ ] Original file unchanged (re-upload shows original).

## File comparison

- [ ] Identical files → 0 added, 0 removed, 0 changed, all unchanged.
- [ ] Reordered rows → 0 changes (key-based).
- [ ] Added record → appears in "added" with correct row number.
- [ ] Removed record → appears in "removed".
- [ ] Changed record → "changed" with per-cell before→after detail.
- [ ] Composite key (where UI allows) → correct matching.
- [ ] Duplicate keys → warning shown, names the key and rows.
- [ ] Different column order between files → columns still paired.
- [ ] Missing column in one file → ignored for change detection, no crash.
- [ ] Additional column in one file → ignored, no crash.
- [ ] Whitespace-insensitive toggle works.
- [ ] Case-sensitive toggle works.
- [ ] Change report CSV opens in Excel with correct counts.

## Text cleaning

- [ ] Leading/trailing whitespace trimmed.
- [ ] Repeated internal spaces collapsed when option on.
- [ ] Empty-token normalization (N/A, null, -, …) → blank.
- [ ] Protected columns (id, phone, zip) untouched even if dirty.
- [ ] Leading zeros preserved in all columns unless excluded by user (trim only removes whitespace).
- [ ] Numeric-looking strings (1.0, 007) not converted.

## User interface

- [ ] Upload → preview → confirm → export completes without confusion.
- [ ] Cancel button hides confirm panel and leaves data intact.
- [ ] Error messages are human-readable and name the file.
- [ ] Empty states shown when no file loaded.
- [ ] All interactive elements reachable by keyboard (Tab/Enter/Space).
- [ ] Visible focus ring on every focusable element.
- [ ] Buttons/inputs have accessible labels.
- [ ] Preview table has a caption/aria-label.
- [ ] Status changes announced (aria-live on #app or status line — verify).
- [ ] Layout usable at 320 px width and 200% zoom.
- [ ] Recovery after invalid input: drop a bad file, then a good file → works.

## Privacy (manual, in browser)

- [ ] DevTools Network tab shows no requests carrying file content during parse/dedupe/diff/clean/export.
- [ ] No cookies set (Application → Cookies empty).
- [ ] No localStorage/sessionStorage/IndexedDB entries involving file data.
- [ ] Save page to disk (Ctrl+S); reopen with network disabled (DevTools → Offline) → app still loads and runs a full dedupe.
- [ ] CSP header/meta present; no CSP violations in console.

## Performance (manual)

- [ ] 1 MB file (~10k rows): all operations < 2 s.
- [ ] 10 MB file (~100k rows): all operations < 10 s; UI stays responsive.
- [ ] 50 MB file (~500k rows): completes without tab crash; note time.
- [ ] Cancel button visible during long runs (verify worker responsiveness).

## Accessibility tooling (if available)

- [ ] Run axe DevTools or Lighthouse accessibility audit; record score.
- [ ] NVDA/VoiceOver smoke on upload zone and preview table.

## Sign-off

Reviewer: __________  Date: __________  Browser/OS: __________
Result: PASS / FAIL (list failures)
