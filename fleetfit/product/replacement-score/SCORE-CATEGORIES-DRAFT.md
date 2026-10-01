# Replacement Score — Category Draft (~10)
**Date:** 2026-09-26 · Sherlock draft · **Ted lock ~10:39 AM ET** · Steve Jobs **re-bar** · **not CLEARED**  
**Companion:** `RESEARCH-BRIEF.md` · `SOURCES.md`  
**Buyer promise:** Transparent category grades → weighted total → **rank sorts best→worst** → plain-language “why this beats / loses to your current work vehicle.”  
**Public UI lock:** No Worth it / SOH / FACT pills unless Ted locks display. Categories may use SOH/warranty **internally**.

**Grading scale (default):** **0–10** integers (continuous within each category). Display can map later to A–F if Ted prefers (`9–10=A … 0–1=F`).  
**Weights:** All weights below are **INFERENCE** unless a source is cited for the *existence* of the factor (not the numeric weight).

### Ted lock (2026-09-26 ~10:39 AM ET via Jarvis) — FACT as product instruction
**Life Delta / mid-life similar-mile is a soft taper only.**  
- **No hard REJECT** and **no hard FLAG-out** of a candidate solely for mid-life similar miles.  
- Similar-mile mid-life units **stay in the ranked list**; they simply score lower on Life Delta and sort toward the bottom when other categories do not compensate.  
- Earlier Sherlock draft (ΔM ~15k REJECT/FLAG) and Steve interim bar (ΔM 25k REJECT) are **superseded** on this point until Ted changes it.

---

## Roll-up model (buyer-open)

```
1. HARD FILTERS run first — Job Fit (HF-1) and title/salvage (HF-3) only
2. Soft categories each produce Grade 0–10 (+ Unknown flag)
   - Life Delta is ALWAYS soft / continuous (no HF-2 hard gate)
3. WeightedTotal = Σ (grade_i × weight_i) / Σ weights_of_known
   - Categories marked Unknown are EXCLUDED from denominator
     (do not invent mid-scores that pretend knowledge)
   - If Unknown share of weight > ~40% → buyer copy: “Score incomplete — key data missing”
4. RANK: sort package candidates best→worst by WeightedTotal (ties: prefer higher Job Fit soft, then lower EV miles)
5. Plain-language Why: top 2 helping categories + top 2 hurting vs current unit
```

**INFERENCE:** Cap any single soft category at 20% weight so one unknown-friendly field cannot dominate.

---

## Hard filters (reject / flag — not soft points)

### HF-1 · Job Fit prerequisite (locked axis)
**Rule:** Candidate must be package-scorable on **payload · bed/cab · tow** vs current work vehicle per `../payload-fit/PAYLOAD-FIT-PRODUCT-BAR.md`.  
**Fail → REJECT** (or hold out of “improves your fleet” framing) if FACT shows clear shortfall on the shop’s stated job role (e.g. required tow not met).  
**Unknown capacity fields →** use em dash on fit table; **do not invent**; if critical job field unknown, **FLAG** “fit unverified” rather than auto-pass.  
**Source grounding:** Product lock (Ted) + PG&E model-availability / duty-cycle fit.

### HF-2 · REMOVED as hard filter (Ted lock)
Mid-life / similar-mile behavior lives **only** in soft category **1 · Odometer / Life Delta** (continuous 0–10 taper).  
Do **not** reject or hard-flag candidates out of the list for ΔM alone.

### HF-3 · Title / salvage / warranty-void signals
**Reject or severe FLAG** if FACT shows salvage/flood/odometer rollback / OEM void conditions called out in warranty guides.  
No invented history — listing/title FACT only.

---

## Soft score categories (~10)

Weights sum to 100 (INFERENCE). Adjust at Steve re-bar.

| # | Category | Hard/Soft | Weight (INFERENCE) |
|---|---|---|---|
| 0 | Job Fit (payload·bed/cab·tow) | **Hard + soft detail** | Prerequisite; soft detail **15** if passed |
| 1 | Odometer / Life Delta vs current | **Soft only (continuous)** | **15** |
| 2 | Warranty Remaining (battery / e-powertrain) | Soft | **12** |
| 3 | Battery Health (SOH / capacity) — internal | Soft | **10** |
| 4 | Duty-Cycle Range Adequacy | Soft | **12** |
| 5 | Charging Readiness | Soft | **8** |
| 6 | Serviceability & Network | Soft | **10** |
| 7 | Energy Counter vs current | Soft | **8** |
| 8 | Maintenance & Downtime Counter | Soft | **5** |
| 9 | Residual / Value-Retention Risk | Soft | **5** |

---

### 0 · Job Fit (payload · bed/cab · tow)
**Purpose:** Locked primary fit axis — “does the EV do the job your current work truck does?”  
**Grade rule (0–10):** After HF-1 pass, score side-by-side FACT completeness + match quality:
- 9–10: All four axes FACT; meets or exceeds shop need on stated role  
- 7–8: Meets need; one axis approximate / minor shortfall shop accepts  
- 4–6: Mixed; at least one material gap or multiple unknowns  
- 1–3: Clear shortfall on a stated need (should usually have failed HF-1)  
- 0: Rejected on HF-1  
**Data needed (FACT):** Listing/OEM payload, bed/box, cab, tow; intake current-unit figures.  
**Unknown:** Em dash on UI; grade ≤5 and Flag “fit incomplete.” **Never invent numbers.**  
**Buyer line:** “Payload / bed / cab / tow vs your current work vehicle.”

### 1 · Odometer / Life Delta vs current (soft taper — Ted lock)
**Purpose:** Prefer lower-mile / larger step-down vs the current work vehicle without kicking similar-mile units out of the list.  
**Intent still holds:** mid-life non-EV → similar-mile EV is a **weak** improvement on miles — it should **rank lower**, not vanish.

Let  
- `M_c` = current work vehicle odometer (miles)  
- `M_e` = candidate EV odometer  
- `ΔM = M_c − M_e` (positive = EV has fewer miles)

**Continuous grade rule (0–10) — INFERENCE anchors for Steve re-bar:**

| Grade | Guide (use linear interp between anchors when implementing) |
|---|---|
| 10 | `ΔM ≥ 50k` **or** `M_e ≤ 15k` with clean history |
| 9 | `ΔM` ~40–49k **or** `M_e` ≤20k |
| 7–8 | `ΔM` ~25–39k |
| 5–6 | `ΔM` ~15–24k (modest step-down) |
| 3–4 | `ΔM` ~5–14k (similar-mile / weak step-down — **stays in list**) |
| 1–2 | `ΔM` ~0–4k (essentially same miles) |
| 0 | `ΔM < 0` (EV has **more** miles than current) |

**Optional soft boost (not a hard gate):** If intake FACT shows current unit **end-of-life / high maintenance / retiring**, add **+1** grade (cap 10) so Life Delta does not alone bury a true retirement swap that happens to have a modest ΔM.

**Data:** Both odometers FACT.  
**Unknown:** Exclude from weighted total; note “miles vs current not confirmed” in Why — **still list the unit** if other categories score.  
**Buyer line:** “Miles on this unit vs miles on your current work vehicle.”  
**No REJECT / no hard FLAG-out** for mid-life similar miles (Ted).

**Research grounding (why taper exists, even soft):**  
- **FACT:** Geotab EVSA intended near end of life — https://support.geotab.com/mygeotab/mygeotab-add-ins/doc/evsa-faq  
- **FACT:** PG&E prioritizes end-of-lifecycle / high-maintenance units — https://www.pge.com/assets/pge/docs/clean-energy/electric-vehicles/pge-fleet-electrification-guidebook.pdf  
- **FACT:** Typical HV battery warranty mile cap 100,000 — OEM table in research brief.

### 2 · Warranty Remaining (battery / e-powertrain)
**Grade rule:** Compute remaining on OEM schedule (years *and* miles; first-to-expire):
- 9–10: ≥5 yr **and** ≥50k miles left on HV battery warranty  
- 7–8: ≥3 yr **or** ≥30k miles left (whichever framing is leftover runway)  
- 4–6: Some runway left but <30k miles **or** <3 yr  
- 1–3: Expired or <10k miles / <1 yr left  
- 0: Confirmed expired  
Use OEM FACT tables (Ford/GM/Rivian/Ram/MB — see research brief). Commercial vs consumer Rivian schedules differ — **pick the schedule matching the VIN use/warranty book**.  
**Data:** In-service / original delivery date, odometer, make/model year, warranty book.  
**Unknown date →** grade from miles-only with Flag; unknown both → exclude + FLAG.  
**Buyer line:** “Estimated battery/powertrain warranty left (years and miles).”  
**Not public SOH pill.**

### 3 · Battery Health (SOH / capacity) — internal only
**Grade rule (when documented FACT exists):**
- 9–10: Documented capacity/SOH ≥90% (or OEM “no excessive loss” diagnostic pass with report)  
- 7–8: ~80–89%  
- 4–6: ~70–79% (near common warranty floors)  
- 1–3: <70% or failed capacity test  
**Data:** Dealer/OEM diagnostic, Recurrent-style report, equivalent. **Not** dashboard GOM alone (Recurrent: range ≠ SOH).  
**Unknown (common):** **Exclude from average**; optional gray “Battery health not verified.” Do **not** impute passenger average 95% range retention as SOH.  
**Buyer line (if shown later):** “Battery health report on file / not verified” — no SOH pill unless Ted locks.

### 4 · Duty-Cycle Range Adequacy
**Grade rule (Geotab-shaped):**
- 9–10: Real-world adjusted range covers intake daily miles with ≥30% buffer, typical weather  
- 7–8: Covers with 10–29% buffer  
- 4–6: Covers only best-case / needs rare on-route charge  
- 1–3: Regular midday charge required for stated duty  
- 0: Cannot cover stated duty  
**Data:** EPA/OEM range FACT; intake daily miles, climate, payload/tow derate notes; van vs truck duty.  
**Unknown daily miles:** FLAG; grade from package role defaults only as INFERENCE and label as such — prefer exclude.  
**Buyer line:** “Range for your workday (with weather/load caution).”

### 5 · Charging Readiness
**Grade rule:**
- 9–10: Depot Level 2+ ready *or* verified home/depot dwell ≥ charge need (Geotab charge viability)  
- 7–8: Plan funded / timeline clear within package onboarding  
- 4–6: Partial plan; public DCFC dependency for daily ops  
- 1–3: No depot path; unreliable dwell  
- 0: Cannot charge for duty cycle  
**Data:** Intake site power, dwell hours, connector type (NACS/CCS), existing EVSE.  
**Unknown:** Exclude or ≤4 with FLAG “charging plan not confirmed.”  
**Buyer line:** “Can this unit recharge in your normal day?”

### 6 · Serviceability & Network
**Grade rule:**
- 9–10: EV-certified dealer/service ≤ ~50 mi **or** OEM mobile service coverage documented for segment  
- 7–8: Coverage in region; moderate wait risk  
- 4–6: Sparse network; known parts lead-time risk  
- 1–3: No practical EV service in operating area  
**Data:** OEM dealer locator / commercial service programs (e.g. Ford Pro Elite Commercial Service Centers reporting — verify locally).  
**Unknown:** Mid grade ≤5 + FLAG — do not assume “dealer everywhere.”  
**Buyer line:** “How hard is it to get this unit serviced near your shop?”

### 7 · Energy Counter vs current
**Grade rule (directional — no invented $):**
- 9–10: FACT energy use + shop electricity rate shows clear $/mi advantage vs current fuel FACT  
- 7–8: Advantage under typical utility assumptions labeled as estimate  
- 4–6: Roughly similar or sensitive to demand charges  
- 1–3: Likely worse under shop’s rate / duty  
**Data:** kWh/mi or MPGe FACT; current MPG FACT; optional utility rate from intake.  
**Unknown rate or MPG:** Exclude or FLAG; **never invent annual savings dollars.**  
**Buyer line:** “Energy cost direction vs your current work vehicle (not a savings guarantee).”

### 8 · Maintenance & Downtime Counter
**Grade rule:**
- 9–10: Clear reduction in scheduled ICE maintenance items for duty + service plan  
- 7–8: Likely fewer fluid/brake events; tires/alignment still apply  
- 4–6: Mixed (brake wear from weight, tire cost)  
- 1–3: High downtime risk (recall, parts, upfit complexity)  
**Data:** OEM maintenance schedule; open recalls; commercial upfit notes.  
**Unknown:** ≤5 + FLAG. Literature (e.g. Consumer Reports ownership-cost reports) supports **lower EV maintenance on average** for light vehicles — use as **context INFERENCE**, not unit FACT.  
**Buyer line:** “Maintenance & downtime outlook vs your current work vehicle.”

### 9 · Residual / Value-Retention Risk
**Grade rule:**
- 9–10: Segment residual data shows relative strength vs peer EVs (source-dated)  
- 7–8: Average peer retention  
- 4–6: Below-peer truck residual pattern (e.g. weaker Black Book 36-mo share)  
- 1–3: High residual uncertainty / distressed segment  
**Data:** Black Book / KBB / equivalent **dated** residual or retention %. Quote source figures only.  
**Unknown (many vans):** Exclude + “Resale outlook not established for this commercial config.”  
**Buyer line:** “Resale-risk outlook for this model class (source-dated).”  
**Never show invented residual $.**

---

## Buyer-visible “open the score” copy pattern

```
Replacement score: 7.4 / 10 (6 of 10 categories complete)
Rank in this package: #2 of 5 (best → worst)

Why this can improve your fleet
• 28k fewer miles than your current work truck
• ~4 years / ~55k miles estimated battery warranty left (OEM schedule)

Watch-outs
• Charging plan at your shop not confirmed
• Battery health report not on file
• Only a modest mile step-down vs your current unit (still listed — scores lower on Life Delta)

Job fit: payload / bed / cab / tow — see side-by-side
```

Voice: informative, no dunking on the gas/diesel unit.

---

## Soft-taper worked example (illustrative grades — not a live unit)

| | Current work truck | Candidate EV |
|---|---|---|
| Miles | 65,000 | 45,000 |
| Status | Mid-life, still in rotation | Used Lightning / similar |

- `ΔM = 20,000` → Life Delta soft grade **~6–7** (modest step-down).  
- **Stays in the ranked list** (Ted: no hard REJECT/FLAG-out).  
- If warranty / job fit / range / service are also middling, **sorts toward the bottom** vs a 15k-mile EV with the same job fit.  
- If current were 60k and EV 45k (`ΔM = 15k`): Life Delta **~5–6** — weak on miles, still comparable on other counters if they win.

---

## What Steve should re-bar next
1. ~~HF-2 hard reject vs flag~~ → **CLOSED by Ted:** soft taper only; continuous Life Delta 0–10  
2. Exact Life Delta anchor table (ΔM breakpoints above are Sherlock INFERENCE)  
3. Weight table (esp. whether Life Delta stays at 15)  
4. Whether Job Fit soft 15 stays inside score or lives only as prerequisite chrome  
5. Public display of warranty remaining (allowed) vs SOH (locked off)  
6. Minimum known-weight % before showing a number at all  
7. Rank tie-break rules (Job Fit soft → lower EV miles proposed above)
