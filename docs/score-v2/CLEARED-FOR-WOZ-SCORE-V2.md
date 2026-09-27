# CLEARED-FOR-WOZ — Replacement Score v2 (Current | Candidate, 10 x 10) · Steve Jobs · ~9:05 AM ET 2026-09-27

**Ted:** ~8:18 AM ET + ~8:32 AM ET (numeric-only lock) via Jarvis: `ROLE-FIT-MIDSIZE-REDLINE-2026-09-27.md`
**Rubric draft:** `SCORE-V2-RUBRIC-DRAFT-2026-09-27.md` (~8:50 AM ET). This file supersedes it.
**Sources:** Sherlock `SOURCES-V2-2026-09-27.md` + `data-v2/*.csv`. A (R1T), B (preview EVs), C (gas baselines), D (FL prices) and F (gap fill, ~9:15 AM ET) are all merged. Also `RIVIAN-COMMERCIAL-WARRANTY-2026-09-27.md` + `data-v2/rivian_warranty_compare.csv`.
**Host:** `Burnsted/fleetfit-preview` PR #1 draft · **no merge**
**Replaces:** v1 weighted model (`CLEARED-FOR-WOZ.md` weights, `REPLACEMENT-SCORE-PRODUCT-BAR.md`, the `specUnknown` cap, the v1 category list in `SCORE-CATEGORIES-DRAFT.md`).
**Keeps:** `CLEARED-FOR-WOZ-SCORE-UI.md` (dial right of price) · `CLEARED-FOR-WOZ-SCORE-DIAL-TAP.md` (tap → readout) · `oem-specs/CLEARED-FOR-WOZ-OEM-SPECS.md` ("Not published", never dashes; `src/data/oemSpecs.ts`).

All point anchors below are **INFERENCE** (Steve's thresholds) until Ted overrides them. The data values they read are FACT or INF exactly as labeled in SOURCES-V2.


## Addendum 2026-09-27 (section F) · Steve · ~9:25 AM ET
**Ted:** ~9:17 AM ET follow-up. **Inputs:** SOURCES-V2 §F + `data-v2/f_baseline_payload.csv`, `f_seat_counts.csv`, `f_service_distance.csv`, `f_warranty_commercial_use.csv`, `f_gm_capacity_floor.csv`; `RIVIAN-COMMERCIAL-WARRANTY-2026-09-27.md` + `data-v2/rivian_warranty_compare.csv`. Pre-F copy: `notes/CLEARED-FOR-WOZ-SCORE-V2.pre-F.bak.md`.

**Changelog**
1. **Cat 2 payload** now reads `f_baseline_payload.csv`. Order of use: the listing's trim/VIN payload, then the **low end** of the matching per-trim/config range (labeled), then the OEM range minimum. An OEM **max-only** row (e.g. F-150 3.5EB 3,230 lb) is a best-case ceiling and is never scored. Ted lock: this low-end rule applies to both columns and overrides the global conflict rule for payload.
2. **Cat 3 seats** now read `f_seat_counts.csv`. R1T and the preview pickups are 5 (FACT, third party). BrightDrop 600 and ProMaster EV are 2 (INFERENCE, labeled). Gas cargo-van seats are UNKNOWN unless the listing or VIN states them, so those rows show `Not scored`. If the cab is not entered, the lowest seat count across matching cabs is used.
3. **Cat 7 service** now reads `f_service_distance.csv` (road miles from ZIP 32960; OSRM = INFERENCE, addresses FACT): Ford 4.1 · Ram 4.9 · Chevrolet 2.6 · Toyota 5.1 · Tesla 65.0 · Rivian 107.2. Mobile service still adds +2, and only Rivian has it sourced. GM EV candidates show `Not scored` until an EV-certified dealer is sourced, because GM requires one for EV warranty repair (FACT).
4. **Cat 8 warranty:**
   - New per-listing `warrantyType` = `consumer` | `commercial_fleet`.
   - A used R1T defaults to `consumer` unless the seller documents a fleet sale.
   - Consumer R1T in work use = **0** and shows **"At risk, not counted"**.
   - Fleet-sold or ex-fleet R1T and Rivian Commercial Van: remaining = min(8 yr − age, 100k − odometer), minus 3 for an upfit not done by a Rivian Preferred Upfit Partner.
   - Rivian is the **only** OEM with a commercial-use exclusion (F.4 FACT). Ford, GM, Ram, Tesla and Toyota score normally.
   - GM qualifying fleets get 5 yr/100k powertrain.
   - Battery capacity floors are added to the reason line.
5. **§6 worked example re-run** with F data. Points possible rose from 60 to 90. Result: **F-150 56.9/90 · consumer R1T 51.0/90 (−5.9) · fleet-sold R1T on Commercial warranty 55.1/90 (−1.8)**. Nothing was tuned.
6. **§7 checklist** updated (items 5, 7, 13 revised; 15–18 added).

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
   - `At risk, not counted`: longevity only (§3 cat 8, consumer R1T in work use). The row stays in the totals and scores 0 warranty points.
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
- Ratio = payload used ÷ `job.loadLb`. Anchors: ≤0.8 → 0 · 0.9 → 4 · 1.0 → 7 · ≥1.25 → 10.
- **Payload used (Ted lock, 2026-09-27 addendum). Same order for both columns:**
  1. The listing's stated trim/VIN payload (door-jamb or window-sticker value), when the listing has one. Label: "listing".
  2. Otherwise the **low end** of the matching `config_trim_range` / `oem_config` rows in `f_baseline_payload.csv` for year + make + model + engine + drive (+ cab when entered). Label: `lowest per-trim value for <config> (cars.com, base-equipped trim)` or `(OEM catalog)`.
  3. Otherwise the `oem_engine_range` minimum. `proxy` rows are used only with the INFERENCE label in the reason.
  4. An **`oem_engine_max`-only** row is a best-case ceiling (e.g. F-150 3.5EB 3,230 lb: HD Payload Pkg build) and is **never** scored. With nothing else available → `Not scored: payload for this config not published`.
  - Candidate EVs use the same order against `payloadLb` (a_r1t_specs.csv, b_preview_ev_specs.csv, oemSpecs.ts). "Up to" and "as low as" values (Lightning) take the low figure.
  - Conflicts flagged in F.1 use the OEM value (Colorado 2020 1,578; Silverado 2019–20 OEM range; Tacoma 2017 1,620 not used).
- Vans with `job.cargoCuFt`: a cu ft ratio with the same anchors, and the score = min(payload score, volume score). Cu ft not published → payload ratio only, and the reason says "cargo volume Not published".
- Remaining gaps (from F.6): Transit-250 2016 and Transit 250/350 2020 3.7L (not offered) → `Not scored`. ProMaster 2500 2016–17 uses a diesel-trim proxy → INFERENCE label.
- Reason template: `1,485 lb (lowest per-trim value, 2018 F-150 3.5EB 4x4, cab not entered; cars.com base-equipped trim) vs 1,000 lb load (ratio 1.49)` + link.

**Cat 3 — Cab / crew fit** (step rule)
- Seats ≥ `job.crew` → 10 · one seat short → 4 · two or more short → 0. Surplus seats are neutral.
- Field: `seats`, read from `f_seat_counts.csv` (baselines by cab; EV rows; R1T 5).
  - The listing or VIN seat count wins when stated.
  - Cab not entered → use the **lowest** seat count across the model's cabs for that MY (e.g. F-150: Regular 3 / SuperCab 5 / SuperCrew 5 → 3).
  - A seat range within a cab (Silverado Crew 5–6) → use the low value.
- **Gas cargo vans (Transit-250/350, ProMaster 2500):** seats are UNKNOWN unless the listing or VIN states them → `Not scored: seating not published for this van`. The cars.com values (1 / 3 / 5 / wagon counts) are not used.
- **EV vans:**
  - BrightDrop 600 = 2 (INFERENCE from the FACT equipment list: driver + passenger jump seat).
  - ProMaster EV = 2 (INFERENCE: spec-sheet jump seat).
  - E-Transit: C&D/Edmunds say 2 and cars.com says 1. Global conflict rule applies: as a candidate it scores on **1** unless the listing states 2, and the reason shows both.
  - The INFERENCE label appears in the reason text.
- Reason template: `5 seats (cars.com) vs crew 2` · `3 seats (lowest across F-150 cabs; cab not entered) vs crew 2`.

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
- **Vero Beach (ZIP 32960 centroid), `f_service_distance.csv` `road_mi`.** OSRM route = INFERENCE; address = FACT.

  | Make | Nearest service | Road mi | Points |
  |---|---|---|---|
  | Chevrolet | Dyer Chevrolet | 2.6 | 10 |
  | Ford | Mullinax Ford | 4.1 | 10 |
  | Ram | Vatland CDJR | 4.9 | 10 |
  | Toyota | Toyota of Vero Beach | 5.1 | 10 |
  | Tesla | Merritt Island | 65.0 | 3.5 |
  | Rivian | Orlando | 107.2 | 0 + 2 mobile = 2.0 |

- Fort Pierce and West Palm Beach: only Rivian is sourced (a_r1t_service.csv: 117.4 / 63.1 mi). Other makes at those origins → `Not scored: service distance not published for <city>`.
- Mobile service: **Rivian only** (FACT). Ford, GM, Ram, Toyota and Tesla mobile service are UNKNOWN, so no +2.
- **EV candidates at franchised dealers:**
  - GM EVs (Silverado EV, Sierra EV, Hummer EV, BrightDrop): the 2024 Chevrolet EV warranty requires EV warranty repairs at an EV-certified dealer (FACT), and Dyer's certification is UNKNOWN → `Not scored: EV-certified dealer distance not published`.
  - Ford EVs (Lightning, E-Transit): score on the Mullinax distance. The reason says "EV certification not verified".
- A Rivian Space (West Palm Beach) is retail, not service. The planned Tesla Port St. Lucie site is not open (INFERENCE) and is not used.
- Reason template: `Nearest Rivian service: Orlando, 107.2 road mi from 32960 (OSRM) · Rivian Mobile Service available (+2)` · `Mullinax Ford, Vero Beach: 4.1 road mi (OSRM)`.

**Cat 8 — Longevity (warranty remaining + degradation modifier)**
- Warranty points = 10 x min(years left ÷ original years, miles left ÷ original miles). EVs use battery/drivetrain; gas/diesel use powertrain. Floor 0.
- Warranty start = the in-service / first-delivery date if the listing or VIN states it. Otherwise **Jan 1 of the model year** (INFERENCE), labeled. Years left are computed to the scoring date.
- Modifiers: EV with **model-specific FACT** capacity data at this mileage 80–90% → −2, <80% → −4. Anecdotes, class-level data and listing SOH never trigger it, and SOH is never shown. Gas/diesel over 150k mi → −2.
- **Per-listing `warrantyType` (new): `consumer` | `commercial_fleet`.**
  - A used R1T defaults to **`consumer`** unless the seller documents a Rivian Fleet Sales / commercial sale (invoice, warranty record or listing text naming the Commercial warranty).
  - Rivian Commercial Van 500/700 is always `commercial_fleet` (fleet-only product, FACT).
  - Amazon-DSP EDVs → `Not scored: EDV warranty terms not published` (DSP guide not retrieved).
- **Consumer R1T in work use** (every FleetFit job counts as work use):
  - Warranty points = **0**. The cell shows **`0.0 · At risk, not counted`**. The row stays in both totals.
  - Reason: `At risk, not counted: Rivian consumer warranty does not apply if "used primarily for business or commercial purposes" (NVLW Guide Rev 15, eff. 2026-08-13, p16). Nominal consumer coverage left: <yr> yr / <mi> mi. Counts only on Rivian Commercial warranty or written Rivian confirmation.` + guide link.
  - Exception: `oemWrittenConfirmation = true`, set only from a document Ted/ops attaches (default false). Then score the consumer terms normally.
- **Fleet-sold / ex-fleet R1T, Rivian Commercial Van** (`commercial_fleet`):
  - Terms: Rivian Commercial NVLW Guide Rev 3, eff. 2024-12-31, p11. 8 yr / 100,000 mi battery + drivetrain, 70% floor (FACT; the van's floor is INFERENCE via the same guide).
  - Remaining = min(8 yr − age, 100k − odometer). Age runs from the first commercial delivery date, or Jan 1 of MY if unstated (INFERENCE).
  - Points = 10 x min((8 − age) ÷ 8, (100,000 − odometer) ÷ 100,000).
  - **Upfit deduction (INFERENCE amount): −3** when the listing shows an upfit/modification not done by a Rivian Preferred Upfit Partner. The guide (p13) does not cover damage from such mods. Upfit not mentioned → no deduction. Upfit present but installer unknown → −3 and the reason says "installer not documented".
  - Field `upfit` = `none` | `preferred_partner` | `other` | `unknown`.
- **Other OEMs score normally.** F.4 (FACT) found **no** express-warranty commercial-use exclusion for Ford, GM (Chevy/GMC), Ram/FCA, Tesla or Toyota. Ford and Ram disclaim only *implied* warranties for business use, which is not scored. Rivian is the only OEM with `commercialUseExclusion`. The ProMaster EV booklet was not located; it scores normally per Ted.
- **GM qualifying fleets:** a GM gas current vehicle or candidate documented as bought under a qualifying fleet account uses **5 yr / 100k** powertrain (FACT, GM 2019 Chevrolet and 2023 GMC booklets) instead of 5/60k. All 2016–20 units are past 5 years, so they still score 0.
- **Battery capacity floor** (shown in the reason line, not scored separately). Field `capacityFloorPct` + label:

  | OEM / models | Floor | Label / source |
  |---|---|---|
  | Rivian consumer and Commercial | 70% | FACT |
  | Ford BEV | 70% (65% cutaway / chassis cab) | FACT, Ford BEV guide |
  | Chevrolet EV (2024 MY booklet) | 75% | FACT, `f_gm_capacity_floor.csv` |
  | 2026 Silverado EV | 75% | INFERENCE (2024 booklet carried forward; F.5 lists it UNKNOWN) |
  | GMC Sierra EV, HUMMER EV, BrightDrop 600 | 75% | INFERENCE |
  | Tesla | 70% | FACT |
  | Ram ProMaster EV | Not published | — |

- Fields: `battWarrantyYr/Mi`, `powertrainWarrantyYr/Mi`, `warrantyType`, `upfit`, `oemWrittenConfirmation`, `commercialUseExclusion`, `capacityFloorPct`. Files: a_r1t_warranty.csv, rivian_warranty_compare.csv, f_warranty_commercial_use.csv, f_gm_capacity_floor.csv, b_preview_ev_specs.csv, c_baseline_warranty.csv.
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
- Extend `src/data/oemSpecs.ts` entries (candidates) with: `epaKwhPer100mi`, `seats` (f_seat_counts.csv), `towLbNoWdh`, `battWarrantyYr/Mi`, `capacityFloorPct`, `retained3yrPct[]`, `recallCampaignsMy`, `failurePatterns[]`, `maintClass`.
- New `src/data/baselineVehicles.ts` (current vehicles, from C): `epaCombMpg`, `epaFuel`, `fuelTankGal`, `powertrainWarrantyYr/Mi`, `retained3yrPct[]`, `recallCampaignsMy`, `failurePatterns[]`, `maintClass`; `payloadLb` / `payloadBasis` (from f_baseline_payload.csv per §3 cat 2), `seats` (f_seat_counts.csv), `towLb` = null (render "Not published").
- New `src/data/serviceNetwork.ts` (f_service_distance.csv for Vero Beach 32960, all makes; a_r1t_service.csv for Rivian from Fort Pierce and WPB), `src/data/warrantyRules.ts` (commercial-use exclusion: Rivian only per f_warranty_commercial_use.csv; Rivian consumer vs Commercial terms per rivian_warranty_compare.csv; GM fleet 5/100k; capacity floors per f_gm_capacity_floor.csv), `src/data/flEnergyPrices.ts` (D), `src/data/scoreV2Rubric.ts` (anchors above as constants, each tagged `INFERENCE`).
- Per-listing fields (listing overlay, not oemSpecs): `warrantyType` (`consumer` | `commercial_fleet`, R1T default `consumer`), `upfit`, `oemWrittenConfirmation`, and the listing payload/seats when stated.
- Every value carries a `url` in the data file; the readout links it.

---

## 6. Validation worked example — R1T vs typical 2016–20 gas half-ton (re-run with section F, not tuned)

**Job (example intake, unchanged):** supervisor / team lead · crew 2 · no tow · 120 mi/day · load 1,000 lb · shop Vero Beach 32960 · scored 2026-09-27.

**Current:** 2018 Ford F-150 3.5L EcoBoost 4x4, 10-spd (EPA 39252: 19 mpg comb, Regular) · 23 gal tank (cars.com default trim) · 120,000 mi. Cab not entered.

**Candidates:**
- **A:** 2022 Rivian R1T Quad Large, `warrantyType = consumer` (the default). Most-listed R1T in our sample (n=10), 41,446 mi. EPA 44462: 314 mi, 48.1 kWh/100 mi · payload 1,764 lb · 5 seats · 8 yr / 175k consumer battery warranty. The Quad Large mapping is INF per A1.
- **B:** the same unit spec, fleet-sold: `warrantyType = commercial_fleet` (seller documents a Rivian Fleet Sales sale), `upfit = none`. Everything but cat 8 is identical to A, so B isolates the warranty rule.

| # | Category | Current: 2018 F-150 3.5EB | A: R1T consumer | B: R1T fleet-sold (Commercial) | Diff A | Diff B |
|---|---|---|---|---|---|---|
| 1 | Range fit | **10.0**: 23 gal x 19 = 437 mi x 0.7 = 306 vs 120 (2.55) | **10.0**: 314 x 0.7 = 220 vs 120 (1.83) | **10.0** | 0.0 | 0.0 |
| 2 | Payload / cargo | **10.0**: 1,485 lb (lowest per-trim value, 2018 3.5EB 4x4, cab not entered; cars.com) vs 1,000 (1.49). OEM max 3,230 not used (ceiling) | **10.0**: 1,764 lb vs 1,000 (1.76) | **10.0** | 0.0 | 0.0 |
| 3 | Cab / crew | **10.0**: 3 seats (lowest across F-150 cabs) vs crew 2 | **10.0**: 5 seats (cars.com) vs crew 2 | **10.0** | 0.0 | 0.0 |
| 4 | Tow | Not used by this job | Not used by this job | Not used by this job | drops out | drops out |
| 5 | Resale 3-yr | **10.0**: iSeeCars 81.1% | **4.4**: Black Book 46.3% · iSeeCars 66.0%; lower used | **4.4** | −5.6 | −5.6 |
| 6 | Reliability | **0.0**: 19 NHTSA campaigns MY2018 (open status not checked) · CSP 21N03 | **0.0**: 12 campaigns MY2022 · 2 TSBs | **0.0** | 0.0 | 0.0 |
| 7 | Service network | **10.0**: Mullinax Ford 4.1 road mi | **2.0**: Rivian Orlando 107.2 mi → 0 + mobile 2 | **2.0** | −8.0 | −8.0 |
| 8 | Longevity | **0.0**: powertrain 5 yr/60k expired; ≤150k mi, no modifier | **0.0 · At risk, not counted**: consumer exclusion (nominal 3.26 yr / 133.6k mi left) | **4.1**: Commercial 8 yr/100k: min(3.26/8 = 0.41, 58.6k/100k = 0.59); no upfit | 0.0 | +4.1 |
| 9 | Energy ¢/mi | **2.8**: $4.3679 ÷ 19 = 23.0¢ | **9.7**: 48.1 x 11.37¢ = 5.5¢ | **9.7** | +6.9 | +6.9 |
| 10 | Maintenance ¢/mi | **4.1**: AAA half-ton 11.82¢ (class-level) | **4.9**: AAA EV pickup 10.79¢ (class-level) | **4.9** | +0.8 | +0.8 |
| | **Total** | **56.9 / 90** | **51.0 / 90** | **55.1 / 90** | **−5.9** | **−1.8** |

Nothing is "Not scored" in this pair. Only Tow drops out (Not used by this job), so points possible = 90.

**Extra line, not a table column (same job, sourced inputs):** a fleet-sold **2024 R1T Dual Large 21"** (EPA 47868: 352 mi, 43.2 kWh/100 mi; 2024 median 16,856 mi; 7 campaigns MY2024) scores:

| Range | Payload | Cab | Resale | Reliability | Service | Longevity | Energy | Maintenance | Total | Diff |
|---|---|---|---|---|---|---|---|---|---|---|
| 10 | 10 | 10 | 4.4 | 0 | 2.0 | 6.6 (min(5.26/8, 83.1k/100k)) | 10 (4.9¢) | 4.9 | **57.9 / 90** | **+1.0** |

The same 2024 unit on a consumer warranty scores 51.3 / 90 (−5.6). Caveat: Rivian Commercial guide Rev 1 is dated 2023-11-27, so a Commercial-warranty 2022 unit (candidate B) may be rare. Which warranty applied to a 2022 fleet sale is UNKNOWN; B is shown to isolate the rule.

**Honest read (numbers only, for Ted):**
- With F data the F-150 leads a consumer R1T by 5.9 of 90 and a fleet-sold 2022 R1T by 1.8.
- Energy (+6.9) is still the R1T's largest category gain.
- Service (−8.0 at Vero Beach, 107.2 mi to Orlando) and resale (−5.6) outweigh it.
- The Commercial warranty recovers 4.1 on a 2022 unit and 6.6 on a 2024 unit.

Moves (each applied alone, from the A/B totals):
- **Resale same basis** (iSeeCars for both, R1T 66.0% → 9.2): +4.8 → A −1.1 · B +3.0.
- **Shop at West Palm Beach:** R1T service 5.7 (Miramar 63.1 mi + mobile), but Ford WPB distance is not sourced → that pair would show service Not scored.
- **Residential electricity** (15.03¢): R1T energy 8.7 → −1.0. **EIA weekly gas** ($4.217): F-150 energy 3.1 → −0.3. **Argonne maintenance pair** (6.1 vs 10.1¢): +2.2.
- **F-150 cab entered as SuperCab 4x4** (2,071 lb, 5 seats): no change (both already 10).

## 7. Acceptance checklist — Steve Pages bar (live site, hard refresh, record script hash)
1. [ ] Dial tap opens the v2 readout with **10 category rows** in §3 order, columns **Category | Current | Candidate**.
2. [ ] The Current column names the current vehicle (year / make / model / engine) from intake or the package. No current vehicle → "Score incomplete: current vehicle not entered", no totals.
3. [ ] Every number has a one-line reason with the input value(s), arithmetic and a working source link. Spot-check 3 links (EPA, Rivian warranty guide, AAA/EIA).
4. [ ] Totals row shows `NN.N / PP` for both columns with **the same PP**. Difference is signed (`+`/`−`) to 1 decimal and equals candidate − current of the displayed rounded values.
5. [ ] Non-towing pickup job with section F wired: Tow reads "Not used by this job" in both columns and the totals read **`/ 90`** (no other drop-outs for F-150 / R1T at Vero Beach).
6. [ ] A missing input reads "Not scored: <field> …" in **both** columns and drops out. With PP < 60 → "Score incomplete: key data missing" and no totals/difference.
7. [ ] R1T with `warrantyType = consumer` (the default): Longevity shows **`0.0 · At risk, not counted`** with the p16 exclusion quote, the nominal coverage left and the guide link. HF-3 is not triggered, and the unit stays listed.
8. [ ] R1T resale reason shows **both** 46.3% (Black Book) and 66.0% (iSeeCars), with 46.3% used (4.4 pts).
9. [ ] Energy reasons show the FL price with its as-of date (EIA Jul 2026 commercial 11.37¢; AAA 9/27/26 regular $4.3679), or "Not scored: FL energy price not loaded" if unwired. Vans: Fuelly row labeled INF / not EPA-rated. Transit-350 and non-EPA EVs show Not scored.
10. [ ] Maintenance reasons include the words "class-level, not model-specific". Vans show Not scored.
11. [ ] Card: dial right of price shows `NN.N / PP` plus `±N.N vs current` beneath. Candidates are ordered by total (normalized when PP differs). Sidegrades are still visible.
12. [ ] Zero occurrences on the page of: Best, Worst, Best fit, Worst fit, Worth it, SOH, battery health, FACT pill, better, worse, good, bad, strong, weak. Zero `—` dashes in spec or score cells (text search the DOM).
13. [ ] Supervisor preset + 2018 F-150 3.5EB 4x4 (cab not entered, 120k mi) at 120 mi/day, 1,000 lb, Vero Beach, no tow:
    - vs consumer 2022 R1T Quad Large → **56.9 / 90 vs 51.0 / 90, −5.9**
    - vs the same R1T set to `commercial_fleet` → **55.1 / 90, −1.8**
14. [ ] PR #1 still **draft**, not merged. The ship note lists the script hash and the per-category R1T vs current points.
15. [ ] Payload reason for a gas F-150 names the **lowest per-trim** value and its config. The OEM max (3,230 lb for 3.5EB) never appears as the scored value. A listing with a stated payload uses the listing value.
16. [ ] Service reasons at Vero Beach show the F-row miles: Ford 4.1 · Ram 4.9 · Chevrolet 2.6 · Toyota 5.1 · Tesla 65.0 · Rivian 107.2 (+2 mobile). GM EV candidates show "Not scored: EV-certified dealer distance not published".
17. [ ] Seats: a gas cargo van without listing/VIN seats shows "Not scored: seating not published for this van". BrightDrop 600 / ProMaster EV reasons show 2 seats with "INFERENCE".
18. [ ] Longevity reason for Ford / GM / Tesla EVs shows the capacity floor with its label (Ford 70% FACT; Chevrolet 75% FACT; Sierra EV / Hummer / BrightDrop 75% INFERENCE). No "At risk" appears on any non-Rivian unit.

## Woz
Quote **this** file in the cloud ship prompt, plus `CLEARED-FOR-WOZ-SCORE-UI.md`, `CLEARED-FOR-WOZ-SCORE-DIAL-TAP.md`, `oem-specs/CLEARED-FOR-WOZ-OEM-SPECS.md`, and SOURCES-V2 + data-v2 as the only data inputs. Ship to `Burnsted/fleetfit-preview` **PR #1 draft only**. Put the data files with source URLs in the diff so Steve can spot-check them. Do not tune anchors. If the §6 numbers don't reproduce, report the per-category points rather than adjusting. Ping Steve + Jarvis with the hard-refresh URL + script hash when live. **No merge.**

## Open for Ted (override any; defaults above ship until then)
1. Anchors in cats 1–10 are Steve INFERENCE.
2. Conflict rule = shrink the candidate's lead (R1T resale 46.3%, not 66.0%). **Payload and seats use your low-end rule for both columns instead** (2026-09-27 addendum).
3. Maintenance same-basis = AAA 2026 for both columns (Argonne shown, not scored).
4. Energy uses FL **commercial** electricity and AAA daily gas.
5. Gas vans use Fuelly INF mpg; Transit-350 stays Not scored.
6. No-VIN reliability fallback (−2 per MY campaign) floors nearly every truck at 0. A VIN open-recall lookup is the fix.
7. Unknown warranty start = Jan 1 of the model year.
8. Life Delta retired as a category.
9. Rank normalizes by points possible when PP differs.
10. **Upfit deduction = −3** (amount is INFERENCE; also applied when the installer is not documented).
11. **E-Transit seats** score on 1 (cars.com) as a candidate unless the listing says 2.
12. **GM EV candidates** show service Not scored until an EV-certified dealer is sourced. Ford EVs are scored on the dealer distance with "EV certification not verified".
13. **2026 Silverado EV 75% floor** is labeled INFERENCE, not FACT. The FACT source is the 2024 Chevrolet EV booklet, and F.5 lists 2026 as UNKNOWN.

**Sherlock asks (remaining):**
- Ford/Chevy/Ram/Toyota/Tesla service miles from Fort Pierce and West Palm Beach
- EV-certified status for Dyer Chevrolet and Mullinax Ford
- OEM mobile service (Ford Pro, GM, Tesla)
- Gas cargo-van OEM seat counts
- Tow ratings for the 2016–20 baselines (needed for towing jobs)
- FL midgrade price
- Van-class maintenance ¢/mi
- EDV (DSP) warranty terms
- ProMaster EV warranty booklet
