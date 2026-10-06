# Intake R3 Product bar (Steve Jobs) · Ted ~10:20 AM ET 2026-09-26

**Supersedes (delta):** Other trade enter · Units dropdown line · Payload free-form alone · Region · Cab size list · miles-only dead end  
**Prior still holds:** FleetFit-only · H1/subline · Match a package · PATH Intake · Add to fleet · Budget · Haul R2 options · Upfits minus spray · Trade-in + model on Yes · no VND · no merge  
**Ship:** `Burnsted/fleetfit-preview` `#/intake` draft · **no merge**  
**Paste:** `INTAKE-CUSTOMIZE-COPY.md` · **Redline:** `INTAKE-R3-REDLINE-2026-09-26.md`  
**Gate:** Bar paste → rewrite `CLEARED-FOR-WOZ-R3.md` → Woz Cursor cloud

## 1. Trade — Other cut / enterable
Named trades stay. Selecting **Other** opens a text field:

| | |
|--|--|
| Label | `Your trade` |
| Placeholder | `Type your trade…` |
| Hide | When Trade ≠ Other |

## 2. Units — Add+ only
| | |
|--|--|
| Control | **Add+** / `Add unit` button |
| Kill | Separate `Units to replace` line · `Body & units` grouping · 1–2 / 3–5 / 6–10 / Not sure dropdown |
| Behavior | Each tap adds a unit to replace; no orphan units row |

Body stays its own control (Van · Pickup · Either).

## 3. Payload — weight brackets
| | |
|--|--|
| Control | Single select **brackets** |
| Options v1 | Light · Medium · Heavy · Not sure |
| Kill | Free-form lbs as the only input |
| Copy | Helper: `Weight band — not a typed number alone.` |
| FACT | Do **not** invent lb cutoffs on chips. Numeric bands only after research FACT; optional exact lbs later as secondary never alone |

## 4. Address (kill Region)
| | |
|--|--|
| Label | `Address` |
| Placeholder | `Shop or depot address…` |
| Kill | `Region` |

## 5. Cab — Double or Crew only
```
Double
Crew
```
**Kill:** Regular · Extended · Either · any other cab size. Unset OK.

## 6. Typical day miles → map prompt
Keep miles field. Always offer a map path (not miles-only dead end):

| | |
|--|--|
| Primary | Button/link **`Map my day`** |
| Alternate | Link **`Map in ABRP`** (external ABRP planner) |
| Optional helper | `Sketch the day so range isn’t a guess.` |

## Layout lean (customize band)
Trade (+ Your trade when Other) → Fleet size → **Address** → Typical day miles + **Map my day / ABRP** → Overnight → Body → **Add unit** → Payload brackets → Cab (Double/Crew) → Haul → Upfits → Trade-in (+ model on Yes) → Notes → Match a package

## Out
Region · Units dropdown · Cab beyond Double/Crew · free-form payload alone · miles with no map path · Spray liner · invented lbs · VND · merge without Ted · deep trailer customizer
