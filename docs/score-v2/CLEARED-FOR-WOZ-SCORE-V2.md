# CLEARED-FOR-WOZ — Replacement Score v2 (Current | Candidate, 10 x 10) · Steve Jobs · G-final 2026-09-27

**Ted:** ~8:18 AM ET + ~8:32 AM ET (numeric-only lock) via Jarvis: `ROLE-FIT-MIDSIZE-REDLINE-2026-09-27.md`
**Rubric draft:** `SCORE-V2-RUBRIC-DRAFT-2026-09-27.md` (~8:50 AM ET). This file supersedes it.
**Sources:** Sherlock `SOURCES-V2-2026-09-27.md` + `data-v2/*.csv`. A (R1T), B (preview EVs), C (gas baselines), D (FL prices) and F (gap fill) are all merged. Also `RIVIAN-COMMERCIAL-WARRANTY-2026-09-27.md` + `data-v2/rivian_warranty_compare.csv`.
**G-final inputs (2026-09-27):** Sherlock `g_gaps.csv` + `G-GAPS-NOTE-2026-09-27.md`; `USED-EV-COMMERCIAL-WARRANTY-CROSSCHECK-2026-09-27.md` + `used_ev_commercial_warranty.csv`; `RIVIAN-PRIMARY-BUSINESS-USE-PARAMETERS-2026-09-27.md`; Woz polish `WOZ-POLISH-FOR-G-2026-09-27.md`.
**Host:** `Burnsted/fleetfit-preview` PR #1 draft · **no merge**
**Replaces:** v1 weighted model (`CLEARED-FOR-WOZ.md` weights, `REPLACEMENT-SCORE-PRODUCT-BAR.md`, the `specUnknown` cap, the v1 category list in `SCORE-CATEGORIES-DRAFT.md`).
**Keeps:** `CLEARED-FOR-WOZ-SCORE-UI.md` (dial right of price) · `CLEARED-FOR-WOZ-SCORE-DIAL-TAP.md` (tap → readout) · `oem-specs/CLEARED-FOR-WOZ-OEM-SPECS.md` ("Not published", never dashes; `src/data/oemSpecs.ts`).

All point anchors below are **INFERENCE** (Steve's thresholds) until Ted overrides them. The data values they read are FACT or INF exactly as labeled in SOURCES-V2 / g_gaps.


## Addendum 2026-09-27 (section G-final) · Steve · locked product decisions
**Where G-final conflicts with the G draft, F addendum, or older text, G-final wins.** §1, §3 cats 3/5/7/8/9/10, §6 and §7 are updated below.

**Changelog (G-final)**
1. **Service (cat 7) scores on drive miles to the nearest EV-certified / authorized dealer** (g_gaps item 1). Remove the draft-G "Ford/GM/Ram Not scored" rule.
   - Ford: Mullinax Ford, 4.1 mi, EV Certified **FACT** → **10.0**.
   - Ram: Vatland CDJR, 4.9 mi, LEV + PMCD **FACT** → **10.0**.
   - Chevrolet: Dyer, 2.6 mi; certification **INFERENCE** → one rubric step below FACT at that distance → **7.0** (FACT would be 10).
   - GMC: Linus Buick GMC, 2.5 mi; certification **INFERENCE** → **7.0**.
   - BrightDrop: no Treasure Coast BrightDrop-certified dealer confirmed; score AutoNation Chevrolet Greenacres **80.4 mi** (INFERENCE certification from new-unit sales) → **2.0**.
   - Rubric step-down ladder for INFERENCE certification: **10 → 7 → 4 → 0** (next-lower anchor Y below the FACT distance score).
2. **Energy (cat 9):** B-section vans with no EPA label use sourced third-party tests. When one model has several comparable figures, use the **less favorable** (shrink-the-lead) and cite test conditions in the reason. Do **not** derive kWh/100 from OEM range ÷ pack.
   - E-Transit: **1.4 mi/kWh** (71.4 kWh/100 mi) — EV Pulse highway 70 mph at max GVWR, ~40°F. Note the 1.2 mi/kWh stop-and-go / heater figure; do **not** use it as the Florida basis.
   - ProMaster EV: **50.1 kWh/100 mi** (Motor Illustrated, ~800 lb load).
   - BrightDrop 600: **67.1 kWh/100 mi** (Motor Illustrated, >1,700 lb load).
   - Sherlock raw EPA `combE` for Sierra EV, Silverado EV and Lightning **stands**.
3. **Transit example current vehicle (2018 Transit-250):**
   - Seats = **2** (FACT, Ford 2018 brochure) → cab scores.
   - Tow = **6,200 lb** (FACT, 2018 towing guide; LWB High Roof).
   - Maintenance = **$0.31/mi** (INFERENCE, low end of Argonne year-8 range). Same-basis rule still applies: if the candidate has no figure on that van/Argonne basis, the row is Not scored for both.
   - Resale = KBB **−50%** over the last 3 years (FACT dollars; retained % INFERENCE arithmetic). Score both columns on **value lost over the next 3 years of ownership** (Transit uses the KBB last-3-yr change as that figure). If a candidate has no figure on that same 3-yr value-lost / retained basis → Not scored for both.
4. **F-150 example tow** = **10,700 lb** (typical SuperCrew 4x4 config, FACT config / INFERENCE "typical"), not the 13,200 lb max.
5. **ProMaster EV recalls:** count only EV-confirmed **24V715** and **25V665**. Do **not** count 25V330 (UNKNOWN EV inclusion), 25V720, or 24V416.
6. **Confirmed from draft G:** capacity-floor modifier **−2 of 20** when the battery warranty has no capacity floor or only an inferred one; Score incomplete threshold = **2/3 of job-applicable points**; tongue weight defaults to **15%** of trailer; Hummer Edition 1 falls under the 6-month transfer rule; Tesla Pre-Owned add-on is noted but **never scores**.
7. **Rivian consumer R1T in work use:** reason reads **`At risk, not counted`** (never "void"); scores **0 of 20**. `warranty_type` = `commercial` | `consumer` | `unconfirmed`. Unconfirmed shows `Commercial warranty status not confirmed` and scores as consumer. The field only matters where fleet use changes coverage: Rivian R1T, Tesla Pre-Owned add-on (note only), Hummer Edition 1 early transfer, and VW MY2025 EVs whose battery warranty excludes commercial use.
8. **Woz polish (fold-in):**
   - `Not scored…` and `Not used by this job` appear **once**, as the cell value. A reason line only if it adds information beyond that string.
   - Below the incomplete threshold: show **`Score incomplete: key data missing`** with **no total and no difference** (§1.6 wins over any card-always-shows-NN.N/PP fix).
   - Example current card chip: **Payload 3,571 lb** (matches the readout; never "Payload Not published" when the readout has 3,571).
   - Transit range reason: `13.6 mpg x 25 gal = 340 mi x 0.7 = 238 mi usable (mpg estimate)`.
   - Dial text readable and not clipped at mobile width.
9. **Numbers only.** No Best, Worst, SOH, battery health, Worth it, or opinion labels. Never invent a value; anything unsourced is Not scored.

## Addendum 2026-09-27 (section G draft) · Steve · ~10:05 AM ET
**Ted lock:** ~9:46 AM ET via Jarvis. **Inputs:** Sherlock `USED-EV-COMMERCIAL-WARRANTY-CROSSCHECK-2026-09-27.md` + `data-v2/used_ev_commercial_warranty.csv`. Pre-G copy: `notes/CLEARED-FOR-WOZ-SCORE-V2.pre-G.bak.md`. **Superseded in part by G-final** (service Not-scored rule removed; energy third-party tests; Transit seats/resale/maint; ProMaster recall filter; warranty_type scope; polish).

**Changelog (G draft, still in force except where G-final overrides)**
1. **Warranty (cat 8) is worth 20 points** (double weight). The other 9 categories stay at 10. Max possible = **110**. With tow `Not used by this job` = **100**. Dial format unchanged: `NN.N / PP`.
2. **Score incomplete threshold = 2/3 of job-applicable points.** Job-applicable = max possible minus the `Not used by this job` rows (**66.7** with tow not used).
3. **One warranty formula for every model:** Points = 20 x min(years left ÷ term years, miles left ÷ term miles). Rivian consumer in work use = **0 of 20**, reason `At risk, not counted`. Rivian commercial: min(8 yr − age, 100k − odometer) scaled to 20, **−6** for an upfit not done by a Rivian Preferred Upfit Partner.
4. **Listing field `warranty_type` = `commercial` | `consumer` | `unconfirmed`** (see G-final item 7 for where it matters).
5. **No R1T override.** When the job tows, tongue weight is added to the payload load (§3 cat 2).
6. **Section B corrections:** ProMaster EV floor = **NONE**; BrightDrop 5 yr/60k powertrain **dropped**; Sierra/HUMMER/BrightDrop 75% floor = **INFERENCE** (−2 on candidates); GM fleet 5/100k powertrain **does not apply to EVs**.

## Addendum 2026-09-27 (section F) · Steve · ~9:25 AM ET
**Ted:** ~9:17 AM ET follow-up. **Inputs:** SOURCES-V2 §F + F CSVs; Rivian commercial compare. Pre-F copy: `notes/CLEARED-FOR-WOZ-SCORE-V2.pre-F.bak.md`.

**Changelog (F; warranty parts superseded by G / G-final)**
1. **Cat 2 payload** reads `f_baseline_payload.csv` (listing → low end of per-trim range → OEM range min; OEM max-only never scored).
2. **Cat 3 seats** read `f_seat_counts.csv` (+ G-final: 2018 Transit cargo van = 2 FACT).
3. **Cat 7 service** reads `f_service_distance.csv` (+ G-final EV-certified rows from `g_gaps.csv`).
4. **Cat 8 warranty** superseded by G / G-final (20 points; `warranty_type` enum).
5. **§6 / §7** superseded by G-final re-run below.

---

## Quote Ted pick
- The score is relative to the vehicle being replaced, not to the whole market.
- Numbers only. No better/equal/worse, good/bad, or any other opinion words.
- The current (replaced) vehicle runs through the same categories for the same job. Show both numbers side by side per category and in the total. The point difference is the comparison.
- Only score capability the replaced vehicle actually uses. Never deduct for unneeded capability. Surplus capability is never a penalty. Oversizing is not rewarded.
- Keep: soft taper, no hard rejects, no Best/Worst, score + order only, tap readout with a sourced reason for every number.

## Exact ship

### 1. Shape (locked)
1. **10 categories, 1 decimal.** Nine categories are 0–10. **Cat 8 warranty is 0–20** (G). Max possible = **110**; with tow not used = 100. Round each category to 1 decimal first, then sum the rounded values.
2. **Current vehicle is scored on the same rubric** with the same job inputs. The current vehicle comes from intake Trade-in (year / make / model / engine / drivetrain / miles), or from the vehicle the package states it is replacing. If there is no current vehicle, the readout shows **"Score incomplete: current vehicle not entered"** and no totals. Never default to a typical truck.
3. **Readout (dial tap)** is a table with three columns: **Category | Current | Candidate**. Each **scored** number carries a one-line sourced reason and a source link (see §4 templates). Below the table: a totals row (`NN.N / PP` for each column) and **Difference** as a signed number, candidate minus current — **unless** incomplete (§1.6).
4. **Card dial** (right of price, unchanged position): shows the candidate total as `NN.N / PP` (PP up to 110), with arc fill = total ÷ points possible, **only when a total is displayed**. Directly under the dial, one small line: the signed difference plus the words `vs current` (e.g. `+2.1 vs current`). No other words on the dial. Dial numerals and the `vs current` line must stay fully readable at mobile card width (not clipped by the photo).
5. **Rank:** candidates are ordered by candidate total. When candidates in the same package have different points possible, order by candidate total ÷ points possible (used for ordering only, never displayed). Ties go to the lower price, then the lower miles. Order is the only ranking signal: no ordinal badges with words, no Best/Worst.
6. **Status strings.** Exact text, used for BOTH columns of that row:
   - `Not used by this job`: the job does not use this capability (e.g. Tow when the current vehicle doesn't tow). The row drops out of both totals. **Show once as the cell value**; do not repeat the same string as a reason line unless the reason adds information.
   - `Not scored: <field> not published` (or `Not scored: <field> not entered` for a missing intake field): the input is missing for **either** vehicle. The row drops out of both totals, so both columns always share the same points possible. **Show once as the cell value**; reason line only if it adds information beyond that string.
   - `Score incomplete: key data missing`: **replaces both totals and the difference** when scored points possible < **2/3 of job-applicable points** (job-applicable = 110 minus `Not used by this job` rows; **66.7** when tow is not used). Category rows still render. **No total and no difference** (§1.6 wins over any alternate that keeps `NN.N / PP` on cards when incomplete).
   - `At risk, not counted`: warranty only (§3 cat 8, `warranty_type = consumer` R1T in work use). The row stays in the totals and scores 0 of 20. Never say "void".
   - `Commercial warranty status not confirmed`: warranty only (`warranty_type = unconfirmed` where it matters). Scores as consumer / the lower case.
7. **No hard rejects.** HF-3 (salvage / title / warranty-void on listing or title FACT) stays a severe flag exactly as today. The commercial-use warranty rule (cat 8) is a scoring rule, not HF-3.
8. **Soft taper:** every anchor is linear between points (except the two step rules in cats 3 and 4). No cliffs, nothing hidden, sidegrades stay visible and rank by total. The v1 Life Delta category is retired in v2. Wear is now carried by cat 8 (warranty miles left) and cat 6. The "Similar miles" soft label on cards stays and does not affect the score.
9. **Unknown display:** any spec value that is null renders **"Not published"**, never `—`, on cards, stat tiles, facts and inside readout reasons. Example current card chip for the 2018 Transit-250 package: **Payload 3,571 lb** (lowest per-trim), matching the readout.
10. **Out:** Best / Worst / Best fit / Worst fit · Worth it · SOH or any battery-health copy/pill · FACT pills · better/worse/good/bad/strong/weak/great/poor · invented values · merge without Ted · VND public voice.

### 2. Job inputs (from intake; the role preset may prefill)
| Input | Field (new or existing in intake state) | Used by | Missing → |
|---|---|---|---|
| Daily miles | `job.dailyMiles` | cat 1 | `Not scored: daily miles not entered` |
| Load (top of payload bracket, lb) | `job.loadLb` | cat 2 | `Not scored: load not entered` |
| Cargo volume need (vans, cu ft) | `job.cargoCuFt` (optional) | cat 2 (vans) | payload ratio only |
| Crew size (people riding) | `job.crew` | cat 3 | `Not scored: crew not entered` |
| Current vehicle tows? + trailer weight (lb) + WDH used? | `job.tows`, `job.trailerLb`, `job.wdh` | cat 4 | tows = no → `Not used by this job` |
| Shop / home-base city | `job.shopCity` (Vero Beach / Fort Pierce / West Palm Beach today) | cat 7 | `Not scored: shop location not entered` |
| Current vehicle odometer | `current.miles` | cat 8 | `Not scored: current miles not entered` |

**Role preset "Supervisor / team lead":** crew 2, tows = no, trailer only if the user states a drop-trailer weight. Daily miles and load still come from intake; the preset never invents them.

**Current-vehicle config ambiguity.** If intake does not give engine/drivetrain and several SOURCES-V2 rows match year/make/model, use the matching row that **shrinks the candidate's lead** (e.g. the highest EPA mpg). The reason line says so: "engine not entered; highest published mpg for 2018 F-150 used".

### 3. Categories, anchors (INFERENCE) and data fields
`lin()` = linear interpolation between the listed anchors, clamped at the ends. Each category caps at 10 (warranty at 20) and floors at 0.

**Global conflict rule (Steve decision; the draft was silent).** When two sourced values conflict for the same field, use the value that **shrinks the candidate's lead**: the lower/less favorable value for the candidate, the higher/more favorable value for the current vehicle. The reason line shows both values and both sources. Example: R1T 3-yr retained uses Black Book **46.3%**, reason shows "iSeeCars 66.0% (model-level) · Black Book 46.3% (36-mo residual, % MSRP); lower used".

---

**Cat 1 — Range fit (daily route)**
- Usable range = published range x **0.7** (heat / load / AC buffer; the same factor for EV and gas). Ratio = usable range ÷ `job.dailyMiles`.
- Anchors: ratio ≤0.6 → 0 · 0.8 → 4 · 1.0 → 7 · ≥1.5 → 10.
- EV range field: `epaRangeMi` (a_r1t_specs.csv `epa_range_mi`; b_preview_ev_specs.csv `range_mi` + `range_basis`). If there is no EPA rating (E-Transit, ProMaster EV, BrightDrop, 2024 Cybertruck, Hummer 3X), use the OEM estimate from `range_basis` and label it "OEM estimate, not EPA" in the reason.
- Gas range = `epaCombMpg` x `fuelTankGal` (c_baseline_specs.csv `comb_mpg` + c_baseline_fuel_tank.csv `fuel_tank_gal`; use the cars.com default-trim tank unless intake states the tank).
- Gas vans (Transit 250/350, ProMaster 2500) have no EPA mpg: use the labeled Fuelly INF value per cat 9. Transit-350 has no Fuelly value → `Not scored: mpg not published (van >8,500 GVWR)`.
- Reason template (Transit gas van): `13.6 mpg x 25 gal = 340 mi x 0.7 = 238 mi usable (mpg estimate)` · (EV) `314 mi EPA x 0.7 = 220 mi usable vs 120 mi/day (ratio 1.83)` + EPA link.

**Cat 2 — Payload / cargo fit**
- Ratio = payload used ÷ `job.loadLb`. Anchors: ≤0.8 → 0 · 0.9 → 4 · 1.0 → 7 · ≥1.25 → 10.
- **Payload used (Ted lock, 2026-09-27 addendum). Same order for both columns:**
  1. The listing's stated trim/VIN payload (door-jamb or window-sticker value), when the listing has one. Label: "listing".
  2. Otherwise the **low end** of the matching `config_trim_range` / `oem_config` rows in `f_baseline_payload.csv` for year + make + model + engine + drive (+ cab when entered). Label: `lowest per-trim value for <config> (cars.com, base-equipped trim)` or `(OEM catalog)`.
  3. Otherwise the `oem_engine_range` minimum. `proxy` rows are used only with the INFERENCE label in the reason.
  4. An **`oem_engine_max`-only** row is a best-case ceiling (e.g. F-150 3.5EB 3,230 lb: HD Payload Pkg build) and is **never** scored. With nothing else available → `Not scored: payload for this config not published`.
  - Candidate EVs use the same order against `payloadLb` (a_r1t_specs.csv, b_preview_ev_specs.csv, oemSpecs.ts). "Up to" and "as low as" values (Lightning) take the low figure.
  - Conflicts flagged in F.1 use the OEM value (Colorado 2020 1,578; Silverado 2019–20 OEM range; Tacoma 2017 1,620 not used).
- **Towing jobs (G):** load = `job.loadLb` + tongue weight (`job.tongueLb`; if not entered, **15%** of `job.trailerLb`, INFERENCE, the top of Ted's 10–15% range). The same load applies to both columns. No vehicle-specific exemption.
- Vans with `job.cargoCuFt`: a cu ft ratio with the same anchors, and the score = min(payload score, volume score). Cu ft not published → payload ratio only, and the reason says "cargo volume Not published".
- Remaining gaps (from F.6): Transit-250 2016 and Transit 250/350 2020 3.7L (not offered) → `Not scored`. ProMaster 2500 2016–17 uses a diesel-trim proxy → INFERENCE label.
- Reason template: `1,485 lb (lowest per-trim value, 2018 F-150 3.5EB 4x4, cab not entered; cars.com base-equipped trim) vs 1,000 lb load (ratio 1.49)` + link.
- **Example current (2018 Transit-250):** payload **3,571 lb** (lowest per-trim). Card chip and readout must match.

**Cat 3 — Cab / crew fit** (step rule)
- Seats ≥ `job.crew` → 10 · one seat short → 4 · two or more short → 0. Surplus seats are neutral.
- Field: `seats`, read from `f_seat_counts.csv` (baselines by cab; EV rows; R1T 5) and g_gaps.
  - The listing or VIN seat count wins when stated.
  - Cab not entered → use the **lowest** seat count across the model's cabs for that MY (e.g. F-150: Regular 3 / SuperCab 5 / SuperCrew 5 → 3).
  - A seat range within a cab (Silverado Crew 5–6) → use the low value.
- **Gas cargo vans:**
  - **2018 Transit-250 cargo van = 2 seats (FACT,** Ford 2018 brochure "Seating 2-passenger"). Scores.
  - Other MY/config without listing/VIN or brochure seats → `Not scored: seating not published for this van`. The cars.com multi-seat wagon counts are not used.
- **EV vans:**
  - BrightDrop 600 = 2 (INFERENCE from the FACT equipment list: driver + passenger jump seat).
  - ProMaster EV = 2 (INFERENCE: spec-sheet jump seat).
  - E-Transit: C&D/Edmunds say 2 and cars.com says 1. Global conflict rule applies: as a candidate it scores on **1** unless the listing states 2, and the reason shows both.
  - The INFERENCE label appears in the reason text.
- Reason template: `2 seats (Ford 2018 Transit brochure, FACT) vs crew 2` · `5 seats (cars.com) vs crew 2` · `3 seats (lowest across F-150 cabs; cab not entered) vs crew 2`.

**Cat 4 — Tow fit** (only if the current vehicle tows)
- `job.tows = no` → `Not used by this job` for both. Surplus tow rating is never scored.
- Ratio = rated tow for that config ÷ `job.trailerLb`. Anchors: <1.0 → 0 (step) · 1.0 → 7 · ≥1.5 → 10 (linear 1.0–1.5). Drop-trailer / occasional light tow uses the stated trailer weight, never a default heavy one.
- **WDH rule:** if a rating requires a weight-distributing hitch (R1T 11,000 lb requires WDH; 5,000 lb without, a_r1t_specs.csv `tow_lb_wdh` / `tow_lb_no_wdh`), use the no-WDH rating unless `job.wdh = yes`.
- Fields: `towLb`, `towLbNoWdh` (a_r1t_specs.csv; b_preview_ev_specs.csv `tow_lb`). **G-final sourced baselines (g_gaps item 5):**
  - 2018 F-150 3.5 EcoBoost: score **10,700 lb** (typical SuperCrew 4x4 without Max Tow), not the 13,200 lb max.
  - 2018 Transit-250 3.7 LWB High Roof: **6,200 lb** (extended-length High Roof 6,000).
  - Other gas baselines still without tow → `Not scored: current tow rating not published` until sourced.

**Cat 5 — Resale (value lost over the next 3 years of ownership)**
- Score both columns on **value lost over the next 3 years of ownership**. Convert published 3-yr / 36-month retained % to the same basis (value lost = 100 − retained). Anchors remain on retained %: ≤35% → 0 · 45% → 4 · 55% → 7 · ≥70% → 10.
- **2018 Transit-250 (example current):** KBB private-party fell **50%** over the last 3 years ($35,079 → $17,500) → score as **50% retained / 50% value lost** (FACT dollars; retained % INFERENCE arithmetic). Reason cites KBB and the last-3-yr basis.
- Accepted on this basis: FACT 3-yr / 36-month retained or value-lost figures (iSeeCars model-level, Black Book 36-mo % MSRP, KBB 3-yr / last-3-yr, CarEdge 3-yr). Rejected: ~2-yr figures (KBB 2024 Silverado EV 55%, CarBuzz ProMaster EV 46.4%, KBB Cybertruck 86%), INF listing-sample ratios, CarResaleValue Transit 78.5% → `Not scored: 3-yr value lost not published`.
- **If a candidate has no figure on that same basis → Not scored** for both columns.
- Conflict → global rule (candidate lower retained / higher value lost, current higher retained), both shown with basis.
- Fields: `retained3yrPct[]` / `valueLost3yrPct[]` with `{value, source, basis, url}`. Files: a_r1t_depreciation.csv, b_retained_value.csv, c_retained_value.csv, g_gaps.
- Reason template: `Value lost next 3 yr: KBB last-3-yr −50% (2018 Transit-250 EL HR; retained 50% used)` · `3-yr retained: Black Book 46.3% (36-mo residual, % MSRP) · iSeeCars 66.0% (model-level); lower used (value lost 53.7%)`.

**Cat 6 — Reliability (recalls + failure patterns)**
- Start at 10. **−2 per open, unremedied safety recall** (VIN lookup when a VIN is available). With no VIN: −2 per NHTSA campaign for that model year, and the reason says "MY campaign count; open status not checked (no VIN lookup)". **−1 per sourced known failure pattern** for that MY. Floor 0.
- "Sourced failure pattern" = a FACT-labeled TSB, customer-satisfaction / service program, or recall-cluster row matching the MY. Not counted: INF / alleged / complaint-keyword rows, and survey rankings (Consumer Reports brand/model scores are not a failure pattern). A pattern that *is* a recall already counted is not counted twice.
- **ProMaster EV (G-final):** count only EV-confirmed campaigns **24V715** and **25V665**. Do **not** count **25V330** (UNKNOWN EV inclusion), **25V720**, or **24V416**. With no VIN: 2 campaigns → **6.0**.
- Fields: `recallCampaignsMy` (a_r1t_recall_complaint_counts.csv, b_preview_ev_recalls.csv, c_baseline_recall_complaint_counts.csv, g_gaps), `failurePatterns[]`.
- Baseline counts cover all engines/bodies for the model string (C3 caveat). The reason says "all engines/body styles".
- Reason template: `2 NHTSA EV-confirmed campaigns MY2024 (24V715, 25V665; open status not checked; no VIN lookup)` · `12 NHTSA campaigns MY2022 (open status not checked; no VIN lookup) · 2 TSBs (…)`.

**Cat 7 — Service network distance (+ mobile service)**
- Road miles from `job.shopCity` to the nearest OEM-authorized **EV-certified / authorized** service location for that make when the candidate is an EV that requires one; otherwise the nearest OEM-authorized service location. Anchors: ≤15 → 10 · 30 → 7 · 60 → 4 · ≥100 → 0. **+2 (cap 10)** if the OEM's mobile service covers that area (sourced FACT).
- **INFERENCE certification step-down (G-final):** when the nearest dealer's EV / BrightDrop / ProMaster certification is only INFERENCE, score **one rubric step below** the FACT distance score. Ladder: **10 → 7 → 4 → 0**.
- **Vero Beach (ZIP 32960 centroid).** OSRM route = INFERENCE; address = FACT. G-final rows (g_gaps + f_service_distance):

  | Make / product | Nearest service | Road mi | Certification | Points |
  |---|---|---|---|---|
  | Chevrolet (non-BrightDrop EV) | Dyer Chevrolet | 2.6 | INFERENCE | **7.0** (FACT at 2.6 would be 10) |
  | GMC EV | Linus Buick GMC | 2.5 | INFERENCE | **7.0** |
  | Ford EV | Mullinax Ford | 4.1 | FACT (EV Certified) | **10.0** |
  | Ram ProMaster EV | Vatland CDJR | 4.9 | FACT (LEV + PMCD) | **10.0** |
  | BrightDrop | AutoNation Chevrolet Greenacres | 80.4 | INFERENCE (new-unit sales) | **2.0** (score on distance; no further step-down) |
  | Toyota (gas) | Toyota of Vero Beach | 5.1 | n/a | 10 |
  | Tesla | Merritt Island | 65.0 | OEM SC | 3.5 |
  | Rivian | Orlando | 107.2 | OEM SC | 0 + 2 mobile = **2.0** |

- Fort Pierce and West Palm Beach: only Rivian is sourced (a_r1t_service.csv: 117.4 / 63.1 mi). Other makes at those origins → `Not scored: service distance not published for <city>`.
- Mobile service: **Rivian only** (FACT). Ford, GM, Ram, Toyota and Tesla mobile service are UNKNOWN, so no +2.
- Tesla and Rivian service centers are OEM-owned and scored on distance (no franchised-cert step-down).
- A Rivian Space (West Palm Beach) is retail, not service. The planned Tesla Port St. Lucie site is not open (INFERENCE) and is not used.
- Reason template: `Dyer Chevrolet, 2.6 road mi (OSRM); EV-certified INFERENCE → 7.0 (one step below FACT 10)` · `Mullinax Ford, Vero Beach: 4.1 road mi (OSRM); EV Certified FACT` · `AutoNation Chevrolet Greenacres: 80.4 road mi (OSRM); BrightDrop certification INFERENCE` · `Nearest Rivian service: Orlando, 107.2 road mi from 32960 (OSRM) · Rivian Mobile Service available (+2)`.

**Cat 8 — Longevity / warranty (20 points; Ted lock 2026-09-27 ~9:46 AM ET)**
- **Formula for every model:** warranty points = **20** x min(years left ÷ term years, miles left ÷ term miles), floor 0, 1 decimal. EVs use the battery / EV-propulsion term; gas and diesel use powertrain.
- Term start = in-service / first-delivery date if the listing or VIN states it; otherwise **Jan 1 of the model year** (INFERENCE, labeled). Years left are computed to the scoring date.
- **Modifiers** (applied after the formula; floor 0):
  - **Capacity-floor modifier (INFERENCE amount):** an EV battery warranty with **no capacity floor** (FACT: ProMaster EV) → **−2**.
    - A floor that is only INFERENCE (Sierra EV, HUMMER EV, BrightDrop, 2026 Silverado EV, Rivian Commercial Van) is treated as **no floor for a candidate** (−2) and **as the stated floor for a current vehicle** (0). This is the shrink-the-lead rule.
    - FACT floors: Ford 70% (65% cutaway / chassis cab), Chevrolet 2024 EV 75%, Tesla 70%, Rivian consumer and Commercial R1T 70%. No deduction for these.
    - The reason line always shows the floor and its label.
  - EV with **model-specific FACT** capacity data at this mileage 80–90% → −4, <80% → −8 (doubled with the category). Anecdotes, class data and listing SOH never trigger it, and nothing about battery health is shown.
  - Gas/diesel over 150k mi → −4 (doubled).
- **Terms by model.** Source: `used_ev_commercial_warranty.csv`, plus C/F for gas.

  | Model | Scored term | Floor (label) | Fleet use |
  |---|---|---|---|
  | Ford F-150 Lightning, E-Transit | EV component 8 yr/100k | 70%, E-Transit cutaway/CC 65% (FACT) | Keeps coverage (implied warranty disclaimer only) |
  | Chevrolet Silverado EV 2024 | Battery 8/100k | 75% (FACT) | Keeps. GM fleet 5/100k powertrain **not** applied to EVs |
  | Chevrolet Silverado EV 2026 | Battery 8/100k | 75% (INFERENCE) | Keeps |
  | GMC Sierra EV | Battery 8/100k (INFERENCE; GMC EV booklet not retrieved) | 75% (INFERENCE) | Keeps (INFERENCE) |
  | GMC HUMMER EV Pickup | Battery 8/100k (INFERENCE) | 75% (INFERENCE) | Keeps, except Edition 1 (below) |
  | Chevrolet BrightDrop 400/600 (2025+) | EV propulsion 8/100k (FACT, GM 25MY spec guide p.40). **No powertrain term; the section B "5 yr/60k" is dropped** | 75% (INFERENCE) | Commercial product |
  | Zevo 2022–24 | `Not scored: warranty terms not published` | — | — |
  | Ram ProMaster EV | Electric powertrain + HV battery 8/100k (FACT) | **NONE** (FACT, 2024 Ram HD booklet p.15) | Keeps (implied warranty disclaimer only) |
  | Tesla Cybertruck | Battery + drive unit 8/150k (FACT) | 70% (FACT) | NVLW balance kept |
  | Rivian Commercial Van 500/700 | Commercial 8/100k | 70% (INFERENCE for van) | Commercial |
  | Ex-Amazon EDV (DSP guide) | `Not scored: EDV warranty terms not published` | — | — |
  | Rivian R1T | See the `warranty_type` rules below | 70% (FACT) | Consumer loses coverage |
  | VW MY2025 EVs | HV System warranty excludes commercial use (FACT) | per booklet | `warranty_type` matters |
  | Gas baselines (C) | Powertrain 5/60k (all 2016–20 expired → 0) | — | GM gas with a documented qualifying-fleet account uses 5/100k (still expired for 2016–20) |

  - Tesla note: the Tesla **Pre-Owned** 1 yr/10k add-on excludes commercial use (FACT, p.7) and extends Basic, not the battery. It is **never counted**; the reason line notes it when the listing mentions it.
- **Listing field `warranty_type` = `commercial` | `consumer` | `unconfirmed`** (default `unconfirmed` unless the listing or seller documents one).
  - **Where it matters (G-final):** Rivian R1T; GMC HUMMER EV Edition 1 (6-month transfer); VW MY2025 EVs (HV commercial exclusion); Tesla Pre-Owned add-on (**note only, never points**). **Every other model ignores the field.**
  - **Rivian R1T:**
    - `consumer` → **0.0 of 20**. Cell `0.0 · At risk, not counted`. Reason: `At risk, not counted: Rivian consumer warranty does not apply if "used primarily for business or commercial purposes" (NVLW Guide Rev 15, eff. 2026-08-13, p16). Nominal consumer coverage left: <yr> yr / <mi> mi.` + link. Never say "void".
    - `unconfirmed` → scores as consumer (the lower case): **0.0 of 20**. Cell `0.0 · Commercial warranty status not confirmed`. The reason adds the nominal consumer coverage left and the Commercial-terms points it would score if confirmed.
    - `commercial` (documented Rivian Fleet Sales / Commercial NVLW) → 20 x min((8 − age) ÷ 8, (100,000 − odometer) ÷ 100,000). Age runs from first commercial delivery (Commercial guide Rev 3 p.10). Then **−6** if `upfit = other | unknown` (installer not a documented Rivian Preferred Upfit Partner, guide p.13), and the −2 floor modifier does not apply (floor 70% FACT).
    - `oemWrittenConfirmation = true` (a document Ted/ops attaches) → score the consumer terms normally.
  - **Rivian Commercial Van:** always `commercial` (fleet-only product), same formula and upfit rule.
  - **GMC HUMMER EV Edition 1** (2022–2024 named units; G-final: **2022 Edition 1 falls under the same 6-month rule**): resale within 6 months of delivery voids EV Propulsion coverage (FACT, gmc.com FAQ).
    - `unconfirmed` → scores the lower case (**0 of 20**), reason `Commercial warranty status not confirmed · Edition 1 6-month retention not VIN-verified`.
    - Coverage-confirmed listing → normal formula.
    - Non-Edition-1 HUMMER (e.g. 2023 3X) ignores the field.
- **Upfit (other OEMs):** body and upfit components are warranted by the upfitter, not the OEM (Ford BEV guide p.12, GM EV booklet p.14, Ram HD booklet p.17, FACT). This is noted in the reason when the listing shows an upfit. **No points change** (Ted lock: only the Rivian −6).
- Fields: `battWarrantyYr/Mi`, `powertrainWarrantyYr/Mi`, `capacityFloorPct` + `capacityFloorLabel` (`FACT` | `INFERENCE` | `NONE`), `warrantyType`, `upfit`, `oemWrittenConfirmation`, `hummerEdition1`, `commercialUseExclusion`. Files: used_ev_commercial_warranty.csv, rivian_warranty_compare.csv, a_r1t_warranty.csv, f_warranty_commercial_use.csv, f_gm_capacity_floor.csv, c_baseline_warranty.csv.
- 2025 R1T "Large Plus": warranty UNKNOWN → `Not scored: warranty terms not published`.

**Cat 9 — Energy ¢/mi (FL prices)**
- EV: ¢/mi = `epaKwhPer100mi` ÷ 100 x FL **commercial** electricity ¢/kWh (EIA EPM Table 5.6.A, latest month). EPA kWh/100 mi is wall-to-wheels, so no extra charging-loss factor is applied.
- Gas: ¢/mi = 100 x FL regular $/gal (**AAA FL daily**) ÷ `epaCombMpg`. Diesel: AAA FL diesel. Midgrade-rated engines (Ram 5.7 Hemi): D has no FL midgrade price, so use FL regular, and the reason says "rated on midgrade; priced at regular" (this shrinks the candidate's lead).
- Anchors: ≤5¢ → 10 · 10¢ → 7 · 20¢ → 4 · ≥30¢ → 0.
- **Van rule (Steve pick):** gas vans over 8,500 lb GVWR use the **labeled INF Fuelly mpg** (c_baseline_vans.csv): Transit-250 2017 15.3 / 2018 13.6, ProMaster 2500 2018 13.1. Use the MY-matched value; if there is no MY match, use the highest captured value for that model (shrinks the candidate's lead). The reason says `Fuelly crowd-sourced mpg (INF, not EPA-rated: GVWR >8,500)`. Transit-350 has no Fuelly value → `Not scored: mpg not published (van >8,500 GVWR)`. The T150 Wagon EPA proxy is not used.
- **B-section EVs with EPA ids (Sherlock raw `combE` stands):**
  - 2026 Sierra EV Std 49660 → 50.3; Ext 49658 / 49659 → 49.5 / 52.4
  - 2024 Silverado EV WT 47446 / 46946 → 50.5 / 53.4
  - 2026 Silverado EV Std 49643 → 50.3
  - 2022 Lightning SR 45318 / ER 45317 / Platinum 45316 → 49.4 / 47.9 / 50.7
  - 2025 Cybertruck 49123 / 49152 → 42.9 / 40.9
  - Trim unknown → the higher kWh/100 (shrink-the-lead).
- **B-section vans without EPA (G-final third-party tests; less favorable when several comparable figures):**
  - **E-Transit (2023 68 kWh):** **1.4 mi/kWh = 71.4 kWh/100 mi** (EV Pulse, 2022-11-11; flat highway 70 mph cruise, ~40°F, max GVWR). Reason cites those conditions. Note also 1.2 mi/kWh stop-and-go with heater at ~40°F — **not** used as the Florida basis. (Motor Illustrated 2025 89 kWh Canadian unit is a different pack; not used for the 2023 68 kWh candidate.)
  - **ProMaster EV:** **50.1 kWh/100 mi** (Motor Illustrated, 2025-08-17; ~800 lb load, short mixed loop). Less favorable than OEM-derived ~1.5 mi/kWh INFERENCE.
  - **BrightDrop 600:** **67.1 kWh/100 mi** (Motor Illustrated, 2025-08-17; >1,700 lb load).
  - Never derive efficiency from OEM range ÷ kWh. Label third-party tests in the reason (not "EPA").
- **Prices (section D).** Data file `src/data/flEnergyPrices.ts`, static with `as_of` and `url` per row:
  - electricity_commercial 11.37 ¢/kWh (July 2026, EIA release 2026-09-24)
  - gasoline_regular_aaa $4.3679/gal (AAA "as of 9/27/26")
  - diesel_aaa $6.1040/gal (AAA "as of 9/27/26")
  - File: data-v2/d_fl_energy_prices.csv
- If a price field is null → `Not scored: FL energy price not loaded`.
- Reason template: `71.4 kWh/100 mi (1.4 mi/kWh; EV Pulse highway 70 mph, max GVWR, ~40°F) x 11.37¢/kWh FL commercial (EIA, Jul 2026) = 8.1¢/mi · note 1.2 mi/kWh stop-and-go/heater not used for FL` · `48.1 kWh/100 mi (EPA) x 11.37¢/kWh = 5.5¢/mi` · `$4.3679/gal FL regular (AAA, 9/27/26) ÷ 13.6 mpg (Fuelly INF) = 32.1¢/mi`.

**Cat 10 — Maintenance ¢/mi (class-level only)**
- Anchors: ≤4¢ → 10 · 8¢ → 7 · 12¢ → 4 · ≥15¢ → 0.
- **Same-basis rule (Steve decision):** both columns must come from one study basis.
  - **Pickups:** **AAA Your Driving Costs 2026** (maintenance + repair + tires, 15k mi/yr, new vehicles, 5 yr): EV pickup 10.79¢ (INF arithmetic: $1,618 ÷ 15,000); gas half-ton 11.82¢ (FACT); gas midsize 11.26¢ (FACT). Argonne 2021 scheduled-only (BEV 6.1¢ vs ICEV 10.1¢) is a second reason line, not scored.
  - **Vans (G-final):** Argonne 2021 Utilimarc medium-duty van/pickup M&R by age (FACT class range). For a ~8-year-old 2018 van: **$0.31–0.40/mi** (INFERENCE). **Example Transit current uses $0.31/mi** (low end; shrink-the-lead for the current column) → 31¢/mi → **0.0**. If the candidate has no figure on that same Argonne van basis → Not scored for both.
- The reason text must say class-level and the basis: `Class-level, not model-specific: Argonne 2021 Utilimarc medium-duty M&R ~$0.31/mi at year 8 (INFERENCE, low end of $0.31–0.40)` / `Class-level, not model-specific: AAA 2026 EV pickup 10.79¢/mi · Argonne scheduled-only BEV 6.1¢ vs ICEV 10.1¢`.
- Files: a_maintenance.csv, b_maintenance_class.csv, c_maintenance.csv, g_gaps.

### 4. Reason-line rules
- One line per **scored** number: the input value(s), the arithmetic, the source name + date, and a link. FACT/INF shows as the words "INF" / "OEM estimate" / "class-level" inside the sentence, never as a pill.
- `Not scored…` / `Not used by this job`: value once; reason only if it adds information.
- Missing inputs name the field (`Not scored: current payload not published`), never a dash.
- No adjectives and no comparisons in words. The difference column does the comparing.

### 5. Data wiring (no new sources beyond SOURCES-V2 + g_gaps / warranty cross-check)
- Extend `src/data/oemSpecs.ts` entries (candidates) with: `epaKwhPer100mi` (incl. third-party van tests), `seats`, `towLbNoWdh`, `battWarrantyYr/Mi`, `capacityFloorPct`, `retained3yrPct[]`, `recallCampaignsMy`, `failurePatterns[]`, `maintClass`.
- New `src/data/baselineVehicles.ts` (current vehicles, from C + g_gaps): include Transit seats = 2, tow 6,200, resale KBB −50%, maint $0.31/mi; F-150 tow typical 10,700.
- `src/data/serviceNetwork.ts`: f_service_distance + g_gaps EV-certified rows (Mullinax FACT; Vatland FACT; Dyer/Linus INFERENCE step-down; BrightDrop 80.4 mi).
- `src/data/warrantyRules.ts`: `warranty_type` = `commercial` | `consumer` | `unconfirmed`; matters for Rivian, Hummer Edition 1, VW MY2025 EV HV, Tesla Pre-Owned note-only.
- `src/data/flEnergyPrices.ts` (D), `src/data/scoreV2Rubric.ts` (anchors as constants, each tagged `INFERENCE`; incomplete = 2/3 of job-applicable; warranty max 20).
- Per-listing fields: `warranty_type`, `upfit`, `oemWrittenConfirmation`, listing payload/seats when stated.
- Every value carries a `url` in the data file; the readout links it.

---

## 6. Validation worked examples (G-final; computed from SOURCES-V2 + g_gaps + cross-check, not tuned)

Common rules for §6:
- Scored 2026-09-27. Shop Vero Beach 32960. No tow, so Tow = `Not used by this job` everywhere; job-applicable = 100 and the incomplete threshold = **66.7**.
- Candidate miles are the listing-sample medians from B.4 / A6 (except where §6 names a figure). The live site uses each listing's own miles.
- When the trim is unknown, each field takes the shrink-the-lead value, and the reason says so.
- Maintenance vs Transit: Argonne van basis; demo EV/pickup candidates lack that basis → maintenance **Not scored** (drops) on Transit pairs. Resale scores only when the candidate has a same-basis 3-yr value-lost / retained figure.

### 6.1 Current = 2018 Ford Transit-250 3.7L high roof, 48,000 mi (electrical job: 120 mi/day, 543 lb, crew 2, no tow)

**Transit per category:**
| Category | Points | Reason |
|---|---|---|
| Range | **10.0** | 13.6 mpg x 25 gal = 340 mi x 0.7 = 238 mi usable (mpg estimate) |
| Payload | **10.0** | 3,571 lb, lowest per-trim value 2018 Transit-250 3.7L (cars.com), vs 543 |
| Cab / crew | **10.0** | 2 seats (Ford 2018 Transit brochure, FACT) vs crew 2 |
| Tow | Not used by this job | |
| Resale | **5.5** | KBB last-3-yr value lost 50% ($35,079 → $17,500); retained 50% used (value lost next 3 yr basis) |
| Reliability | **0.0** | 14 NHTSA campaigns MY2018, all Transit bodies, open status not checked |
| Service | **10.0** | Mullinax Ford, 4.1 road mi |
| Longevity | **0.0 / 20** | Powertrain 5/60k expired (MY2018); ≤150k mi |
| Energy | **0.0** | $4.3679 ÷ 13.6 = 32.1¢/mi |
| Maintenance | **0.0** (pair may drop) | Class-level Argonne 2021 Utilimarc ~$0.31/mi at year 8 (INFERENCE, low end). When the candidate has no same-basis van figure, both columns show Not scored and the row drops. |

Card chip: **Payload 3,571 lb**.

| Candidate | Key inputs | Candidate total / possible | Transit total / same possible | Difference | UI shows |
|---|---|---|---|---|---|
| 2018 F-150 3.5EB 4x4, 120k mi (as a candidate) | range 10 · payload 10 (1,485) · cab 10 · resale 10 (81.1%) · rel 0 · service 10 · warranty 0 · energy 2.8 | **52.8 / 90** | 45.5 / 90 | **+7.3** | totals |
| 2022 R1T Quad Large, `consumer`, 41,446 mi | range 10 · payload 10 · cab 10 · resale 4.4 (46.3%) · rel 0 (12) · service 2.0 · warranty **0.0 · At risk, not counted** · energy 9.7 | **46.1 / 90** | 45.5 / 90 | **+0.6** | totals |
| Same R1T, `commercial` (fleet-sold, no upfit) | warranty 20 x min(3.26/8, 58.6k/100k) = **8.2** | **54.3 / 90** | 45.5 / 90 | **+8.8** | totals |
| 2024 R1T Dual Large 21", `commercial`, 16,856 mi | range 10 (352 EPA → 246 usable) · payload 10 · cab 10 · resale 4.4 · rel 0 (7) · service 2.0 · warranty **13.2** · energy 10.0 (43.2 → 4.9¢) | **59.6 / 90** | 45.5 / 90 | **+14.1** | totals |
| Live demo 2022 R1T Adventure (Quad Large), `unconfirmed` | as consumer: warranty **0.0 · Commercial warranty status not confirmed** | **46.1 / 90** | 45.5 / 90 | **+0.6** | totals |
| 2026 GMC Sierra EV Elevation Std Range, 3,468 mi | range 10 (283 EPA) · payload 10 (2,250) · cab 10 · resale Not scored · rel 2.0 (4) · service **7.0** (Linus 2.5 mi, cert INFERENCE) · warranty 18.2 − 2 (75% INF) = **16.2** · energy 9.6 (50.3 EPA) | **64.8 / 80** | 40.0 / 80 | **+24.8** | totals |
| 2025 Chevrolet BrightDrop 600, 28 mi | range 6.5 (166 mi GM est; 116 usable/120) · payload 10 (1,420 lowest) · cab 10 (2 INF) · resale Not scored · rel 9.0 · service **2.0** (Greenacres 80.4 mi) · warranty 15.7 − 2 = **13.7** · energy 8.4 (67.1 kWh/100 mi, Motor Illustrated) | **59.6 / 80** | 40.0 / 80 | **+19.6** | totals |
| 2024 Ram ProMaster EV (SHR), 1,007 mi | range 6.2 (162 mi OEM city est) · payload 10 (2,030) · cab 10 · resale Not scored · rel **6.0** (2 EV-confirmed: 24V715, 25V665) · service **10.0** (Vatland 4.9 FACT) · warranty 13.2 − 2 (floor NONE) = **11.2** · energy 9.6 (50.1 kWh/100 mi) | **63.0 / 80** | 40.0 / 80 | **+23.0** | totals |
| 2024 Chevrolet Silverado EV Work Truck, 4,170 mi | range 10 (393) · payload 10 (1,400 lower WT) · cab 10 · resale 5.3 (Black Book 49.4% 36-mo) · rel 2.0 (4) · service **7.0** (Dyer 2.6, cert INFERENCE) · warranty **13.2** (75% FACT) · energy 9.4 (53.4 kWh/100, higher WT) | **66.9 / 90** | 45.5 / 90 | **+21.4** | totals |
| 2023 Ford E-Transit (roof unknown), 7,495 mi | range 0.6 (108 mi OEM est) · payload 10 (3,330) · cab 4.0 (1 seat cars.com vs crew 2; listing may state 2) · resale 3.2 (KBB last-3-yr 43% retained) · rel 8.0 (1: 25V860) · service **10.0** (Mullinax FACT) · warranty **10.7** (70% FACT) · energy 8.1 (1.4 mi/kWh highway test) | **54.6 / 90** | 45.5 / 90 | **+9.1** | totals |
| 2022 Ford F-150 Lightning Pro, 84,296 mi | range 9.1 (230 SR) · payload 10 (1,800 lowest) · cab 10 · resale 10.0 (KBB 76%) · rel 0 (9) · service **10.0** (Mullinax FACT) · warranty **3.1** · energy 9.6 (49.4 EPA) | **61.8 / 90** | 45.5 / 90 | **+16.3** | totals |

All **7 live-demo candidates** display totals (PP 80 or 90 ≥ 66.7). No Score incomplete on this package with G-final data.

### 6.2 Current = 2018 F-150 3.5EB 4x4, 120k mi (supervisor, crew 2, no tow, 120 mi/day, 1,000 lb)

Tow rating for this current when a towing job is entered: **10,700 lb** (typical SuperCrew 4x4), not 13,200 max. This no-tow table leaves Tow as Not used.

| # | Category | F-150 | 2022 R1T `consumer` | 2022 R1T `commercial` | 2024 R1T DL21 `commercial` |
|---|---|---|---|---|---|
| 1 | Range | 10.0 | 10.0 | 10.0 | 10.0 |
| 2 | Payload | 10.0 (1,485) | 10.0 | 10.0 | 10.0 |
| 3 | Cab / crew | 10.0 (3 seats min) | 10.0 (5) | 10.0 | 10.0 |
| 4 | Tow | Not used by this job | Not used | Not used | Not used |
| 5 | Resale | 10.0 (81.1%) | 4.4 (46.3% · 66.0%) | 4.4 | 4.4 |
| 6 | Reliability | 0.0 | 0.0 | 0.0 | 0.0 |
| 7 | Service | 10.0 (4.1 mi) | 2.0 | 2.0 | 2.0 |
| 8 | Warranty /20 | 0.0 | **0.0 · At risk, not counted** | **8.2** | **13.2** |
| 9 | Energy | 2.8 | 9.7 | 9.7 | 10.0 |
| 10 | Maintenance | 4.1 | 4.9 | 4.9 | 4.9 |
| | **Total** | **56.9 / 100** | **51.0 / 100** | **59.2 / 100** | **64.5 / 100** |
| | **Difference** | — | **−5.9** | **+2.3** | **+7.6** |

(The same 2024 unit on `consumer` or `unconfirmed` scores 51.3 / 100, −5.6.)

### 6.3 No R1T override: landscaper towing (Ted item 3; illustration of the rules, not a ranked pair)
Job: 7,000 lb trailer, tongue 700–1,050 lb (10–15%; tongue not entered → **15% = 1,050 lb**, shrink-the-lead), cargo 0 or 1,000 lb.
- **Tow:**
  - No WDH stated → R1T rated 5,000 lb without WDH → ratio 0.71 → **0**.
  - With WDH: Gen1 11,000 → 1.57 → **10**; Gen2 Standard/Large 7,700 → 1.10 → **7.6**.
  - Current 2018 F-150 3.5EB: rated **10,700 lb** (typical SuperCrew 4x4) ÷ 7,000 → 1.53 → **10**.
  - Current 2018 Transit-250 HR: **6,200 lb** ÷ 7,000 → 0.89 → **0**.
- **Payload** (load = cargo + tongue):
  - R1T 1,764 vs 1,050 → 1.68 → **10**.
  - R1T 1,764 vs 2,050 → 0.86 → **2.4**.
  - Gen2 Large 2,172 vs 2,050 → 1.06 → **7.7**.
- No rule exempts the R1T.

## 7. Acceptance checklist — Steve Pages bar (live site, hard refresh, record script hash)
1. [ ] Dial tap opens the v2 readout with **10 category rows** in §3 order, columns **Category | Current | Candidate**.
2. [ ] The Current column names the current vehicle (year / make / model / engine) from intake or the package. No current vehicle → "Score incomplete: current vehicle not entered", no totals.
3. [ ] Every **scored** number has a one-line reason with the input value(s), arithmetic and a working source link. Spot-check 3 links (EPA, Rivian warranty guide, AAA/EIA). `Not scored` / `Not used` appear once as the value.
4. [ ] Totals row shows `NN.N / PP` for both columns with **the same PP**. Difference is signed (`+`/`−`) to 1 decimal and equals candidate − current of the displayed rounded values. When incomplete: **no totals row numbers and no difference** — only `Score incomplete: key data missing`.
5. [ ] Non-towing pickup job with F+G-final wired: Tow reads "Not used by this job" in both columns and the totals read **`/ 100`** when no other drop-outs (F-150 / R1T at Vero Beach).
6. [ ] A missing input reads "Not scored: <field> …" in **both** columns and drops out. With PP < 2/3 of job-applicable points (66.7 with no tow) → "Score incomplete: key data missing" and no totals/difference.
7. [ ] R1T with `warranty_type = consumer`: the warranty row (/20) shows **`0.0 · At risk, not counted`** (never "void"). With `unconfirmed` (the default) it shows `0.0 · Commercial warranty status not confirmed`. HF-3 is not triggered, and the unit stays listed.
8. [ ] R1T resale reason shows **both** 46.3% (Black Book) and 66.0% (iSeeCars), with 46.3% used (4.4 pts), framed as value lost over the next 3 years.
9. [ ] Energy reasons show the FL price with its as-of date (EIA Jul 2026 commercial 11.37¢; AAA 9/27/26 regular $4.3679). Vans: Fuelly INF for gas; E-Transit / ProMaster / BrightDrop show third-party kWh/100 with test conditions. Transit range reason matches §1 polish string.
10. [ ] Maintenance reasons include "class-level, not model-specific". Transit current shows $0.31/mi Argonne when the pair shares that basis; otherwise Not scored.
11. [ ] Card: dial right of price shows `NN.N / PP` plus `±N.N vs current` beneath when a total is displayed. Dial text is fully readable at mobile width (not clipped). Candidates ordered by total (normalized when PP differs). Sidegrades still visible. Incomplete cards do not show a competing total.
12. [ ] Zero occurrences on the page of: Best, Worst, Best fit, Worst fit, Worth it, SOH, battery health, FACT pill, better, worse, good, bad, strong, weak. Zero `—` dashes in spec or score cells (text search the DOM).
13. [ ] Supervisor preset + 2018 F-150 3.5EB 4x4 (cab not entered, 120k mi) at 120 mi/day, 1,000 lb, Vero Beach, no tow:
    - vs consumer 2022 R1T Quad Large → **56.9 / 100 vs 51.0 / 100, −5.9**
    - vs the same R1T `commercial` → **59.2 / 100, +2.3**
14. [ ] PR #1 still **draft**, not merged. The ship note lists the script hash and the per-category R1T vs current points.
15. [ ] Payload reason for a gas F-150 names the **lowest per-trim** value and its config. The OEM max (3,230 lb for 3.5EB) never appears as the scored value. Example current card chip shows **Payload 3,571 lb**.
16. [ ] Service reasons at Vero Beach: Ford EV Mullinax 4.1 FACT → 10; Ram Vatland 4.9 FACT → 10; Chevy Dyer 2.6 INFERENCE → 7; GMC Linus 2.5 INFERENCE → 7; BrightDrop Greenacres 80.4 → 2.0; Toyota 5.1; Tesla 65.0; Rivian 107.2 (+2 mobile).
17. [ ] Seats: 2018 Transit cargo shows 2 FACT. BrightDrop 600 / ProMaster EV reasons show 2 seats with "INFERENCE". E-Transit candidate uses 1 unless listing says 2.
18. [ ] Warranty reason for Ford / GM / Ram / Tesla EVs shows the capacity floor with its label (Ford 70% FACT; Chevrolet 2024 75% FACT; Sierra EV / Hummer / BrightDrop 75% INFERENCE; ProMaster EV None). No "At risk" / "void" on any non-Rivian unit.
19. [ ] Warranty row shows points **out of 20**. Totals read `/ 100` for a no-tow truck pair with everything sourced, and max `/ 110` when tow is used.
20. [ ] Score incomplete fires below **2/3 of job-applicable points**: 66.7 when tow is not used. With G-final data, the seven demo candidates vs the 2018 Transit-250 **all show totals** (see §6.1).
21. [ ] R1T `warranty_type`:
    - `consumer` → `0.0 · At risk, not counted`
    - `unconfirmed` (the default) → `0.0 · Commercial warranty status not confirmed`
    - `commercial` → formula points (2022 QL at 41,446 mi = 8.2; 2024 DL at 16,856 mi = 13.2)
    - A non-Preferred-Upfit-Partner upfit shows −6
22. [ ] `warranty_type` affects only Rivian R1T, HUMMER Edition 1, VW MY2025 EV HV commercial exclusion, and the Tesla Pre-Owned note (never points). No effect on Ford / other GM / Ram / Toyota / gas rows.
23. [ ] ProMaster EV reason shows capacity floor **None** and −2; reliability counts only 24V715 and 25V665 (6.0). Sierra EV / BrightDrop show 75% **INFERENCE** and −2. Silverado EV 2024 shows 75% FACT with no deduction. BrightDrop shows **no** 5 yr/60k powertrain.
24. [ ] No GM EV shows 5 yr/100k powertrain. Ford / Chevy / GMC / Ram / BrightDrop EV service rows show the G-final distances and points (not "Not scored: EV-certified…").
25. [ ] Towing job: payload reason shows load = cargo + tongue (tongue entered, or "15% of trailer" when not). F-150 uses 10,700 lb typical; Transit-250 HR 6,200 lb; R1T without WDH uses 5,000 lb.
26. [ ] §6.1 / §6.2 numbers reproduce (G-final):
    - vs Transit (PP 90 with resale / 80 without): R1T consumer **46.1/90** vs 45.5 (+0.6) · fleet 2022 **54.3/90** (+8.8) · fleet 2024 **59.6/90** (+14.1) · unconfirmed same as consumer · Sierra **64.8/80** (+24.8) · BrightDrop **59.6/80** (+19.6) · ProMaster **63.0/80** (+23.0) · Silverado **66.9/90** (+21.4) · E-Transit **54.6/90** (+9.1) · Lightning **61.8/90** (+16.3)
    - vs F-150: F-150 56.9/100 · consumer R1T 51.0 (−5.9) · fleet 2022 59.2 (+2.3) · fleet 2024 64.5 (+7.6)
    - Zero Best/Worst/SOH/battery-health/Worth it text or badges.

## Woz
Quote **this** file in the cloud ship prompt, plus `CLEARED-FOR-WOZ-SCORE-UI.md`, `CLEARED-FOR-WOZ-SCORE-DIAL-TAP.md`, `oem-specs/CLEARED-FOR-WOZ-OEM-SPECS.md`, and SOURCES-V2 + data-v2 + g_gaps as the only data inputs. Ship to `Burnsted/fleetfit-preview` **PR #1 draft only**. Put the data files with source URLs in the diff so Steve can spot-check them. Do not tune anchors. If the §6 numbers don't reproduce, report the per-category points rather than adjusting. Ping Steve + Jarvis with the hard-refresh URL + script hash when live. **No merge.**

## Open for Ted (override any; defaults above ship until then)
1. Anchors in cats 1–10 are Steve INFERENCE.
2. Conflict rule = shrink the candidate's lead (R1T resale 46.3%, not 66.0%). **Payload and seats use your low-end rule for both columns instead.**
3. Maintenance same-basis = AAA 2026 for pickup pairs; Argonne van $0.31/mi for Transit when the candidate shares that basis.
4. Energy uses FL **commercial** electricity and AAA daily gas; van third-party tests per G-final.
5. Gas vans use Fuelly INF mpg; Transit-350 stays Not scored for mpg.
6. No-VIN reliability fallback (−2 per MY campaign) floors nearly every truck at 0. A VIN open-recall lookup is the fix.
7. Unknown warranty start = Jan 1 of the model year.
8. Life Delta retired as a category.
9. Rank normalizes by points possible when PP differs.
10. **Upfit deduction = −6 of 20** (amount is INFERENCE; also applied when the installer is not documented).
11. **E-Transit seats** score on 1 (cars.com) as a candidate unless the listing says 2.
12. **EV service** uses G-final certified-dealer distances (FACT or INFERENCE step-down); draft-G Not-scored rule is removed.
13. **2026 Silverado EV 75% floor** is labeled INFERENCE, not FACT.
14. **Capacity-floor modifier −2 of 20** for no floor or INFERENCE-only floor on a candidate.
15. **Incomplete threshold base** = job-applicable points (100 when no tow), not the 110 max.
16. **Tongue default** = 15% of trailer when not entered.
17. **ProMaster EV recalls:** only 24V715 and 25V665.
18. **HUMMER Edition 1** (including 2022) under the 6-month rule.
19. **Tesla Pre-Owned** add-on: noted, never scored.
20. **`warranty_type` scope:** Rivian, Hummer Edition 1, VW MY2025 EV HV, Tesla add-on note only.

**Sherlock asks (remaining):**
- Ford/Chevy/Ram/Toyota/Tesla service miles from Fort Pierce and West Palm Beach
- OEM mobile service (Ford Pro, GM, Tesla) FACT confirmation
- GMC EV warranty booklet (Sierra EV / HUMMER 75% wording) and US BrightDrop booklet
- BrightDrop-certified dealer FACT (beyond new-unit-sales INFERENCE)
- Chevy/GMC EV-certified FACT from GM locator ( presently INFERENCE)
- EV van maintenance ¢/mi on the Argonne (or other) basis matching Transit $0.31/mi
- 3-yr value-lost figures for Sierra EV / BrightDrop / ProMaster EV (same basis as Transit KBB)
- FL midgrade price
- EDV (DSP) warranty terms
