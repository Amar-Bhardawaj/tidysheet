# Security Policy — TidySheet

## Supported versions

Only the latest release on the default branch is supported.

## Reporting a vulnerability

Please report security issues privately to the repository owner before
disclosing them publicly. There is no public issue tracker expectation for
security reports; use the owner's contact method.

## Security model

- TidySheet is a static site. All file parsing, cleaning, deduping and
  comparing happens in the browser. No file content is uploaded.
- There is no backend, database, authentication, or cloud sync in v1.
- The Content Security Policy in `index.html` restricts scripts, workers and
  objects to `'self'`.
- Files are never executed as code; CSV text is parsed as data only.
- Hard limits: 100 MB per file, 1,000,000 rows per table.
- Error messages never echo absolute paths.

## Out of scope for v1

- Server-side processing of any kind.
- Authentication, accounts, or authorization.
- Paid-tier infrastructure (none exists yet).

## What to never commit

- Real customer/export data, even for testing.
- Any credentials or tokens (none are used by the app).
- Large synthetic test fixtures.
