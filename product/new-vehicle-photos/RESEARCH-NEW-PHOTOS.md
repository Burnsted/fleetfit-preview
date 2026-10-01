# RESEARCH — New vehicle photos (FleetFit draft)

**Status:** Draft only. Do not merge to main. Do not publish.  
**Branch:** `cursor/new-vehicle-photos`  
**Style target:** Existing New cards on `cursor/trade-cards-new-tab-af18` (`src/assets/new-catalog/`): photographic plates; Cybertruck ~1920×1440 (4:3); R1T ~1920×1031. Finals here are **1600 px wide**.

**Method:** (a) Wikimedia Commons / press reuse search first; only use a plate if trim-correct, unbranded (or OEM-only marks), and clean enough under hard rules. (b) Otherwise generate from real refs, then side-by-side compare. Failures stay REJECT / not confirmed.

Outputs live under `product/new-vehicle-photos/`:

| Path | Contents |
|---|---|
| `final/` | 1600 px candidate plates |
| `sheets/` | Candidate beside 2 real refs |
| `refs/` | Downloaded Commons reference files used for compare |

---

## Verdict summary

| vehicle_id | Model | Method | Verdict |
|---|---|---|---|
| `rivian_rcv_500` | Rivian Commercial Van Delivery 500 | Generated (no clean unbranded Commons) | **PASS** |
| `ford_etransit_cargo_van_low_roof_148_wb` | Ford E-Transit Cargo Van Low Roof (2026) | Generated attempts; Commons low-roof exists but branded | **REJECT** |
| `mb_esprinter_81` | Mercedes-Benz eSprinter Cargo Van 81 kWh | Generated; no clean unbranded current-gen plate | **REJECT** |
| `chevy_silverado_ev_wt_4wt` | Chevrolet Silverado EV WT | Commons reuse (plain crop) | **PASS** |
| `gmc_sierra_ev_elevation_standard` | GMC Sierra EV Elevation | Generated (Commons Elevation exists but dealer clutter) | **PASS** |

---

## 1. Rivian Commercial Van (EDV / RCV Delivery 500)

**Files:** `final/rivian_rcv_500.jpg` · `sheets/rivian_rcv_500_sheet.jpg`

### (a) Commons / press search

| URL | Author | License | Usable as card? |
|---|---|---|---|
| https://commons.wikimedia.org/wiki/File:Rivian_EDV-500_front.jpg | Jay8g | CC BY-SA 4.0 | No — Amazon front logo + Prime side livery |
| https://commons.wikimedia.org/wiki/File:Rivian_EDV_Amazon_Delivery_Truck_-_55211343232.jpg | Phillip Pessar | CC BY 4.0 | No — Amazon/Prime livery; rear/side angle |
| https://commons.wikimedia.org/wiki/File:Rivian_EDV_front_20250809.jpg | ElToAn123 | CC BY-SA 4.0 | No — Amazon/Prime text; open slider; poles |

No unbranded EDV/RCV plate found on Commons. Category media is Amazon-operated units.

### (b) Generation

Generated unbranded slate-gray EDV using the Jay8g / Pessar plates as guidance (Amazon marks removed).

### Compare checklist

| Check | Result |
|---|---|
| Face & lights | **Pass** — circular lamps with amber/orange halo rings; blank dark panel between lamps (no Amazon) |
| Handles | **Pass** — black commercial pulls; sliding-door track present mid-body |
| Wheels | **Pass** — plain black utilitarian steel-style wheels |
| Trim badges | **Pass** — no Amazon/Prime, no Rivian lettering, no fleet numbers, blank plate area |
| Proportions | **Pass** — high-roof box van, wrap windshield, black lower cladding match refs |

**Residual uncertainty (accepted):** Delivery 500 vs 700 cargo length is hard to certify from one 3/4 front still; face/body read as EDV/RCV Delivery family, not R1T/R1S.

**VERDICT: PASS** (draft generated plate; not a Commons file)

---

## 2. Ford E-Transit Cargo Van Low Roof (2026)

**Files:** `final/ford_etransit_cargo_van_low_roof.jpg` · `sheets/ford_etransit_low_roof_sheet.jpg`

### (a) Commons / press search

| URL | Author | License | Usable as card? |
|---|---|---|---|
| https://commons.wikimedia.org/wiki/File:Budget_Ford_E-Transit_Roseville_2026.jpg | TaurusEmerald | CC BY-SA 4.0 | No — **correct low roof** but Budget livery, DOT stickers, person in cab, barriers |
| https://commons.wikimedia.org/wiki/File:2026_Ford_E-Transit_au_SIAM_2026.jpg | Bull-Doser | Public domain | No — high roof + Ford PRO / promo text / show floor |
| https://commons.wikimedia.org/wiki/File:2022_Ford_E-Transit_350_Leader.jpg | Calreyn88 | CC BY-SA 4.0 | No — DPD courier livery; high roof; 3/4 rear |
| https://commons.wikimedia.org/wiki/File:Michigan_Central_Ford_E-Transit_(53364997740).jpg | (Flickr/Commons) | (Commons category) | No — Michigan Central / Electreon graphics |
| https://commons.wikimedia.org/wiki/File:Ford_Transit_-_Fort_Knox_receives_first_fully_electric_government_vehicle.jpg | Jenn DeHaan (US Army) | Public domain (US gov) | No — passenger-window side profile, not 3/4 cargo low-roof plate |

No clean, unbranded, low-roof, 3/4-front Commons plate.

### (b) Generation

Three generation attempts guided by Budget low-roof + SIAM/face refs. Roof-height collage vs Budget (low) and SIAM (high) shows **candidate matches high roof**, not low roof.

### Compare checklist

| Check | Result |
|---|---|
| Face & lights | Pass-ish — E-Transit blue grille bars / Ford oval / headlamp shape OK |
| Handles | Pass-ish — black commercial handles/mirrors |
| Wheels | Pass-ish — steel wheels |
| Trim badges | Pass — unbranded, blank plate |
| Proportions | **FAIL** — **high roof**, not low roof (148 WB low-roof card) |

**VERDICT: REJECT** — wrong roof height. Keep New card as photo not confirmed. Reject candidate retained only for research audit.

---

## 3. Mercedes-Benz eSprinter Cargo Van 81 kWh

**Files:** `final/mb_esprinter_81.jpg` · `sheets/mb_esprinter_81_sheet.jpg`

### (a) Commons / press search

| URL | Author | License | Usable as card? |
|---|---|---|---|
| https://commons.wikimedia.org/wiki/File:Electric_Sprinter_2018.jpg | Spielvogel | CC BY-SA 4.0 | No — promo text on hood/side; 2018 EU first-gen show unit |
| https://commons.wikimedia.org/wiki/File:Mercedes-Benz_eSprinter_au_salon_des_voitures_%C3%A9l%C3%A9ctriques_de_Montr%C3%A9al_2022.JPG | Bull-Doser | Public domain | No — Prolite / e-Evolution marks; people; dealer plate text |
| https://commons.wikimedia.org/wiki/File:MB_eSprinter_DHL.jpg | Pedant01 | CC BY-SA 3.0 | No — DHL livery |
| https://commons.wikimedia.org/wiki/File:Mercedes-Benz_Vans,_IAA_2026,_Hanover_(20260914-P1086814).jpg | Matti Blume | CC BY-SA 4.0 | No — open doors; Tafel/show branding; people; indoor booth |

81 kWh is a battery option (not a unique exterior trim). NA current eSprinter uses a **closed EV grille assembly** distinct from open diesel-style bars.

### (b) Generation

Multiple gens using IAA 2018 / Montreal / IAA 2026 refs. Candidates kept a conventional open horizontal-slat Sprinter face rather than a clearly closed current NA eSprinter EV panel.

### Compare checklist

| Check | Result |
|---|---|
| Face & lights | **FAIL / uncertain** — reads as open-slat Sprinter face; not confirmed as current closed-grille NA eSprinter |
| Handles | Pass-ish — black pulls, slider present |
| Wheels | Pass-ish — steel work wheels |
| Trim badges | Pass — no courier text; Mercedes star only |
| Proportions | Ambiguous — generic high-roof Sprinter cargo; 81 kWh not externally verifiable |

**VERDICT: REJECT** — better “not confirmed” than a wrong/uncertain face. Battery size cannot be photographed.

---

## 4. Chevrolet Silverado EV WT (not RST)

**Files:** `final/chevy_silverado_ev_wt.jpg` · `sheets/chevy_silverado_ev_wt_sheet.jpg`

### (a) Commons reuse

| URL | Author | License | Notes |
|---|---|---|---|
| https://commons.wikimedia.org/wiki/File:2024_Silverado_EV_WT.jpg | Kaundike | CC BY-SA 4.0 | **Used** — WT work-truck face; whole vehicle; 3/4 front; blank plate; no people. Plain crop → 1600 px wide (1600×1141). |
| https://commons.wikimedia.org/wiki/File:2024_Chevrolet_Silverado_EV_4WT_AWD_in_Summit_White,_front_left,_2024-06-30.jpg | Elise240SX | CC BY-SA 4.0 | Compare-only — also WT/4WT, but lot sign / other vehicle / poles (not “truly clean”) |

Setting on the Kaundike plate: gravel + white wall + palms. No poles/wires/signs lining up with the vehicle; no plate text; no people. Accepted under hard rules (specific forbidden clutter absent).

### Compare checklist

| Check | Result |
|---|---|
| Face & lights | **Pass** — solid black EV fascia, thin upper DRL bar, gold bowtie (WT, not RST body-color face) |
| Handles | **Pass** — black WT handles/mirrors |
| Wheels | **Pass** — black multi-spoke WT wheels (not RST designs) |
| Trim badges | **Pass** — SILVERADO / WT cues; no RST badge |
| Proportions | **Pass** — crew cab + sail-panel EV bed |

**VERDICT: PASS** (Commons crop; attribute Kaundike / CC BY-SA 4.0 before any public use)

---

## 5. GMC Sierra EV Elevation (not Denali)

**Files:** `final/gmc_sierra_ev_elevation.jpg` · `sheets/gmc_sierra_ev_elevation_sheet.jpg`

### (a) Commons / press search

| URL | Author | License | Usable as card? |
|---|---|---|---|
| https://commons.wikimedia.org/wiki/File:26_GMC_Sierra_EV_Elevation.jpg | HJUdall | CC0 1.0 | Trim-correct Elevation, but dealership lot: other vehicles, lamp posts, building signage, folding chair — **not clean enough for uncropped card use** |
| https://commons.wikimedia.org/wiki/File:26_GMC_Sierra_EV_AT4.jpg | HJUdall | (Commons) | Contrast only — AT4 (red hooks / different wheels), not Elevation |

### (b) Generation

Generated plain-lot plate guided by HJUdall Elevation photo (dealer clutter removed).

### Compare checklist

| Check | Result |
|---|---|
| Face & lights | **Pass** — solid black EV panel, red GMC lettering, C / inverted-L DRLs matching Elevation ref (not Denali chrome face) |
| Handles | **Pass** — body-color handles matching Elevation ref (not chrome Denali) |
| Wheels | **Pass** — gloss black multi-spoke Elevation-style; not AT4 two-tone / Denali chrome |
| Trim badges | **Pass** — no Denali / AT4 badges; blank plate; OEM GMC face mark only |
| Proportions | **Pass** — crew cab + EV sail-panel bed |

**VERDICT: PASS** (draft generated plate; Commons Elevation used as reference only)

---

## Hard-rule compliance notes

- Rivian final: no Amazon / Prime / courier marks; no Rivian lettering; blank plate area.  
- No people in PASS finals.  
- Ford / eSprinter candidates are **rejected** and must not be wired into the New catalog as confirmed.  
- Silverado PASS is CC BY-SA 4.0 — keep attribution if/when published.  
- All work is draft; `src/assets/new-catalog/` on the trade-cards branch is unchanged.

## Existing New catalog context (from trade-cards branch)

Already confirmed on that branch: Tesla Cybertruck Dual, Rivian R1T Premium.  
Still “Photo not confirmed” there for the five IDs above — this research updates draft assets under `product/new-vehicle-photos/` only.
