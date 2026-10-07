# CLEARED-FOR-WOZ: Trade home cards, Used | New toggle, new fleet options (FleetFit)
Date: 2026-10-01 overnight. Draft only. No merge. No publish. No hosting until Ted says yes.
Source of truth: Ted's overnight directive, RESEARCH-TRADE-CARDS-AND-NEW-TAB.md, BUILD-PLAN.md, mocks/ and data/ in this folder.

## History (plain)
Trade vehicle cards: concept only, never built. New tab: designed 9/27, deferred in the cleared spec, never built, never removed. Only unused newVsUsed data exists in package.js.

## Base and order
Stack on Woz's fleet list branch (PR 4, d972ea3) with PR 2 package total folded in, and on the trade packages build. If trade packages is not ready, build the home cards and toggle on PR 4 and say so. Keep the diff readable. Report file count.

## Build
1. HOME: replace the single hero and Example packages with a 2x2 grid of four trade cards, photo with trade name as the only caption (Landscaping, HVAC, Electric, Plumbing). Each card opens that trade's package. Keep wordmark, Match my fleet, PATH. Photos: mocks/home-trades-desktop-1440.png (Silverado EV, Cybertruck, white R1T, lime R1T). Fourth card: the mock says Utility but our trade packages are Electrical, HVAC, Plumbing, Landscaping, so label it Plumbing and use the lime R1T plate. Ted decides in the morning. Crop images from the mock plates only if they are not baked with text; if a plate has baked-in text, use the source image from /workspace/fleetfit/product/home-four-photos/ or tell me.
2. INTAKE: Trade preset (Electrical, HVAC, Plumbing, Landscaping) as 4px-corner rectangles, and Stock choice Used (default) or New. Helper text exactly "Used EVs with seller price (default)" for Used. Map to stockMode.
3. PACKAGE and ADD TO FLEET: Used | New toggle, Used default and unchanged (real listings only, good score rule from PR 4). Never mix New cards into used listing cards. Never show a New vehicle with a seller listing, mileage, or used price.
4. NEW view cards (from data/new_ev_trims.csv, new_ev_links.csv only): Tesla Cybertruck Dual Motor (MSRP $74,990, 325 mi EPA), Rivian Commercial Van Delivery 500 (Fleet orders only, from $79,900, range 161, payload 2,663, link rivian.com/fleet), Rivian R1T Premium (MSRP $79,990, 300 mi EPA), Ford E-Transit Cargo Van Low Roof (MSRP $53,260, range 159, payload 3,320), Chevrolet Silverado EV WT (Fleet orders only, from $52,800, 286, 2,350), GMC Sierra EV Elevation (from $62,400, 283, 2,250), Mercedes-Benz eSprinter 81 kWh (from $52,700, range 150 max est). Verify every figure against the CSV rows before coding; if the CSV disagrees with this list, the CSV wins and tell me. No Lightning, no BrightDrop. Unknown fields read "not confirmed". Link text "Build on the maker site" only where the CSV URL is a FACT; INFERENCE URLs get no link, or the status page text from the mock only if the URL is real. Never invent a URL.
5. Rivian Commercial Van and eSprinter: no photo yet (no accurate unbranded photo). Show a plain spec card, light grey box reading "Photo not confirmed". Do not generate or use a made-up van picture. Ted may supply or approve one later.
6. Vehicle photos in the New view come from the mock set (Commons-based). They are for the draft only; license check is TBD before any public use, note that in the PR description.
7. Label every New card "New" in a 4px-corner rectangle tag, not a pill.

## Fix these in the cloud agent's mocks (do not copy them)
- The filter row ("New", "Trade Electrical", "Ordered by model") looks like pills. Drop it; use one plain text line: "New EV trucks and vans. MSRP shown where confirmed."
- Middle dots between spec items are fine; no slashes anywhere visible. No em dashes.
- No dial, no score on New cards.

## Acceptance checklist (I run this in a real browser)
1. Home shows four trade cards, full vehicle visible, trade name only, tap goes to that trade's package.
2. Cybertruck, Rivian R1T and the Rivian Commercial Van are all reachable in New.
3. Used view is unchanged: only the real good-score listing, exact empty lines intact.
4. New cards show only CSV figures; any unknown says not confirmed; no invented prices or links.
5. No New card carries a seller link, mileage or used price.
6. Intake preset and Used or New choice carry through to package and Add to fleet.
7. Package total (PR 2) still computes from Used units, no crash with empty sets.
8. No pills, no slashes, no em dashes, none of Best, Worst, Worth it, SOH, battery health. FleetFit name only.
9. Phone 390 and desktop 1440 both readable; no cropped vehicles.
10. Tests and build pass. PR small; file count reported.
Send me the PR link and screenshots. I bar it, then hold the link for Ted.
