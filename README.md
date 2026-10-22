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

## Run locally

```bash
npm ci
npm run dev        # http://localhost:5173
npm test           # 53 tests via node:test (tsx)
npm run build      # static output in dist/
```

No accounts, environment variables, secrets or network access needed at build
time. The build works fully offline once dependencies are installed.

## Privacy

- No cookies, no localStorage involving file data, no telemetry.
- The page makes no network call carrying file content — verifiable by saving
  the page and using it with networking off.
- Content-Security-Policy is set to `default-src 'self'`.

## Limits (v1)

- CSV and TSV only (Excel `.xlsx` is planned next).
- 100 MB per file; 2,000,000 rows per table.
- Numbers and dates are compared as text on purpose — so `1.0` ≠ `1` and
  `2024-01-02` ≠ `02/01/2024`. This is deliberate: it prevents false
  matches on IDs, prices and envelope numbers.

## License

MIT.
