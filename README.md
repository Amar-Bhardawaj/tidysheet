# TidySheet

**Clean, dedupe and compare CSV/TSV exports — in your browser, nothing uploaded.**

TidySheet is a free, no-signup, privacy-first web tool for the three jobs people
actually repeat every month with spreadsheet exports:

1. **Remove duplicate rows** — by full row or by a key column (or composite key),
   with first / last / most-complete keep rules and a preview before anything
   is removed.
2. **Clean text** — trim edges, collapse internal whitespace, normalize empty-like
   tokens (`N/A`, `null`, `-`, …) to blank, with per-column protection for
   ID / phone / zip columns.
3. **Compare two exports** — key-based (or composite key) diff reporting
   added / removed / changed / unchanged rows, with duplicate-key warnings and
   an exportable change report.

Everything runs in this browser tab. **No file content is ever uploaded.**
Closing the tab discards everything.

## The problem

Exported spreadsheet data is rarely clean. Customer lists contain duplicate rows.
Text columns have inconsistent spacing. Updated exports arrive and you need to
know exactly what changed. Excel's "Remove Duplicates" removes rows silently and
cannot diff two files. Opening a CSV in Excel quietly strips leading zeros from
IDs, phone numbers, and postal codes. Free online tools are ad-heavy,
sign-up-gated, size-capped, or produce false differences when rows are reordered.

TidySheet brings these common data-preparation tasks into one browser-based tool
that does not upload your data.

## Who it is for

- Operations teams reconciling data exports from different dates or systems.
- Analysts and spreadsheet users preparing data for import into another tool.
- Small-business owners managing customer, product, sales, or inventory records.
- Students working with datasets and tabular information.
- Developers and technical users inspecting exported data.
- Anyone dealing with duplicate rows, inconsistent text, or differences between
  two data files.

TidySheet is not a replacement for Excel, a database, or an ETL platform. It
handles the three specific tasks above and nothing more.

## How to use it

### Remove duplicates from one file

1. Open the [live application](https://amar-bhardawaj.github.io/tidysheet/).
2. Drop a CSV or TSV file into the upload zone (or click to browse).
3. In the "Remove duplicates" card, choose a key column (or leave "Full row").
4. Pick a keep rule: first occurrence, last occurrence, or most complete record.
5. Click **Preview duplicates** and review which rows will be removed.
6. Click **Confirm and apply**, then **Download cleaned file**.

### Clean text in one file

1. Load a CSV or TSV file.
2. In the "Clean text" card, choose which operations to apply (trim edges,
   collapse internal whitespace, normalize empty-like tokens).
3. Protect identifier columns (ID, phone, zip) from any changes.
4. Click **Preview cleaning** and review the changes.
5. Click **Confirm and apply**, then **Download cleaned file**.

### Compare two files

1. Drop two CSV or TSV files into the upload zone.
2. Switch to "Two files: compare / diff" mode.
3. Select a key column in each file (or composite key).
4. Toggle whitespace and case sensitivity as needed.
5. Click **Compare files** and review added, removed, changed, and unchanged rows.
6. Click **Download change report** to export the results.

## Example use case

**Before:** You export a customer list from your CRM on Monday and again on
Friday. The Friday export has 50 new customers, 3 removed, and 12 whose email
or phone changed. Manually finding these differences means scrolling through
thousands of rows.

**With TidySheet:** Load both exports, select "id" as the key column, and click
Compare. TidySheet reports 50 added, 3 removed, 12 changed, and the rest
unchanged — with a per-cell breakdown of every change. Download the change report
and share it with your team.

Use synthetic or non-sensitive data when trying the tool. Do not upload
confidential production records to any public website.

## Privacy

- No cookies, no localStorage involving file data, no telemetry.
- Files are parsed and compared entirely in this browser tab. No file content
  is ever sent to a server.
- The page makes no network call carrying file content — verifiable by saving
  the page and using it with networking off.
- Content-Security-Policy is set to `default-src 'self'`.

## Limits (v1)

- CSV and TSV only (Excel `.xlsx` support is planned for a future version).
- 100 MB per file; 1,000,000 rows per table.
- Numbers and dates are compared as text on purpose — so `1.0` ≠ `1` and
  `2024-01-02` ≠ `02/01/2024`. This is deliberate: it prevents false
  matches on IDs, prices, and envelope numbers.
- No saved profiles, batch processing, or Excel export in v1.
- Composite-key selection in the UI uses single-select dropdowns (engine
  supports composites; multi-select UX is planned for v1.1).

## Run locally

```bash
npm ci
npm run dev        # http://localhost:5173
npm test           # 53 tests via node:test (tsx)
npx tsc --noEmit   # TypeScript type check
npm run build      # static output in dist/
```

No accounts, environment variables, secrets, or network access needed at build
time. The build works fully offline once dependencies are installed.

## Feedback

Found a bug or have a suggestion? Open an issue at
https://github.com/Amar-Bhardawaj/tidysheet/issues

## License

MIT. See [LICENSE](LICENSE) for details.