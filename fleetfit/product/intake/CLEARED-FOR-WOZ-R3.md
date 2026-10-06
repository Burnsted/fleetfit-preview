# CLEARED-FOR-WOZ — Intake R3 (Steve Jobs) · ~10:22 AM ET 2026-09-26

**Ted:** ~10:20 AM ET · **Cleared:** ~10:22 AM ET (Isaacson paste PASS)  
**Host:** `Burnsted/fleetfit-preview` PR #1 draft · `#/intake` · **no merge**  
**Paste:** `INTAKE-CUSTOMIZE-COPY.md` — **PASS**, no overrides  
**Also read:** `INTAKE-R3-PRODUCT-BAR.md` · `INTAKE-R3-REDLINE-2026-09-26.md`  
**Supersedes:** `CLEARED-FOR-WOZ-R2.md` (R2 still holds Haul / Upfits / Trade-in / PATH / chrome)

## Quote Ted pick
1. Other trades → type-in (`Your trade`)  
2. Units → Add+ only (kill Units dropdown + Body & units)  
3. Payload → weight brackets (Light · Medium · Heavy · Not sure; no invented lb cutoffs)  
4. Address not Region  
5. Cab = Double · Crew only  
6. Typical day miles → Map my day (primary) / Map in ABRP (alt)

## Exact ship (from Isaacson paste)

### Top fields
**Trade** — named trades stay. When **Other**:
- Label: `Your trade`
- Placeholder: `Type your trade…`

**Fleet size** — helper `Blank is fine.`

**Address** (kill Region):
- Label: `Address`
- Placeholder: `Shop or depot address…`

**Typical day miles** + map path (not miles-only dead end):
- Label: `Typical day miles`
- Placeholder optional: `Miles per unit…`
- Primary: `Map my day`
- Alternate: `Map in ABRP`
- Optional helper: `Sketch the day so range isn’t a guess.`

**Overnight charging** — unchanged

### Customize
**Body:** Van · Pickup · Either

**Units — Add+ only**
- Button: `Add unit` (compact `+` OK)
- Optional helper: `Add each unit you want to replace.`
- **Kill:** `Units to replace` dropdown · `Body & units` chrome · 1–2 / 3–5 / 6–10 / Not sure line

**Payload** (brackets):
```
Light
Medium
Heavy
Not sure
```
Helper: `Weight band — not a typed number alone.`  
No invented lb cutoffs. Free-form alone killed.

**Cab:**
```
Double
Crew
```
**Kill:** Regular · Extended · Either · any other cab size. Unset OK.

**Haul** (R2 lock, unchanged):
```
None
Open trailer
Enclosed trailer
Gooseneck
Not sure
```

**Upfits:** Ladder rack · Toolbox · Cargo rails · Other (**kill Spray liner**)

**Trade-in:** Yes · No · Not sure  
**Trade-in model** when Yes: placeholder `Year make model…`

### Unchanged
Eyebrow FleetFit · Fleet swap · H1 · subline · Match a package + helper · PATH `Intake · Add to fleet · Budget` · Notes · no Bed · no VND · no Primary-path essay

## Delta vs R2 CLEARED
- Trade Other → `Your trade` type-in  
- Kill Units dropdown + Body & units → **Add unit** only  
- Payload stays brackets; free-form alone banned; no invented lb cutoffs  
- Region → **Address**  
- Cab → **Double · Crew** only  
- Miles + **Map my day** / **Map in ABRP**

## Woz
Quote **this** file + `INTAKE-CUSTOMIZE-COPY.md` in the cloud ship prompt · PR #1 draft · `#/intake` · ping Steve when Pages ready · **no merge**
