# 90-Day Roadmap — TidySheet

**Status:** Phase Ten deliverable (per mission §10)
**Date:** 2026-10-22
**Premise:** Small, reliable first version; revenue targets are hypotheses, not
guarantees. No baseline metrics exist yet — first real measurement is recorded
once the tool is live.

## Month 1 — Validate and build (done in this session)

- [x] Market research + competitor matrix (`docs/market-validation.md`).
- [x] Product spec + MVP definition (`docs/product-spec.md`).
- [x] Architecture (`docs/architecture.md`).
- [x] MVP implemented (CSV/TSV dedupe, clean, diff-by-key, exports).
- [x] Automated tests: 53 passing; type check clean; production build succeeds.
- [x] UX pass: single page, no signup, privacy statement, limits stated.
- [x] Pricing hypothesis (`docs/pricing-strategy.md`).
- [x] Launch + distribution + deployment docs.
- [ ] Manual QA checklist (docs/testing-report.md) — execute on real browsers.
- [ ] Owner authorization for public repo + Pages.

**Milestone M1:** "Local release usable" — a developer can clone, run, test, and
build the tool with zero external services. **Status: achieved.**

## Month 2 — Release and learn

Week 5:
- Obtain owner authorization; publish repo + enable Pages.
- Run manual QA checklist; fix any blocking defects.
- Publish first tutorial (leading-zeros article + 60 s video).

Week 6:
- Submit to AlternativeTo and 2–3 awesome-lists via PR.
- Publish second tutorial (CSV diff false positives).
- Respond to first issues; triage.

Week 7:
- Publish third tutorial (dedupe keep-rules).
- Add OpenGraph/Twitter card meta tags.
- Add opt-in aggregate counter (privacy-respecting) if owner approves.

Week 8:
- Publish fourth tutorial (CRM export diff walkthrough).
- Review first real usage signals: activation rate, which mode is used most.
- Fix top 3 usability issues reported.

**Targets (hypotheses, not guarantees):**
- 1 public release live at a stable URL.
- ≥ 1 tutorial published per week (4 total).
- Activation rate (first-time visitor completes one operation): ≥ 30%.
- Zero critical defects open at end of month.

## Month 3 — Improve and monetize

Week 9:
- Ship v1.1: Excel (.xlsx) read support (SheetJS CE) — claims the "compare
  Excel exports" searches.
- Composite-key multi-select in the UI.

Week 10:
- Publish fifth tutorial (clean messy export).
- Run the in-app willingness-to-pay poll (once, after second successful session).
- Review poll + issue-tracker signals.

Week 11:
- If signals support it: build the offline desktop bundle and a one-time
  ₹149–₹299 paid tier (owner authorization required for payment gateway).
- Otherwise: keep free; invest in discovery (more tutorials, directory listings).

Week 12:
- Retrospective: which features are actually used; which problems remain.
- Decide v2 scope from evidence, not from excitement.
- Update roadmap for the next quarter.

**Targets (hypotheses):**
- v1.1 with .xlsx support shipped.
- ≥ 100 distinct returning visitors (aggregate, if counter approved).
- ≥ 10 issue-tracker interactions (questions/feedback/bugs).
- Monetization decision made on evidence: either a paid tier introduced or
  explicitly deferred with documented reasoning.

## Measurable targets summary

| Milestone | Metric | Target |
| --- | --- | --- |
| M1 (end month 1) | Local release usable | Achieved |
| M2 (end month 2) | Public release live | 1 URL |
| M2 | Tutorials published | 4 |
| M2 | Activation rate | ≥ 30% |
| M2 | Critical defects open | 0 |
| M3 | .xlsx support | shipped |
| M3 | Returning visitors (agg.) | ≥ 100 |
| M3 | Issue-tracker interactions | ≥ 10 |
| M3 | Monetization decision | documented |

Revenue targets are deliberately not stated as commitments. Any revenue figure
would be an invention; the only honest claim is that a paid tier is a
hypothesis to be tested against real willingness-to-pay signals.
