# Launch Plan — TidySheet

**Status:** Phase Eight deliverable (per mission §8)
**Date:** 2026-10-22

## 1. Landing page copy (use on GitHub Pages home / README hero)

### Hero

**TidySheet — clean, dedupe and compare CSV/TSV exports in your browser.**
Free. No sign-up. Nothing uploaded. Your data stays in this tab.

[ Drop your file here ]  [ Try with sample data ]

### Problem

Every month you get the same two-file problem: two exports that should be
identical but aren't, or one export full of duplicate rows with messy spacing.
Excel's "Remove Duplicates" is one click — but it removes rows silently, can't
diff two files, and opening a CSV in Excel quietly eats leading zeros on IDs,
phone numbers and zip codes. The free online tools are ad-heavy, sign-up-gated,
size-capped, or get the diff wrong when rows are reordered.

### Who it helps

Freelancers, analysts, bookkeepers, back-office and ops staff, e-commerce and
SaaS operators — anyone who handles recurring CSV/TSV exports and is not a
developer. Developers use it too, and recommend it to non-technical colleagues.

### What it does

- **Remove duplicates** — by full row or by a key column (or composite key).
  Keep first, last, or the most complete record. Preview exactly which rows
  will be removed before you commit.
- **Clean text** — trim edges, collapse internal whitespace, normalize empty-like
  tokens (`N/A`, `null`, `-`, …) to blank. Protect ID / phone / zip columns
  from any change.
- **Compare two exports** — key-based diff reporting added, removed, changed
  and unchanged rows. Reordering rows never creates false changes. Duplicate
  keys are warned about, never silently mis-paired.
- **Export** — cleaned file, removed-rows report, and a full change report (CSV).

### How it works

1. Drop one or two CSV/TSV files.
2. Pick an operation and the columns it should use.
3. Preview the proposed changes (limited rows shown; full result on download).
4. Confirm. Download. Done.

### Privacy

Files are parsed and compared entirely in this browser tab. Nothing is uploaded.
No cookies, no localStorage involving file data, no telemetry. Save the page
to disk and it works with the network turned off. (Verifiable in your browser's
Network panel.)

### What is free

Everything in v1. No account, no paywall, no ads.

### What may eventually require payment

Possibly a one-time offline desktop version with larger memory, only if real
usage shows demand. Nothing is gated today, and no payment is collected.

## 2. README.md

Already created at repository root (see README.md). It covers setup, privacy,
limits, and license. Keep it the single source of truth for "how to run".

## 3. Five useful tutorial ideas (for SEO + organic discovery)

1. **"Why your CSV diff shows 1000 changes when nothing really changed"** —
   explains row-order false positives and how key-based matching fixes them.
   (Targets: "compare two csv files", "csv diff wrong".)
2. **"How to remove duplicate rows in Excel without losing the wrong record"** —
   walks through keep-first vs keep-most-complete, with screenshots. (Targets:
   "remove duplicates excel keep first".)
3. **"Stop Excel from eating your leading zeros (IDs, phones, zips)"** —
   documents the CSV↔Excel corruption problem and how to protect columns.
   (Targets: "csv leading zeros excel", "excel removes leading zeros".)
4. **"Diff two CRM exports by email/SKU in 30 seconds (free, no upload)"** —
   end-to-end walkthrough with a real-looking export. (Targets: "compare csv by
   id", "compare two excel files".)
5. **"Clean a messy CSV export: trim, normalize blanks, dedupe — in one tab"** —
   cleanup workflow for e-commerce / payroll exports. (Targets: "clean csv data
   online", "normalize csv".)

Each tutorial should be a short article + a 60–90 s screen recording, published
on the project's GitHub Pages blog section and mirrored as a YouTube video with
chapters. No spam, no mass posting; one per week.

## 4. Organic distribution checklist

- [ ] Publish repository publicly (owner authorization required) with a clear
      README, LICENSE (MIT), SECURITY.md, and issue templates.
- [ ] Enable GitHub Pages from `dist/` (or `/docs`) so the tool is live at a
      stable URL.
- [ ] Submit to software directories that accept free/open-source tools:
      AlternativeTo, Slant, Product Hunt (only after the manual QA checklist
      passes), Hacker News "Show HN" (only with a working live demo).
- [ ] Add the project to relevant awesome-lists (awesome-csv, awesome-data-tools)
      via pull request with a one-line description.
- [ ] Write the five tutorials above; publish one per week.
- [ ] Answer relevant Stack Overflow / Reddit questions with a link only when
      the tool genuinely solves the asked problem (no drive-by promotion).
- [ ] Add a "Compare with TidySheet" badge/snippet users can embed (optional,
      later).
- [ ] Keep a public changelog and issue tracker; respond to issues within a
      week.
- [ ] Add OpenGraph + Twitter card meta tags to index.html for share previews.

## 5. Measurement plan (privacy-respecting)

- **No per-user analytics by default.** If measurement is added later, it must
  be aggregate-only and opt-in, and never carry file content or PII.
- Track (manually, from GitHub): stars, forks, issues opened, releases
  downloaded.
- Track (from the live page, aggregate only, if and only if an opt-in
  privacy-respecting counter is added later): page views, "successful run"
  counts (dedupe/diff completed), and the in-app willingness-to-pay poll.
- Activation metric: % of first-time visitors who complete at least one
  operation (dedupe or diff) without an error.
- Retention proxy: returning visitors (aggregate) and issue-tracker engagement.
- Do not invent baseline numbers; record the first real measurement date once
  the tool is live.

## 7. First 100 users plan (concrete, week-by-week)

Goal: 100 distinct people who complete at least one operation, with feedback.

Week 1 (after launch):
- Post "Show HN: TidySheet" on Hacker News with a live demo link and a 60 s GIF.
  Target: 20–50 visitors.
- Post in r/excel and r/dataengineering with the leading-zeros tutorial link
  (not a product pitch). Target: 10–30 visitors.

Week 2:
- Publish tutorial #1 (leading zeros) on Dev.to + a YouTube short.
- Answer 5 relevant Stack Overflow questions with a link where the tool
  genuinely solves the asked problem.

Week 3:
- Publish tutorial #2 (CSV diff false positives).
- Submit to AlternativeTo and 2 awesome-lists via PR.
- Post in 2 freelancer/ops communities (IndieHackers, a bookkeeping forum).

Week 4:
- Publish tutorial #3 (dedupe keep-rules).
- Email 10 people who starred the repo or opened issues asking for feedback
  (not a sales pitch).
- Review analytics (if opt-in counter approved) and issue tracker.

Metrics to track (aggregate only, no PII):
- Page views, operations completed, error rate, returning visitors.
- Issue tracker: questions, bugs, feature requests, willingness-to-pay poll.

Rules: no spam, no fake reviews, no mass posting, no cold DMs. One post per
community, value-first, link only when genuinely helpful.

1. Manual QA checklist in docs/testing-report.md — all items checked.
2. Live URL responds and the tool completes a dedupe + diff end-to-end.
3. README, privacy statement, and limits visible on the landing page.
4. Issue tracker enabled; SECURITY.md present.
5. At least one tutorial published.
6. Owner authorization obtained for public publication and Pages deployment.
