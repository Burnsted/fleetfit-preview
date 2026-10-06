# Inventory freshness + full body rank — Ted redline · ~11:38 AM ET 2026-09-26

**Status:** CLEARED-FOR-WOZ · Steve ~11:40 AM ET 2026-09-26 · see `CLEARED-FOR-WOZ.md`  
**Host:** `Burnsted/fleetfit-preview` PR #1 draft · **no merge**  
**UI clear note:** Body-mix + dial chrome OK; ranking + inventory pool + labels need this pass.

## Ted locks (paraphrase, actionable)

### 1. Inventory freshness (look newer first)
- Do **not** present a stack topped by mid-2024s at ~7.2 as if those are the best used market finds.
- Candidate pool / mock inventory **must include** newer used units: **2025** and **early / newly used 2026** where they exist for the body.
- Prioritize **looking there** in sourcing + sort bias for Life Delta / warranty / residual categories.
- Price and ROI may still grade a newer unit lower overall — that is fine. Still surface and score them; do not skip the look because they are more expensive.
- Out: claiming “best available used” while the pool is stuck on older MYs only.

### 2. Full option rank (not Best Truck / Best Van chrome)
- Every suggestion / package / fleet-fit recommendation page lists **one of each available truck option and van option** for sale in the candidate pool.
- Order: **score high → low**. Simple ranked list.
- **Kill** “Best Truck”, “Best Van”, “Best fit”, “Worst fit”, and similar rank labels.
- UI stays: dial + score + order. No extra labels or complexity.

### 3. Body coverage (extends prior one-each lock)
- Prior lock (best-of truck + best-of van only) is **widened**: include **each distinct available truck option and van option** in the set (one slot per option / listing identity Steve bars), still covering **both** body classes when both exist in pool.
- Intake body preference may boost order but must not erase the other body class or drop lower-scoring options that are still available.
- If a body/option is not in pool after hard filters: omit it; **never invent** a unit.

## Out
Best/Worst/Best Truck/Best Van labels · mono-body when both classes available · inventing units · Worth it/SOH/FACT pills · merge without Ted · VND in public voice

## Ship path
Steve → CLEARED-FOR-WOZ → Woz Cursor cloud on PR #1 draft → Steve Pages re-bar → Ted UI clear. **No merge.**
