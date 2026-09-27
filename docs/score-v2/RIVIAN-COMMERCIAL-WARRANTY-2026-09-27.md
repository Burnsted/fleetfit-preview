# Rivian R1T: consumer vs commercial warranty (for Score v2)

_Accessed 2026-09-27 for every source below. Labels: **FACT** = quoted from or directly stated in the source. **INF** = inference. **UNKNOWN** = not found; what was searched is listed. Rivian was not contacted. Page numbers are the PDF's printed page numbers, which match the PDF page index._
_Data: `data-v2/rivian_warranty_compare.csv`. Script: `scripts-v2/build_rivian_commercial_warranty_2026-09-27.py`. Raw PDFs and HTML: `notes/_raw/v2-2026-09-27/rivian/`._

## Plain-English answer

**Q1. R1T bought new by a business through Rivian Fleet Sales.**
- Rivian sells R1T and R1S to fleets ("Add R1T and R1S to your fleet", rivian.com/fleet).
- Its support site says "Rivian fleet vehicles are covered by the Commercial New Vehicle Limited Warranty" (FACT).
- There is one Commercial guide (effective 2024-12-31, Rev 3). It does not name a model. It covers "Rivian vehicles sold by Rivian" and mentions R1-only items such as the Camp Speaker. So it covers the R1T and R1S as well as the van: FACT for fleet-sold vehicles, INF for the model scope.
- Terms (FACT, p11–13):
  - Drivetrain and battery pack: 8 yr / 100,000 mi, with a 70% capacity floor (a pack that "loses 30% or more" is covered).
  - Comprehensive (bumper-to-bumper): 3 yr / 36,000 mi.
  - Corrosion (perforation): 5 yr, no mileage limit.
  - Restraints: 8 yr / 100k mi. Adjustments: 1 yr / 12k mi. 12V battery: 3 yr / 36k mi.
  - Roadside: 24/7. Towing is free only for warrantable issues during the warranty.
  - There is **no business- or commercial-use exclusion**.
  - One upfit catch: damage from modifications "not performed by a Rivian Preferred Upfit Partner" is not covered (p13).
- Compared with the consumer warranty, the commercial one is shorter on battery miles (100k vs 120k–175k), on comprehensive coverage (3/36 vs 4/50 or 5/60) and on corrosion (5 vs 8 yr). Both have the same 70% floor.
- UNKNOWN: an R1T bought through the normal consumer checkout but registered to an LLC. The registration page allows business registrants, but no source says which warranty that sale carries.

**Q2. Used consumer R1T put into commercial use.**
- Every consumer guide checked says the New Vehicle Limited Warranty "does not apply to a vehicle" when "The vehicle or product is used primarily for business or commercial purposes" (FACT). That covers Rev 1 (2022-11-16), Rev 8 (2024-03-15), Rev 9 (2024-06-28) and Rev 15 (2026-08-13), all on p16.
- I found **no partial-coverage, pro-rata, or convert-to-commercial language** in the consumer guide or on any Rivian support page. Rivian's Roadside Terms also say you "will be charged" for roadside service "if a Consumer Vehicle is used primarily for business or commercial purposes" (FACT).
- Transfer rules:
  - Consumer guide: the warranty "may be transferable to subsequent lawful purchasers of the vehicle after the first retail purchaser". Buyers "should contact Rivian, before purchase, to determine whether any warranty coverages have been voided" (FACT, p13).
  - Support article: "The New Vehicle Limited Warranty may be transferred to a new owner" and says to contact Customer Service (FACT).
- **INF:** a business can take title to the remaining consumer warranty, but running the truck primarily for business puts it outside that warranty. For scoring, treat that coverage as zero or at risk. "Primarily" is not defined, and Rivian's enforcement practice is UNKNOWN.

**Q3. Rivian Commercial Van (500/700) comparison.**
- The van's Reference Guide (2025 MY) lists (FACT, p6):
  - Powertrain including battery pack: 8 yr / 100,000 mi.
  - Comprehensive: 3 yr / 36,000 mi.
  - Corrosion: 5 yr, unlimited miles.
- The van's fleet page links the same Commercial guide, which sets the 70% floor. So the van and a fleet-bought R1T share identical terms: INF, because the quick reference does not state the floor itself.
- A separate "Electric Delivery Van (EDV) New Vehicle Limited Warranty Guide (DSP)" exists. It covers EDVs sold to Amazon or an Authorized Purchaser for use by Amazon Delivery Service Partners. I could not retrieve its PDF, so its terms are UNKNOWN. That guide applies only to Amazon DSP vans; the Commercial guide is the one that covers other fleets.

## 1. Guides used (model years, versions)

| guide | effective / version | covers | url | pages | label |
|---|---|---|---|---|---|
| R1T + R1S NVLW Guide (consumer) | Effective 2026-08-13, **Document Revision 15** (Rev 12 added MY2026; Rev 15 added MY2027) | "Rivian passenger vehicles sold by Rivian and registered in the United States" (p13); coverage table for MY2022-24, MY2025-26, MY2027 (p14) | https://assets.ctfassets.net/2md5qhoeajym/3jyOsY7odpa35j9Yzb0KXK/edc6d556b122b351117b409a9bb8cf8a/r1t_r1s-new-vehicle-limited-warranty-guide-us-en-us-20260813.pdf | 24 | FACT |
| same (consumer) | Effective 2024-06-28, Document Revision 9 | MY2022-2025 table | https://assets.ctfassets.net/2md5qhoeajym/4QCZtanQpDG0oFPAhaskR0/28dc1a917d946b819271a2e16e779404/r1t_r1s-new-vehicle-limited-warranty-guide-us-en-us-20240628.pdf | 24 | FACT |
| same (consumer) | Effective 2024-03-15, Document Revision 8 | config-based list (Quad 5/60, others 4/50; battery 175k/150k/120k) | https://assets.rivian.com/2md5qhoeajym/4QCZtanQpDG0oFPAhaskR0/5b5695d99fb30bd969c585d1c3786c16/r1t_r1s-new-vehicle-limited-warranty-guide-us-en-us-20240315.pdf | 23 | FACT |
| same (consumer) | Effective 2022-11-16, cover says "DOCUMENT REVISION 1" (file name 20221202; the Rev 15 history lists 2022-11-16 as Rev 3) | early R1: 5 yr/60k comprehensive and 8 yr/175k battery+drivetrain, with no split by configuration (p14) | https://assets.rivian.com/2md5qhoeajym/4QCZtanQpDG0oFPAhaskR0/387b5d12f8c8d9f6cf9d9b271c033190/r1t_r1s-new-vehicle-limited-warranty-guide-us-en-us-20221202.pdf | 23 | FACT |
| Commercial NVLW Guide | Effective 2024-12-31, **Document Revision 3** (Rev 1 2023-11-27, Rev 2 2024-09-18). This is the version linked from rivian.com/fleet on 2026-09-27 | "Rivian vehicles sold by Rivian and registered in the United States" (p9); no model named | https://assets.rivian.com/2md5qhoeajym/7ru4KaOCgjEP7FfT8QT7jE/ece18b4b636928b05eb06938645890fa/commercial-new-vehicle-limited-warranty-guide-us-en-us-20241231.pdf | 19 | FACT |
| Rivian Commercial Van 500\|700 Reference Guide | 2025 MY, v17 (PDF created 2025-02-12) | van warranty summary (p6) | https://assets.ctfassets.net/2md5qhoeajym/5FQcJgfAOa4vDYu9rWwEYO/4de1a8dc14ab58f3f21009c1d3df5fd2/RCV-QuickRef-v17.pdf | 7 | FACT |
| EDV NVLW Guide (DSP) | UNKNOWN (PDF not retrieved) | "EDVs sold by Rivian to Amazon, or an Authorized Purchaser, for commercial use by a Delivery Service Partner (DSP)" | https://rivian.com/support/article/electric-delivery-van-new-vehicle-limited-warranty-guide-dsp | n/a | FACT (scope) / UNKNOWN (terms) |

Supporting web pages (all accessed 2026-09-27; publish dates are not shown unless listed):
- https://rivian.com/fleet: "Add R1T and R1S to your fleet … Check vehicle availability in your area by contacting Fleet Sales." FAQ: "What's Rivian's commercial warranty? You can view our commercial warranty here". The link points to the 2024-12-31 Commercial PDF. FACT.
- https://rivian.com/support/article/what-is-the-warranty-coverage-on-a-new-rivian: "A New Vehicle Limited Warranty is included on all new passenger vehicles purchased from Rivian." It ends: "Rivian fleet vehicles are covered by the Commercial New Vehicle Limited Warranty." FACT.
- https://rivian.com/support/article/what-is-the-warranty-on-fleet-vehicles: "Each fleet vehicle will come with a comprehensive warranty". Lists 8/100k, 3/36k, 5-yr corrosion, 8/100k restraints, 1/12k adjustment. FACT.
- https://rivian.com/support/article/commercial-new-vehicle-limited-warranty: "applies to Rivian vehicles used for commercial purposes". FACT.
- https://rivian.com/support/article/does-the-warranty-on-my-rivian-transfer-to-the-new-owner-if-i-sell-my: "The New Vehicle Limited Warranty may be transferred to a new owner. Before selling your vehicle, you or the new owner should contact Customer Service to determine if the existing warranty is transferable." FACT.
- https://rivian.com/legal/roadside (last updated 2026-07-16): defines "Consumer Vehicle" and "Commercial Fleet Vehicle", plus the business-use roadside charge. FACT, quoted below.
- https://rivian.com/support/article/what-documents-do-i-need-to-register-my-vehicle-in-the-united-states: "Registration to a Business or Trust … All business registrants will be required to submit their Employer Identification Number." FACT. The page does not mention warranty.
- Rivian newsroom, "Rivian Opens Sales of The Rivian Commercial Van to Fleets of All Sizes in The US" (Reuters dates it 2025-02-10): https://rivian.com/newsroom/article/rivian-opens-sales-of-the-rivian-commercial-van-to-fleets-of-all-sizes-in-the-us. No warranty terms in the text. FACT (absence).
- WardsAuto, 2025-12-17: https://www.wardsauto.com/news/rivian-recalls-eletric-delivery-vans-for-seat-belt-cable-nhtsa/807950/. Says "All of the recalled delivery vans are covered under Rivian's 8 year/100,000-mile new vehicle limited warranty." FACT that the article says this. INF: it does not say which component term that is.

## 2. Q1 detail: R1T bought new by a business

| item | value / exact text | label | source | version | page |
|---|---|---|---|---|---|
| R1 sold to fleets | "Add R1T and R1S to your fleet … Check vehicle availability in your area by contacting Fleet Sales." | FACT | rivian.com/fleet | page as of 2026-09-27 | web |
| Which warranty | "Rivian fleet vehicles are covered by the Commercial New Vehicle Limited Warranty." | FACT | support: what-is-the-warranty-coverage-on-a-new-rivian | as of 2026-09-27 | web |
| Roadside definitions | "'Commercial Fleet Vehicle' shall mean a Vehicle that is part of a fleet of Rivian passenger vehicles owned or leased by a business, organization, or entity for use in a business context." Roadside is paid for warrantable issues "as detailed further in the New Vehicle Limited Warranty Guide for Consumer Vehicles and the Commercial New Vehicle Limited Warranty Guide for Commercial Fleet Vehicles." | FACT | rivian.com/legal/roadside | last updated 2026-07-16 | web |
| Commercial guide scope | "The warranties in this Warranty Guide apply to Rivian vehicles sold by Rivian and registered in the United States." The consumer guide says "Rivian **passenger** vehicles". | FACT | Commercial guide | Rev 3, 2024-12-31 | 9 |
| Commercial guide covers R1 models | The guide names no model. It lists a Camp Speaker warranty ("The Camp Speaker, if equipped, is covered by a 2-year limited warranty"), an R1 feature. Support and Roadside pages route fleet-owned "passenger vehicles" to this guide. | INF | Commercial guide + roadside terms | Rev 3 | 13 |
| Start date | "begins on the day a new Rivian vehicle is delivered to the first commercial purchaser(s) or by leasing or registering the vehicle for operation, whichever is earlier" | FACT | Commercial guide | Rev 3 | 10 |
| Battery / drivetrain | "An 8-year or 100,000-mile (whichever occurs first) drivetrain and battery pack limited warranty." | FACT | Commercial guide | Rev 3 | 11 |
| Capacity floor | "The warranty will cover a battery pack that loses 30% or more of its normal minimum usable rated capacity within the warranty period." That makes the floor 70%. | FACT | Commercial guide | Rev 3 | 11 |
| Comprehensive | "A 3-year or 36,000-mile (whichever occurs first) bumper-to-bumper comprehensive warranty." | FACT | Commercial guide | Rev 3 | 11 |
| Corrosion | "A 5-year corrosion (perforation) limited warranty." The detail section says "continues for 5 years with no mileage limit". | FACT | Commercial guide | Rev 3 | 11, 12 |
| Restraints / adjustment | "8-year or 100,000-mile … occupant active restraint"; "1-year or 12,000-mile … adjustment" | FACT | Commercial guide | Rev 3 | 11 |
| 12V / surface rust | each 3-year or 36,000-mile | FACT | Commercial guide | Rev 3 | 13 |
| Roadside | "Rivian Roadside Assistance is available 24 hours a day, 365 days a year … Explore opportunities for an enhanced roadside experience by contacting Rivian." Free only if "disabled due to a warrantable issue during the applicable … Commercial New Vehicle Limited Warranty period" (Roadside Terms). | FACT | Commercial guide; roadside terms | Rev 3; 2026-07-16 | 5; web |
| Commercial-use limit | None. The exclusion list (p13–14) has no business/commercial-use item. It does exclude "unusual physical, thermal, or electrical stress; racing; overloading; …" and "Using the vehicle for purposes other than those for which it was designed, including using the vehicle for long-term stationary power backup or supply." | FACT | Commercial guide | Rev 3 | 13–14 |
| Upfit rule | Not covered when caused by "Using or installing parts or performing modifications that are not performed by a Rivian Preferred Upfit Partner." | FACT | Commercial guide | Rev 3 | 13 |
| Commercial loss | "INCIDENTAL OR CONSEQUENTIAL DAMAGES, INCLUDING … LOSS OF USE OF THE VEHICLE, OR COMMERCIAL LOSS, ARE NOT COVERED" | FACT | Commercial guide | Rev 3 | 9 |
| Separate commercial guide for R1? | No R1-specific commercial guide exists. The support "Warranty" doc list has exactly: R1T + R1S NVLW, R2 NVLW, Commercial NVLW, EDV NVLW (DSP), plus parts, gear and charger guides. | FACT (list) | https://rivian.com/support/warranty-docs | as of 2026-09-27 | web |
| Business buying through the consumer checkout (LLC-registered) | Which warranty applies: UNKNOWN. The consumer exclusion is **use**-based ("used primarily"), not registration-based. | UNKNOWN / INF | registration support page; consumer guide p16 | n/a | n/a |
| Minimum fleet size for "Commercial Fleet Vehicle" | UNKNOWN. The roadside definition says "part of a fleet"; no count is given. | UNKNOWN | roadside terms | 2026-07-16 | web |

## 3. Q2 detail: used consumer R1T in commercial use

| item | exact text | label | source | version | page |
|---|---|---|---|---|---|
| Exclusion (current) | "The New Vehicle Limited Warranty does not apply to a vehicle in the following situations: … The vehicle or product is used primarily for business or commercial purposes." | FACT | consumer guide | Rev 15, 2026-08-13 | 16 |
| Exclusion (history) | Same bullet appears in Rev 9 (2024-06-28, p16), Rev 8 (2024-03-15, p16) and the 2022-11-16 guide (p16). The exclusion has been there since at least late 2022. | FACT | consumer guides | as listed | 16 |
| Partial coverage | None found. The exclusion applies to "a vehicle", not to specific parts, and there is no pro-rata wording. Searched the Rev 15 text for "primarily", "partial", "prorat", "convert", "fleet", "rideshare", "rental", "upfit". | FACT (absence in text) / INF (effect) | consumer guide | Rev 15 | full text |
| Scope wording | "apply to Rivian passenger vehicles sold by Rivian and registered in the United States" | FACT | consumer guide | Rev 15 | 13 |
| Start date | "begins on the day a new Rivian vehicle is delivered to the first retail purchaser(s) or by leasing or registering the vehicle for operation, whichever is earlier" | FACT | consumer guide | Rev 15 | 13 |
| Transfer (consumer) | "The warranties described in this Warranty Guide may be transferable to subsequent lawful purchasers of the vehicle after the first retail purchaser. Subsequent purchasers should contact Rivian, before purchase, to determine whether any warranty coverages have been voided." | FACT | consumer guide | Rev 15 (same in Rev 8/9) | 13 |
| Transfer (support) | "The New Vehicle Limited Warranty may be transferred to a new owner. Before selling your vehicle, you or the new owner should contact Customer Service to determine if the existing warranty is transferable." | FACT | support article | as of 2026-09-27 | web |
| Voiding language | "This New Vehicle Limited Warranty may be voided if the instructions in those documents … are not followed. These instructions include … vehicle proper use …" | FACT | consumer guide | Rev 15 | 20 |
| Roadside under business use | "You will be charged for Roadside Services if … a Consumer Vehicle is used primarily for business or commercial purposes." "'Consumer Vehicle' shall mean a Vehicle owned or leased by an individual for personal use." | FACT | roadside terms | 2026-07-16 | web |
| Converting to commercial terms | No Rivian page or guide describes converting a consumer warranty to Commercial terms. | UNKNOWN | searched rivian.com support (warranty-docs list, Fleet, transfer, private-party purchase articles) and web for "convert" / "business use" / "fleet" and consumer R1T | n/a | n/a |
| Rivian statements on fleet use of consumer vehicles | None beyond the guide exclusion and the Roadside Terms clause. No press statement found. | UNKNOWN | Rivian newsroom (Commercial Van sales release), support site, general web | n/a | n/a |
| Meaning of "primarily" | Not defined in the guide. | UNKNOWN | consumer guide Rev 15 full text | n/a | n/a |
| Telemetry | Rivian "reserves the right to use telemetry data … to … approve or deny warranty claims" (the Commercial guide has the same wording at p16). | FACT | consumer guide | Rev 15 | 20 |
| **INF: effect** | A business buyer can receive the remaining consumer warranty by transfer. Using the truck primarily for business takes it outside that warranty (battery 8 yr/120–175k and comprehensive), and roadside becomes chargeable. Rivian could detect the use through telemetry and service history. The actual practice is UNKNOWN. | INF | — | — | — |
| **INF: used ex-fleet R1T** | The Commercial guide's transfer clause ("may be transferable to subsequent lawful purchasers of the vehicle", p10) has no "after the first retail purchaser" wording and no commercial-use exclusion. A used R1T originally sold on Commercial terms is the cleanest used-R1T option for a business. The buyer should verify coverage status before purchase, as the guide itself instructs. | INF | Commercial guide | Rev 3 | 10 |

## 4. Q3 detail: Rivian Commercial Van

| item | value / exact text | label | source | version | page |
|---|---|---|---|---|---|
| Comprehensive | "Comprehensive 3 years or 36,000 miles (60,000 km), whichever comes first" | FACT | RCV Reference Guide | 2025 MY v17 | 6 |
| Powertrain incl. battery | "Powertrain (Incl. Battery Pack) 8 years or 100,000 miles (160,000 km), whichever comes first" | FACT | RCV Reference Guide | 2025 MY v17 | 6 |
| Corrosion | "Corrosion 5 years (unlimited miles)" | FACT | RCV Reference Guide | 2025 MY v17 | 6 |
| Battery | "LFP (Lithium Iron Phosphate) 100 kWh Battery Pack" | FACT | RCV Reference Guide | 2025 MY v17 | 6 |
| Capacity floor | 70%, from the Commercial guide (p11), which the van page links as "our commercial warranty". The quick reference does not state a floor. | INF | Commercial guide + rivian.com/fleet | Rev 3 | 11 |
| Personal purchase | "Can I purchase a van for personal use? At this time, we're focused on fulfilling fleet orders." | FACT | rivian.com/fleet | as of 2026-09-27 | web |
| Amazon DSP EDVs | Separate EDV NVLW Guide (DSP) covering "Comprehensive, Battery, Drivetrain, Corrosion, Safety System, and Tire warranties". Terms UNKNOWN. WardsAuto (2025-12-17) cites "8 year/100,000-mile new vehicle limited warranty". | FACT (scope) / UNKNOWN (terms) | support page; WardsAuto | n/a | web |

## 5. Comparison table

| case | term | years | miles | capacity_floor_pct | commercial_use_allowed | label | source_url | version | page |
|---|---|---|---|---|---|---|---|---|---|
| consumer R1T | battery + drivetrain | 8 | 120,000 / 150,000 / 175,000 (by config & MY) | 70 | **No** ("used primarily for business or commercial purposes" excluded) | FACT | [consumer guide](https://assets.ctfassets.net/2md5qhoeajym/3jyOsY7odpa35j9Yzb0KXK/edc6d556b122b351117b409a9bb8cf8a/r1t_r1s-new-vehicle-limited-warranty-guide-us-en-us-20260813.pdf) | Rev 15, 2026-08-13 | 14, 15, 16 |
| consumer R1T | comprehensive | 4 (5 for MY22-24 Quad Large) | 50,000 (60,000) | n/a | No | FACT | consumer guide | Rev 15 | 14, 16 |
| consumer R1T | corrosion (perforation) | 8 | none stated | n/a | No | FACT | consumer guide | Rev 15 | 14 |
| consumer R1T | roadside (free only for warrantable issues) | = warranty | = warranty | n/a | No (charged if used primarily for business) | FACT | [roadside terms](https://rivian.com/legal/roadside) | 2026-07-16 | web |
| R1T bought by business (Fleet Sales) | battery + drivetrain | 8 | 100,000 | 70 | **Yes** | FACT | [Commercial guide](https://assets.rivian.com/2md5qhoeajym/7ru4KaOCgjEP7FfT8QT7jE/ece18b4b636928b05eb06938645890fa/commercial-new-vehicle-limited-warranty-guide-us-en-us-20241231.pdf) | Rev 3, 2024-12-31 | 11 |
| R1T bought by business (Fleet Sales) | comprehensive (bumper-to-bumper) | 3 | 36,000 | n/a | Yes | FACT | Commercial guide | Rev 3 | 11 |
| R1T bought by business (Fleet Sales) | corrosion (perforation) | 5 | no limit | n/a | Yes | FACT | Commercial guide | Rev 3 | 11–12 |
| R1T bought by business (Fleet Sales) | roadside | = warranty | = warranty | n/a | Yes | FACT | roadside terms | 2026-07-16 | web |
| Commercial Van 500/700 | powertrain incl. battery | 8 | 100,000 | 70 (INF via Commercial guide) | Yes (fleet-only) | FACT (terms) / INF (floor) | [RCV Reference Guide](https://assets.ctfassets.net/2md5qhoeajym/5FQcJgfAOa4vDYu9rWwEYO/4de1a8dc14ab58f3f21009c1d3df5fd2/RCV-QuickRef-v17.pdf) | 2025 MY v17 | 6 |
| Commercial Van 500/700 | comprehensive | 3 | 36,000 | n/a | Yes | FACT | RCV Reference Guide | 2025 MY v17 | 6 |
| Commercial Van 500/700 | corrosion | 5 | unlimited | n/a | Yes | FACT | RCV Reference Guide | 2025 MY v17 | 6 |
| used consumer R1T in commercial use | all terms | 0 effective (INF) | — | — | No | INF | consumer guide | Rev 15 | 16 |

The full row set (20 rows, incl. restraints/adjustment/12V/upfit rule/EDV-DSP) is in `data-v2/rivian_warranty_compare.csv`.

## 6. Suggested Score v2 warranty treatment (all INF)

1. **Used consumer R1T bought to run as a fleet or work truck (the main FleetFit case):**
   - Score warranty coverage as **0** by default for battery/drivetrain, comprehensive and roadside.
   - Show the nominal remaining consumer coverage as an "at risk, not counted" note.
   - Raise the score only if the buyer has written confirmation from Rivian. That is the user's step: the guide says to "contact Rivian, before purchase".
   - Add a flag such as `warranty_status = consumer_excluded_commercial_use`.
2. **Used consumer R1T kept in mostly personal use (e.g., an owner-operator's personal truck with light business use):**
   - Use the remaining consumer terms (8 yr and 120k/150k/175k by config and MY; 4/50 or 5/60) counted from the original in-service date.
   - Apply a "primarily" uncertainty discount and show the flag. Where "primarily" falls is UNKNOWN.
3. **R1T bought new, or bought used ex-fleet with Commercial terms:**
   - Count Commercial terms: battery/drivetrain 8 yr / 100k mi (70% floor), comprehensive 3/36, corrosion 5 yr.
   - Remaining coverage = min(8 yr − age, 100k − odometer), from the first commercial delivery date.
   - Full credit for commercial use.
   - Penalise, or require confirmation, if the upfit was not done by a Rivian Preferred Upfit Partner (p13 exclusion).
4. **Rivian Commercial Van 500/700:** same Commercial formula (8/100k powertrain, 3/36 comprehensive, 5-yr corrosion). Full credit for commercial use.
5. **Amazon-DSP EDV sold on the used market:** mark UNKNOWN (DSP guide not retrieved). Do not credit warranty until those terms are sourced.
6. **Scoring input:** store `warranty_regime` (consumer | commercial | commercial_van | edv_dsp | unknown) per listing. Default a used R1T to consumer unless the seller documents a fleet or commercial sale.

## 7. UNKNOWNs (with what was searched)

- **EDV NVLW Guide (DSP) terms and version.** The support page loads the PDF link client-side from the CMS. The static HTML and `__NEXT_DATA__` contain only entry IDs. Web searches for the guide title found no PDF. Wayback CDX timed out through WebFetch, and curl to web.archive.org fails the TLS handshake from this box.
- **Which warranty applies when a business buys an R1T through the consumer web checkout** (registered with an EIN, not through Fleet Sales). Searched the support registration article, the fleet page and the warranty docs list. Not stated.
- **Minimum fleet size or eligibility for Commercial terms** ("part of a fleet"). Roadside terms and the fleet page give no number.
- **Definition or threshold of "primarily" for business use, and Rivian's enforcement practice.** No definition in any guide version checked. No support article or press statement.
- **Any path to convert a consumer warranty to Commercial terms, or to reinstate coverage.** Not found on the support site or the web.
- **Newer Commercial guide than 2024-12-31 (Rev 3).** The fleet page and search results point only to this version.
- **2026/2027 MY Commercial Van warranty summary.** Only the 2025 MY reference guide was found.
- **Earliest (2021) consumer guide text.** The oldest retrieved is the 2022-11-16 version, which already has the exclusion. The Rev 15 history lists Rev 1 as 2021-12-09, but that PDF was not found.
- **Note:** Rivian's California ZEV propulsion-parts warranty pages apply to "applicable R2 vehicles" only. They are not relevant to the R1T, and Florida is not a California-rules state anyway.
