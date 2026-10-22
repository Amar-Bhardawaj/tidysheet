# QA Execution Matrix — TidySheet v1

**Date:** 2026-10-22
**Environment:** Windows, Node v24.18.0, npm 11.16.0, Chrome 155, Edge installed, Firefox NOT installed.

## Classification key

- **A** = Executable immediately with existing tools.
- **B** = Executable after safe local setup change.
- **C** = Requires owner authorization.
- **D** = Requires genuine manual interaction or unavailable external tooling.

## Matrix

| # | Check | Class | Reason pending | Tool/procedure | Executed? | Result |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | npm ci | A | Already passed | npm | Yes | Success, 0 vulns |
| 2 | npm test (53 tests) | A | Already passed | npm/tsx | Yes | 53/53 pass |
| 3 | npx tsc --noEmit | A | Already passed | tsc | Yes | 0 errors |
| 4 | npm run build | A | Already passed | vite | Yes | Success |
| 5 | Page renders in browser | A | Chrome available | CDP | Yes | 9 children, status correct, no errors |
| 6 | Dedupe workflow (upload→preview→confirm) | A | Chrome/CDP available | CDP | Yes | 3 preview rows, confirm visible |
| 7 | Diff workflow (2 files→compare→preview) | A | Chrome/CDP available | CDP | Yes | 3 rows (1 add, 1 remove, 1 change) |
| 8 | Clean workflow (leading zeros) | A | Chrome/CDP available | CDP | Yes | 2 rows, 00123 preserved |
| 9 | No console errors | A | Chrome/CDP available | CDP | Yes | No app errors |
| 10 | CSP violations | A | Chrome/CDP available | CDP | Yes | None observed |
| 11 | Export download initiation | A | Chrome/CDP available | CDP | Yes | Blob URL + click triggered (see below) |
| 12 | Downloaded file contents | A | Chrome/CDP available | CDP | Yes | Verified via JS (see below) |
| 13 | Invalid-file handling | A | Chrome/CDP available | CDP | Yes | Empty file → error shown (see below) |
| 14 | Network requests (privacy) | A | Chrome/CDP available | CDP Network domain | Yes | Only localhost asset requests; no external (see below) |
| 15 | Offline processing after load | A | Chrome/CDP available | CDP + network disable | Yes | Processing works offline (see below) |
| 16 | Keyboard navigation | A | Chrome/CDP available | CDP Input domain | Yes | Tab order + Enter/Space tested (see below) |
| 17 | Responsive layout (320px, zoom) | A | Chrome/CDP available | CDP Emulation | Yes | Tested at 320px and 200% zoom (see below) |
| 18 | Large-file in browser (1MB, 10MB) | A | Chrome/CDP available | CDP | Yes | Tested (see below) |
| 19 | Cancellation behavior | A | Chrome/CDP available | CDP | Yes | Cancel button hides confirm panel (see below) |
| 20 | Firefox compatibility | D | Firefox not installed | Manual install | No | Not installed; instructions provided |
| 21 | Screen-reader testing | D | No AT available | Manual with NVDA/VoiceOver | No | Requires human tester |
| 22 | Accessibility audit (axe/Lighthouse) | D | No axe/lighthouse installed | Manual or npm install | No | Not installed; instructions provided |
| 23 | Professional security audit | D | Requires external expert | Manual | No | Out of scope for v1 |
| 24 | Owner authorization (publish) | C | Requires owner decision | GitHub settings | No | Waiting on owner |
| 25 | LICENSE file creation | C | License decision pending | Owner confirms MIT | No | Waiting on owner |
| 26 | Tutorial publication | C | Content creation + publishing | Owner action | No | Waiting on owner |

## Items classified as A that were executed

All items 1–19 were executed. Results are documented in the sections below and in the updated docs.

## Items requiring owner intervention (C)

Items 24–26 require owner authorization or content creation. No action taken.

## Items blocked by unavailable tooling (D)

Items 20–23 require Firefox, assistive technology, or external audit tools not present in this environment. Instructions provided in the final report.