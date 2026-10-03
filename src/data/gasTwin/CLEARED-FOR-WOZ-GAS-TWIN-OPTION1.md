# CLEARED-FOR-WOZ: Compare with gas twin, Option 1 (thin strip + Full comparison panel)
Date: Oct 2, 2026. Owner: Steve. Ted chose Option 1 at 2:23 PM. Branch: new draft branch off PR 6 (or a fresh branch), FleetFit DRAFT only. Host ONLY as a new subfolder `/draft-gas-twin/` on https://burnsted.github.io/fleetfit-preview/. Do NOT touch the live root (bundle index-5Wk_Egvm.js), `/draft-trade-cards/`, `/draft-fleet-list/`, `/draft-trade-packages/`, `/draft-package-total/`. No merge. Off by default. Rollback note required.
START GATE: Steve is spot-checking Sherlock's data. Do not start until Steve sends "DATA OK". Until then you may read this and plan.

## Mocks (the visual target, Option 1)
/workspace/for-ted/gas-twin-options-v4/gas_compare_opt1_*_v4.png (off, on, full_comparison desk and mobile, missing; 1440 and 390) and gas_compare_intake_off_*_v4.png. Placeholder numbers in mocks become real data.

## What it does
1. A control "Compare with gas twin" with Off | On, upper right, opposite Used | New. Same visual style as StockModeToggle (`src/components/StockModeToggle.jsx`), 4px corners. Default Off. On the fleet package pages (`PackageResults.jsx`, `TradePackageResults.jsx`, row `.trade-stock-bar`) and on the intake page where the Used | New control appears. Off state must be byte-for-byte the same layout as today (screenshot diff).
2. State: React state like `stockMode`, plus years (3, 5 or 7, default 5) and yearly miles. Not a new route needed; keep HashRouter. Prefer remembering the choice for the session only.
3. On: each vehicle card gets a thin strip directly under it (no new page, cards do not move or shrink):
   - "vs [gas twin name]" (make, model, short trim).
   - Three money figures in one row: Upfront (EV price minus gas twin price, written "$X more" or "$X less"), Per year, Over N years.
   - One small line: "Payload X lb vs Y lb, Tow X lb vs Y lb, Range X mi vs Y mi".
   - Two text links (not pills): "Why this twin" (inline expand, one short block) and "Full comparison".
   - One 3, 5, 7 years selector at the page top ("Over 5 years"), not per card.
   - One "Fleet total" strip at the end of the strips.
4. Full comparison: side panel on desktop (right third), full-screen sheet on mobile, with a Close button, focus trap and Escape to close. Contents: header (EV name and gas twin name), "Why this twin" sentence, "Other candidates considered" (secondary rows from the data, name and closeness score), then a table of factors with value and score for BOTH vehicles in neutral colors (no winner coloring), overall score for each, and the caption "Spec and price score, not a quality rating." A closed "How we scored and estimated" disclosure with formulas, sources and dates.

## Money math (all labeled Estimate, never "savings guaranteed")
- Upfront = EV base MSRP minus gas twin base MSRP, both from data (`ev_base_msrp_usd`, `gas_twin_base_msrp_usd`). If either is "not confirmed" show "not confirmed".
- Per year = yearly miles x ((gas_energy_usd_per_mi + gas maintenance per mile) minus (ev_energy_usd_per_mi + EV maintenance per mile)). Maintenance per mile: AFDC class-level $0.061 EV and $0.101 gas, shown as class-level. Needs the user's yearly miles: until entered, show "Add your yearly miles to see this." with a small number field (default empty, validated: whole number, greater than 0, no NaN). Do not invent a default mileage.
- Over N years = N x Per year minus Upfront difference (net of the upfront price gap), labeled "Over 5 years, after the upfront price difference". Show negative values as "$X more" with plain words, no red or green.
- No insurance, tires, DC fast charging, incentives, depreciation or resale in the dollars (resale appears only as a scored factor when sourced).
- Any input that is "not confirmed" makes that figure "not confirmed". Never partial sums. Footer: "Estimates use Florida energy prices, the miles per year you entered, and listed prices. Not a quote."

## Data (Sherlock, spot-checked by Steve)
Source files: /workspace/for-ted/gas_twin_pairs.csv (84 rows, one per EV variant and gas candidate, `primary_twin` = yes picks the twin; `candidate_rank` orders "Other candidates considered"), gas_twin_factors.csv (value, unit, score, source_url, source_date, status per factor), gas_twin_pairs_NOTES.md. Convert to a generated typed data module (e.g. `src/data/v2/gasTwin.ts` plus a script that regenerates it from the CSVs and fails on a missing source_url or date for any FACT row). Keep source_url and source_date with every value.
- The UI NEVER computes closeness or scores itself. It displays the data's values and scores. Scores and closeness already come from Sherlock's method: rank_metric = (0.35 x class_match + 0.65 x mean closeness) x coverage; Ted's 10-category scores out of points possible (70 or 80, like Score v2 dials). Display them as "NN out of [points possible]" using the same dial style as `scoreV2.ts`, and show NO overall total when points possible is under 60 (show "not enough confirmed data"). This replaces "out of 100" in the mocks.
- Factor rows in the panel, in this order: Payload, Towing capacity, Cargo or bed size, Cab size, Range (and towing range only if confirmed), New price, Resale value. Value column from the data; score column from the data's matching TED category or closeness field; anything unscored or unsourced reads "not confirmed" for both vehicles in that row.
- Show the data status honestly: rows with status INFERENCE get the footnote "Score is an estimate from listed specs." FACT rows link their source (a text link opening a new tab, rel noopener).
- App vehicle to data row mapping by make, model and variant; no mapping or no primary twin means the strip shows "Gas twin not confirmed" and no money figures for that card. Weak matches (match_quality weak or fair) show the plain words "Rough match" in the Why this twin block with the gap_notes sentence. Do not hide weak matches.
- R1T primary twin is the Tacoma Double Cab TRD Sport 5-ft bed 4WD (Ted decision). Do not re-pick twins in code.

## Copy rules
FleetFit naming only. No em dashes, slashes as separators, pill shapes (4px corners), the words Best, Worst, Worth it, SOH, battery health, or winner colors or arrows. "vs" is fine. Strings: control "Compare with gas twin"; Off | On; "Over 5 years"; "3 years", "5 years", "7 years"; "Why this twin"; "Full comparison"; "Other candidates considered"; "Spec and price score, not a quality rating."; "How we scored and estimated"; "Add your yearly miles to see this."; "Gas twin not confirmed"; "not confirmed". Isaacson's barred copy file, if present, wins on wording of the disclosure.

## Acceptance (Steve's Cursor real-browser check will test these at 1440, 1024, 390)
1. Off: pages identical to today (same layout and heights), control present upper right opposite Used | New on intake and package pages.
2. On: strips under every card, nothing shrinks or crowds, 390 no horizontal scroll, years selector changes Over N years.
3. Yearly miles blank gives "Add your yearly miles to see this." and no NaN; negative, zero and text rejected.
4. Full comparison opens as panel (desktop) or sheet (mobile), Escape and Close work, focus returns, both vehicles shown on the same factors with scores from data, "not confirmed" in a row shows for both.
5. Missing mapping gives "Gas twin not confirmed". Weak matches say "Rough match".
6. No banned words, slashes, pills, em dashes, console errors; v13 wraps, trade-in entry and other drafts untouched.
7. Tests: unit tests for the money math (including not confirmed propagation and years), data generator failing on missing source, no-total under 60 points, mapping. `npm test` and the existing named test scripts must pass.
8. Report back: bundle, commit, gh-pages before and after, rollback, screenshots (off and on, panel, missing; 1440 and 390).

## Not in this build
Real incentives, insurance, used gas medians, towing range numbers, anything outside Sherlock's sourced files. Outreach and live publish stay on hold.
