# BUILD-PLAN: Trade home cards + Used | New across the concept

Draft plan only. Depends on real-listings work already in flight (PR #3 audit, PR #4 Woz clean re-cut). Do not invent used listings. Do not ship New as fake used.

## Screens

| Screen | Change | Notes |
|---|---|---|
| **Home** | Replace model “Example packages” with four trade cards (Landscaping, HVAC, Electric, Utility). Caption = trade name only. Each card → that trade’s package. Keep FleetFit wordmark, Match my fleet, PATH (Intake · Package · Add to fleet per product lock / mocks). | Photos must be model-accurate; no pills; 4px corners. |
| **Intake** | Trade preset entry (chips already exist). Surface Used \| New choice (Used default) as stock mode for the upcoming package. | Maps to `stockMode` from CLEARED trade-packages spec. |
| **Package** | Same package surface; honor `stockMode`. Used = real listings only. New = OEM catalog cards (not seller VDPs). | Package total (PR #2) stays; recomputes from visible units. |
| **Add to fleet** | Used \| New toggle (Used default). Used view = today’s real-listing-only results (after PR #3/#4). New view = OEM models from sourced CSV. | New cards: model, trim, year, 1–2 confirmed specs, MSRP or “MSRP not confirmed” / “Fleet orders only”, link “Build on the maker site” only when URL is not inference-only. No score dial unless Score v2 can score new OEM config from real data. |

## Data needed

| Data | Source | Gate |
|---|---|---|
| Used units | Existing package/listings + listingOutbound | PR #3/#4: fetch-verified seller URL **and** (for suggestions) score ≥ 0.7 |
| New trims / MSRP / specs | `new_ev_trims.csv` + `SOURCES-NEW-2026-09-27` | UNKNOWN → “MSRP not confirmed” / omit spec; no invented prices |
| New build / fleet URLs | `new_ev_links.csv` | If build URL label is INFERENCE → use status page or omit; never invent |
| Discontinued | CSV `sale_status` | Do **not** show F-150 Lightning or BrightDrop as orderable new |
| Trade presets / job profile | CLEARED trade-packages + `trade_needs.csv` (when committed) | Seed intake; do not invent units |
| `stockMode` | package field (`Used` \| `New`) | Ship Used now; New when catalog wired |

## Required New catalog (current orderable)

From CSV only (examples): Ford E-Transit; Chevrolet Silverado EV; GMC Sierra EV; Rivian R1T; Rivian Commercial Van; Tesla Cybertruck; Mercedes eSprinter. Exclude Lightning BEV and BrightDrop as new orderable.

## Depends on fleet-list real listings fix (PR #3 / PR #4)

- Used Add to fleet and Shop must not reintroduce unverified or weak units.
- New path is a **separate catalog**, never mixed into used listing cards.
- Package total / counts must recompute from the filtered Used set; New selections need their own confirmed price rules (MSRP from CSV only).
- Merge order suggestion: land PR #4 (clean re-cut) + PR #2 package total, then trade packages + stockMode, then New catalog UI.

## UI hard rules (carry into build)

FleetFit name only · rectangles with 4px corners (no pills) · no slashes in visible text · no em dashes · none of Best / Worst / Worth it / SOH / battery health · no VND · no EXAMPLE DATA banners in product UI.

## Out of scope for first ship

Publishing to live Pages root · inventing dealer New inventory prices · scoring New cards without a real Score v2 path · Amazon-liveried Rivian vans (use plain Rivian Commercial Van styling only).
