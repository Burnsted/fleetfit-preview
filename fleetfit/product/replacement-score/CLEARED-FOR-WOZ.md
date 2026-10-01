# CLEARED-FOR-WOZ — Replacement Score (Steve Jobs) · ~10:39 AM ET 2026-09-26

**Ted HF-2 override:** ~10:38 AM ET via Jarvis  
**Cleared:** ~10:39 AM ET (product model)  
**Host:** `Burnsted/fleetfit-preview` · PR draft OK · **no merge until Ted clears UI**  
**Also read:** `REPLACEMENT-SCORE-PRODUCT-BAR.md` · Sherlock `RESEARCH-BRIEF.md` · `SCORE-CATEGORIES-DRAFT.md` · `SOURCES.md`

## Quote Ted pick
1. Transparent ~10 category grades → weighted final score  
2. **HF-2:** NO hard REJECT / flag-out on mid-life similar-mile. **Soft taper only** — Life Delta (and related) grade down so sidegrades rank worst; **keep them visible**  
3. Optimize for best fleet improvement via soft ranking (low miles, warranty remaining, serviceability, real counters) — not by hiding units  
4. No Worth it / SOH / FACT pills public unless Ted locks display  

## Exact ship

### Hard filters (keep)
- **HF-1 Job Fit** (payload · bed/cab · tow): REJECT / hold on clear FACT shortfall; FLAG if critical fit unknown. Soft Job Fit detail weight **15** after pass.  
- **HF-3 Title/salvage/warranty-void:** REJECT or severe FLAG on listing/title FACT only.  
- **Kill:** any HF-2 hard reject or flag-out based on ΔM / mid-life similar-mile alone.

### Soft Life Delta (primary sidegrade taper)
`ΔM = M_c − M_e` (positive = EV fewer miles)

| Grade | Rule |
|-------|------|
| 9–10 | `ΔM ≥ 40k` or EV ≤20k clean history |
| 7–8 | `ΔM` 20–39k |
| 5–6 | `ΔM` 15–19k |
| 2–4 | `ΔM` 0–14k — sidegrade / similar-mile (**low rank, still shown**) |
| 0–1 | `ΔM < 0` (EV more miles) |

Unknown odometer → exclude from weighted total + “miles not verified” — package stays visible.

### Soft categories + weights (INFERENCE v1 — ship as scaffold)
Job Fit detail 15 · Life Delta 15 · Warranty 12 · Battery Health internal 10 · Range 12 · Charging 8 · Serviceability 10 · Energy 8 · Maintenance 5 · Residual 5  

Unknown excluded from denominator · unknown weight share >40% → no number, “Score incomplete” · cap any cat ≤20%.

### Public copy
- Open the score: total + top helps + watch-outs  
- Sidegrades stay in list, sorted low  
- Voice: vs “current work vehicle / non-EV work vehicle” — no dunking  
- **Out:** Worth it · SOH pills · FACT pills · inventing $

## Woz
Quote **this** file in the cloud ship prompt. Draft on fleetfit-preview only. Ping Steve when Pages ready for score UI bar. **No merge until Ted clears UI.**
