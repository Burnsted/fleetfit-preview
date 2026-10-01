# FleetFit trade packages: per-trade vehicle needs (sourced), 2026-09-27

Researcher: Sherlock (executor), working for Ted Burns. All sources accessed **2026-09-27**. Publish date is given where the source shows one.
**Labels:** FACT = quoted from or taken directly out of the linked source. INF = derived by us, an assumption, or an anecdote. UNKNOWN = searched for and not found (the searches are listed in the tables and in the UNKNOWN section).
**CSVs:**
- `data/trade_needs.csv` is the cross-trade summary Woz codes from.
- `data/trade_needs_detail.csv` holds every sourced line item.

Raw pulls (the EC&M PDF, Adrian catalog, NREL report, spec sheets) are in `notes/_raw/`. Build script: `scripts/build_trade_needs_2026-09-27.py`.
**Never invent numbers:** when a cell says UNKNOWN, the UI shows "—".

## Cross-trade summary (Woz codes from this)

| trade | daily_mi_typical | payload_lb_typical | body (van/bed/both) | crew | tow_habit | top_upfits | label | source_url | accessed |
|---|---|---|---|---|---|---|---|---|---|
| Electrical | 62 (one fleet) / 74 class-level van avg | UNKNOWN (upfit alone 401-543 lb) | both (vans 62% / pickups 61% of firms) | 1 (often alone); 2 with helper | UNKNOWN | shelving+drawers; partition; wire reel holder; ladder rack w/ conduit tube | daily_mi FACT(single fleet)+class; payload UNKNOWN; body FACT; crew FACT(BLS)->INF count; tow UNKNOWN; upfits FACT | https://www.worktruckonline.com/news/ford-pro-e-telematics-helps-fleet-track-e-transit-efficiency (+ more in CSV) | 2026-09-27 |
| HVAC | 63.3 avg (fleet medians 45-90) | UNKNOWN (upfit 517 lb; 3-ton condenser 158 lb) | both (2013 survey: pickups >71%, vans 22-23%) | 1 service tech; 2 when training/installing | UNKNOWN | refrigerant tank rack; shelving+drawers; partition; ladder rack | daily_mi FACT(Azuga 2018); payload UNKNOWN; body FACT(2013, old); crew FACT(BLS)->INF count; tow UNKNOWN; upfits FACT | https://azuga.com/blog/productivity-gains-for-hvac-fleets-our-reports-highlights (+ more in CSV) | 2026-09-27 |
| Plumbing | ~48-60 (INF from 12-15k mi/yr, one fleet) | UNKNOWN (upfit 481 lb; 50-gal water heater 150-186 lb) | both (2002 survey: pickups 69%, cargo vans 68%, service body 34%) | 1-2 (BLS: residential = one or two plumbers) | UNKNOWN | drawers+parts bins; pipe transport tube; shelving; drain machine space | daily_mi INF; payload UNKNOWN; body FACT(2002, old); crew FACT(BLS); tow UNKNOWN; upfits FACT | https://www.worktruckonline.com/articles/keeping-hvac-and-plumbing-fleets-on-track (+ more in CSV) | 2026-09-27 |
| Landscaping / lawn care | UNKNOWN | UNKNOWN truck payload; trailer tongue ~700-1,050 lb on a 7,000 lb trailer | bed (pickup + trailer); landscape/dump body for installs | 3 typical (range 1-5) | daily; 7,000 lb GVWR tandem open trailer baseline (16-18 ft) | trimmer racks; enclosed trailer E-track; landscape/dump body; brake controller | daily_mi UNKNOWN; tongue FACT(dealer guide); body FACT; crew FACT(LM example)->INF typical; tow FACT(dealer guide + LM example); upfits FACT | https://www.spencertrailers.com/best-trailers-for-landscaping-businesses-in-2024/ (+ more in CSV) | 2026-09-27 |
| General contracting | UNKNOWN | UNKNOWN | bed (pickup / contractor platform or service body) = INF | UNKNOWN (BLS: laborers work as a team) | UNKNOWN | overhead ladder/material rack; toolboxes; stake racks; contractor body | daily_mi UNKNOWN; payload UNKNOWN; body INF (catalog shows options, not share); crew UNKNOWN; tow UNKNOWN; upfits FACT(catalog) | https://www.knapheide.com/industries/skilled-trades (+ more in CSV) | 2026-09-27 |

Reading notes:
- **"payload_lb_typical" is UNKNOWN for every trade.** No trade-level study of loaded working weight was found. The numbers shown are *known components* only: interior upfit package weights (Adrian Steel, via distributor listings) and typical heavy items (manufacturer spec sheets). Scoring should compare the candidate EV's payload against the current vehicle's rated payload (see replacement-score); do not compare it against these numbers.
- The **body mix** figures are the percentage of firms that own each body type (a firm can own several). They are not the percentage of vehicles. The HVAC (2013) and plumbing (2002) surveys are old. Only the electrical figure (EC&M 2024) is current.
- **Class-level fallback for daily miles (FACT):** Ford Pro telematics puts the average US commercial van at **74 mi/day**.


## All trades (class-level)

| attribute | value | label | source_url | source_published | note | accessed |
|---|---|---|---|---|---|---|
| daily_mi | 74 mi/day average for US commercial vans (Ford Pro Telematics, >2.5M trips / 30M mi) | FACT (class-level, not trade-specific) | https://www.fromtheroad.ford.com/us/en/articles/2024/ford-pro-marks-10-years-of-u-s--transit-by-bolstering-e-transit | 2024 | — | 2026-09-27 |
| ev_suitability | EVs more suitable for Door-to-Door, Hub-and-Spoke and Local vocations; ~half of those vehicles could save money electrifying | FACT (Geotab report) | https://www.geotab.com/CMS-GeneralFiles-production/NA/ebooks/Taking_Charge/taking-charge-report-ebook-2024-1244275079-geotab-web-EN-EN-final-Mar24-AODA-web.pdf | 2024-03 | — | 2026-09-27 |
| daily_mi | NREL Fleet DNA service vans: 4 vehicles, 29 vehicle-days, 951.3 mi total (~32.8 mi/vehicle-day by division) | INF (tiny sample; division is ours) | https://www.nlr.gov/media/docs/libraries/transportation/fleet_dna_service_vans_report.pdf | 2014-08-18 (generated) | trade not specified | 2026-09-27 |

## Electrical

| attribute | value | label | source_url | source_published | note | accessed |
|---|---|---|---|---|---|---|
| daily_mi | No electrician-specific telematics study found; one electrical contractor (Fize Electrique, Quebec) reports ~25,000 km (15,534 mi)/yr per E-Transit, ~100 km (62 mi)/day | FACT (single fleet) | https://www.worktruckonline.com/news/ford-pro-e-telematics-helps-fleet-track-e-transit-efficiency | not captured | use Ford 74 mi/day class-level as fallback | 2026-09-27 |
| payload | Adrian Steel Electrical Contractor interior pkg 4319TL148 (Transit low roof 148"): 401.03 lb | FACT (upfit weight only) | https://industrialladder.com/adrian-steel-4319tl148-electrical-contractor-package-ford-transit-low-roof-148-wb/ | — | — | 2026-09-27 |
| payload | Adrian Steel ELE-FTMR148B electrical pkg (Transit mid roof 148"): 542.73 lb | FACT (upfit weight only) | https://industrialladder.com/Adrian-ELE-FTMR148B-Electrical-Package-FTM148/ | — | — | 2026-09-27 |
| payload | Loaded working payload (upfit + wire + parts + ladders) | UNKNOWN | — | — | searched: electrician van loaded weight / payload study | 2026-09-27 |
| body | Share of electrical contracting firms with each vehicle type in fleet (2024, n=195): vans/panel trucks 62%; pickups (3/4 ton or less) 61%; medium/heavy trucks 36%; any vehicle 83%. Firms 10+ employees: vans 74%, pickups 78% | FACT (EC&M Profile survey) | https://www.ecmag.com/docs/default-source/profile-reports/profile-topic-specific-reports/ec_2024_profile_breakout-report_vehicles.pdf | 2025-01 | — | 2026-09-27 |
| fleet_size | Average 8.6 vehicles per firm (2024); 10% considering EV/hybrid purchase in next 1-3 yrs (down from 28% in 2022) | FACT | https://www.ecmag.com/docs/default-source/profile-reports/profile-topic-specific-reports/ec_2024_profile_breakout-report_vehicles.pdf | 2025-01 | — | 2026-09-27 |
| crew | "Many electricians work alone, but sometimes they collaborate with others." "Electricians employed by large companies are likely to work as part of a crew, directing helpers and apprentices" | FACT (BLS OOH) | https://www.bls.gov/ooh/construction-and-extraction/electricians.htm | 2026-08-27 (last modified) | crew per vehicle typical 1-2 = INF | 2026-09-27 |
| tow | Trailer/tow frequency for electricians | UNKNOWN | — | — | searched: electrician trailer towing survey; none found | 2026-09-27 |
| upfits | Adrian 4319TL148 contents: 3 shelf units, partition with door, wire reel holder, drawer units, divider kit, hook bar | FACT | https://industrialladder.com/adrian-steel-4319tl148-electrical-contractor-package-ford-transit-low-roof-148-wb/ | — | — | 2026-09-27 |
| upfits | Ranger Design: combination ladder rack (step + extension ladder + transport tube for materials); drop-down ladder rack for high roofs; wire reel holders; transport tube kits for conduit | FACT | https://rangerdesign.com/trades/electrician-van-shelving/ | — | — | 2026-09-27 |
| upfits | Knapheide lists Electrical Van Interior Packages (Transit/Express/ProMaster/Sprinter) and KUV bodies with conduit chute | FACT | https://www.knapheide.com/industries/skilled-trades | — | — | 2026-09-27 |

## HVAC

| attribute | value | label | source_url | source_published | note | accessed |
|---|---|---|---|---|---|---|
| daily_mi | Azuga study of HVAC fleets with 10+ vehicles: average 63.3 mi/vehicle/day; 85.0% of fleets have median 45-90 mi/vehicle/day; 83.5% of fleets median 6-8 stops/day | FACT (telematics vendor study) | https://azuga.com/blog/productivity-gains-for-hvac-fleets-our-reports-highlights | 2018-08-14 | — | 2026-09-27 |
| daily_mi | ACHR News infographic repeats 63.3 mi/day average and 6-8 median stops | FACT (trade magazine, same data) | https://www.achrnews.com/ext/resources/2019/01-2019/1-21-2019/HVAC-Satellite-Office.pdf | 2019-01-21 | — | 2026-09-27 |
| daily_mi | Verizon Connect (3,700 plumbing/heating/AC vehicles, 2018): "average distance traveled per vehicle reached 117.9 miles" in summer vs 113.2 spring / 113.8 fall; article frames these as weekly averages alongside 5.8 stops/week | FACT (quote) / INF (unit ambiguous; conflicts with Azuga daily figures) | https://www.automotive-fleet.com/news/hvac-service-fleet-activity-peaks-in-summer | 2019-09-05 | — | 2026-09-27 |
| payload | Adrian Steel HVAC-FTMR148B pkg (Transit mid roof 148"): 517.44 lb | FACT (upfit weight only) | https://industrialtruckandvan.com/Adrian-HVAC-FTMR148B-HVAC-Package.FTM148/ | — | — | 2026-09-27 |
| payload | Example heavy item: Goodman GLXS4BA3610 3-ton condenser 158 lb equipment / 173 lb ship weight | FACT (manufacturer spec) | http://chadwellsupply.s3.amazonaws.com/Forms/goodman_glxs4b-r32.pdf | — | — | 2026-09-27 |
| payload | Loaded working payload | UNKNOWN | — | — | searched: HVAC service van loaded weight study | 2026-09-27 |
| body | Contracting Business 2013 HVAC Service Vehicle Survey (n=343): pickups owned/leased by >71% across sectors, then box/cube trucks; vans only 22-23%; avg fleet 8 (residential) / 9 (commercial) / 12 (industrial); truck lifespan 9 yr; 75% allow take-home | FACT (old survey, 2013) | https://www.contractingbusiness.com/residential-hvac/article/20866156/2013-hvac-service-vehicle-survey-making-tracks | 2013-04-04 | body mix may have shifted since 2013 | 2026-09-27 |
| crew | BLS: technicians "may be assigned to a single jobsite or to several locations at the beginning of the day. They then travel to each site, making service calls." "Newly hired HVAC technicians typically work alongside experienced technicians." | FACT (BLS OOH) | https://www.bls.gov/ooh/installation-maintenance-and-repair/heating-air-conditioning-and-refrigeration-mechanics-and-installers.htm | 2026-08-27 (last modified) | crew per vehicle 1 (service) / 2 (install, trainee) = INF | 2026-09-27 |
| tow | Trailer/tow frequency for HVAC | UNKNOWN | — | — | searched; none found | 2026-09-27 |
| upfits | Refrigerant bottle racks and lockers (Ranger Design); welded tank rack in Adrian HVAC starter pkg; shelving, drawers, partition, ladder rack | FACT | https://rangerdesign.com/blog/upfit-truck-van-accessories/ | 2017-06-02 | — | 2026-09-27 |
| upfits | Adrian HVAC starter package (Transit Connect LWB) includes welded tank rack, shelf units, drawer units, partition, hook bars, parts bins | FACT | https://www.adriansteel.com/wp-content/uploads/2023/12/Ford-Interior-Starter-Packages.pdf | 2023-12 | — | 2026-09-27 |

## Plumbing

| attribute | value | label | source_url | source_published | note | accessed |
|---|---|---|---|---|---|---|
| daily_mi | No plumbing-specific telematics study found. 128 Plumbing, Heating, Cooling & Electric (MA, 28 vehicles): 12,000-15,000 mi/yr per vehicle; Colepepper Services (San Diego-LA): 60,000 mi/yr per vehicle | FACT (two fleets) | https://www.worktruckonline.com/articles/keeping-hvac-and-plumbing-fleets-on-track | 2017-08-08 | — | 2026-09-27 |
| daily_mi | 12,000-15,000 mi/yr = ~48-60 mi/workday assuming 250 workdays | INF (our division; assumption) | https://www.worktruckonline.com/articles/keeping-hvac-and-plumbing-fleets-on-track | 2017-08-08 | — | 2026-09-27 |
| payload | Adrian Steel PLUM-FTMR148B pkg (Transit mid roof 148"): 480.70 lb | FACT (upfit weight only) | https://industrialladder.com/Adrian-PLUM-FTMR148B-Plumbing-Package-FTM148/ | — | — | 2026-09-27 |
| payload | Example heavy item: Rheem Professional Classic 50-gal tall gas water heater ship weight 150-165 lb (short 186 lb) | FACT (manufacturer spec) | https://hvacdirect.com/media/pdf/PROG50-38N%20RH60%20spec%20sheet.pdf | — | — | 2026-09-27 |
| payload | Colepepper high-roof service vans each carry two drain cleaning machines plus common stock | FACT (single fleet) | https://www.worktruckonline.com/articles/keeping-hvac-and-plumbing-fleets-on-track | 2017-08-08 | — | 2026-09-27 |
| payload | Loaded working payload | UNKNOWN | — | — | searched | 2026-09-27 |
| body | PM magazine reader survey (residential plumbing/heating, ~19% of 1,000 responded): own pickups 69%, cargo vans 68%, service/utility body 34%, cube truck 20%, step van 14%; 36% have >5 trucks | FACT (old survey, 2002) | https://www.pmmag.com/articles/86616-contractors-love-trucks | 2002-03-29 | very old; directional only | 2026-09-27 |
| crew | BLS: "residential water systems use copper, steel, and plastic pipe that one or two plumbers install" | FACT (BLS OOH) | https://www.bls.gov/ooh/construction-and-extraction/plumbers-pipefitters-and-steamfitters.htm | 2026-08-27 (last modified) | — | 2026-09-27 |
| tow | Trailer/tow frequency for plumbers | UNKNOWN | — | — | searched; none found | 2026-09-27 |
| upfits | Transport tube kits for pipe/conduit (Ranger); Adrian plumbing starter pkg heavy on drawer units (8x DC6) + parts bins + utility hooks; Knapheide Plumbing Van Interior Packages | FACT | https://rangerdesign.com/blog/upfit-truck-van-accessories/ | 2017-06-02 | — | 2026-09-27 |

## Landscaping / lawn care

| attribute | value | label | source_url | source_published | note | accessed |
|---|---|---|---|---|---|---|
| daily_mi | Landscaping daily miles | UNKNOWN | — | — | searched: Geotab/Samsara/Motive landscaping mileage, NALP route density (404), LM/L&L; only vendor blog guidance on drive-time ratio found (not used) | 2026-09-27 |
| payload | Bumper-pull trailer tongue weight commonly 10-15% of loaded weight; a 7,000 lb loaded trailer puts ~700-1,050 lb on the hitch, counted against truck payload | FACT (trailer dealer guide) | https://www.spencertrailers.com/best-trailers-for-landscaping-businesses-in-2024/ | 2026-08-04 | — | 2026-09-27 |
| payload | Professional zero-turn mower ~900 to >1,600 lb; hydro walk-behind ~500-700 lb (ride on trailer, not truck) | FACT (trailer dealer guide) | https://www.spencertrailers.com/best-trailers-for-landscaping-businesses-in-2024/ | 2026-08-04 | — | 2026-09-27 |
| body | Maintenance route: crew truck + equipment trailer; installation: landscape or dump body on chassis cab | FACT (FL Ford commercial dealer guide, qualitative) | https://commercialfleetvehicles.com/industries/landscaping-companies/ | — | — | 2026-09-27 |
| body | Example crew rig: "a three-quarter-ton truck and a two-axle, 18-foot trailer with three mowers on it" | FACT (Landscape Management / U.S. Lawns) | https://stage.landscapemanagement.net/tips-for-determining-your-ideal-maintenance-crew-size/ | 2017-09-25 (upd 2023-11-03) | — | 2026-09-27 |
| body | LM 2024 State of the Industry: 78% planned to add equipment in 2025, mainly trucks and trailers (81%) | FACT (survey) | https://stage.landscapemanagement.net/lm-state-of-the-industry-something-to-smile-about/ | 2025-01-28 | — | 2026-09-27 |
| crew | "If your average crew is three people..."; crews sized 1-5+ by route density and property size | FACT (LM / U.S. Lawns) | https://stage.landscapemanagement.net/tips-for-determining-your-ideal-maintenance-crew-size/ | 2017-09-25 (upd 2023-11-03) | typical 3 = INF from example | 2026-09-27 |
| crew | Tandem 7x16 enclosed trailer "a practical starting size for many two-person mowing crews" | FACT (dealer guide) | https://www.spencertrailers.com/best-trailers-for-landscaping-businesses-in-2024/ | 2026-08-04 | — | 2026-09-27 |
| tow | Daily trailer: "A practical baseline for a professional mower crew is a 7,000 lb GVWR tandem-axle open utility trailer"; dump trailers ~9,890-12,000 lb GVWR for mulch/soil | FACT (dealer guide) | https://www.spencertrailers.com/best-trailers-for-landscaping-businesses-in-2024/ | 2026-08-04 | — | 2026-09-27 |
| upfits | Trimmer racks on trailer rails (Jungle Jim, Green Touch, Pack'em); E-track in enclosed trailers; landscape body / dump body; brake controller + hitch | FACT | https://www.spencertrailers.com/best-trailers-for-landscaping-businesses-in-2024/ | 2026-08-04 | — | 2026-09-27 |

## General contracting

| attribute | value | label | source_url | source_published | note | accessed |
|---|---|---|---|---|---|---|
| daily_mi | GC / construction pickup daily miles | UNKNOWN | — | — | searched: Motive/Samsara/Verizon construction mileage; CarData construction report page no longer shows the 615-692 mi/month figure seen in a search snippet (not used) | 2026-09-27 |
| payload | GC loaded payload | UNKNOWN | — | — | searched | 2026-09-27 |
| body | Knapheide Contractor Platform Body: flatbed with overhead material rack, drop-down side/rear stake racks, above- and underbody toolboxes; also combo body and service bodies | FACT (upfitter catalog; exists, not share) | https://www.knapheide.com/industries/skilled-trades | — | — | 2026-09-27 |
| crew | BLS: construction laborers/helpers assist tradesworkers and "need to work as a team"; "Travel to jobsites may be required." | FACT (BLS OOH) | https://www.bls.gov/ooh/construction-and-extraction/construction-laborers-and-helpers.htm | 2026-08-27 (last modified) | crew per vehicle UNKNOWN | 2026-09-27 |
| tow | GC trailer habit (dump / equipment trailer frequency) | UNKNOWN | — | — | searched; none found | 2026-09-27 |
| upfits | Overhead ladder/material rack, crossover/underbody toolboxes, stake racks, contractor or service body (Knapheide product list) | FACT (catalog) | https://www.knapheide.com/industries/skilled-trades | — | — | 2026-09-27 |

## Local FL examples (INTERNAL ONLY: never show shop names on public Pages)
These come from existing VinNotDiesel concept files, which were sourced from the shops' own sites on 2026-09-24. They are not re-fetched today.

| trade | local signal | label | source (file → original URL) |
|---|---|---|---|
| Landscaping | "Four crews outfitted with late model fully equipped custom built 16-20' flatbed landscape trucks and trailers" | FACT (company site) | vinnotdiesel/product/concepts/2026-09-24-gary-roberts-nursery-fleet-package.md → http://garyrobertslandscape.com/ |
| Electrical | "licensed electricians arrive in fully stocked trucks" and "Our vans are equipped with extra circuit breakers" (trucks and vans both named) | FACT (company site) | vinnotdiesel/product/concepts/2026-09-24-happy-home-electric-fleet-package.md → https://www.localelectriciansfl.com/ |
| HVAC | "their trucks are fully stocked" (trucks plural; no vans named) | FACT (company site) | vinnotdiesel/product/concepts/2026-09-24-star-quality-air-fleet-package.md → https://www.starqualityair.com/ |
| Plumbing + HVAC | May 15 2025 press release about adding new trucks to the corporate fleet (body type not stated) | FACT | vinnotdiesel/product/concepts/2026-09-24-miranda-plumbing-air-fleet-package.md → https://www.newswire.com/news/miranda-plumbing-air-conditioning-upgrades-fleet-with-new-trucks-22573879 |
| Electrical | "small business of four employees" (a staff count, not a vehicle count) | FACT (Angi snippet) | vinnotdiesel/product/concepts/2026-09-24-king-electric-fleet-package.md |

## What this means for packages (INF, to be confirmed by Steve)
- **Electrical:** mix vans and pickups. Both are near-equally common (EC&M 2024). Needed: ladder rack, wire reels, conduit tube.
- **HVAC:** a service van or a pickup with a tank rack. Mileage is the best-sourced of all the trades (roughly 45-90 mi/day). Condensers (about 160 lb each) plus a roughly 500 lb upfit fit easily within a cargo van's payload. The fit still needs checking on each VIN.
- **Plumbing:** the stocked van, the "warehouse on wheels," dominates service work (INF). A water heater run adds about 150-190 lb per unit.
- **Landscaping:** the trailer is the deciding factor. Towing a roughly 7,000 lb tandem trailer every day, with about 700-1,050 lb of tongue weight, means tow rating and payload after tongue weight both have to be checked. Where the rating can't be verified, do not put an EV into a trailer-hauler slot (consistent with the TrueLawn and Gary Roberts concept flags).
- **General contracting:** thin sourcing. Use a pickup with a rack and toolbox as the default (INF), and let intake capture the actual trailer use.

## UNKNOWN (what was searched)
1. **Loaded working payload for every trade.** Searched: "service van loaded weight study", "vans overloaded GVWR plumbing HVAC". Results were UK or delivery-van focused only.
2. **Electrician daily miles.** No trade-specific telematics study was found, only one fleet (Fize) plus forum anecdotes (not used).
3. **Plumbing daily miles.** Only two single-fleet annual figures. The Verizon Connect PHC data has an ambiguous unit.
4. **Landscaping daily miles.** Searched Geotab, Samsara and Motive landscaping content, NALP route density (404), and LM/L&L.
5. **GC daily miles, payload, crew per vehicle, tow habit.** The CarData construction mileage figure in the search snippet is no longer on the page.
6. **Tow habits for electrical, HVAC and plumbing.** No survey found.
7. **Current (post-2013) HVAC and (post-2002) plumbing body-mix surveys.** The EC&M-style Profile exists only for electrical.
8. **Crew-per-vehicle counts.** BLS gives qualitative statements only. The counts in the summary are INF.
9. **Adrian Transit high-roof electrical package weight (687 lb).** This appeared in a search synthesis only and was not verified, so it is excluded.
