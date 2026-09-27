# CLEARED-FOR-WOZ — Replacement Score v2 (Current | Candidate, 10 x 10) · Steve Jobs · ~9:05 AM ET 2026-09-27

**Ted:** ~8:18 AM ET + ~8:32 AM ET (numeric-only lock) via Jarvis: `ROLE-FIT-MIDSIZE-REDLINE-2026-09-27.md`
**Rubric draft:** `SCORE-V2-RUBRIC-DRAFT-2026-09-27.md` (~8:50 AM ET). This file supersedes it.
**Sources:** Sherlock `SOURCES-V2-2026-09-27.md` + `data-v2/*.csv`. A (R1T), B (preview EVs), C (gas baselines) and D (FL prices) are all merged as of ~8:55 AM ET.
**Host:** `Burnsted/fleetfit-preview` PR #1 draft · **no merge**
**Replaces:** v1 weighted model (`CLEARED-FOR-WOZ.md` weights, `REPLACEMENT-SCORE-PRODUCT-BAR.md`, the `specUnknown` cap, the v1 category list in `SCORE-CATEGORIES-DRAFT.md`).
**Keeps:** `CLEARED-FOR-WOZ-SCORE-UI.md` (dial right of price) · `CLEARED-FOR-WOZ-SCORE-DIAL-TAP.md` (tap → readout) · `oem-specs/CLEARED-FOR-WOZ-OEM-SPECS.md` ("Not published", never dashes; `src/data/oemSpecs.ts`).

All point anchors below are **INFERENCE** (Steve's thresholds) until Ted overrides them. The data values they read are FACT or INF exactly as labeled in SOURCES-V2.

---

## Quote Ted pick
- The score is relative to the vehicle being replaced, not to the whole market.
- Numbers only. 10 categories x 10 points = 100. No better/equal/worse, good/bad, or any other opinion words.
- The current (replaced) vehicle runs through the same 10 categories for the same job. Show both numbers side by side per category and in the total. The point difference is the comparison.
- Only score capability the replaced vehicle actually uses. Never deduct for unneeded capability. Surplus capability is never a penalty. Oversizing is not rewarded.
- Keep: soft taper, no hard rejects, no Best/Worst, score + order only, tap readout with a sourced reason for every number.

## Exact ship

### 1. Shape (locked)
1. **10 categories, 0–10 points each, 1 decimal.** Round each category to 1 decimal first, then sum the rounded values.
2. **Current vehicle is scored on the same rubric** with the same job inputs. The current vehicle comes from intake Trade-in (year / make / model / engine / drivetrain / miles), or from the vehicle the package states it is replacing. If there is no current vehicle, the readout shows **"Score incomplete: current vehicle not entered"** and no totals. Never default to a typical truck.
3. **Readout (dial tap)** is a table with three columns: **Category | Current | Candidate**. Each number carries a one-line sourced reason and a source link (see §4 templates). Below the table: a totals row (`NN.N / PP` for each column) and **Difference** as a signed number, candidate minus current (e.g. `+2.1`, `−5.9`, `0.0`).
4. **Card dial** (right of price, unchanged position): shows the candidate total as `NN.N / PP`, with arc fill = total ÷ points possible. Directly under the dial, one small line: the signed difference plus the words `vs current` (e.g. `+2.1 vs current`). No other words on the dial.
5. **Rank:** candidates are ordered by candidate total. When candidates in the same package have different points possible, order by candidate total ÷ points possible (used for ordering only, never displayed). Ties go to the lower price, then the lower miles. Order is the only ranking signal: no ordinal badges with words, no Best/Worst.
6. **Status strings.** Exact text, used for BOTH columns of that row:
   - `Not used by this job`: the job does not use this capability (e.g. Tow when the current vehicle doesn't tow). The row drops out of both totals.
   - `Not scored: <field> not published` (or `Not scored: <field> not entered` for a missing intake field): the input is missing for **either** vehicle. The row drops out of both totals, so both columns always share the same points possible.
   - `Score incomplete: key data missing`: replaces both totals and the difference when points possible < 60. Category rows still render.
   - `At risk`: longevity only (§3 cat 8). The row stays in the totals and scores 0 warranty points.
7. **No hard rejects.** HF-3 (salvage / title / warranty-void on listing or title FACT) stays a severe flag exactly as today. The commercial-use warranty rule (cat 8) is a scoring rule, not HF-3.
8. **Soft taper:** every anchor is linear between points (except the two step rules in cats 3 and 4). No cliffs, nothing hidden, sidegrades stay visible and rank by total. The v1 Life Delta category is retired in v2. Wear is now carried by cat 8 (warranty miles left) and cat 6. The "Similar miles" soft label on cards stays and does not affect the score.
9. **Unknown display:** any spec value that is null renders **"Not published"**, never `—`, on cards, stat tiles, facts and inside readout reasons.
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
`lin()` = linear interpolation between the listed anchors, clamped at the ends. Each category caps at 10 and floors at 0.

**Global conflict rule (Steve decision; the draft was silent).** When two sourced values conflict for the same field, use the value that **shrinks the candidate's lead**: the lower/less favorable value for the candidate, the higher/more favorable value for the current vehicle. The reason line shows both values and both sources. Example: R1T 3-yr retained uses Black Book **46.3%**, reason shows "iSeeCars 66.0% (model-level) · Black Book 46.3% (36-mo residual, % MSRP); lower used".

---

**Cat 1 — Range fit (daily route)**
- Usable range = published range x **0.7** (heat / load / AC buffer; the same factor for EV and gas). Ratio = usable range ÷ `job.dailyMiles`.
- Anchors: ratio ≤0.6 → 0 · 0.8 → 4 · 1.0 → 7 · ≥1.5 → 10.
- EV range field: `epaRangeMi` (a_r1t_specs.csv `epa_range_mi`; b_preview_ev_specs.csv `range_mi` + `range_basis`). If there is no EPA rating (E-Transit, ProMaster EV, BrightDrop, 2024 Cybertruck, Hummer 3X), use the OEM estimate from `range_basis` and label it "OEM estimate, not EPA" in the reason.
- Gas range = `epaCombMpg` x `fuelTankGal` (c_baseline_specs.csv `comb_mpg` + c_baseline_fuel_tank.csv `fuel_tank_gal`; use the cars.com default-trim tank unless intake states the tank).
- Gas vans (Transit 250/350, ProMaster 2500) have no EPA mpg: use the labeled Fuelly INF value per cat 9. Transit-350 has no Fuelly value → `Not scored: mpg not published (van >8,500 GVWR)`.
- Reason template: `314 mi EPA x 0.7 = 220 mi usable vs 120 mi/day (ratio 1.83)` + EPA link.

**Cat 2 — Payload / cargo fit**
- Ratio = published payload ÷ `job.loadLb`. Anchors: ≤0.8 → 0 · 0.9 → 4 · 1.0 → 7 · ≥1.25 → 10.
- Fields: `payloadLb` (a_r1t_specs.csv `payload_lb`, b_preview_ev_specs.csv `payload_lb`, oemSpecs.ts). Values quoted as "up to" or "as low as" (Lightning) → apply the conflict rule (candidate: "as low as" figure).
- Vans with `job.cargoCuFt`: cu ft ratio with the same anchors, and the category score = min(payload score, volume score). If cu ft is not published → payload ratio only, and the reason says "cargo volume Not published".
- **Gap:** SOURCES-V2 has **no payload for any 2016–2020 gas pickup** (C has mpg / tank / warranty only). Until Sherlock adds it, any gas-pickup current vehicle shows `Not scored: current payload not published`.
- Reason template: `1,764 lb rated payload vs 1,000 lb load (ratio 1.76)` + Rivian payload link.

**Cat 3 — Cab / crew fit** (step rule)
- Seats ≥ `job.crew` → 10 · one seat short → 4 · two or more short → 0. Surplus seats are neutral.
- Field: **new** `seats` in oemSpecs.ts (OEM-sourced per year/trim/cab) and on the current-vehicle record. Do not derive seats from the cab name.
- **Gap:** no seat counts in SOURCES-V2 for R1T, preview EVs or baselines → `Not scored: seating not published` until Sherlock adds them.

**Cat 4 — Tow fit** (only if the current vehicle tows)
- `job.tows = no` → `Not used by this job` for both. Surplus tow rating is never scored.
- Ratio = rated tow for that config ÷ `job.trailerLb`. Anchors: <1.0 → 0 (step) · 1.0 → 7 · ≥1.5 → 10 (linear 1.0–1.5). Drop-trailer / occasional light tow uses the stated trailer weight, never a default heavy one.
- **WDH rule:** if a rating requires a weight-distributing hitch (R1T 11,000 lb requires WDH; 5,000 lb without, a_r1t_specs.csv `tow_lb_wdh` / `tow_lb_no_wdh`), use the no-WDH rating unless `job.wdh = yes`.
- Fields: `towLb`, `towLbNoWdh` (a_r1t_specs.csv; b_preview_ev_specs.csv `tow_lb`). **Gap:** no tow ratings for gas baselines in C → towing jobs show `Not scored: current tow rating not published` until sourced.

**Cat 5 — Resale (3-yr retained %)**
- Anchors: ≤35% → 0 · 45% → 4 · 55% → 7 · ≥70% → 10.
- Accepted: FACT 3-yr / 36-month retained % only (iSeeCars model-level, Black Book 36-mo % MSRP, KBB 3-yr, CarEdge 3-yr). Rejected: ~2-yr figures (KBB 2024 Silverado EV 55%, CarBuzz ProMaster EV 46.4%, KBB Cybertruck 86%), INF values (CarResaleValue Transit 78.5%, listing-sample ratios) → `Not scored: 3-yr retained value not published`.
- Conflict → global rule (candidate lower, current higher), both shown with basis. Always print the basis in the reason (B.3 warns the bases differ).
- Fields: `retained3yrPct[]` with `{value, source, basis, url}`. Files: a_r1t_depreciation.csv, b_retained_value.csv, c_retained_value.csv.
- Reason template: `3-yr retained: Black Book 46.3% (36-mo residual, % MSRP) · iSeeCars 66.0% (model-level); lower used`.

**Cat 6 — Reliability (recalls + failure patterns)**
- Start at 10. **−2 per open, unremedied safety recall** (VIN lookup when a VIN is available). With no VIN: −2 per NHTSA campaign for that model year, and the reason says "MY campaign count; open status not checked (no VIN lookup)". **−1 per sourced known failure pattern** for that MY. Floor 0.
- "Sourced failure pattern" = a FACT-labeled TSB, customer-satisfaction / service program, or recall-cluster row matching the MY. Not counted: INF / alleged / complaint-keyword rows, and survey rankings (Consumer Reports brand/model scores are not a failure pattern). A pattern that *is* a recall already counted is not counted twice.
- Fields: `recallCampaignsMy` (a_r1t_recall_complaint_counts.csv, b_preview_ev_recalls.csv, c_baseline_recall_complaint_counts.csv), `failurePatterns[]` (a_r1t_failure_patterns.csv, c_baseline_failures.csv, SOURCES-V2 B "Known failure patterns").
- Baseline counts cover all engines/bodies for the model string (C3 caveat). The reason says "all engines/body styles".
- Reason template: `12 NHTSA campaigns MY2022 (open status not checked; no VIN lookup) · 2 TSBs (HV pack seal RCA-30-22-001-1, tonneau RSB-60-22-001-1)`.

**Cat 7 — Service network distance (+ mobile service)**
- Road miles from `job.shopCity` to the nearest OEM-authorized service location for that make. Anchors: ≤15 → 10 · 30 → 7 · 60 → 4 · ≥100 → 0. **+2 (cap 10)** if the OEM's mobile service covers that area (sourced FACT).
- Fields: `serviceLocations[]` with road miles per origin + `mobileService {available, url}`. Rivian: a_r1t_service.csv (Vero Beach → Orlando 108.0 mi, Fort Pierce → Miramar 117.4, West Palm Beach → Miramar 63.1; mobile service anywhere in the US = FACT). A Rivian Space is not service.
- **Gap:** ICE dealer distances are UNKNOWN (SOURCES-V2 E #11, "assumed local, unverified"). Until Sherlock sources them, every gas current vehicle shows `Not scored: current service distance not published`. The same applies to Ford/GM/Ram/Tesla EV candidates (EV-certified dealer distance not sourced).
- Reason template: `Nearest Rivian service: Orlando, 108 mi road (OSRM) · Rivian Mobile Service available (+2)`.

**Cat 8 — Longevity (warranty remaining + degradation modifier)**
- Warranty points = 10 x min(years left ÷ original years, miles left ÷ original miles). EVs use the battery/drivetrain warranty; gas/diesel use the powertrain warranty.
- Warranty start = the in-service date if the listing or VIN states it. Otherwise **Jan 1 of the model year** (INFERENCE), labeled in the reason. Years left are computed to the scoring date.
- Modifiers: EV with **model-specific FACT** capacity data at this mileage 80–90% → −2, <80% → −4. Anecdotes, class-level data and listing SOH never trigger it, and SOH is never shown (internal-only lock stands). Gas/diesel over 150k mi → −2. Floor 0.
- **Commercial-use exclusion rule (NEW, Sherlock FACT, Rivian warranty guide):** the Rivian R1T/R1S consumer New Vehicle Limited Warranty (guide effective 2026-08-13, Exclusions) does not apply if "the vehicle or product is used primarily for business or commercial purposes." For a consumer R1T going into fleet work:
  - Warranty-remaining points = **0**. The cell shows `At risk` next to the number (e.g. `0.0 · At risk`).
  - Reason: `At risk: Rivian consumer warranty excludes vehicles used primarily for business or commercial purposes (Warranty Guide eff. 2026-08-13, Exclusions). 0 warranty points unless on Rivian Commercial warranty or Rivian confirms in writing.` + guide link.
  - Exceptions (score normally): `warrantyProgram = 'commercial'` (Rivian Commercial guide eff. 2024-12-31: 8 yr / 100k mi, 70% floor), or `oemWrittenConfirmation = true` (set only from a document Ted/ops attaches; default false).
  - Unit program unknown → treat as consumer (used R1T listings are consumer units).
  - **Generalized:** any OEM consumer warranty with a **sourced** commercial-use exclusion gets the same treatment for candidates and current vehicles. Data: per-OEM warranty entry `commercialUseExclusion {excluded: true, quote, url, effective}`. Today only Rivian is sourced. Ford/GM/Ram/Tesla warranties score normally until Sherlock sources an exclusion (no assumption either way).
- Fields: `battWarrantyYr/Mi`, `powertrainWarrantyYr/Mi`, `warrantyProgram`, `oemWrittenConfirmation`, `commercialUseExclusion`. Files: a_r1t_warranty.csv, b_preview_ev_specs.csv (`batt_warranty_*`), c_baseline_warranty.csv, a_r1t_degradation.csv / b_degradation_class.csv (context only; class-level data never triggers the modifier).
- 2025 R1T "Large Plus": warranty UNKNOWN → `Not scored: warranty terms not published`.

**Cat 9 — Energy ¢/mi (FL prices)**
- EV: ¢/mi = `epaKwhPer100mi` ÷ 100 x FL **commercial** electricity ¢/kWh (EIA EPM Table 5.6.A, latest month). EPA kWh/100 mi is wall-to-wheels, so no extra charging-loss factor is applied.
- Gas: ¢/mi = 100 x FL regular $/gal (**AAA FL daily**) ÷ `epaCombMpg`. Diesel: AAA FL diesel. Midgrade-rated engines (Ram 5.7 Hemi): D has no FL midgrade price, so use FL regular, and the reason says "rated on midgrade; priced at regular" (this shrinks the candidate's lead).
- Anchors: ≤5¢ → 10 · 10¢ → 7 · 20¢ → 4 · ≥30¢ → 0.
- **Van rule (Steve pick):** gas vans over 8,500 lb GVWR use the **labeled INF Fuelly mpg** (c_baseline_vans.csv): Transit-250 2017 15.3 / 2018 13.6, ProMaster 2500 2018 13.1. Use the MY-matched value; if there is no MY match, use the highest captured value for that model (shrinks the candidate's lead). The reason says `Fuelly crowd-sourced mpg (INF, not EPA-rated: GVWR >8,500)`. Transit-350 has no Fuelly value → `Not scored: mpg not published (van >8,500 GVWR)`. The T150 Wagon EPA proxy is not used.
- EVs with no EPA kWh/100 mi (E-Transit, ProMaster EV, BrightDrop, 2024 Cybertruck, Hummer 3X) → `Not scored: EPA efficiency not published`. Never derive efficiency from OEM range ÷ kWh.
- **Prices (section D, landed ~8:55 AM ET).** Data file `src/data/flEnergyPrices.ts`, static with `as_of` and `url` per row (no live fetch in the preview):
  - electricity_commercial 11.37 ¢/kWh (July 2026, EIA release 2026-09-24)
  - gasoline_regular_aaa $4.3679/gal (AAA "as of 9/27/26")
  - diesel_aaa $6.1040/gal (AAA "as of 9/27/26")
  - File: data-v2/d_fl_energy_prices.csv
- If a price field is null → `Not scored: FL energy price not loaded`. Woz may ship that state first and wire the D values in the same PR.
- Reason template: `48.1 kWh/100 mi (EPA) x 11.37¢/kWh FL commercial (EIA, Jul 2026) = 5.5¢/mi` · `$4.3679/gal FL regular (AAA, 9/27/26) ÷ 19 mpg (EPA) = 23.0¢/mi`.

**Cat 10 — Maintenance ¢/mi (class-level only)**
- Anchors: ≤4¢ → 10 · 8¢ → 7 · 12¢ → 4 · ≥15¢ → 0.
- **Same-basis rule (Steve decision):** both columns come from one study, **AAA Your Driving Costs 2026** (maintenance + repair + tires, 15k mi/yr, new vehicles, 5 yr):
  - EV pickup 10.79¢ (INF arithmetic: $1,618 ÷ 15,000)
  - gas half-ton 11.82¢ (FACT)
  - gas midsize 11.26¢ (FACT)
  - Argonne 2021 **scheduled-only** figures (BEV 6.1¢ vs ICEV 10.1¢, light-duty) are shown as a second line in the reason, not scored. Mixing Argonne EV 6.1 with AAA gas 11.82 is not allowed (different bases).
- The reason text must say class-level: `Class-level, not model-specific: AAA 2026 EV pickup 10.79¢/mi · Argonne scheduled-only BEV 6.1¢ vs ICEV 10.1¢` / `Class-level, not model-specific: AAA 2026 half-ton pickup 11.82¢/mi`.
- Vans (EV or gas): no van class in any source → `Not scored: van maintenance cost not published`.
- Files: a_maintenance.csv, b_maintenance_class.csv, c_maintenance.csv.

### 4. Reason-line rules
- One line per number: the input value(s), the arithmetic, the source name + date, and a link. FACT/INF shows as the words "INF" / "OEM estimate" / "class-level" inside the sentence, never as a pill.
- Missing inputs name the field (`Not scored: current payload not published`), never a dash.
- No adjectives and no comparisons in words. The difference column does the comparing.

### 5. Data wiring (no new sources; everything from SOURCES-V2)
- Extend `src/data/oemSpecs.ts` entries (candidates) with: `epaKwhPer100mi`, `seats` (null until sourced), `towLbNoWdh`, `battWarrantyYr/Mi`, `warrantyProgram`, `retained3yrPct[]`, `recallCampaignsMy`, `failurePatterns[]`, `maintClass`.
- New `src/data/baselineVehicles.ts` (current vehicles, from C): `epaCombMpg`, `epaFuel`, `fuelTankGal`, `powertrainWarrantyYr/Mi`, `retained3yrPct[]`, `recallCampaignsMy`, `failurePatterns[]`, `maintClass`; `payloadLb`, `towLb`, `seats`, service distance = null (render "Not published").
- New `src/data/serviceNetwork.ts` (a_r1t_service.csv), `src/data/warrantyRules.ts` (commercial-use exclusion entries), `src/data/flEnergyPrices.ts` (D), `src/data/scoreV2Rubric.ts` (anchors above as constants, each tagged `INFERENCE`).
- Every value carries a `url` in the data file; the readout links it.

---

## 6. Validation worked example — R1T vs typical 2016–20 gas half-ton (computed from SOURCES-V2, not tuned)

**Job (example intake):** supervisor / team lead · crew 2 · no tow · 120 mi/day · load 1,000 lb · shop Vero Beach · scored 2026-09-27.
**Current:** 2018 Ford F-150 3.5L EcoBoost 4x4, 10-spd (EPA id 39252: 19 mpg comb, Regular) · 23 gal tank (cars.com default trim) · 120,000 mi.
**Candidate:** 2022 Rivian R1T Quad Large (the most-listed R1T in our sample, n=10; median 41,446 mi, median ask $53,343). EPA id 44462: 314 mi, 48.1 kWh/100 mi · payload 1,764 lb · 8 yr / 175k battery warranty (consumer). The Quad Large config mapping is INF per A1.

| # | Category | Current: 2018 F-150 3.5EB | Candidate: 2022 R1T Quad Large | Diff |
|---|---|---|---|---|
| 1 | Range fit | **10.0**: 23 gal x 19 mpg = 437 mi x 0.7 = 306 mi vs 120 (2.55) | **10.0**: 314 mi EPA x 0.7 = 220 mi vs 120 (1.83) | 0.0 |
| 2 | Payload / cargo | Not scored: current payload not published | Not scored (R1T 1,764 lb vs 1,000 = 1.76 → would be 10) | drops out |
| 3 | Cab / crew | Not scored: seating not published | Not scored | drops out |
| 4 | Tow | Not used by this job | Not used by this job | drops out |
| 5 | Resale 3-yr | **10.0**: iSeeCars 81.1% (model-level) | **4.4**: Black Book 46.3% (36-mo, % MSRP) · iSeeCars 66.0%; lower used | −5.6 |
| 6 | Reliability | **0.0**: 19 NHTSA campaigns MY2018 (all engines/bodies; open status not checked) · CSP 21N03 cam phaser | **0.0**: 12 NHTSA campaigns MY2022 (open status not checked) · TSBs RCA-30-22-001-1, RSB-60-22-001-1 | 0.0 |
| 7 | Service network | Not scored: current service distance not published | Not scored (R1T: Orlando 108 mi → 0 + mobile 2 = 2.0) | drops out |
| 8 | Longevity | **0.0**: powertrain 5 yr/60k expired (MY2018, 120k mi); ≤150k, no modifier | **0.0 · At risk**: consumer warranty commercial-use exclusion (would be 4.1: 3.26 of 8 yr left, 133.6k of 175k mi left) | 0.0 |
| 9 | Energy ¢/mi | **2.8**: $4.3679 ÷ 19 = 23.0¢/mi | **9.7**: 48.1 kWh/100 x 11.37¢ = 5.5¢/mi | +6.9 |
| 10 | Maintenance ¢/mi | **4.1**: AAA 2026 half-ton 11.82¢ (class-level) | **4.9**: AAA 2026 EV pickup 10.79¢ (class-level) | +0.8 |
| | **Total** | **26.9 / 60** | **29.0 / 60** | **+2.1** |

Points possible = 60 (6 scored categories), which exactly meets the 60 floor. One more missing input would make this pair show "Score incomplete". The parentheticals in "Not scored" rows are for Ted/Steve only; they are **not** rendered in the UI.

**Variant, same job:** 2023 R1T Dual Large 21" (EPA 47000: 352 mi, 43.2 kWh/100 mi; 23,188 median mi) = range 10.0, resale 4.4, reliability 0.0 (8 campaigns), longevity 0.0 At risk, energy 10.0 (4.9¢), maintenance 4.9 → **29.3 / 60 vs 26.9 / 60, +2.4**.

**Honest read (numbers only, for Ted):** under strict sourcing the R1T leads by +2.1 of 60. Energy (+6.9) carries it, and resale (−5.6) offsets most of that. Longevity is 0 for both (the commercial-use exclusion zeroes the R1T's 4.1). Reliability is 0 for both (the no-VIN campaign-count fallback floors both). How the pending inputs would move it:
- **Service (largest swing):** R1T at Vero Beach = 2.0. If Sherlock sources a Ford dealer ≤15 road mi (unverified today), F-150 = 10 → both /70 → **31.0 vs 36.9, −5.9**. At West Palm Beach the R1T scores 5.7 (Miramar 63.1 mi + mobile).
- **Resale same basis** (iSeeCars for both: R1T 66.0% → 9.2): +4.8 → **+6.9**.
- **Rivian Commercial warranty or written OK:** longevity 4.1 → **+6.2**.
- **Payload / cab:** R1T scores 10 on both; the F-150 also scores 10 if its published payload is ≥1,250 lb and it seats ≥2, which leaves the difference unchanged.
- **Residential electricity (15.03¢)** instead of commercial: R1T energy 8.7 → −1.0. **EIA weekly gas ($4.217)** instead of AAA: F-150 energy 3.1 → −0.3. **F-150 4x2 (21 mpg):** energy 3.7 → −0.9.

## 7. Acceptance checklist — Steve Pages bar (live site, hard refresh, record script hash)
1. [ ] Dial tap opens the v2 readout with **10 category rows** in §3 order, columns **Category | Current | Candidate**.
2. [ ] The Current column names the current vehicle (year / make / model / engine) from intake or the package. No current vehicle → "Score incomplete: current vehicle not entered", no totals.
3. [ ] Every number has a one-line reason with the input value(s), arithmetic and a working source link. Spot-check 3 links (EPA, Rivian warranty guide, AAA/EIA).
4. [ ] Totals row shows `NN.N / PP` for both columns with **the same PP**. Difference is signed (`+`/`−`) to 1 decimal and equals candidate − current of the displayed rounded values.
5. [ ] Non-towing job: Tow row reads "Not used by this job" in both columns and PP drops by 10 (e.g. `/ 90` when nothing else is missing).
6. [ ] A missing input reads "Not scored: <field> …" in **both** columns and drops out. With PP < 60 → "Score incomplete: key data missing" and no totals/difference.
7. [ ] R1T in any package: Longevity shows `0.0 · At risk` with the commercial-use exclusion reason + guide link. HF-3 is not triggered by it, and the unit stays listed.
8. [ ] R1T resale reason shows **both** 46.3% (Black Book) and 66.0% (iSeeCars), with 46.3% used (4.4 pts).
9. [ ] Energy reasons show the FL price with its as-of date (EIA Jul 2026 commercial 11.37¢; AAA 9/27/26 regular $4.3679), or "Not scored: FL energy price not loaded" if unwired. Vans: Fuelly row labeled INF / not EPA-rated. Transit-350 and non-EPA EVs show Not scored.
10. [ ] Maintenance reasons include the words "class-level, not model-specific". Vans show Not scored.
11. [ ] Card: dial right of price shows `NN.N / PP` plus `±N.N vs current` beneath. Candidates are ordered by total (normalized when PP differs). Sidegrades are still visible.
12. [ ] Zero occurrences on the page of: Best, Worst, Best fit, Worst fit, Worth it, SOH, battery health, FACT pill, better, worse, good, bad, strong, weak. Zero `—` dashes in spec or score cells (text search the DOM).
13. [ ] Supervisor preset + R1T vs 2018 F-150 3.5EB 4x4 at 120 mi/day, Vero Beach, no tow → **26.9 / 60 vs 29.0 / 60, +2.1** (matches §6 while the §6 gaps stay open).
14. [ ] PR #1 still **draft**, not merged. The ship note lists the script hash and the per-category R1T vs current points.

## Woz
Quote **this** file in the cloud ship prompt, plus `CLEARED-FOR-WOZ-SCORE-UI.md`, `CLEARED-FOR-WOZ-SCORE-DIAL-TAP.md`, `oem-specs/CLEARED-FOR-WOZ-OEM-SPECS.md`, and SOURCES-V2 + data-v2 as the only data inputs. Ship to `Burnsted/fleetfit-preview` **PR #1 draft only**. Put the data files with source URLs in the diff so Steve can spot-check them. Do not tune anchors. If the §6 numbers don't reproduce, report the per-category points rather than adjusting. Ping Steve + Jarvis with the hard-refresh URL + script hash when live. **No merge.**

## Open for Ted (override any; defaults above ship until then)
1. Anchors in cats 1–10 are Steve INFERENCE.
2. Conflict rule = shrink the candidate's lead (R1T resale 46.3%, not 66.0%).
3. Maintenance same-basis = AAA 2026 for both columns (Argonne shown, not scored).
4. Energy uses FL **commercial** electricity (not residential) and AAA daily gas (not EIA weekly).
5. Gas vans use Fuelly INF mpg (not "Not scored"). Transit-350 stays Not scored.
6. No-VIN reliability fallback (−2 per MY campaign) floors nearly every truck at 0. A VIN open-recall lookup is the fix.
7. Unknown warranty start = Jan 1 of the model year.
8. The 60-point floor is borderline for current gas vehicles until Sherlock adds baseline payload, seats, tow and dealer distance.
9. Life Delta retired as a category.
10. Rank normalizes by points possible when PP differs.

**Sherlock asks (to close the §6 gaps):** 2016–20 baseline payload + tow + seats by cab · R1T + preview EV seats · Ford/GM/Ram/Toyota dealer road miles from Vero Beach / Fort Pierce / WPB (plus EV-certified for Lightning/Silverado/Sierra) · commercial-use exclusion check for Ford, GM, Ram, Tesla consumer warranties · FL midgrade price · van-class maintenance ¢/mi.
