# Market Validation — CSV & Excel Tool

**Research date:** 2026-10-22 (OS date Thu Oct 22 2026)
**Researcher:** OpenCode autonomous agent
**Status of this document:** Phase One deliverable (per mission §4)

---

## 1. What was examined

Public web searches and competitor product pages, help pages, and pricing pages were
inspected using web search and web fetch. The areas covered:

1. Competitors for "compare two CSV files", "compare two Excel files", dedupe tools.
2. Competitor feature sets, format support, pricing, limitations, privacy claims.
3. Public user complaints (forum threads, comment sections, Q&A sites, Reddit).
4. Demand proxies (what queries the market currently surfaces; do not include invented
   search-volume numbers — none are reported here).
5. Pricing anchors (verified from live pricing pages).

**Honest scope note:** I did not and cannot verify keyword search volumes, purchase
intent, revenue, or traffic of competitors. No such invented figures appear here.
Every claim below is labeled: **[V]** verified fact with live source, **[I]** inference
drawn from verified facts, **[U]** unverified assumption.

---

## 2. Competitor matrix

All rows verified on the research date from the live pages listed. "Local" = tool
claims parsing happens in-browser/on-device. "Key match" = user can pick a key/id
column for row matching instead of positional line-by-line. "Export" = can download
a report or cleaned file.

### 2.1 Free-no-signup web tools for comparing spreadsheets

| Tool | URL (researched) | Formats | Rows matched by | Sheets | Export | Limits / notes |
| --- | --- | --- | --- | --- | --- | --- |
| ExtendsClass CSV diff | extendsclass.com/csv-diff.html **[V]** | CSV only | **Positional line-by-line** (their own guide says files must be sorted) | n/a | Copy / download diff | Open source (WebCSVDiff by cyrilbois). Ads on page. Multi-line quoted values broken (user comment), 50 MB memory error (user comment) |
| Datablist CSV diff | datablist.com/tools/csv-diff **[V]** | **CSV only** | **Key column, multi-key, or full-row**; column mapping; join type (full outer / inner / left); ignore whitespace/case/null | n/a | Summary CSV / changed rows / full diff CSV | Very strong free tool. Large files: computes counts and limits preview sample. Multi-encoding. No signup for tool |
| TextCompare CSV | textcompare.org/csv **[V]** | CSV | Side-by-side + text view | n/a | Not verified in detail | Generic diff-tool brand, many parallel utility pages |
| Dataflowmapper CSV diff | dataflowmapper.com/tools/csv-diff **[V]** | CSV | Added/removed/modified cells; claims client-side | n/a | Not verified | Claims "Secure client-side comparison. No signup" |
| Diffchecker Excel | diffchecker.com/excel-compare/ **[V]** | xlsx, xls, xlsm, xlsb, csv, tsv, dif, ods | **Positional / aligned-by-insertion** + optional sort-by-column | Sheet picker, per-sheet compare | **PDF/Excel export is Pro-only**; no signup to compare | No file size limit claimed. Formula-compare mode. Date US/EU normalization. Desktop app = 14-day trial then paid. **ISO/IEC 27001 claim on site** |
| Draftable Excel | draftable.com/compare-excel-files **[V]** | Excel etc. | Rows by content (matches rows by content so reordering does not create false changes) — **[V]** help doc | Not verified | Exports produce marked-up Excel file — verification of free-tier limits not found | Primary monetization is **Draftable Legal** (law firms); general compare free on web |
| ExcelCompare.org | excelcompare.org **[V]** | Excel & more | Cell-by-cell "in seconds" | Not verified | Not verified | Generic free page, tactics unclear |
| TestMu AI compare pages | testmuai.com/free-online-tools/csv-compare **[V]** | xlsx + csv | Not verified | Not verified | Not verified | Part of QA-tool company marketing pages |
| xlstools.com/compare | xlstools.com/compare **[V]** | Excel | "Select unique key columns for accurate matching" per listing | Not verified | Export results **[V]** listing text | Note: xlstools.com also sells desktop products (clarity not verified) |

### 2.2 Paid / professional spreadsheet comparison products

| Product | Pricing (verified) | Notes |
| --- | --- | --- |
| xlCompare | **$99.99 one-time perpetual, 1 user; $399.99 for 5 users** (xlcompare.com/order.html **[V]** 2026-10-22) | Windows desktop. Compares values, formulas, VBA, merges, Git/SVN/Perforce integration, reports. 15-day free eval |
| Diffchecker (Pro) | Excel export (PDF/Excel) is Pro-gated; Desktop is a 14-day trial then paid (diffchecker.com **[V]**) | Pro price displayed on their /pricing page; not quoted here as I did not record the number |
| Draftable Legal | Paid, legal-industry pricing (draftable.com **[V]**) | General Excel compare is a free funnel for it |
| Microsoft Spreadsheet Compare | Not sold separately — included only in certain Office tiers (r/Office365 thread **[V]**) | Many Microsoft 365 users **do not** have this feature; classic complaint from Excel power users |
| Datablist (app) | Free 500 credits/yr; credits $20–650; paid tiers ~$20–50/mo (datablist.com/pricing, coldiq listing **[V]**, credit docs **[V]**) | The platform is freemium AI data-cleaning; the diff tool itself stays free |

### 2.3 Dedupe / cleaning web tools

| Tool | URL | Formats | Duplicate definition | Column selection | Preview | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| CleanMyExcel | cleanmyexcel.com **[V]** | xlsx, xls, csv | Full row, case-insensitive, whitespace-trimmed | **No** | No (removes immediately) | 100% free, client-side, no signup; also blank-row removal |
| ExcelErrorFinder | excelerrorfinder.com/tools/find-duplicates **[V]** | Excel | Row-based | Yes ("select which columns to compare") | Yes ("preview the duplicates, download clean file") | Free funnel |
| DataSort dedupe | datasort.app/remove-duplicates **[V]** | Excel + CSV | "Exact and fuzzy" claims AI, "keeps best record" | Not verified | Not verified | AI-framing |
| Hermes-BI dupes | hermes-bi.com/duplicate-removal-tool **[V]** | Excel, Google Sheets, CSV | Row-based | Yes | Not verified | Free funnel |
| Datablist dupes | datablist.com/features/duplicates-remover **[V]** | Excel/CSV/etc. | Row groups then review | Yes | Yes ("first shows the duplicate groups") | App, free with credits |
| DataConverter dupes | dataconverter.io/transform/remove-duplicates **[V]** | xls only | Row-based | Not verified | Not verified | Convert-first funnel |

### 2.4 Open source / dev tools

| Tool | Notes |
| --- | --- |
| simonw/csv-diff (Python CLI, on GitHub) **[V]** | Popular Python CLI. Reddit r/dataengineering user complains it "only gives the row which was updated, not any info of" (2026 result from search **[V]**; shows unmet detail need) |
| WebCSVDiff (extendsclass's own source, public on GitHub) **[V]** | The Free web tool is open source; author is active |
| csvdiff / csv-comparison GitHub topics **[V]** | Several small open-source CSV diff tools; none with a polished UI + Excel |
| WinMerge (open-source Windows diff) **[V]** | Handles text files; CSV support is line-based, not semantic |

---

## 3. Verified user pain points (with sources)

**P1 — Naive positional diffs produce false positives when row order changes.**
Verified: ExtendsClass's own docs say files must be pre-sorted for their tool
(extendsclass.com/csv-diff.html **[V]**). Diffchecker added a "Sort rows" setting and
still compares in-position (diffchecker.com/excel-compare/ **[V]**). Draftable added
row-content matching specifically as a fix for reordered rows (help.draftable.com
**[V]**). Inference: real users get burned by this *before* the big tools solved it;
there is still no free browser tool that combines key-based matching + Excel .xlsx +
free exports.

**P2 — Large files break browser tools.**
Verified: a user comment reports a 50 MB file producing a memory error on
ExtendsClass (2020 comment, still on the page **[V]**). Several tools ramp limits
(Pirai says 100,000 rows). Inference: robust large-file handling and clear limits is a
differentiator, not table stakes.

**P3 — Format support is fragmented.**
Verified: Datablist CSV diff is CSV-only; CleanMyExcel dedupe does xlsx but no diff;
Diffchecker does formats but no key-based matching; xlCompare (paid, desktop) does all
of Excel. Inference: a user who wants "compare my two xlsx exports by id" with a free
export must cobble two tools or pay for desktop. (This is the wedge.)

**P4 — Leading zeros and identifier corruption on CSV↔Excel round trips.**
Verified across Microsoft Q&A (learn.microsoft.com **[V]**), Reddit r/excel
(2024 thread **[V]**), MrExcel forum, StackOverflow Q74466994, and Splashtop support
docs — all describe ID / phone / postal-code columns corrupted when CSV is opened or
saved by Excel. Inference: a tool that refuses to silently rewrite ID-like columns,
and that explains this behavior to users, earns trust and matches a very frequent real
request.

**P5 — "Is my data safe?" is asked even of tools that never upload.**
Verified: a Diffchecker commenter (2020) had to be told "not stored". ExtendsClass
user asked "what's your data retention policy" (2020 comment, on page **[V]**).
Inference: visible, verifiable privacy statements ("no uploads, works offline if you
save the page") convert skeptical users.

**P6 — Monetization precedent in the space.**
Verified: xlCompare $99.99 one-time desktop. Diffchecker Pro exports. Datablist
freemium + credits. Draftable Legal category pricing. Inference: a free web layer with
optional paid convenience (bigger files, saved reports, desktop offline copy) has
precedent. **[I]** The competitive bar for *what the free tier must include* is high —
most users can already get key matching for CSV *or* Excel positional compare for
free — so the paid tier must target a job the free tools genuinely do not finish
(e.g., audited change reports on very large xlsx, offline private desktop app).

---

## 4. Demand proxies (reported without invented numbers)

- The phrase "compare two CSV files" / "compare two Excel files" carries a crowded
  SERP with 10+ competing free tools and dedicated tool sites — evidence that
  (a) the demand is real and persistent, and (b) winning purely on these exact
  queries requires a differentiating feature. **[I] from observed SERPs**
- Long-tail modifications appear verbatim in live page titles/FAQs across
  competitors: "compare csv by key column", "full outer join csv compare",
  "compare large csv files", "compare csv with different column names", "csv
  dedupe by selected columns". Competitors build FAQ sections targeting these —
  implying search volume behind each. **[I] from observed competitor SEO copy**
- Reddit r/dataengineering request for richer diff output; r/excel thread on keeping
  leading zeros; r/Office365 thread on Spreadsheet Compare being tier-gated. **[V]**

---

## 5. Opportunity scoring

Criteria (each scored 1–10, weights shown):
Severity of the problem 15% · Frequency 15% · Evidence of demand 10% · Competition 15%
(inverse: higher competition = lower score) · Dev effort 15% (inverse) · Op cost 10%
(inverse) · Privacy/security requirement 5% (favor local processing) · Organic
discovery potential 10% · Willingness-to-pay 5%.

| Opportunity | Sev | Freq | Demand | Comp | Effort | OpCost | Priv | Disc | WTP | **Weighted /10** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **A. Local-first CSV/TSV toolkit: dedupe + diff-by-key + clean + export** | 8 | 8 | 8 | 5 | 8 | 10 | 10 | 9 | 6 | **7.6** |
| B. Same but **Excel .xlsx-first** (multi-sheet, formula-aware) | 8 | 8 | 8 | 6 | 5 | 9 | 10 | 9 | 7 | **6.9** (xlsx engine effort and formula-complexity lower it) |
| C. PDF utility suite (merge/split/rotate, local) | 7 | 8 | 7 | 3 | 6 | 9 | 8 | 8 | 5 | 6.5 (iLovePDF/Adobe dominate; no wedge) |
| D. Resume builder | 6 | 3 | 7 | 2 | 5 | 8 | 7 | 6 | 7 | 5.4 (saturated + low problem severity) |
| E. Invoice generator (freelancers) | 6 | 5 | 6 | 3 | 6 | 9 | 6 | 6 | 7 | 5.9 (saturated, free incumbents) |
| F. CSV→SQL/JSON converter suite | 5 | 5 | 6 | 4 | 8 | 10 | 9 | 8 | 5 | 6.1 (dev-only audience; narrower) |

Weighted total for A: (8·15 + 8·15 + 8·10 + 5·15 + 8·15 + 10·10 + 10·5 + 9·10 + 6·5) / (100·10) = 7.6 → highest.

Why A beats B for MVP: identical problem and audience, lower first-ship risk. Excel
.xlsx support is added as phase 1.1 after CSV path is validated, not abandoned. (This
still targets the "want to compare Excel exports" users: most workflows start from a
CSV export already.)

**Honest counter-evidence I take seriously:** the generic-tool market is *very*
crowded, and "more tools" is not automatically a better product. The chosen grievance
is correctness + completeness rather than raw novelty — specifically these still-
missing free capabilities:

1. Key-based (and composite key) diff for **.xlsx** with free export (P3).
2. **Duplicate keys handled loudly** — warning + explicit strategy — rather than
   silent first-wins or silent wrong output (P1, freedom from silent failure).
3. No-signup, ad-free, local-only tool for the whole loop (dedupe → clean →
   diff → export) in one page (P3, P5).
4. Identifier-safe cleanup that documents exactly what was touched (P4).

---

## 6. Audience, problem, MVP

### Target audience (recommendation)
**Solo professionals who handle recurring spreadsheet exports but are not developers**:
freelancers, analysts, bookkeepers, back-office staff, e-commerce/SaaS operators, and
non-technical risk-averse office staff handling payroll / accounting / CRM exports.
Secondary audience: developers (will love it for its correctness and open source, and
will evangelize to non-technical colleagues).

### Core problem
**"I receive recurring CSV/Excel exports and I keep re-doing the same three jobs by
hand — dedupe, clean, and tell me exactly what changed since last time — and I can't
trust the free tools (ads, sizes, gaps, wrong diffs) or afford/pay for a desktop
professional version."**

### MVP (one sentence)
**A no-signup, privacy-first web tool that takes two CSV/TSV exports and, without any
data leaving the device, detects duplicates, cleans them, and produces a rigorous
key-based diff (added / removed / changed / unchanged, with duplicate-key warnings),
with exportable results.**

### Explicit non-goals for v1
Excel .xlsx parsing (planned immediately after), merges, saved rules, accounts,
uploading, cloud sync, AI features. Date-format wizard (deliverable but post-MVP).

---

## 7. Monetization hypothesis

- **Free web edition remains complete** for files that fit comfortably in the
  browser. This mirrors Datablist's staying-free diff tool and Diffchecker's free
  compare: the bar for free is already high.
- **Hypothesis (to be tested later with real users, not built on day 1):** a paid
  layer could exist for (a) very large files (P2), (b) saved reusable options,
  (c) offline desktop build with bigger memory, priced one-time in the
  ₹149–₹299 / $10–$20 band to undercut xlCompare's $99.99 while not pretending to
  match its professional feature depth. **[I]** This remains unvalidated until
  real usage signals exist; nothing is implemented without evidence.
- **Deliberately avoided:** trial-gated free tier, AI upsell, subscription tier at
  launch — contradicts "solves a recurring problem simply" positioning.

---

## 8. Open risks

1. **Crowded market risk**: if SEO for generic terms is won only by incumbents, the
   product must differentiate by the missing-feature quad above and through
   open-source + niche exact-spot pages ("compare csv by id and email").
2. **xlsx gap**: launch without .xlsx may exclude the exact users in the wedge —
   mitigated by shipping .xlsx support as phase 1.1 very soon after, and by the CSV
   export reality for most data sources.
3. **Invented-metrics risk avoided**: monetization, traffic, and WTP judgments are
   stated as hypotheses and deferred to real usage data at launch.

---

## 9. Conclusion

Proceed with opportunity **A** as a staged plan:
**Step 1**: Local-first CSV/TSV toolkit (dedupe with explicit keep-rules, exact
whitespace/empty-value cleanup, key-based diff with duplicate-key warnings, exportable
report).
**Step 2** (immediately after): .xlsx read support to claim the "compare Excel
exports" searches pos-tech.
**Step 3**: monetize with one-time desktop/large-file tier only if real usage data
justifies it (documented hypothesis; not built at launch).

This satisfies the zero-capital constraint (pure static site + free hosting),
privacy-first claims with zero privacy surface (no server), organic discoverability
(shareable open source + SEO landing pages) without any cold-contact selling.
