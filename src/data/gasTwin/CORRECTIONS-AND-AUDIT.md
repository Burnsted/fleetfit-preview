# Round 3 changes (Steve Jobs follow-ups)

**Date:** 2026-10-03  
**Branch:** `cursor/gas-twin-corrections-round3-be77` (from `cursor/gas-twin-corrections-round2-0379` / draft PR 17)  
**Files:** `gas_twin_pairs.csv` · `gas_twin_factors.csv` · `_generate_gas_twins.py` · this audit  
**Artifacts:** `/opt/cursor/artifacts/gas_twin_pairs.csv` · `/opt/cursor/artifacts/gas_twin_factors.csv` · `/opt/cursor/artifacts/CORRECTIONS-AND-AUDIT.md`

Two reviewer follow-ups only. Every other cell preserved. Generator regenerated pairs/factors after the value edits; **no primary_twin flips**.

### Round 3 changed cells (row id = vehicle · factor)

| Row id | Old | New | Source URL |
|--------|-----|-----|------------|
| Ram ProMaster 3500 Cargo Standard Roof 136-inch WB · payload | 4820 *(Canadian Birchwood ICE PDF)* | **4680** *(US differs — use US)* | https://www.motortrend.com/cars/ram/promaster/2025 |
| Ram ProMaster 3500 Cargo Standard Roof 136-inch WB · tow *(source label)* | 6700 @ birchwoodchrysler.ca PDF | **6700** kept; labeled **Canadian dealer PDF, US not confirmed** | Canadian dealer PDF, US not confirmed — https://www.birchwoodchrysler.ca/wp-content/uploads/2024/10/2025-Ram-Promaster-Payload-Towing.pdf |
| Ford Transit Cargo Long-EL high roof T-250 · msrp | 58995 *(KBB specs High Roof Extended; that specs table is AWD)* | **55095** *(RWD base for High Roof Extended Length)* | https://www.kbb.com/ford/transit-250-cargo-van/2025/ |
| Ford Transit Cargo Long-EL high roof T-250 · score_price_closeness *(vs E-Transit Long-EL)* | 9.4 | **10.0** | recomputed from MSRP |
| Ford Transit Cargo Long-EL high roof T-250 · rank_metric *(vs E-Transit Long-EL)* | 6.5 | **6.6** | recomputed |

### Round 3 findings (detail)

1. **ProMaster 3500 Standard/Low Roof 136" payload — US differs from Canadian PDF.**  
   - Canadian Birchwood ICE payload PDF: **4,820** lb / tow **6,700** lb for 3500 · vehicle height 93.0" (Standard Roof) · 136" WB.  
   - MotorTrend US (preferred): *“maximum payload for the ProMaster is **4,680** pounds in the **3500 with the low roof and 136-inch wheelbase**.”*  
   - **Deck uses 4,680.** Both figures recorded here. KBB overview also cites class-leading payload **4,680** in body copy (FAQ elsewhere still says 4,820 lineup max without naming this trim).  
   - **Tow 6,700:** no preferred US page (Ram US / KBB style / Edmunds / C&D / MotorTrend / Ram US payload guide) opened that names tow for this exact 3500 Standard/Low Roof 136" config. MotorTrend’s tow figure is lineup max **6,910** for **1500 low roof 118"**, not this trim. Value **kept at 6,700** with source labeled **Canadian dealer PDF, US not confirmed**; `trim_match_checked=no`.

2. **Transit 250 Cargo High Roof Extended MSRP — $55,095 is the RWD base; $58,995 is AWD.**  
   - KBB overview names **High Roof Extended Length** kicking off at **$55,095**.  
   - KBB specs page lists High Roof Extended Length at **$58,995** and shows **Drivetrain AWD** across that comparison table.  
   - KBB style page `…/high-roof-extended-length/` lists **Drivetrain RWD** for that style.  
   - Ford US dealer price list (Gaudin Ford / State Fleet NV): **R3X** Transit 250 Cargo Van High Roof 148 WB.EL **RWD** MSRP **$55,095**; **R3U** same roof/WB.EL **AWD** MSRP **$58,995**.  
   - Deck MSRP updated to **55095**; cited source = KBB overview naming the style. Dependent price closeness vs E-Transit Long-EL **9.4 → 10.0**; that pair’s `rank_metric` **6.5 → 6.6**. Primary remains Express 2500 Cargo Extended.

### Round 3 primary twin check

| EV | Primary after round 2 | After round 3 | Change? |
|----|----------------------|---------------|---------|
| All deck EVs | (unchanged list) | same | **none** |

---

# Changes in this re-issue (round 2)

**Date:** 2026-10-03  
**Branch:** `cursor/gas-twin-corrections-round2-0379` (from `cursor/gas-twin-corrections-audit-3bee` / draft PR 15)  
**Files:** `gas_twin_pairs.csv` · `gas_twin_factors.csv` · `_generate_gas_twins.py` · this audit  
**Artifacts:** `/opt/cursor/artifacts/gas_twin_pairs.csv` · `/opt/cursor/artifacts/gas_twin_factors.csv` · `/opt/cursor/artifacts/CORRECTIONS-AND-AUDIT.md`

Steve Jobs second spot-check: **9 of 14 confirmed OK (preserved)**; **5 wrong → fixed below**. Systemic pass: every unique payload / tow / MSRP / range cell re-checked for same make · model · year · trim · drive · cab/bed or roof/WB on the cited page. New column: `trim_match_checked` (`yes` / `no` / blank).

### Round-2 changed cells (row id = vehicle · factor)

| Row id | Old | New | Source URL |
|--------|-----|-----|------------|
| Ford F-150 SuperCrew 5.5-ft 4WD XLT · msrp | 45695 | **51915** | https://www.carweek.com/research/ford/f-150/2025 |
| Ford F-150 SuperCrew … · variant label | SuperCrew 5.5-ft 4WD XLT **2.7L** | SuperCrew 5.5-ft 4WD XLT *(engine unspecified; KBB style page showed 5.0)* | https://www.kbb.com/ford/f150%20supercrew%20cab/2025/xlt-pickup-4d-5-1-2-ft/ |
| Mercedes-Benz Sprinter 2500 Cargo diesel · tow *(source)* | 5000 @ eSprinter URL *(wrong vehicle)* | **5000** @ diesel Sprinter page | https://www.kbb.com/mercedes-benz/sprinter-2500-cargo/2025/ |
| Ram ProMaster · variant | Cargo matching roof/WB gas | **3500 Cargo Standard Roof 136-inch WB** | https://www.birchwoodchrysler.ca/wp-content/uploads/2024/10/2025-Ram-Promaster-Payload-Towing.pdf |
| Ram ProMaster 3500 Std Roof 136" · payload *(source)* | 4820 @ KBB (unnamed roof/WB; page also said 4,680 max) | **4820** named Standard Roof 136" / height 93.0" | same Ram ICE payload PDF |
| Ram ProMaster 3500 Std Roof 136" · tow | not confirmed | **6700** | same Ram ICE payload PDF |
| Ram ProMaster 3500 Std Roof 136" · cargo | 463 cu ft *(wrong config)* | **307.5 cu ft** | same Ram ICE payload PDF |
| Ram ProMaster 3500 Std Roof 136" · msrp | 47055 *(lineup starting, not this config)* | **not confirmed** | — |
| Ford E-Transit Cargo Long-EL high roof · msrp | 56295 *(C&D range top $53,095–$56,295)* | **56530** | https://www.kbb.com/ford/e-transit-350-cargo-van/2025/extended-length-high-roof/ |
| Ford E-Transit Cargo Long-EL high roof · payload *(source)* | 2799 @ C&D band only | **2799** High Roof/Extended Long Body | https://www.ford.ca/commercial-trucks/e-transit/features/ |
| Ford E-Transit Cargo Long-EL high roof · range | not confirmed | **142** | https://www.ford.ca/commercial-trucks/e-transit/features/ |
| Ford E-Transit Cargo Long medium roof · msrp | 53095 *(C&D range bottom)* | **54405** | https://www.kbb.com/ford/e-transit-350-cargo-van/2025/ |
| Ford E-Transit Cargo Long medium roof · range | 159 *(Low Roof figure)* | **148** | https://www.kbb.com/ford/e-transit-350-cargo-van/2025/specs/ |
| Ford E-Transit Cargo Long medium roof · payload | not confirmed | **3100** | https://www.ford.ca/commercial-trucks/e-transit/features/ |
| Ford E-Transit Cargo Long medium roof · cargo | 350 cu ft | **357.1 cu ft** | https://www.kbb.com/ford/e-transit-350-cargo-van/2025/specs/ |
| Chevrolet Silverado 1500 Crew Cab short bed 4WD WT · payload | 2174 *(Cars.com blocked for reviewer; GM Authority Crew Cab Short Bed 4WD 2.7L = 2020 and does not name WT)* | **not confirmed** | — |
| Chevrolet Silverado 1500 Crew Cab short bed 4WD WT · tow *(source)* | 9400 @ Cars.com | **9400** @ U.S. News named 4WD Crew Cab 147" Work Truck | https://cars.usnews.com/cars-trucks/chevrolet/silverado-1500/2025/specs/silverado-1500-crew-cab-short-box-4-wheel-drive-wt-458792 |
| *(schema)* gas_twin_factors.csv | — | added **`trim_match_checked`** column | — |

### Round-2 F-150 full-row check (only gas F-150 in set)

| Factor | Value | Trim match | Notes |
|--------|------:|:----------:|-------|
| payload | 2120 | yes | KBB SuperCrew XLT 4D 5½-ft **4WD** |
| tow | 7500 | yes | same page |
| msrp | 51915 | yes | Carweek **4x4 XLT SuperCrew 5.5 ft**; $45,695 is **2WD SuperCab 6.5-ft** (also Express Ext) |
| range | not confirmed | no | no EPA total-range cited |

No other F-150 gas trim rows exist in this deck — no further cross-trim slips found.

### Round-2 audit counts (unique vehicle × factor cells)

| Result | Count |
|--------|------:|
| Rows checked (payload/tow/MSRP/range unique) | **152** |
| Confirmed on openable page naming same trim/config (`trim_match_checked=yes`) | **96** |
| Blank / not confirmed (`trim_match_checked=no`) | **56** |
| Corrected vs PR-15 round-1 material cells | **17** (table above) |
| `trim_match_checked` blank (unchecked) on payload/tow/MSRP/range | **0** |

Preserved confirmed-OK (do not break): Lightning Pro **4WD SR 240**; Sierra Denali short-bed payload **1960**; eSprinter 170 tow **4100**; Express 2500 Ext MSRP **45695**; Ram Tradesman 4x4 5.6-ft MSRP **46875**; Transit 250 High Roof Extended MSRP **58995**; Rivian Delivery 700 range **160**; Cyberbeast tow **11000**; Sierra EV Denali tow **10500**.

### Primary twin changes (vs round-1 / PR 15)

| EV | Prior primary | New primary | Why |
|----|---------------|-------------|-----|
| Silverado EV WT SR | Silverado 1500 WT | **Sierra Denali 4WD short bed** | WT payload blanked → coverage/score drop |
| Cybertruck AWD | Silverado 1500 WT | **F-150 SuperCrew 5.5-ft 4WD XLT** | same |
| Cybertruck Cyberbeast | Silverado 1500 WT | **F-150 SuperCrew 5.5-ft 4WD XLT** | same |
| E-Transit Long medium | ProMaster (unnamed) | **Transit Medium Roof LWB T-250** | E-Transit medium filled; ProMaster renamed/MSRP blanked; same-badge Transit wins |
| E-Transit Long-EL | ProMaster | **Express 2500 Cargo Extended** | ProMaster no longer unnamed max-payload stand-in |
| BrightDrop 400 | ProMaster | **Express 2500 Cargo Extended** | ProMaster MSRP blank / config rename |
| BrightDrop 600 | ProMaster | **Express 3500 Cargo Extended** | same |
| ProMaster EV | ProMaster gas | **Sprinter 2500 Cargo diesel** | same-badge ProMaster weak after MSRP blank |
| eSprinter 144 | ProMaster | **Transit Medium Roof LWB T-250** | score/coverage shift |
| eSprinter 170 | Express 2500 Ext | **ProMaster 3500 Std Roof 136"** | renamed ProMaster still leads this set on numbers |
| RCV/EDV 500 | ProMaster | **Express 2500 Cargo Extended** | ProMaster shift |
| RCV/EDV 700 | ProMaster | **Express 3500 Cargo Extended** | ProMaster shift |
| Lightning Pro SR | F-150 SuperCrew | **F-150 SuperCrew** (kept; label drop 2.7L only) | — |
| Lightning Flash ER | Sierra Denali | **Sierra Denali** (kept) | — |
| Silverado EV LT ER | Sierra Denali | **Sierra Denali** (kept) | — |
| Sierra EV Denali Ext | Sierra 1500 Denali | **Sierra 1500 Denali** (kept) | — |
| R1T Dual / Max | Tacoma Limited 5-ft | **Tacoma Limited 5-ft** (kept) | — |
| EV Star | NPR-HD | **NPR-HD** (kept) | — |
| Hummer 2X | F-150 | **F-150** (kept; weak) | — |

### Decisions for Ted (round 2)

1. [ ] Accept F-150 XLT 4WD SuperCrew 5.5-ft MSRP **$51,915** (Carweek/Cars.com/JD Power family) vs prior Express-copied **$45,695**.
2. [ ] Accept blanking Silverado WT short-bed **payload** until a non-Cars.com page names WT with a single figure (GM Authority 2,020 for Crew Cab Short Bed 4WD 2.7L does not say WT).
3. [ ] Accept ProMaster deck trim as **3500 Standard Roof 136"** (payload 4820) rather than an unnamed “matching roof/WB” max.
4. [ ] OK that many van primaries left ProMaster after that rename + MSRP blank — prefer forcing same-badge Transit for E-Transit?
5. [ ] Accept E-Transit Medium / Long-EL trim-specific KBB MSRPs **$54,405 / $56,530** and Ford CA payload/range fills.
6. [ ] Keep Sprinter diesel tow **5000** with KBB diesel page (value unchanged; URL was the bug).

---

# Corrections and full audit — gas twin CSVs (round 1, retained)

**Date:** 2026-10-02  
**Branch:** `cursor/gas-twin-corrections-audit-3bee` (from `cursor/gas-twin-pairs-csv-f8fe` / draft PR 14)  
**Files:** `gas_twin_pairs.csv` · `gas_twin_factors.csv` · `_generate_gas_twins.py` · this audit  
**Artifacts:** `/opt/cursor/artifacts/gas_twin_pairs.csv` · `/opt/cursor/artifacts/gas_twin_factors.csv` · `/opt/cursor/artifacts/CORRECTIONS-AND-AUDIT.md`

## Top takeaways

1. **Steve Jobs’s six findings are fixed** with openable sources (or blanked): Transit Medium Roof LWB MSRP **$56,795**; F-150 XLT 4WD SuperCrew 5.5-ft payload/tow **2120 / 7500** (not lineup max); R1T Tacoma primary trim is now **Double Cab Limited 5-ft** (TRD Sport on KBB is 6-ft); Sierra Denali 4WD short-bed payload **1960**; Lightning Pro labeled **4WD SR** with EPA **240** (Pro ER1 = 320); Express / Silverado WT re-sourced off blocked Edmunds/JD Power pages.
2. **Full audit of every unique payload / tow / MSRP / range row** (152 unique vehicle×factor cells): **96 confirmed** on openable pages (incl. Cars.com via WebFetch), **56 blank / not confirmed**, **0 remaining “needs review”** after blanking inferred gas ranges.
3. **Primary twin shifts after rescoring:** R1T Tacoma trim changed; several half-ton EV primaries now favor **Silverado 1500 WT** once F-150 tow was corrected off the 13,500 lineup max; E-Transit Long-EL / several vans stay or move to **ProMaster** when Transit payload blanks.

---

## Audit method (FACT / INFERENCE / UNKNOWN)

- Scope: every `gas_twin_factors.csv` row where `factor` ∈ {payload, tow, msrp, range}.
- For each unique (vehicle, factor): open `source_url`; require value + trim/config + model year agreement.
- If page blocked/404: one alternate maker/independent page; else value blank, status `UNKNOWN` / not confirmed, dependent scores `not scored`.
- Scores / TED totals / `rank_metric` regenerated from `_generate_gas_twins.py` after value edits.
- Labels: **FACT** = figure on cited page for that trim/year; **INFERENCE** = derived (e.g. energy $/mi); **UNKNOWN** = not confirmed.

### Audit counts (unique vehicle × factor cells)

| Result | Count |
|--------|------:|
| Rows checked (payload/tow/MSRP/range unique) | **152** |
| Confirmed on openable page (incl. WebFetch for Cars.com) | **96** |
| Blank / not confirmed (incl. intentional blanks) | **56** |
| Corrected vs pre-audit PR-14 values (material cells) | **30+** (see changed-cell table) |
| Unverifiable after alternate attempt → blanked | **18** vehicle-fields |

Preserved confirmed-OK (do not break): Ram Tradesman MSRP **46875**; RCV Delivery 700 payload **2258**; BrightDrop 400 Base FWD MSRP **64600**; ProMaster gas MSRP **47055**; AAA PSL **$4.1551**; FPL **$0.12258/kWh**.

---

## Changed cells (row id = vehicle · factor)

| Row id | Old | New | Source URL |
|--------|-----|-----|------------|
| Transit Cargo Medium Roof LWB T-250 · msrp | 54395 | **56795** | https://www.kbb.com/ford/transit-250-cargo-van/2025/specs/ |
| Transit Cargo Medium Roof LWB T-250 · cargo | 350 cu ft | **357.1 cu ft** | same KBB specs |
| Transit Cargo Medium Roof LWB T-250 · payload | 4068 | **3834** | https://www.merchantsfleet.com/fleet-vehicles/ford-transit-250-cargo/ |
| Transit Cargo Medium Roof LWB T-250 · tow | not confirmed | **5000** | Merchants Fleet |
| Transit Cargo Long-EL high roof T-250 · msrp | 54395 | **58995** | KBB Transit 250 specs (High Roof Extended) |
| Transit Cargo Long-EL high roof T-250 · payload | 4068 | **not confirmed** | Ford.com blocked; no openable trim payload |
| F-150 SuperCrew 5.5-ft 4WD XLT 2.7L · payload | 2440 | **2120** | https://www.kbb.com/ford/f150%20supercrew%20cab/2025/xlt-pickup-4d-5-1-2-ft/ |
| F-150 SuperCrew 5.5-ft 4WD XLT 2.7L · tow | 13500 | **7500** | same KBB 4WD XLT 5.5-ft page |
| F-150 SuperCrew 5.5-ft 4WD XLT 2.7L · range | 520 | **not confirmed** | inferred mpg×tank — not EPA total range |
| F-150 SuperCrew · msrp source | ford.com (wrong max context) | MotorTrend baseMsrp **45695** kept | https://www.motortrend.com/cars/ford/f-150/2025/specs |
| Tacoma primary trim | TRD Sport 5-ft / 1700 / 44995 / tow 6400 | **Limited 5-ft / 1590 / 54450 / tow 6300** | https://www.kbb.com/toyota/tacoma-double-cab/2025/specs/ |
| Tacoma · range | 382 | **not confirmed** | inferred |
| Sierra 1500 Crew Cab Denali 4WD · payload | 2260 | **1960** | https://www.kbb.com/gmc/sierra-1500-crew-cab/2025/denali-pickup-4d-5-3-4-ft/ |
| Sierra Denali 4WD · tow | 13300 (wrong Sierra EV URL) | **13000** | same KBB Denali 4WD short-bed page |
| Sierra Denali · msrp | 68700 | **67595** | https://www.kbb.com/gmc/sierra-1500-crew-cab/2025/ |
| Sierra Denali · variant | Crew Cab Denali 4WD | **Crew Cab Denali 4WD short bed** | — |
| Lightning Pro · variant | Pro Standard Range | **Pro Standard Range (4WD SR)** | EPA PowerSearch |
| Lightning Pro · range source | bymodel page | PowerSearch (**240** for 4WD SR; Pro ER1=320) | https://fueleconomy.gov/feg/PowerSearch.do?... |
| Lightning Pro · tow | 5000 | **7000** | https://www.kbb.com/ford/f150-lightning/2025/specs/ |
| Lightning ER · variant / payload / tow / msrp | XLT/Flash / 2246 / 7700 / 56975 | **Flash Extended Range / 2226 / 10000 / 72190** | KBB Lightning specs |
| BrightDrop 400 · variant | 400 ZEVO FWD SR | **400 Base FWD** | https://www.carsdirect.com/compare/2025-chevrolet-brightdrop-trims |
| BrightDrop 600 · variant | 600 ZEVO FWD SR | **600 Base FWD** | same |
| Silverado 1500 Crew short bed 4WD WT · payload | 2117 (JD Power **157"** WT) | **2174** | https://www.cars.com/research/chevrolet-silverado_1500-2025/ |
| Silverado WT · range | 432 | **not confirmed** | inferred |
| Express 2500 Cargo Extended · payload | 3280 (Regular) | **3060** | https://www.kbb.com/chevrolet/express-2500-cargo/2025/extended/ |
| Express 2500 Ext · msrp | 43700 | **45695** | https://www.kbb.com/chevrolet/express-2500-cargo/2025/ |
| Express 2500 Ext · tow source | Edmunds (blocked) | KBB Extended (**10000** kept) | KBB extended |
| Express 3500 Cargo Extended · payload | 4280 (Regular) | **4060** | https://www.kbb.com/chevrolet/express-3500-cargo/2025/specs/ |
| Express 3500 Ext · msrp | 46550 | **48545** | same KBB specs |
| Express 3500 Ext · tow source | Edmunds | KBB (**10000** kept) | same |
| Ram 1500 Tradesman · payload | 1772 | **1770** | https://www.kbb.com/ram/1500-crew-cab/2025/specs/ |
| Ram Tradesman · tow | 8210 | **not confirmed** | JD Power blocked |
| Ram Tradesman · msrp | 46875 | **46875** (kept) | https://www.iseecars.com/car/2025-ram-ram_pickup_1500-price |
| Colorado WT · payload / msrp / bed | 1570 / 35200 / 5.14 | **1684 / 33595 / 5.0** | https://www.kbb.com/chevrolet/colorado/2025/ |
| Canyon Elevation · payload / msrp | 1570 / 41700 | **1670 / 40095** | https://www.kbb.com/gmc/canyon/2025/ |
| Silverado EV ER · msrp / variant | 73100 / Extended Range | **75195 / LT Extended Range** | KBB Silverado EV specs |
| Silverado EV SR · msrp | 55000 | **not confirmed** | Edmunds blocked; WT SR not on KBB table |

### Downgraded to not confirmed (unverifiable after alternate)

Hummer EV 2X payload/tow/range/msrp; F-250 XL example payload/tow/msrp; ProMaster EV payload/tow/msrp; Sprinter gas MSRP; eSprinter MSRPs; NPR-HD MSRP; Sierra EV payload; E-Transit Long medium payload (C&D band only); Transit Long-EL payload; Ranger range/msrp; F-150 / Silverado WT / Tacoma inferred ranges (above).

---

## Primary twin changes (vs prior NOTES / PR 14)

| EV | Prior primary | New primary | Notes |
|----|---------------|-------------|-------|
| R1T Dual Std / Max | Tacoma **TRD Sport 5-ft** | Tacoma **Limited 5-ft** | Trim correction only; Ted “Tacoma Double Cab” kept |
| Lightning Flash ER | F-150 SuperCrew | **Sierra Denali 4WD short bed** | After F-150 tow/payload correction |
| Silverado EV WT SR | F-150 SuperCrew | **Silverado 1500 WT** | Same-badge |
| Silverado EV LT ER | F-150 SuperCrew | **Sierra Denali 4WD short bed** | Score shift |
| Sierra EV Denali Ext | F-150 SuperCrew | **Sierra 1500 Denali 4WD short bed** | Same-badge |
| Cybertruck AWD / Beast | F-150 SuperCrew | **Silverado 1500 WT** | F-150 tow corrected |
| E-Transit Long-EL | Transit Long-EL | **ProMaster** | Transit Long-EL payload blanked |
| BrightDrop 600 | Transit Long-EL | **ProMaster** | Coverage/score shift |
| ProMaster EV | Express 2500 Ext | **ProMaster gas** | EV numeric fields blanked → same-badge |
| RCV/EDV 500 / 700 | Transit Long-EL | **ProMaster** | Transit EL payload blank |
| Lightning Pro SR | F-150 SuperCrew | **F-150 SuperCrew** (kept) | Same-badge leader |
| E-Transit Long medium | ProMaster | **ProMaster** (kept) | — |
| BrightDrop 400 | ProMaster | **ProMaster** (kept) | Trim label Base FWD |
| eSprinter 144 / 170 | ProMaster / Express | unchanged class winners | MSRPs blanked |
| EV Star | NPR-HD | **NPR-HD** (kept) | — |
| Hummer 2X | F-150 | F-150 (weak metric) | Specs blanked → weak |

---

## Decisions for Ted

1. [ ] Accept **Tacoma Double Cab Limited 5-ft** (not TRD Sport) as the R1T deck trim — KBB TRD Sport is 6-ft.
2. [ ] Accept half-ton primaries shifting to **Silverado 1500 WT** where F-150’s corrected 7500-lb tow loses the rank race.
3. [ ] OK that **E-Transit Long-EL / BrightDrop 600 / EDV** primaries moved to **ProMaster** after Transit Long-EL payload was blanked?
4. [ ] Prefer forcing **same-badge Transit** for E-Transit even when payload is not confirmed?
5. [ ] Pull openable F-250 / Hummer / ProMaster EV / Sprinter MSRP sheets next pass, or leave blank?
6. [ ] Confirm Lightning **Pro SR = 240** (EPA) vs KBB Pro column showing 300 — we kept EPA + 4WD SR label.
7. [ ] Accept Express Extended payload/MSRP corrections (3060 / $45,695 and 4060 / $48,545).
8. [ ] Keep FL energy anchors AAA **$4.1551** / FPL **$0.12258** unchanged.
9. [ ] Next pass: used Tacoma Limited / F-150 XLT / Transit Medium medians for shop pitch?
10. [ ] Any shop that must tow (excludes U.S. E-Transit) vs cargo-only?
11. [ ] Re-open Ford Transit Long-EL payload from an OEM PDF when available.
12. [ ] OK that inferred gas “range mi” fields stay blank until EPA total-range is cited?
