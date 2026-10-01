# G-FINAL-CHANGELOG — Replacement Score v2 · 2026-09-27

Documentation-only finalize of section G. No app code changes in this pass.

## Locked decisions folded in
1. Service scores EV-certified dealer drive miles (Ford/Ram FACT; Chevy/GMC INFERENCE step-down; BrightDrop 80.4 mi). Draft-G "Not scored" rule removed.
2. Energy uses third-party tests for E-Transit (1.4 mi/kWh), ProMaster EV (50.1 kWh/100 mi), BrightDrop (67.1 kWh/100 mi); shrink-the-lead; Sherlock EPA for Sierra/Silverado/Lightning stands.
3. Transit current: seats 2 FACT; tow 6,200; maint $0.31/mi; resale KBB −50% on value-lost-next-3-yr basis.
4. F-150 tow example: 10,700 lb typical SuperCrew 4x4.
5. ProMaster recalls: only 24V715 + 25V665.
6. −2/20 capacity-floor rule; incomplete = 2/3 job-applicable; tongue 15%; Hummer Edition 1 6-month; Tesla add-on note-only.
7. Rivian: `At risk, not counted` (never void); `warranty_type` commercial|consumer|unconfirmed; unconfirmed→consumer; scope = Rivian / Tesla note / Hummer Edition 1 / VW MY2025 EV HV.
8. Polish: status once; incomplete hides totals+diff; Payload 3,571 chip; Transit range reason string; dial readable on mobile.
9. Numbers only; never invent values.

## §6.1 vs 2018 Transit-250 (electrical job, 120 mi/day, 543 lb, crew 2, no tow, 32960)

Job-applicable = 100; incomplete threshold = 66.7. Maintenance drops on these pairs (candidate lacks Argonne van same-basis). Resale drops when the candidate has no 3-yr value-lost/retained figure.

| Candidate | warranty_type | Total / possible | Transit / same PP | Difference | Displays total? |
|---|---|---|---|---|---|
| 2022 R1T Quad Large (consumer) | consumer | **46.1 / 90** | 45.5 / 90 | **+0.6** | Yes |
| 2022 R1T Quad Large (fleet-sold) | commercial | **54.3 / 90** | 45.5 / 90 | **+8.8** | Yes |
| 2024 R1T Dual Large 21" @ 16,856 mi | commercial | **59.6 / 90** | 45.5 / 90 | **+14.1** | Yes |
| 2022 R1T Adventure (live demo) | unconfirmed | **46.1 / 90** | 45.5 / 90 | **+0.6** | Yes |
| 2026 Sierra EV Elevation Std @ 3,468 mi | (ignored) | **64.8 / 80** | 40.0 / 80 | **+24.8** | Yes |
| 2025 BrightDrop 600 @ 28 mi | (ignored) | **59.6 / 80** | 40.0 / 80 | **+19.6** | Yes |
| 2024 ProMaster EV @ 1,007 mi | (ignored) | **63.0 / 80** | 40.0 / 80 | **+23.0** | Yes |
| 2024 Silverado EV WT @ 4,170 mi | (ignored) | **66.9 / 90** | 45.5 / 90 | **+21.4** | Yes |
| 2023 E-Transit @ 7,495 mi | (ignored) | **54.6 / 90** | 45.5 / 90 | **+9.1** | Yes |
| 2022 F-150 Lightning Pro @ 84,296 mi | (ignored) | **61.8 / 90** | 45.5 / 90 | **+16.3** | Yes |

### Live demo package (7 candidates) — goal check
| # | Demo candidate | Total / PP | Diff vs Transit | UI |
|---|---|---|---|---|
| 1 | 2026 Sierra EV | 64.8 / 80 | +24.8 | **totals** |
| 2 | 2025 BrightDrop 600 | 59.6 / 80 | +19.6 | **totals** |
| 3 | 2024 ProMaster EV | 63.0 / 80 | +23.0 | **totals** |
| 4 | 2024 Silverado EV | 66.9 / 90 | +21.4 | **totals** |
| 5 | 2023 E-Transit | 54.6 / 90 | +9.1 | **totals** |
| 6 | 2022 Lightning | 61.8 / 90 | +16.3 | **totals** |
| 7 | 2022 R1T (unconfirmed) | 46.1 / 90 | +0.6 | **totals** |

**Result: all 7 demo candidates display a total.** None show Score incomplete with G-final data. No missing input blocks a total on this package.

## §6.2 vs 2018 F-150 3.5EB (supervisor, 120 mi/day, 1,000 lb, crew 2, no tow)

| Candidate | Total / possible | F-150 / same PP | Difference | Displays total? |
|---|---|---|---|---|
| (current) 2018 F-150 | 56.9 / 100 | — | — | Yes |
| 2022 R1T consumer | 51.0 / 100 | 56.9 / 100 | **−5.9** | Yes |
| 2022 R1T commercial | 59.2 / 100 | 56.9 / 100 | **+2.3** | Yes |
| 2024 R1T DL21 commercial | 64.5 / 100 | 56.9 / 100 | **+7.6** | Yes |

## What changed vs draft G (why incompletes cleared)
| Input | Draft G | G-final | Effect on demo PP |
|---|---|---|---|
| EV service | Not scored (cert UNKNOWN) | Miles + FACT/INFERENCE step-down | +10 or +7 or +2 to PP |
| Van energy | Not scored (no EPA) | Third-party kWh/100 | +10 to PP for E-Transit / ProMaster / BrightDrop |
| Transit seats | Not scored | 2 FACT → cab 10 | +10 to PP for all Transit pairs |
| Transit resale | Not scored | KBB −50% when candidate has 3-yr basis | +10 to PP when candidate has figure |
| ProMaster recalls | 6 campaigns → rel 0 | 2 EV-confirmed → rel 6.0 | reliability points only |
| Incomplete UI | conflicted with card totals | §1.6: no total, no difference | polish |

## Open items
1. **EV van maintenance (Argonne or other) same-basis as Transit $0.31/mi** — still missing; maintenance drops on Transit vs demo EV pairs.
2. **3-yr value-lost for Sierra EV, BrightDrop, ProMaster EV** — missing; resale drops on those three Transit pairs (PP 80 instead of 90). Does **not** block totals.
3. **Chevy/GMC EV-certified FACT** from GM locator — presently INFERENCE (step-down applied). BrightDrop certification FACT beyond new-unit-sales INFERENCE.
4. **GMC EV booklet / US BrightDrop booklet** — 75% floor remains INFERENCE (−2 on candidates).
5. **Fort Pierce / West Palm Beach** service miles for non-Rivian makes.
6. **OEM mobile service FACT** for Ford Pro / GM / Tesla (no +2 until sourced).
7. Anchors remain Steve INFERENCE until Ted overrides.

## Artifacts
- Spec: `/opt/cursor/artifacts/CLEARED-FOR-WOZ-SCORE-V2.md`
- This changelog: `/opt/cursor/artifacts/G-FINAL-CHANGELOG.md`
