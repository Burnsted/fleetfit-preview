> **REV 2 VISUALS CLEARED BY TED (Sep 30, 2026, 8:56 AM ET).** Ted: "great, I like them as is", no removals. Build to the REV 2 mocks in `design/`: `04-package-stack-rev2-phone.png`, `05-package-stack-rev2-desktop.png`, `06-remove-then-auto-replace-rev2.png` (they supersede 01 to 03).
> - Remove control: clear/transparent ~28px box, thin outlined X, 44x44 hit area. Never a white circle or big X.
> - Removing a listing collapses it to a small "removed, Undo" row and auto-adds the next-ranked unit (note: "Next-ranked unit added."); total updates; list stays score-ordered.
> - Palette (from FleetFit tokens): teal #1bb6a8, deep teal #17a396, accent #3dd6c6, cyan #00a8bd, charcoal #0b1220 / #0c1214, amber #F5A623 on the J6 mark only, soft teal fill #f3fbfa.
> - Queue: Woz builds when the build queue reaches it. Draft only, no merge. **Do not publish live without Ted's OK on publish.** Pages bar against section 12 after a preview URL exists.

# CLEARED-FOR-WOZ — Preset Trade Packages · Steve · 2026-09-27

**Ted redline:** `PRESET-TRADE-PACKAGES-REDLINE-2026-09-27.md` (~8:30 AM ET)  
**Copy (verbatim):** `COPY-2026-09-27.md` (Isaacson) — entry label **Trade packages**  
**Design bar:** `DESIGN-BAR-2026-09-27.md` PASS · mocks `01` card stack · `02` remove+undo · `03` dead listing auto-replaced  
**Trade needs (sourced):** `TRADE-NEEDS-SOURCES-2026-09-27.md` + `trade_needs.csv` + `trade_needs_detail.csv` (Sherlock)  
**Scoring (every package):** `CLEARED-FOR-WOZ-SCORE-V2.md` (G-final) + Score UI / dial-tap / OEM-specs CLEARED files  
**Host:** `Burnsted/fleetfit-preview` PR #1 draft · **no merge**  
**This file:** build-ready ship spec for Woz. Documentation only at clear time — do not invent listings, prices, specs, or seller URLs.

**Visual refs (approved mocks):**
- `01-package-card-stack` — package header, size chips 1–5, unit card stack by score, dead-listing text state
- `02-remove-undo` — X remove, slim Undo row, header/size/total sync, snackbar Undo (~6 s)
- `03-dead-listing-replaced` — auto next-ranked unit, “Next-ranked unit added.”, struck dead row + Undo replace

Intended repo home after ship: `fleetfit/product/trade-packages/` (copy, design, sources, this CLEARED).

---

## 0. Current app structure (read-only baseline)

Stack: React 19 + Vite + `HashRouter` on branch with live preview code. Relevant today:

| Surface | Hash route | Notes |
|---|---|---|
| Home | `#/` | Hero → intake or example package |
| Intake | `#/intake` | Job + current vehicle; **no Back** (`PathBack` hidden on intake) |
| Package (Add to fleet PATH step) | `#/package/:packageId` | `PackageLayout` → `PackageResults` |
| Unit deep link | `#/package/:packageId/unit/:unitId` | Redirects to package index |
| Compare | `#/package/:packageId/compare` | Full compare |
| Checkout | `#/checkout` | Facilitated-sale stub |
| Budget | `#/budget` | Spend envelope |
| Shop | `#/shop` | `LISTINGS` inventory |

**Today’s packages** (`src/data/package.js`): only `pkg-tc-electrical-4` (default) and `pkg-tc-landscape-2`. Intake maps Landscaping → landscape package; everything else → electrical. Units are composite seeds overlaid with FACT Hot Deals rows (`src/data/listingPhotos.js` `LISTING_ROWS`) and outbound live/dead (`src/data/listingOutbound.js` + `src/lib/outboundListing.js`).

**Score v2:** `src/lib/scoreV2.ts` via `rankUnitsByScoreV2` / `composeRecommendationSet`. Job inputs: `dailyMiles`, `loadLb`, `cargoCuFt`, `crew`, `tows`, `trailerLb`, `wdh`, `shopCity`. **Gap vs Score v2 CLEARED:** `tongueLb` is not yet on `JobInputs` / intake — this ship must add it (see §3 / §5).

**Fleet picks:** `sessionStorage` key `fleetfit-fleet-picks`; ids `unit:${packageId}:${unitId}` or `listing:${listingId}` (`src/lib/fleetPick.jsx`). PATH label **Add to fleet** already points at the package surface (`src/lib/pathSteps.js`).

**Analytics:** none in repo today (no gtag / Segment / PostHog). §9 defines optional hooks to add if/when a thin layer lands; do not block ship on a vendor.

**Intake state:** passed as `location.state.intake` on navigate to package — not persisted. Cold `#/package/:id` falls back to package `jobDefaults` + `currentVehicle`.

---

## 1. Locked product rules (do not reopen in code)

1. **Per-trade presets.** Electrical, HVAC, Plumbing, Landscaping (/ lawn), plus General contracting when real listings exist to fill size chips. Each preset **seeds** the job profile from `trade_needs.csv`. **UNKNOWN stays UNKNOWN** — never invent mi/day, payload, crew, tow, or tongue. User may edit; tell them using approved copy (§7).
2. **Real listings only.** A package unit must have a real `listingUrl` (http) from FACT listing data. Rank by Score v2 **candidate total ÷ points possible** against the package’s current vehicle. Never invent units, prices, specs, or links.
3. **Dead / missing link.** Show exact `Seller listing not available`. Auto-add the next-ranked real unit (mock 03) with Undo replace. Manual remove is X + Undo + toast (mock 02).
4. **Add a unit (locked).** A control opens the **full ranked list** of real listings for that trade’s job profile; user picks from it. **No free-text unit creation.**
5. **Custom intake stays.** Second entry point. Intake has **no Back** link (existing PATH rule).
6. **Numbers only.** No Best/Worst, match, Worth it, SOH, battery health, or opinion words. Missing spec → **`Not published`**, never `—`. Brand **FleetFit** only — no Fit My Truck / VinNotDiesel / VND in UI. Local FL shop examples from sources stay **internal** (never on Pages).
7. **Landscaping tows.** Baseline 7,000 lb trailer; tongue 700–1,050 lb. Score down where payload+tongue or tow capacity falls short. **No model override** (incl. R1T).
8. **Stock mode.** Packages take a `stockMode`; ship **`Used`** now. Leave UI/API room for upcoming Used \| New toggle — do not build the toggle in this ship unless copy/design arrives.

---

## 2. Exact ship — routes & entry

### 2.1 Keep hash package route

- Primary package surface remains **`#/package/:packageId`** (param name may stay `packageId`; treat as `:id` in product language).
- PATH step **Add to fleet** continues to highlight on `/package*`.
- **Back** on package → intake (preserve `location.state`). **Hidden on `#/intake`.**

### 2.2 New / updated entry: Trade packages

| Piece | Spec |
|---|---|
| Entry label | **`Trade packages`** (COPY pick A) |
| Optional section helper | `Pick your trade. We’ve lined up real listings you can trim.` |
| Per-trade tap | Opens that trade’s package at default size (see §4) |
| Secondary entry | Custom intake — link copy **`Build your own`**; helper `Start from scratch on the intake form.` |
| Breadcrumbs (package) | `Home / Trade packages / {Trade}` (mock). Keep FleetFit wordmark + PATH Intake · Add to fleet · Budget. |

Home / nav: replace or augment today’s “Example packages” / “View example package” demo path with **Trade packages** entry. Do not leave “Matched setups” in UI.

### 2.3 Package IDs

Introduce stable trade-package ids (extend `PACKAGES` / `matchPackageIdFromIntake`):

| `packageId` | Trade (intake / chip) |
|---|---|
| `pkg-trade-electrical` | Electrical |
| `pkg-trade-hvac` | HVAC |
| `pkg-trade-plumbing` | Plumbing |
| `pkg-trade-landscaping` | Landscaping / lawn |
| `pkg-trade-gc` | General contracting (only if ≥1 live real listing ranks for a size) |

Deprecate or redirect demo ids `pkg-tc-electrical-4` / `pkg-tc-landscape-2` → new ids (or keep as aliases that resolve to the trade packages) so old links do not 404. Default PATH “Add to fleet” target becomes the electrical trade package (or last-used trade if state exists).

`matchPackageIdFromIntake(intake)` must map every named trade to its `pkg-trade-*` id (not only Landscaping → old landscape demo).

---

## 3. Data model changes

### 3.1 Trade needs → code data

Add (committed in PR diff with source URLs):

- `src/data/tradeNeeds.js` (or `.ts`) generated/hand-ported from `trade_needs.csv`
- Keep detail CSV under `fleetfit/product/trade-packages/data/` (or `src/data/v2/`) for audit — UI never shows shop names from the INTERNAL FL examples table

**Seed field mapping** (package `jobDefaults` + editable job profile on the package surface / intake prefill):

| Job field | CSV / sources | Seed rule |
|---|---|---|
| `job.dailyMiles` | `daily_mi_typical` | Seed only a single numeric FACT or labeled INF value when one clear number exists. Multi-value cells → prefer the **explicit numeric typical** used for scoring notes (see §3.2). If cell is UNKNOWN → `null` / empty. |
| `job.loadLb` | `payload_lb_typical` | **All trades UNKNOWN for loaded working payload** → leave **`null`**. Do **not** invent load from upfit-only pounds. (Upfit lb may appear in internal notes / score reasons only when Score v2 CLEARED already allows a FACT upfit load for a demo current — do not invent a trade-typical payload.) |
| `job.crew` | `crew` | Seed INF/FACT typical counts only when a single number is justified in sources (see §3.2). Else `null`. |
| `job.tows` | `tow_habit` | Landscaping: `true`. Others UNKNOWN → `null` or `false` with Tow category `Not used by this job` until user sets towing. |
| `job.trailerLb` | landscaping tow baseline | Landscaping: **7000**. Else `null`. |
| `job.tongueLb` | tongue 700–1050 | Landscaping: if user has not entered tongue → Score v2 default **15% of trailer = 1050** (shrink-the-lead). Store entered tongue when user edits. |
| `job.wdh` | — | Default unset/`null` (no WDH) unless user sets yes. |
| `job.shopCity` | existing intake | Keep Vero Beach / Fort Pierce / West Palm Beach options; do not invent. |
| `job.cargoCuFt` | — | Optional; unset OK. |

**UNKNOWN display (job profile chips / intake):** show the field as empty / “not entered” for scoring (`Not scored: … not entered`). For human-facing missing **vehicle specs** on cards: **`Not published`**. Never `—`. Never show Sherlock INF shop names.

**User can edit:** every seeded field is editable (package profile strip and/or deep-link to intake with prefilled state). Prefer persisting edited job profile in `sessionStorage` (recommended key `fleetfit-trade-package-job`) so refresh does not wipe edits — open if product wants router-state-only (§11).

### 3.2 Per-trade seed table (Woz codes this; UNKNOWN = null)

| Trade | dailyMiles | loadLb | crew | tows | trailerLb | tongue default |
|---|---|---|---|---|---|---|
| Electrical | **62** (FACT single fleet) — class 74 is fallback note only, not a second seed | `null` (UNKNOWN) | **2** (INF helper band; alone=1 is alternate — seed 2 to match existing Supervisor/helper demo unless Ted overrides) | `null`/`false` | `null` | n/a |
| HVAC | **63** (round Azuga 63.3 FACT) | `null` | **1** (service tech INF) | `null`/`false` | `null` | n/a |
| Plumbing | **54** midpoint of INF 48–60 **or leave null** — see Open Q | `null` | **2** (BLS one or two) | `null`/`false` | `null` | n/a |
| Landscaping | `null` (UNKNOWN) | `null` (truck payload UNKNOWN) | **3** (INF typical) | **true** | **7000** | **1050** if unset (15%) |
| General contracting | `null` | `null` | `null` | `null`/`false` | `null` | n/a |

Body / upfits from CSV inform **filters and copy work-day lines only** — not invented payload numbers.

### 3.3 Package object shape (extend `src/data/package.js`)

```ts
type TradePackage = {
  id: string                    // pkg-trade-*
  trade: string                 // Electrical | HVAC | …
  label: string                 // internal
  headline: string              // unused in UI if COPY header wins — prefer COPY pattern
  stockMode: 'Used' | 'New'     // ship 'Used'; leave field for toggle
  sizeDefault: 1 | 2 | 3 | 4 | 5
  sizeMax: 5
  jobDefaults: JobInputs & {
    trade: string
    // optional reason/url notes for seeded FACT fields only
  }
  currentVehicle: {             // vehicle being replaced; required for Score v2 totals
    label?: string              // e.g. "Example current vehicle" when demo
    year: number
    make: string
    model: string
    engine?: string
    drivetrain?: string
    miles: number
    // …
  }
  /** Ranked pool = real listing ids eligible for this trade — not a fixed fake roster */
  poolListingIds?: string[]     // optional allowlist; default = all live FACT listings that pass HF filters
  workDayCopyKey: string        // maps to COPY work-day line
}
```

**Units are not invented package seeds.** Build the visible package as:

1. Score all **real** candidate listings (FACT `LISTING_ROWS` / shop listings with real `listing_url`, OEM merge, outbound status) with Score v2 against `currentVehicle` + job inputs.
2. Sort by `sortKey = candidateTotal / pointsPossible` (Score v2 CLEARED §1.5). Ties: lower price, then lower miles.
3. Take top **N** for selected size chip (1–5), skipping hard-rejects / incomplete-as-unrankable per Score v2 rules.
4. If fewer than N real listings exist, show what exists; do not pad with invented units. Empty → COPY empty state.

Retire composite placeholder fields that invent SOH / opinion fit bands on cards for this surface (numbers + Score dial only). Existing listing-card CLEARED still applies where those cards are reused.

### 3.4 Listing / outbound (reuse)

Required per unit in package:

- Real `listingUrl` (and optional `dealerUrl`) from FACT data
- `listingLive` from `LISTING_OUTBOUND` / `resolveOutboundListing`
- Price, miles, YMM from listing facts — never invented
- Specs via OEM merge → **`Not published`** when null

### 3.5 `JobInputs` / Score v2 wiring gap

Extend Score v2 + intake to match CLEARED Score v2 G-final:

```ts
tongueLb: number | null   // NEW on JobInputs
```

Payload load when `tows === true`: **`loadLb + tongue`** (tongue entered, else 15% of `trailerLb`). No vehicle-specific exemption. Landscaping packages must exercise this path.

### 3.6 Stock mode

```ts
stockMode: 'Used'  // default on every trade package
```

Leave a single prop / data field and a neutral layout slot near size chips for a future **Used \| New** control. Do not ship the toggle or New inventory in this CLEARED unless a follow-on clears it. Shop cards already say Used — stay consistent.

---

## 4. Package UI states (match mocks; COPY strings win)

### 4.1 Default — card stack (mock 01)

**Header**
- Title (COPY): `{Trade} package · {N} vehicles`  
  - Electrical / HVAC / Plumbing / Landscaping / General contracting patterns in COPY §2  
  - Landscaping header: `Landscaping package · {N} vehicles`  
  - `{N}` = active size chip, never hard-coded
- Work-day line under title (COPY §2) — job description only
- Tags / chips (neutral, numbers only), e.g. `Trade {Trade}` · `{N} units` · `Ordered by score` — no Best/Worth it. Demo may keep an `Example data` / DEMO banner if the preview still uses composite scaffolding; never claim invented inventory is shop stock
- **Package total:** sum of **shown** units’ real ask prices (currency formatting existing `formatMoney`). Recalculates on size / remove / replace
- **Size control**
  - Label (COPY): `Fleet size`
  - Chips: `1` · `2` · `3` · `4` · `5`
  - Changing size re-slices the ranked real list; updates title N, tags, total, selected chip
- Primary CTA: **`Add package to fleet`** (mock) — adds all **currently shown** package units into `fleetfit-fleet-picks` (toggle-on each `unit:${packageId}:${unitId}` or listing key). Idempotent if already in fleet
- Secondary: **`Build your own`** → `#/intake` (COPY). Optional helper under it. (Mock text “Customize in Intake” is **not** cleared copy — do not ship unless Isaacson amends COPY; see §11)

**Units list**
- Section title: `Units`
- Subcaption: `Replacement score, high → low` (or Score v2 equivalent — numbers/order only)
- Each card:
  - Photo from FACT thumb when `has_photo`; else existing stub (no competitor lifestyle invent)
  - Rank `#1`… sequential after filters
  - Year make model + short spec line (cab/bed etc.) — missing → `Not published`
  - Price (real ask)
  - Score dial (CLEARED Score UI): `NN.N / PP` + muted **`Current NN`** (or `±N.N vs current` per Score UI CLEARED — keep one pattern; mock shows “Current 58” under SCORE). Tap dial → Score v2 readout
  - Remove **X**: visual ~30px circle, **44×44 pt** hit target; aria-label **`Remove`** (COPY)
  - Listing: live → outbound link (existing resolver labels OK, or quiet “View seller listing”); dead/missing → **`Seller listing not available`** (exact)

**Footer note (concept OK):** Score = replacement score out of points possible, relative to the vehicle being replaced. FleetFit only.

### 4.2 Remove + Undo (mock 02)

1. User taps X on a unit → unit leaves the active package set.
2. Card **collapses** to slim ~48px row: `{YMM} · removed` + inline **`Undo`**.
3. Header sync: N, `Fleet size` chip, package total update immediately. Optional thin notice: size/total updated (neutral; no opinion words). Prefer COPY toast for remove:
   - Toast: **`Removed from package.`**
   - Toast action: **`Undo`**
4. Snackbar: ~44pt tall; auto-dismiss **~6 s**; **persist while focused** (a11y).
5. Remaining units stay ordered by score; ranks reflow `#1…`.
6. Undo (inline or toast) restores that listing into the set and recalculates total/N/chip.
7. If all removed → COPY empty:  
   `Package is empty. Add a unit or build your own.`

Removed units do **not** stay in “Add package to fleet” payload.

### 4.3 Dead listing auto-replaced (mock 03)

When a selected slot’s listing is dead (`listingLive !== true` or no http URL):

1. Show dead state copy on the collapsed/struck row: **`Seller listing not available`**
2. **Automatically** insert the next-ranked real live listing not already in the package (same job score order).
3. On the new card, neutral note: **`Next-ranked unit added.`**
4. Struck previous row keeps YMM struck + **`Undo replace`** (restores prior unit into slot and drops replacement — replacement kept until reverted).
5. Package total recalculates with the replacement’s real price.
6. If no next live unit: **`No other listing ranks for this spot yet.`** (COPY) — do not invent a filler.
7. Combined one-line toast allowed (COPY):  
   `Seller listing not available. Next-ranked unit added.`

Swaps are automatic — no manual “swap” link on the dead card (mock 01 note).

### 4.4 Add a unit

- Control label: reuse intake energy — **`Add unit`** (compact `+` OK), not free text.
- Opens a picker: **full ranked list** of real listings for **this trade’s current job profile** (Score v2 order).
- User selects one → appends to package (size chip may bump to match count, max 5, or stay and replace empty slot — prefer: add increases N up to 5; at 5 require remove first). Document choice in Open Q if ambiguous; default **increase N to min(5, N+1)**.
- No invent-your-own YMM/price form.

### 4.5 Job profile / UNKNOWN edit affordance

On the package (and intake when prefilled from a trade package):

- Show seeded numerics as editable fields.
- UNKNOWN fields render empty with scoring status `Not scored: <field> not entered` when opened in readout — **not** a fake typical.
- Cleared user-facing edit pointer (approved COPY): secondary **`Build your own`** + helper `Start from scratch on the intake form.`  
  If a quieter in-place “edit job” control is needed on the package, use intake field labels already cleared in Intake R3 — do **not** invent marketing microcopy. If product wants a dedicated “You can edit these numbers” line, Isaacson must supply it (§11).

---

## 5. Ranking & auto-replace logic (normative)

```
pool = real listings with http listingUrl
     ∩ stockMode Used (for now)
     ∩ not HF-3 hard-reject
     ∩ OEM/listing facts merged

for each candidate in pool:
  score = scoreReplacementV2(candidate, currentVehicle, job)
  sortKey = candidateTotal / pointsPossible   // when PP differs
order = sortKey desc, then price asc, then miles asc

active = first N live listings from order
for each slot in active where listing dead/missing:
  replace with next live from order not already in active
  record replaceUndo stack entry

user → remove from active, push undo; N' = |active|; sync size chip
add unit → user picks from full ordered pool; insert; sync N
```

**Landscaping scoring reminders (Score v2 CLEARED):**
- Tow used; trailer 7000; tongue entered or 15% → 1050
- Payload load = cargo/loadLb + tongue (loadLb may be null → payload Not scored until entered — do not invent landscaping truck payload)
- R1T without WDH uses no-WDH tow rating; shortfalls score down; **no override**

**Current vehicle:** from intake trade-in / current fields when present; else package `currentVehicle` example seed (labeled). No current → Score incomplete per Score v2 (`Score incomplete: current vehicle not entered`) — still list by whatever ranking Score v2 allows without fabricating totals.

---

## 6. Intake relationship

| Rule | Spec |
|---|---|
| Custom intake | Remains full `#/intake` path (Intake R3 CLEARED still in force) |
| Back | **No Back on intake** |
| From Trade packages | `Build your own` → intake (optionally with `state` hint of trade) |
| From intake submit | `navigate(/package/${matchPackageIdFromIntake(intake)}, { state: { intake } })` — job from form **overrides** trade seeds for that session |
| Adjust | Existing `?adjust=1` may retitle; prefer rehydrate from session job blob if implemented |
| PATH | `Intake · Add to fleet · Budget` unchanged |

Trade package seeds **prefill** intake when user lands from a trade chip into customize — never overwrite user-entered values with invented numbers.

---

## 7. Copy (verbatim from COPY-2026-09-27.md)

Ship these strings exactly:

**Entry:** `Trade packages`  
**Helper (optional):** `Pick your trade. We’ve lined up real listings you can trim.`  
**Size label:** `Fleet size` · chips `1` `2` `3` `4` `5`

**Headers / work day**
- `Electrical package · {N} vehicles` — `Ladders on the roof, wire and parts inside, several job sites a day.`
- `HVAC package · {N} vehicles` — `Service calls across town, with parts, tools, and units riding in back.`
- `Plumbing package · {N} vehicles` — `Pipe on the rack, fittings in the bins, back-to-back service stops.`
- `Landscaping package · {N} vehicles` — `Crew and equipment out on a trailer, route of properties, back to the yard.`
- `General contracting package · {N} vehicles` — `Materials and tools to the site, supply runs, crew to and from the job.`

**Microcopy**
- Remove aria: `Remove`
- Toast: `Removed from package.`
- Undo: `Undo`
- Build your own: `Build your own` · helper `Start from scratch on the intake form.`
- Dead: `Seller listing not available`
- Swap note: `Next-ranked unit added.`
- Combined: `Seller listing not available. Next-ranked unit added.`
- No next: `No other listing ranks for this spot yet.`
- Empty: `Package is empty. Add a unit or build your own.`

**Bans:** Best / Worst / Top / better / great / ideal / perfect · invented counts/prices/payload/range · Vin Not Diesel / VND · EV-cred lines · Buy Now / Make Offer · Fit My Truck · SOH / battery health / Worth it / match (as opinion).

**Primary CTA** from mocks (not in COPY file; locked by design bar): `Add package to fleet`.

---

## 8. Add package to fleet / Add to fleet PATH

1. PATH chrome **Add to fleet** = package surface (existing).
2. Per-unit add may remain via existing `AddToFleetButton` if still on cards — must not conflict with package CTA.
3. **`Add package to fleet`** adds every **active** (non-removed, non-struck-dead-without-replacement) unit in the current package view to fleet picks.
4. Checkout stub may read fleet picks + `?package=` as today — no merge / no real payment in this ship.

---

## 9. Analytics hooks

**Repo today: none.** If Woz adds a minimal `track(event, props)` shim (console no-op OK in preview), fire:

| Event | When | Props (no PII) |
|---|---|---|
| `trade_packages_open` | Entry opened | — |
| `trade_package_view` | Package view | `trade`, `size`, `stockMode`, `packageId` |
| `trade_package_size` | Size chip | `trade`, `size` |
| `trade_package_remove` | X remove | `trade`, `listingId`, `size` |
| `trade_package_undo` | Undo remove | `trade`, `listingId` |
| `trade_package_dead_replace` | Auto replace | `trade`, `deadId`, `replacementId` |
| `trade_package_undo_replace` | Undo replace | `trade` |
| `trade_package_add_unit` | Picker select | `trade`, `listingId` |
| `trade_package_add_to_fleet` | Primary CTA | `trade`, `size`, `unitCount`, `totalAsk` |
| `trade_package_build_your_own` | Secondary link | `trade` |

Do not block Pages bar on analytics vendor choice.

---

## 10. Acceptance criteria

1. Trades Electrical, HVAC, Plumbing, Landscaping each have a Trade packages entry → `#/package/pkg-trade-*` with COPY headers and work-day lines.
2. GC appears only if ≥1 real listing can fill; else hidden or empty state without invented units.
3. Size chips 1–5 change N, title, total (sum of real asks), and unit list from Score v2 ranking.
4. Every shown unit has a real listing URL history; live links open seller; dead show `Seller listing not available` and auto-replace per §4.3.
5. Scores use Score v2 G-final; order by total÷possible; dial + Current line; no opinion labels; specs `Not published` not dashes.
6. Landscaping job: tows true, trailer 7000, tongue 1050 default; payload/tow shortfalls reduce score; no R1T override.
7. UNKNOWN seeds stay empty; user can edit via intake / editable fields; no invented payload for trades.
8. Remove X (44×44), slim Undo row, toast `Removed from package.` + Undo, 6 s dismiss unless focused; header sync.
9. `Add unit` opens ranked real list only — no free-text create.
10. `Add package to fleet` writes all active units into fleet picks; PATH Add to fleet active on package.
11. Intake has no Back; `Build your own` reaches intake.
12. `stockMode: 'Used'` present; layout room for future Used\|New; toggle not required this ship.
13. Zero UI mentions of Fit My Truck, VinNotDiesel, VND, or INTERNAL FL shop names.
14. PR #1 draft only; no merge.

---

## 11. Open questions — product desk

1. **Plumbing daily miles:** seed midpoint 54 (INF), seed null (UNKNOWN-strict), or seed 48–60 as a band UI? CLEARED default above uses Open Q — recommend **null** until Ted picks a single FACT.
2. **Electrical daily miles:** 62 (single fleet FACT) vs 74 (class FACT fallback). Spec seeds **62**; confirm.
3. **Electrical/HVAC crew INF seeds (2 vs 1):** confirm or force user entry (`null`).
4. **Mock “Customize in Intake” vs COPY `Build your own`:** COPY wins; confirm mock label is retired.
5. **Mock title “Landscaping • 4 trucks” vs COPY `Landscaping package · {N} vehicles`:** COPY wins; confirm.
6. **Mock size label “Size” vs COPY `Fleet size`:** COPY wins; confirm.
7. **Toast body:** COPY `Removed from package.` vs mock vehicle-specific string — COPY wins; confirm.
8. **Dedicated “you can edit these numbers” microcopy** for UNKNOWN seeds — not in COPY; need Isaacson line or rely on `Build your own` only.
9. **Persist job edits** in `sessionStorage` vs router state only?
10. **Add unit at size 5:** block vs replace lowest score?
11. **Alias redirects** from `pkg-tc-electrical-4` / `pkg-tc-landscape-2`?
12. **Example current vehicle** per trade (Transit-250 electrical demo today) — which current vehicle seeds HVAC / Plumbing / Landscaping / GC when intake empty? Must be labeled example; never silent invent of user’s truck.
13. **General contracting** ship if pool empty — hide trade chip or show empty COPY state?
14. **Analytics:** ship no-op shim now vs wait for vendor?
15. **Used \| New toggle timing** — field-only this ship (assumed) vs hidden UI chrome?

---

## 12. Pages-bar checklist (live site · hard refresh · record script hash)

Verify on the preview host after Woz ships to PR #1 draft:

1. [ ] Home / nav exposes **Trade packages** (not “Matched setups”). Helper optional line matches COPY if shown.
2. [ ] Tap **Electrical** → `#/package/pkg-trade-electrical` (or alias), header `Electrical package · {N} vehicles`, work-day line exact.
3. [ ] Repeat for HVAC, Plumbing, Landscaping headers + work-day lines exact.
4. [ ] `Fleet size` chips 1–5; selecting 4 shows four real units; title N and `{N} units` tag update.
5. [ ] Package total equals the sum of displayed units’ real ask prices (spot-check against listing facts).
6. [ ] Units ordered by Score v2 total÷possible high→low; ranks `#1…` sequential; no Best/Worst/Worth it/SOH/battery health.
7. [ ] Each card: dial `NN.N / PP` (when complete) with Current / vs-current line; tap opens Score v2 readout (10 cats).
8. [ ] Live unit: seller listing link works (new tab). Dead unit: exact `Seller listing not available`.
9. [ ] On a dead slot: next-ranked live unit appears with `Next-ranked unit added.`; struck row + **Undo replace**; total updates.
10. [ ] Undo replace restores prior unit and drops replacement.
11. [ ] If pool exhausted: `No other listing ranks for this spot yet.` — no fake filler card.
12. [ ] X remove: 44×44 hit area; slim removed row + inline Undo; toast `Removed from package.` + Undo; ~6 s dismiss; stays when focused.
13. [ ] After remove: N, size chip, and total sync (mock 02 behavior).
14. [ ] Empty package shows `Package is empty. Add a unit or build your own.`
15. [ ] **Add unit** opens full ranked real list for this job; picking adds a real listing only — no free-text create.
16. [ ] **Add package to fleet** adds all active units to fleet picks; PATH **Add to fleet** is active.
17. [ ] **Build your own** → `#/intake`; intake shows **no** Back control.
18. [ ] Package/PATH Back from Add to fleet returns to intake (when in flow); never on intake itself.
19. [ ] Landscaping: job tows with trailer 7000; tongue default 15%/1050 when unset; low tow/payload scores drop sort order; no model override.
20. [ ] UNKNOWN seeds (e.g. landscaping daily miles, all trade loadLb) are empty / not invented; user can change via intake or editable fields.
21. [ ] Missing vehicle specs render **`Not published`** — DOM text search finds no `—` in spec/score cells on the package.
22. [ ] Zero UI strings: Fit My Truck, Vin Not Diesel, VND, Gary Roberts, Happy Home, Star Quality, Miranda, King Electric (INTERNAL list).
23. [ ] Brand wordmark FleetFit only; DEMO / example banner OK for preview data.
24. [ ] `stockMode` is Used (data attribute or equivalent); no broken New inventory path.
25. [ ] Cold load `#/package/pkg-trade-electrical` still scores with labeled example current + seeds (no crash); intake submit overrides seeds.
26. [ ] Score incomplete / Not scored rules match Score v2 CLEARED when inputs missing.
27. [ ] PR #1 remains **draft**, not merged; ship note lists script/build hash (`data-score-v2` / package build stamp).

---

## 13. Woz — quote & ship

Quote **this** file in the cloud ship prompt, plus:

- `COPY-2026-09-27.md` (verbatim UI strings)
- `DESIGN-BAR-2026-09-27.md` + mocks 01 / 02 / 03
- `TRADE-NEEDS-SOURCES-2026-09-27.md` + `trade_needs.csv` / `trade_needs_detail.csv`
- `CLEARED-FOR-WOZ-SCORE-V2.md` (G-final) + `CLEARED-FOR-WOZ-SCORE-UI.md` + `CLEARED-FOR-WOZ-SCORE-DIAL-TAP.md` + `oem-specs/CLEARED-FOR-WOZ-OEM-SPECS.md`
- Intake R3 CLEARED (Back hidden; field labels) where customize path overlaps

**Ship to** `Burnsted/fleetfit-preview` **PR #1 draft only**. Put trade-needs data + listing source URLs in the diff for Steve spot-check. Do not invent listings or tune Score v2 anchors. Ping Steve + Jarvis with hard-refresh URL + script hash when live. **No merge.**

If Score v2 §6 landscaping tow illustration and live listing pool disagree on order, **report per-category points** — do not invent units to match mock example names/prices (mocks are EXAMPLE DATA).

---

## 13. Product desk decisions on section 11 (Steve, 2026-09-27 ~11:05 AM ET). These are binding.

1. Plumbing daily miles: seed **null** (UNKNOWN). Range shows "Not scored" until the user enters a value.
2. Electrical daily miles: seed **62** (single fleet FACT). Confirmed.
3. Electrical/HVAC crew INF seeds (2 / 1): **use them**, editable.
4–7. **COPY wins** every mock-vs-COPY difference ("Build your own", "Landscaping package · {N} vehicles", "Fleet size", "Removed from package."). Mock labels are retired.
8. Editable-numbers microcopy: Isaacson supplies one line (requested). Use it verbatim. Don't ship placeholder text.
9. Persist job edits in **sessionStorage**.
10. Add unit when the package already has 5: **block**. Isaacson supplies the one-line message. Don't auto-replace.
11. **Yes**, redirect aliases from `pkg-tc-electrical-4` to `pkg-trade-electrical` and from `pkg-tc-landscape-2` to `pkg-trade-landscaping`.
12. Example current vehicle: electrical keeps the labeled 2018 Transit-250 example. Other trades get **no invented example**. Current reads "Not entered" with one banner, "Add your current vehicle to compare", and candidates still score on their own (Score v2 fix B).
13. General contracting with an empty pool: **hide** the trade chip.
14. Analytics: **no shim** this ship.
15. Used | New: **field only** (`stockMode: 'Used'`), with no visible toggle this ship.
