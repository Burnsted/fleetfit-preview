# AUDIT — Add to fleet / suggestions / shop listings

**Date:** 2026-10-01  
**Brand:** FleetFit only  
**Good-score threshold (from code):** `GOOD_SCORE_RATIO = 0.7` — same bar as `ScoreDial` tone `is-high` (`pct = candidateTotal / pointsPossible >= 0.7`). Incomplete scores fail. Do not invent another threshold.

## Where the lists live

| Surface | Route / screen | Data source | Renderer |
|--------|----------------|-------------|----------|
| **Add to fleet** (PATH step) | `#/package/pkg-tc-electrical-4` (and landscape) | `src/data/package.js` units + `listingPhotos.js` FACT overlay + `listingOutbound.js` | `PackageResults.jsx` → `composeRecommendationSet` → `StackCard` |
| Recommendation / replacement set | Same package page (Units + mix chips) | `src/lib/recommendationSet.js` | Same |
| Full compare | `#/package/:id/compare` | Compare-set IDs → `getUnit` | `FullCompare.jsx` |
| Shop “fleet list” (8 cards) | `#/shop` | `src/data/listings.js` (vnd-001…008) + same outbound/photos | `Browse.jsx` → `ListingCard` |

Ted’s “8 options” matches **Shop** (`vnd-001`…`vnd-008`). The PATH **Add to fleet** electrical package shows **7** seed units (`unit-e1`…`unit-e7`); two dead vans are on that package list. Both surfaces are audited below.

Outbound rule before this fix: `listingLive` + `dealer_url` or Cars.com `listing_url`. Cards with `listingLive=false` showed “Seller listing not available” but still appeared in the ranked set (false advertising for vans).

---

## A. Add to fleet — electrical package (7 seed options)

Scores measured on the running app vs package example current (2018 Transit-250). URL checks via HTTP fetch + Playwright (2026-10-01).

| # | Vehicle | Year | Price shown | Seller / dealer shown | URL opened | Fetch | Listing verdict | Score | ≥0.7? | Real link? | Kept / removed |
|---|---------|------|-------------|------------------------|------------|-------|-----------------|-------|-------|------------|----------------|
| 1 | GMC Sierra EV Standard Range Elevation (`unit-e5`) | 2026 | $54,177 | Jimmy Britt Chevrolet (Greensboro, GA) | `jimmybrittchevrolet.com/vehicle/1GT1ESEH3TU406433/...` | HTTP 200; title includes VIN; specific VDP | **REAL LISTING** | 64.8/80 (0.810) | **yes** | **yes** | **KEPT** |
| 2 | RAM ProMaster EV Super High Roof (`unit-e4`) | 2024 | $27,439 | Rob Lambdin's University Dodge RAM (Davie, FL) | none (UI: Seller listing not available); stored Cars.com CF | CF / prior “No longer listed” | **DEAD** | 63.0/80 (0.788) | yes | **no** | **REMOVED** (dead van) |
| 3 | Chevrolet BrightDrop 600 (`unit-e6`) | 2025 | $27,995 | Baha Auto Sales (Chicago, IL) | none; Cars.com CF | CF; prior VIN not on dealer inventory | **DEAD** | 59.6/80 (0.745) | yes | **no** | **REMOVED** (dead van) |
| 4 | Chevrolet Silverado EV Work Truck (`unit-e2`) | 2024 | $43,295 | Ed Morse Bayview Cadillac (Fort Lauderdale, FL) | Cars.com vehicledetail/b562… | HTTP 403 Cloudflare | **could not verify** | 66.9/90 (0.743) | yes | no (unverified) | **REMOVED** |
| 5 | Ford F-150 Lightning Pro (`unit-e3`) | 2022 | $34,495 | Soerens Ford (Brookfield, WI) | none | prior dead; CF on Cars.com | **DEAD** | 61.8/90 (0.687) | **no** | **no** | **REMOVED** |
| 6 | Ford E-Transit Base (`unit-e1`) | 2023 | $25,309 | Zeigler… (Plainwell, MI) | `zeiglerford.com/used-…-1FTBW9CK9PKA27642` | HTTP 200; specific VDP + VIN | **REAL LISTING** | 54.6/90 (0.607) | **no** (mid) | **yes** | **REMOVED** from suggestions (fails good-score; still a verified live VDP in outbound) |
| 7 | Rivian R1T Adventure (`unit-e7`) | 2022 | $53,343 | (anonymized / no VDP) | **NO LINK** | — | **NO LINK** | 46.1/90 (0.512) | **no** | **no** | **REMOVED** |

**Before:** Truck · 4, Van · 3 (including two dead van cards).  
**After:** Truck · 1 (Sierra EV only). Plain line: `No vans with a real listing and a good score right now.`

---

## B. Landscape package (replacement / package pick)

| # | Vehicle | Year | Price | Seller | URL | Fetch | Verdict | Score | ≥0.7? | Real? | Kept / removed |
|---|---------|------|-------|--------|-----|-------|---------|-------|-------|-------|----------------|
| 1 | Chevrolet Silverado EV Trail Boss ER (`unit-l1`) | 2026 | $55,066 | Chevrolet of Culver City | `socalchevy.com/inventory/Used-2026-…-1GC403ED1TU400628/` | HTTP 200 VDP | **REAL LISTING** | incomplete (dial Inc) | **no** | **yes** | **REMOVED** from suggestions (fails good-score) |
| 2 | Ford F-150 Lightning XLT (`unit-l2`) | 2023 | $34,547 | AutoNation Toyota White Marsh | none | prior dead | **DEAD** | incomplete | no | no | **REMOVED** |

---

## C. Shop list — 8 options (`vnd-001`…`vnd-008`)

Shop cards use the same outbound gate. Cars.com pages were **Cloudflare-blocked** from this host (Playwright + fetch). Per Ted: do not guess; unverified ≠ real listing for suggestions.

| # | Vehicle | Year | Price shown | Seller shown | URL | Fetch | Verdict | Score on shop? | Real link? | Kept / removed |
|---|---------|------|-------------|--------------|-----|-------|---------|----------------|------------|----------------|
| 1 | Tesla Cybertruck Base (`vnd-008`) | 2025 | $67,370 | LAX CDJR | Cars.com …/ed88366a… | CF 403 | **could not verify** | n/a (no package score) | no | **REMOVED** (unverified) |
| 2 | Chevrolet Silverado EV LT (`vnd-002`) | 2026 | $54,489 | Montrose Nissan | none | prior left dealer | **DEAD** | n/a | no | **REMOVED** |
| 3 | Tesla Cybertruck Base (`vnd-006`) | 2024 | $66,838 | Schumacher Buick GMC of West Palm Beach | Cars.com …/7bc9b3cc… | CF 403 | **could not verify** | n/a | no | **REMOVED** |
| 4 | Ford F-150 Lightning Pro (`vnd-001`) | 2022 | $34,000 | Berkenkotter Motors Castle Rock | none | sold/Copart | **DEAD** | n/a | no | **REMOVED** |
| 5 | GMC Sierra EV Std Range Elevation (`vnd-004`) | 2026 | $52,690 | Nelson GMC | Cars.com …/aa9ba7cb… | CF 403 | **could not verify** | n/a | no | **REMOVED** |
| 6 | GMC Sierra EV Elevation (`vnd-003`) | 2026 | $49,922 | Suntrup Buick GMC | Suntrup dealer VDP (was live) | **HTTP 404** Page Not Found | **DEAD** | n/a | no | **REMOVED** (dealer cleared) |
| 7 | Rivian R1T Adventure (`vnd-005`) | 2022 | $43,841 | Parkline Motors | none | VIN not listed | **DEAD** | n/a | no | **REMOVED** |
| 8 | GMC HUMMER EV Pickup 3X (`vnd-007`) | 2023 | $58,411 | Webb Chevy | none | no VDP | **DEAD** | n/a | no | **REMOVED** |

**After shop:** 0 live listings → empty state: `No trucks with a real seller listing right now.`

---

## D. Could not verify

- All Cars.com `listing_url` targets: Cloudflare challenge (HTTP 403 / “Just a moment…”) from Playwright and `fetch` on 2026-10-01.
- No invented replacement URLs, prices, dealers, or VINs.

---

## E. Fix (consistent across surfaces)

1. **`listingOutbound.js`:** only fetch-verified dealer VDPs stay `live` (`unit-e1`, `unit-e5`, `unit-l1`). `vnd-003` dealer 404 → dead; CF-only marketplace rows → dead for suggestible pool.
2. **`suggestionEligibility.js` + `recommendationSet.js`:** suggest only `hasRealListing` **and** `passesGoodScore` (≥ 0.7). One-of-each-body **must not** inject weak/unreal vans or trucks.
3. **`getPackage`:** drops non-live units; `unitCount` / battery open note recompute from what remains. Score fixtures use `getPackageAllUnits`.
4. **`PackageResults`:** counts/totals from shown suggestible set; vans line when none qualify.
5. **`Browse` / `getModels`:** live listings only.

**Kept suggestible:** `unit-e5` only (electrical).  
**Live but not suggestible:** `unit-e1` (real listing, score mid), `unit-l1` (real listing, score incomplete).
