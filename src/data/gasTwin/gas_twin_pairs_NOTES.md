# gas_twin_pairs — notes for Ted Burns / FleetFit

**Date:** 2026-10-02 (revised — Ted: R1T primary = Tacoma; no badge-based primaries)  
**Files:** `gas_twin_pairs.csv` · `gas_twin_factors.csv` · this NOTES  
**Artifacts:** `/opt/cursor/artifacts/gas_twin_pairs.csv` · `/opt/cursor/artifacts/gas_twin_factors.csv` · `/opt/cursor/artifacts/gas_twin_pairs_NOTES.md`  
**Generator:** `_generate_gas_twins.py`

## Top takeaways

1. **R1T gas twin = Toyota Tacoma** (Ted decision): primary is **Double Cab TRD Sport 5-ft bed 4WD** — closest Tacoma on crew cab, short bed (~5 ft vs R1T 4.52), and payload (~1700 vs 1764). Colorado / Canyon / Ranger / Frontier / Gladiator stay secondary.  
2. Primaries for all EVs are chosen by **class + payload + tow + cab/cargo**, not brand/badge. Where that diverges from a same-badge twin (e.g. Silverado EV→F-150, ProMaster EV→Express, eSprinter→ProMaster/Express), `gap_notes` says so.  
3. Tacoma is an honest mid-size peer but **weaker than R1T** on payload (slightly), tow (6400 vs 7700 / 11000 w/ WDH), and typically tighter rear cab space; commercial-van EPA/mpg/resale gaps remain largely not confirmed.

---

## R1T → Tacoma (required detail)

**Primary trim picked:** 2025 Toyota Tacoma **Double Cab TRD Sport 5-ft bed 4WD**

| Factor | R1T | Tacoma TRD Sport 5-ft | Winner |
|--------|-----|------------------------|--------|
| Class | midsize | midsize | tie |
| Cab | crew | Double Cab (crew) | peer |
| Bed | 54.2 in / 4.52 ft | ~5 ft short bed | Tacoma slightly longer bed; R1T still has gear tunnel / frunk utility Tacoma lacks |
| Payload | 1764 lb | 1700 lb (KBB TRD Sport) | **R1T** (Tacoma weaker) |
| Tow | 7700 Dual Std / **11000** Max w/ WDH | 6400 lb | **R1T** (Tacoma weaker; Max gap is large) |
| Cab room | Rivian crew | Double Cab — typically tighter rear | **R1T** (Tacoma weaker) |
| MSRP start | ~$71.7k–$80k | ~$45k TRD Sport band | Tacoma cheaper new |

**Why this Tacoma trim:** Double Cab matches R1T crew seating; **5-ft bed** is closer to R1T’s short bed than the 6-ft TRD Sport/Off-Road; TRD Sport’s **1700 lb** payload is the highest common Double Cab gas figure near R1T’s 1764 (vs SR5 ~1405 / Limited ~1590).

**Secondary mid-size (ranked under Tacoma):** Canyon, Colorado, Ranger, Frontier (incomplete), Gladiator (incomplete). Half-tons removed from the R1T set per Ted’s mid-size scope.

---

## Method (anchors)

### Rank metric (no badge bonus)
`rank_metric = (0.35×class_match + 0.65×mean(closeness)) × coverage`  
`coverage = (# closeness factors scored) / 6`

Closeness modes: capability **prefer_over** (meets EV need = 10); price **prefer_under**; spans unchanged (payload 2000 lb, tow 5000 lb, bed 3 ft, cargo units 2.0, cab 2, range 250 mi, MSRP $40k).

**Exception:** every R1T row forces `primary_twin=yes` on the Tacoma candidate (Ted decision), then ranks other mid-size by score.

### Ted 10-category model
Same as prior pass (Range / Payload-cargo / Cab / Tow / Resale 3-yr / Reliability / Service / Longevity / Energy ¢/mi FL / Maint ¢/mi). Totals blank if points possible &lt; 60. Unscored = `not scored: not confirmed` in factors CSV.

FL inputs: AAA PSL **$4.1551/gal**; FPL RS-1 **$0.12258/kWh**; AFDC maint BEV **$0.061** / gas **$0.101**.

---

## Primary twin picks

| EV | Primary | Same-badge note | Quality |
|----|---------|-----------------|---------|
| Lightning Pro / ER | F-150 SuperCrew 5.5 | Same-badge also wins on numbers | strong |
| **R1T Dual Std / Max** | **Tacoma Double Cab TRD Sport 5-ft** | Ted primary; mid-size secondaries below | strong |
| Silverado EV SR / ER | **F-150 SuperCrew** | Same-badge Silverado 1500 is secondary — class/numbers favored F-150 this pass | strong |
| Sierra EV Denali Ext | F-150 SuperCrew | Same-badge Sierra 1500 secondary | strong |
| Cybertruck AWD / Beast | F-150 SuperCrew | No Tesla gas twin; F-250 HD stays candidate-only | strong / fair |
| Hummer EV 2X | F-150 SuperCrew | Metric strong; shop fit still weak (payload/price) | strong metric |
| E-Transit Long medium | **ProMaster gas** | Same-badge Transit secondary on this roof/length pass | strong |
| E-Transit Long-EL | Transit Long-EL | Same-badge wins | strong |
| BrightDrop 400 | ProMaster | Weak class (step_van vs full_van) | fair |
| BrightDrop 600 | Transit Long-EL | Weak volume/shape match | weak |
| ProMaster EV | **Express 2500 Ext** | Same-badge ProMaster secondary | fair |
| eSprinter 144 | ProMaster | Same-badge Sprinter secondary (Sprinter payload unconfirmed) | strong |
| eSprinter 170 | **Express 2500 Ext** | Same-badge Sprinter secondary this pass | fair |
| EDV 500 / 700 | Transit Long-EL | 700 still weak on cubes | fair / weak |
| EV Star | NPR-HD Class 4 | Right class; many blanks → weak metric | weak |

---

## Weak matches

- BrightDrop 400/600, EDV 700, EV Star (incomplete Class 4 fields)  
- Hummer as a trade-shop tool despite high half-ton metric  
- Tacoma vs R1T Max: tow 6400 vs 11000 is a material shortfall (called out in `gap_notes`)

---

## Row counts

| File | Rows (excl. header) |
|------|---------------------|
| `gas_twin_pairs.csv` | **84** |
| `gas_twin_factors.csv` | **3096** |

---

## Main unknowns

Commercial-van EPA kWh/100mi and gas mpg; ProMaster EV range; GreenPower MSRP; most EV 3-yr retained %; Reliability / Longevity not scored; Frontier & Gladiator numeric sheets incomplete; towing range (mi) not confirmed.

---

## Decisions needing Ted

- [x] 1. R1T primary = Tacoma (Double Cab TRD Sport 5-ft) — applied.  
- [ ] 2. Confirm Tacoma 5-ft TRD Sport (vs 6-ft TRD Sport/Off-Road or Limited 5-ft) as the deck trim callout.  
- [ ] 3. OK that Silverado EV / Sierra EV / ProMaster EV / eSprinter primaries can leave same-badge twins secondary when numbers say so?  
- [ ] 4. E-Transit Long medium → ProMaster this pass — prefer forcing Transit same-roof instead?  
- [ ] 5. Hummer / Cybertruck / R1T in trade-shop scope?  
- [ ] 6. Payload and tow floors after racks/stock.  
- [ ] 7. Van standard roof/length for pitches.  
- [ ] 8. BrightDrop / EDV / EV Star in first pitch set?  
- [ ] 9. Pull MBUSA Sprinter 2500 payload to re-rank eSprinter same-badge?  
- [ ] 10. Accept FPL/AAA + AFDC energy/maint anchors for Florida scores.  
- [ ] 11. Next pass: used gas Tacoma / F-150 / Transit medians?  
- [ ] 12. Any shop that must tow (excludes U.S. E-Transit) vs cargo-only.
