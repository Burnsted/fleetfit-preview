# CLEARED-FOR-WOZ — Fill spec fields with real OEM data · Steve Jobs · ~2:52 PM ET 2026-09-26

**Ted:** ~2:48 PM ET via Jarvis (live package page, `index-BTBPoiNp.js`)
**Host:** `Burnsted/fleetfit-preview` PR #1 draft · **no merge**

## Quote Ted pick
Payload and the other spec data points all render as a dash. Put actual data in them.
Fill payload + every spec field (payload, towing, range, battery kWh, drivetrain, bed/cargo, etc. — whatever the card/readout shows) with real OEM spec per year/trim/body. Truly unknown = plain "Not published" text, not a dash, never invented. No Worth it/SOH/FACT pills. No Best labels.

## Steve diagnosis (from live bundle `index-BTBPoiNp.js`)
**It is a binding bug first, a data gap second.**
- The real-listing overlay (minified `function pr(e)`, merges Cars.com listing rows `unit-*` / `vnd-*` onto package units) **hard-sets** `payload, ratedRange, usableKwh, gvwr, curb, cab, bed, onboardChargerKw, dcFastMaxKw` to `null` (and `soh`). Only `drivetrain` survives from the listing row.
- Older demo units carried values (e.g. payload 2000 / 2550 / 1800…), but the overlay wipes them, so the card `meta-chip`, `stat-tile`, and `fact` `dd` render `—` via `x==null ? "—" : …`.
- There is **no towing field** at all in the unit shape today.

## Exact ship
1. **OEM spec table** — new data file (e.g. `src/data/oemSpecs.ts`) keyed by `year + make + model + trim` (+ body/wheelbase/roof where the OEM splits it). One entry for every unit the preview can show, at minimum:
   - 2023 Ford E-Transit (Base / Cargo 250 as listed) · 2024 Chevrolet Silverado EV Work Truck · 2022 Ford F-150 Lightning Pro · 2023 F-150 Lightning XLT · 2024 RAM ProMaster EV Super High Roof (and 2023 ProMaster EV Cargo) · 2026 GMC Sierra EV Standard Range Elevation · 2026 Sierra EV Elevation · 2025 Chevrolet BrightDrop 600 · 2026 Silverado EV Trail Boss Extended Range 4WD · 2026 Silverado EV LT Standard Range 4WD · 2022 Rivian R1T Adventure · 2024 + 2025 Tesla Cybertruck Base · 2023 GMC HUMMER EV Pickup 3X.
2. **Fields per entry:** payload (lb) · max towing (lb) · EPA range (mi) · usable battery (kWh) · drivetrain · bed length (trucks) or cargo volume (cu ft, vans) · GVWR (lb) · curb weight (lb) · cab · onboard AC charger (kW) · DC fast max (kW). Add **towing** to the unit shape and to the same card/detail/readout surfaces that show payload.
3. **Sourcing:** OEM spec pages / OEM spec sheets / OEM press kits for that model year and trim first; EPA fueleconomy.gov for range. Every value carries a `source` URL in the data file (not shown in UI). If the OEM publishes a range of values for a trim, use the value that matches the listed trim/config, else the base config and note it in the file.
4. **Binding fix:** overlay `pr()` must **merge OEM spec by year/make/model/trim** instead of nulling. Dealer-listing values may override only when the listing actually states them.
5. **Unknown display:** anywhere a spec is null after the OEM merge, render plain text **"Not published"**, never `—`. Applies to card chips, stat tiles, facts list, and the score readout.
6. **Keep:** battery health stays internal (no SOH pill), dial right of price, full rank order, Truck·N + Van·N, dial-tap readout, PATH ← Back.
7. **Out:** invented numbers · Worth it / SOH / FACT pills · Best / Worst labels · merge without Ted · VND in public voice.

## Woz
Quote **this** file in the cloud ship prompt. `Burnsted/fleetfit-preview` **PR #1 draft only**. Ship the spec table with source URLs in the diff so Steve can spot-check values. Ping Steve + Jarvis with hard-refresh URL + script hash when live. **No merge.**
