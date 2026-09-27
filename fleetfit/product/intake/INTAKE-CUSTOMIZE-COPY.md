# Fleet intake — paste (Isaacson) · Ted R3 ~10:20 AM ET 2026-09-26

**Product bar:** `INTAKE-R3-PRODUCT-BAR.md` (Steve bars → `CLEARED-FOR-WOZ-R3.md`)  
**Redline:** `INTAKE-R3-REDLINE-2026-09-26.md`  
**Ship host:** `Burnsted/fleetfit-preview` · `#/intake` · draft only · **no merge without Ted**  
**Voice:** FleetFit · positive · sparse · no VND  
**Gate:** Steve bars this paste → `CLEARED-FOR-WOZ-R3.md` → Woz (R2 CLEARED superseded)

---

## 1. Chrome

**Eyebrow:**
```
FleetFit · Fleet swap
```

**H1:**
```
Tell us about the work day
```

**Subline:**
```
We’ll match a used EV package to the work day.
```

**Kill:** Primary-path essay · Region label · Units-to-replace dropdown line · Cab sizes other than Double/Crew · Spray liner · free-form payload alone · miles-only dead end

---

## 2. Top fields

```
Trade
Fleet size
Address
Typical day miles
Overnight charging
```

### Trade
Keep existing named trades. **Other** is cut / enterable:

**When Trade = Other — show field**  
**Label:** `Your trade`  
**Placeholder:**
```
Type your trade…
```

### Fleet size
**Helper:**
```
Blank is fine.
```

### Address (replaces Region)
**Label:** `Address`  
**Placeholder:**
```
Shop or depot address…
```

**Kill:** `Region`

### Typical day miles + map prompt
**Label:** `Typical day miles`  
**Placeholder (optional):**
```
Miles per unit…
```

**Primary prompt (button or text link — pick one in UI):**
```
Map my day
```

**Alternate / secondary link:**
```
Map in ABRP
```

Helper under the map prompt (one line max, optional):
```
Sketch the day so range isn’t a guess.
```

Do not leave miles as a dead-end number field with no map path.

---

## 3. Customize — not Notes

Unset OK. No invented lbs on chips.

### Body
**Label:** `Body`  
```
Van
Pickup
Either
```

### Units — Add+ only (no separate units line)
**Kill:** `Units to replace` dropdown · `Body & units` section chrome · 1–2 / 3–5 / 6–10 / Not sure line

**Control:** Add+ button (adds a unit to replace; no orphan units row)

**Button label:**
```
Add unit
```

**Compact / icon OK:**
```
+
```

Helper (optional, one line):
```
Add each unit you want to replace.
```

### Payload (weight brackets — not free-form alone)
**Label:** `Payload`  
```
Light
Medium
Heavy
Not sure
```

Helper:
```
Weight band — not a typed number alone.
```

**No invented lb cutoffs on chips** until FACT bands land. Optional exact lbs later only as secondary, never alone.

### Cab (Double or Crew only)
**Label:** `Cab`  
```
Double
Crew
```

**Kill:** Regular · Extended · Either · any other cab size

Default unset OK (no forced pick).

### Haul (still R2)
**Label:** `Haul`  
```
None
Open trailer
Enclosed trailer
Gooseneck
Not sure
```

Optional helper:
```
Trailer type only — not a full build.
```

### Upfits (multi)
**Label:** `Upfits`  
```
Ladder rack
Toolbox
Cargo rails
Other
```

**Kill:** `Spray liner`

### Trade-in
**Label:** `Trade-in`  
```
Yes
No
Not sure
```

**When Trade-in = Yes — show**  
**Label:** `Trade-in model`  
**Placeholder:**
```
Year make model…
```

---

## 4. Notes (leftovers only)

**Label:**
```
Notes (optional)
```

**Placeholder:**
```
Anything else about the routes or crew…
```

---

## 5. Submit

**CTA:**
```
Match a package
```

**Helper:**
```
We’ll build from what you set above. Blanks stay open.
```

**Secondary:**
```
Clear
```

---

## 6. PATH (still locked)

```
Intake · Add to fleet · Budget
```

Home CTA: `Match my fleet` → `/intake`.

---

## 7. Hard bans

Primary-path essay · Region · Units dropdown line · Cab beyond Double/Crew · Spray liner · free-form payload alone · miles with no Map my day / ABRP path · invented lbs / KBB · Vin Not Diesel / VND · Buy Now / Make Offer · EV cred · deep trailer custom · fee/savings guilt · merge without Ted
