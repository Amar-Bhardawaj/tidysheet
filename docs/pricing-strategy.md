# Pricing Strategy — TidySheet

**Status:** Phase Seven deliverable (per mission §7)
**Date:** 2026-10-22
**Premise:** Start with a useful free version. No payments at launch.

## 1. Free edition (v1 — complete, nothing gated)

- Full CSV/TSV cleaning (trim, collapse, empty-token normalization).
- Duplicate removal (full-row or by key/composite key, with keep rules).
- Key-based two-file diff (added/removed/changed/unchanged).
- Duplicate-key warnings.
- Cleaned file + removed-rows + change-report exports.
- 100 MB / 1,000,000-row working limit.
- No account, no signup, no ads, no telemetry.

Rationale: the free bar in this category is already high (Datablist's free CSV diff,
Diffchecker's free Excel compare, CleanMyExcel's free dedupe). Gating core features
would only push users to those free alternatives. The free edition is the product.

## 2. Potential paid edition (hypothesis only — not built)

Candidate capabilities, in priority order, only if real usage signals exist:

1. **Offline desktop build** (larger memory, works fully offline, no browser tab
   limits) — one-time price, ₹149–₹299 / $10–$20.
2. **Saved processing profiles** (reusable key/column/clean settings) — only if
   users repeatedly re-configure the same job.
3. **Styled Excel change report** (XLSX output with cell highlighting) — only if
   users ask for Excel-native reports.
4. **Batch processing of many files at once** — only if manual one-by-one use
   proves painful in feedback.

## 3. Pricing anchors from the market (verified)

- xlCompare: $99.99 one-time perpetual (desktop, professional feature depth).
- Diffchecker: Pro-gated Excel export; desktop is a 14-day trial then paid.
- Datablist: freemium with credits ($20–$50/mo tiers) — AI features gated, diff free.
- Draftable: general compare free, monetized via Draftable Legal (industry pricing).

Conclusion: a ₹149–₹299 one-time tier sits well below xlCompare and matches the
mission's "affordable for students, freelancers, small businesses" objective,
while not pretending to match xlCompare's professional depth.

## 4. Fees, taxes, operational costs (when relevant)

- Payment processing (Razorpay / Stripe / PayPro Global as Merchant of Record):
  typically 2–3% + fixed fee per transaction. At ₹149 price point, net per sale
  ~₹140–₹145.
- GST (India) applies on digital goods; if selling cross-border, VAT/GST rules
  of the buyer's country may apply (Merchant of Record handles this).
- **No recurring infrastructure cost** at the free tier (static hosting). Any paid
  tier must not introduce recurring server costs before demand is proven.

## 5. Free-tier limitations (stated openly)

- 100 MB per file, 1,000,000 rows.
- CSV/TSV only (no .xlsx in v1).
- No saved profiles, no batch, no styled Excel reports.
- No SLA / no support beyond the public issue tracker.

## 6. Validation plan before any payment functionality

1. Ship free only.
2. Add an in-app, non-blocking "Would you pay ₹149 for an offline desktop
   version? (yes / maybe / no)" prompt shown once after a successful second
   session. Record counts (no PII) via an opt-in, privacy-respecting counter.
3. If ≥ 5% of returning users answer "yes" and ≥ 50 distinct users request it
   in the issue tracker, build the paid tier.
4. Otherwise, keep the product free and improve discovery.

## 7. Explicitly not done at launch

- No payment gateway integration.
- No domain purchase.
- No account system.
- No subscription tier.
- No paywall on any existing feature.
