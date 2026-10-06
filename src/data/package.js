/**
 * Anonymized composite packages for the PUBLIC friend-preview.
 * Considered-unit photos + year/make/model/price/miles/dealer come from
 * FACT Hot Deals listing rows. No invented VIN / price / miles / dealer.
 *
 * 2026-10-01: getPackage drops units without a verified live seller listing.
 * Good-score filtering for suggestions is in composeRecommendationSet.
 */
import { applyListingFactsToUnit } from '../lib/vehiclePhoto'
import { packageBatteryKwhFact } from '../lib/workSpec'

import {
  DEFAULT_TRADE_PACKAGE_ID,
  getTradePackageDef,
  isTradePackageId,
  matchTradePackageIdFromIntake,
  PACKAGE_ID_ALIASES,
  resolvePackageId,
  TRADE_PACKAGES,
  tradePackageHeader,
} from './tradePackages'

/** Default PATH Add to fleet target = electrical trade package. */
export const DEFAULT_PACKAGE_ID = DEFAULT_TRADE_PACKAGE_ID

/** Legacy demo electrical seed package id (fixtures / score §6.1). */
export const LEGACY_ELECTRICAL_PACKAGE_ID = 'pkg-tc-electrical-4'

/** @deprecated alias of LEGACY_ELECTRICAL_PACKAGE_ID */
export const LEGACY_ELECTRICAL_ID = LEGACY_ELECTRICAL_PACKAGE_ID

const ELECTRICAL_UNITS = [
  {
    id: 'unit-e1',
    stockId: 'STOCK-A01',
    role: 'Service van',
    bodyType: 'van',
    year: 2023,
    make: 'Ford',
    model: 'E-Transit',
    trim: 'Cargo 250',
    mileage: 22100,
    /** §6.1 G-final sample miles for warranty / score (listing miles stay on the card). */
    scoreMileage: 7495,
    location: { city: 'Stuart', state: 'FL' },
    askPrice: 38900,
    sellerType: 'dealer',
    sellerLabel: 'Regional commercial dealer (anonymized)',
    titleStatus: 'Clean',
    cpo: true,
    battery: {
      status: 'Not reported by dealer',
      soh: null,
      usableKwh: null,
      note: 'OEM usable pack on file; confirm before travel.',
    },
    recall: {
      status: 'Unchecked — placeholder',
      detail: 'Recall check not run in this preview. NHTSA lookup is a production stub.',
    },
    chargingFit: {
      label: 'Fits shop L2',
      detail: '11.5 kW onboard · overnight L2 at shop covers a full work day for this route class.',
    },
    tradeFit: {
      label: 'Cargo van fit',
      detail: 'Medium-roof cargo volume suits ladder + wire stock; payload in the right band for electrical service.',
    },
    fitScore: {
      band: 'open items',
      reason: 'Confirm open recalls and OEM usable pack size before deposit.',
    },
    openItems: [
      'Battery 68 kWh',
      'Confirm remaining factory warranty transfer',
      'Verify ladder-rack mounting points on this body',
    ],
    upfitNote: 'Empty cargo — upfit TBD by buyer.',
    description:
      'Placeholder cargo EV for a coastal electrical route. Listing ask only; buyer’s fee is not shown here.',
  },
  {
    id: 'unit-e2',
    stockId: 'STOCK-B02',
    role: 'Work pickup',
    bodyType: 'truck',
    year: 2024,
    make: 'Chevrolet',
    model: 'Silverado EV',
    trim: 'WT',
    mileage: 9800,
    scoreMileage: 4170,
    location: { city: 'Port St. Lucie', state: 'FL' },
    askPrice: 54900,
    sellerType: 'fleet',
    sellerLabel: 'Utility surplus (anonymized)',
    titleStatus: 'Clean',
    cpo: false,
    battery: {
      status: 'Reported',
      soh: 97,
      usableKwh: 205,
      note: 'Fleet surplus pack report on file (demo stub).',
    },
    recall: {
      status: 'Unchecked — placeholder',
      detail: 'Recall check not run in this preview. NHTSA lookup is a production stub.',
    },
    chargingFit: {
      label: 'Long day range',
      detail: 'Long-range WT · shop L2 + rare DC fast covers 100+ mi service days with margin.',
    },
    tradeFit: {
      label: 'Service-body ready',
      detail: 'Crew cab WT with payload headroom for toolboxes and wire reels.',
    },
    fitScore: {
      band: 'route match',
      reason: 'Matches longer coastal runs and heavier stock days.',
    },
    openItems: [
      'Confirm service-body lead time if not included',
      'PPI recommended before close',
    ],
    upfitNote: 'Spray liner only — commercial body not installed.',
    description:
      'Placeholder long-range work truck. Ask price only; FleetFit has not inspected this unit.',
  },
  {
    id: 'unit-e3',
    stockId: 'STOCK-C03',
    role: 'Work pickup',
    bodyType: 'truck',
    year: 2022,
    make: 'Ford',
    model: 'F-150 Lightning',
    trim: 'Pro',
    mileage: 36400,
    scoreMileage: 84296,
    location: { city: 'Fort Pierce', state: 'FL' },
    askPrice: 35900,
    sellerType: 'dealer',
    sellerLabel: 'Volume EV dealer (anonymized)',
    titleStatus: 'Clean',
    cpo: false,
    battery: {
      status: 'Not reported by dealer',
      soh: null,
      usableKwh: 98,
      note: 'Usable pack size known from trim (OEM table).',
    },
    recall: {
      status: 'Unchecked — placeholder',
      detail: 'Recall check not run in this preview. NHTSA lookup is a production stub.',
    },
    chargingFit: {
      label: 'Tight on long days',
      detail: 'Pro range class · overnight L2 OK; plan DC fast if the day stretches past ~180 mi.',
    },
    tradeFit: {
      label: 'Pickup workhorse',
      detail: 'Pro Power Onboard helps jobsite tools; bed needs rack + boxes.',
    },
    fitScore: {
      band: 'open items',
      reason: 'Mileage comps should clear after PPI; OEM usable pack on file.',
    },
    openItems: [
      'Battery 98 kWh',
      'Tire wear unknown',
      'Upfit not included',
    ],
    upfitNote: 'Stock bed — buyer upfit.',
    description:
      'Placeholder Lightning Pro. Higher miles; free EV layer flags missing battery data.',
  },
  {
    id: 'unit-e4',
    stockId: 'STOCK-D04',
    role: 'Service van',
    bodyType: 'van',
    year: 2024,
    make: 'Ram',
    model: 'ProMaster EV',
    trim: 'Cargo',
    mileage: 15200,
    scoreMileage: 1007,
    location: { city: 'Vero Beach', state: 'FL' },
    askPrice: 41200,
    sellerType: 'dealer',
    sellerLabel: 'Van specialist (anonymized)',
    titleStatus: 'Clean',
    cpo: true,
    battery: {
      status: 'Not reported by dealer',
      soh: null,
      usableKwh: null,
      note: 'OEM usable pack on file.',
    },
    recall: {
      status: 'Unchecked — placeholder',
      detail: 'Recall check not run in this preview. NHTSA lookup is a production stub.',
    },
    chargingFit: {
      label: 'Needs shop L2',
      detail: 'Cargo EV · overnight charge assumed; verify depot circuit before package commit.',
    },
    tradeFit: {
      label: 'Van volume',
      detail: 'Standing height for shelving; fits wire and fixture stock.',
    },
    fitScore: {
      band: 'not enough data',
      reason: 'Hold until battery report and depot charging capacity are confirmed.',
    },
    openItems: [
      'Battery 110 kWh',
      'Depot L2 circuit capacity unknown',
      'Shelving fit not verified',
    ],
    upfitNote: 'Empty cargo — shelving TBD.',
    description:
      'Placeholder cargo van. Fit score blocked on missing battery + charging diligence.',
  },
  {
    id: 'unit-e5',
    stockId: 'STOCK-E05',
    role: 'Work pickup',
    bodyType: 'truck',
    year: 2026,
    make: 'GMC',
    model: 'Sierra EV',
    trim: 'Elevation',
    mileage: 2800,
    scoreMileage: 3468,
    location: { city: 'Jupiter', state: 'FL' },
    askPrice: 54177,
    sellerType: 'dealer',
    sellerLabel: 'New-used EV desk (anonymized)',
    titleStatus: 'Clean',
    cpo: false,
    battery: {
      status: 'Not reported by dealer',
      soh: null,
      usableKwh: null,
      note: 'Newly used 2026 — OEM usable pack on file.',
    },
    recall: {
      status: 'Unchecked — placeholder',
      detail: 'Recall check not run in this preview. NHTSA lookup is a production stub.',
    },
    chargingFit: {
      label: 'Long day range',
      detail: 'Standard-range Elevation · shop L2 covers coastal service days with margin.',
    },
    tradeFit: {
      label: 'Service-body ready',
      detail: 'Crew pickup for toolboxes and wire reels — verify tow if you haul.',
    },
    fitScore: {
      band: 'open items',
      reason: 'Newer MY surfaced for look-newer-first; confirm OEM pack kWh and tow before close.',
    },
    openItems: [
      'Battery 120 kWh',
      'PPI recommended on newly used unit',
    ],
    upfitNote: 'Stock bed — commercial body not installed.',
    description:
      'Newly used 2026 work truck option. Listing ask only; FleetFit has not inspected this unit.',
  },
  {
    id: 'unit-e6',
    stockId: 'STOCK-F06',
    role: 'Service van',
    bodyType: 'van',
    year: 2025,
    make: 'Chevrolet',
    model: 'BrightDrop 600',
    trim: 'Zevo 600',
    mileage: 16500,
    scoreMileage: 28,
    location: { city: 'West Palm Beach', state: 'FL' },
    askPrice: 27995,
    sellerType: 'dealer',
    sellerLabel: 'Commercial van desk (anonymized)',
    titleStatus: 'Clean',
    cpo: false,
    battery: {
      status: 'Not reported by dealer',
      soh: null,
      usableKwh: null,
      note: '2025 BrightDrop — OEM usable pack on file.',
    },
    recall: {
      status: 'Unchecked — placeholder',
      detail: 'Recall check not run in this preview. NHTSA lookup is a production stub.',
    },
    chargingFit: {
      label: 'Fits shop L2',
      detail: 'Cargo EV · overnight L2 at shop covers a typical electrical service day.',
    },
    tradeFit: {
      label: 'Cargo van fit',
      detail: 'Walk-in cargo for ladder + wire stock; confirm shelving mounts.',
    },
    fitScore: {
      band: 'open items',
      reason: '2025 van option in the pool — confirm battery report and depot charging.',
    },
    openItems: [
      'Battery 102.4 kWh',
      'Shelving fit not verified',
    ],
    upfitNote: 'Empty cargo — shelving TBD.',
    description:
      '2025 cargo EV van option. Listing ask only; not inspected by FleetFit.',
  },
  {
    id: 'unit-e7',
    stockId: 'STOCK-R1T',
    role: 'Work pickup',
    bodyType: 'truck',
    year: 2022,
    make: 'Rivian',
    model: 'R1T',
    trim: 'Adventure',
    mileage: 41446,
    location: { city: 'Clermont', state: 'FL' },
    askPrice: 53343,
    sellerType: 'dealer',
    sellerLabel: 'Dealer listing (anonymized)',
    titleStatus: 'Clean',
    cpo: false,
    /** Live demo: unconfirmed → consumer score + "Commercial warranty status not confirmed". */
    warrantyType: 'unconfirmed',
    warrantyProgram: 'unconfirmed',
    upfit: 'none',
    scoreMileage: 41446,
    battery: {
      status: 'Reported',
      soh: null,
      usableKwh: 131,
      note: 'OEM usable pack 131 kWh (Large).',
    },
    recall: {
      status: 'Unchecked — placeholder',
      detail: 'Recall check not run in this preview. NHTSA lookup is a production stub.',
    },
    chargingFit: {
      label: 'Day range on file',
      detail: '314 mi EPA class · overnight L2 covers a 120 mi supervisor day with margin.',
    },
    tradeFit: {
      label: 'Crew pickup',
      detail: 'Quad Large payload 1,764 lb; tow not used on supervisor routes.',
    },
    fitScore: {
      band: 'open items',
      reason: 'Commercial warranty status not confirmed on this listing.',
    },
    openItems: [
      'Battery 131 kWh',
      'Commercial warranty status not confirmed',
    ],
    upfitNote: 'Adventure trim — upfit TBD by buyer.',
    description:
      '2022 R1T Quad Large class (most-listed sample). Listing ask only; G-final score uses unconfirmed warranty_type.',
  },
]

const LANDSCAPE_UNITS = [
  {
    id: 'unit-l1',
    stockId: 'STOCK-L01',
    role: 'Trailer hauler',
    bodyType: 'truck',
    year: 2024,
    make: 'Chevrolet',
    model: 'Silverado EV',
    trim: 'WT',
    mileage: 8700,
    location: { city: 'Port St. Lucie', state: 'FL' },
    askPrice: 51400,
    sellerType: 'dealer',
    sellerLabel: 'Franchise truck desk (anonymized)',
    titleStatus: 'Clean',
    cpo: false,
    battery: {
      status: 'Not reported by dealer',
      soh: null,
      usableKwh: null,
      note: 'No pack report on the listing card.',
    },
    recall: {
      status: 'Unchecked — placeholder',
      detail: 'Recall check not run in this preview. NHTSA lookup is a production stub.',
    },
    chargingFit: {
      label: 'Shop L2 assumed',
      detail: 'WT range class should cover a coastal landscape day if depot L2 is real — not verified here.',
    },
    tradeFit: {
      label: 'Hauler candidate',
      detail: 'Crew WT payload is in the right band; dual-axle enclosed tow rating must be verified on this truck.',
    },
    fitScore: {
      band: 'open items',
      reason: 'Confirm tow rating for the enclosed trailer; OEM usable pack on file.',
    },
    openItems: [
      'Tow rating for dual-axle enclosed cargo must be verified',
      'OEM usable pack on file',
      'Replaces a current non-EV hauler — year of the outgoing truck is unconfirmed',
    ],
    replaceNote: 'Replaces hauler — current truck year unconfirmed (not title-checked).',
    upfitNote: 'Stock bed — hitch and brake controller not confirmed.',
    description:
      'Placeholder hauler slot for a two-truck landscape day. FleetFit has not seen this truck or the trailer.',
  },
  {
    id: 'unit-l2',
    stockId: 'STOCK-L02',
    role: 'Lead and estimates',
    bodyType: 'truck',
    year: 2025,
    make: 'Ford',
    model: 'F-150 Lightning',
    trim: 'XLT',
    mileage: 14200,
    location: { city: 'Stuart', state: 'FL' },
    askPrice: 43800,
    sellerType: 'dealer',
    sellerLabel: 'Volume EV dealer (anonymized)',
    titleStatus: 'Clean',
    cpo: false,
    battery: {
      status: 'Not reported by dealer',
      soh: null,
      usableKwh: 98,
      note: 'No pack report on the listing card.',
    },
    recall: {
      status: 'Unchecked — placeholder',
      detail: 'Recall check not run in this preview. NHTSA lookup is a production stub.',
    },
    chargingFit: {
      label: 'Lighter day truck',
      detail: 'XLT range + Pro Power is the estimate and lead truck — not the tow truck.',
    },
    tradeFit: {
      label: 'Lead and tools',
      detail: 'Shorter day, tools and Pro Power before claiming range for a loaded trailer.',
    },
    fitScore: {
      band: 'open items',
      reason: 'Second truck only if the WT hauler’s tow rating clears.',
    },
    openItems: [
      'Battery 98 kWh',
      'Pro Power output not verified on this unit',
      'PPI recommended before close',
    ],
    replaceNote: 'Lighter day truck — not claimed as a trailer hauler.',
    upfitNote: 'Stock bed — rack and boxes not included.',
    description:
      'Placeholder lead truck. Pairing is a work-day split, not a guarantee both units close together.',
  },
]

export const PACKAGES = [
  {
    id: LEGACY_ELECTRICAL_PACKAGE_ID,
    path: 'PRIMARY',
    label: 'Treasure Coast electrical — truck + van options',
    headline: 'Used-EV fleet package. Treasure Coast electrical (truck + van options)',
    summary:
      'Composite example for a small trade fleet that needs matched used EVs for typical coastal service routes — including newer 2025–2026 options. Not a real shop.',
    region: 'Treasure Coast, FL',
    trade: 'Electrical',
    /** Demo FACT scaffold for Life Delta vs current non-EV work vehicle */
    currentMileage: 48000,
    /**
     * CLEARED Pages bar — Example current vehicle (c_ + f_ CSV only).
     * Labeled in UI; used when intake has no current vehicle.
     */
    currentVehicle: {
      label: 'Example current vehicle',
      year: 2018,
      make: 'Ford',
      model: 'Transit-250',
      engine: '3.7L V6',
      drivetrain: '4x2',
      miles: 48000,
      roof: 'high roof',
    },
    /** Demo job inputs when intake is empty (home → package). */
    jobDefaults: {
      trade: 'Electrical',
      dailyMiles: 120,
      loadLb: 543,
      loadNote:
        'Adrian Steel ELE-FTMR148B electrical mid-roof upfit 542.73 lb → 543 lb load. Cargo weight not entered.',
      loadUrl:
        'https://industrialladder.com/Adrian-ELE-FTMR148B-Electrical-Package-FTM148/',
      crew: 2,
      crewNote: 'electrician plus helper',
      tows: false,
      shopCity: 'Vero Beach',
    },
    unitCount: null,
    statedCountNote: 'Fleet size from live listings only',
    workDayNote:
      'Typical day: 80 to 120 mi across coastal jobsites; overnight Level 2 at shop; occasional DC fast on longer runs.',
    matchNote:
      'Package matched from dealer listings with a verified seller page to the intake profile. Vehicle prices shown are listing asks only. Buyer’s fee appears only at checkout.',
    packageFit: {
      band: 'Package notes',
      detail: 'OEM pack kWh on file · recalls Not checked per stock ID · live listings only',
    },
    openOnPackage: null,
    /** Full seed pool (includes dead) — score fixtures / audit. UI uses getPackage filter. */
    allUnits: ELECTRICAL_UNITS,
    units: ELECTRICAL_UNITS,
    newVsUsed: {
      usedLabel: 'This used package',
      newLabel: 'New cargo EV. Labeled desk note',
      newPriceLabel: 'Starting $79,900*',
      newDetail:
        '*Desk note only. Not a quote. Two new vans would be ≥ ~$159,800 before trucks. No fuel-savings $ invented on this screen.',
    },
    tradeIn: {
      status: 'Pending dealer appraisal',
      detail:
        'Count stated (~4). Outgoing units not inventoried by FleetFit. No ACV shown. Not invented.',
    },
    sourcedNote:
      'Sourced from dealer listings and your fleet inputs. We have not seen these vehicles in person.',
  },
  {
    id: 'pkg-tc-landscape-2',
    path: 'SECONDARY EXAMPLE',
    label: 'Treasure Coast landscape — trailer hauler + lead truck',
    headline: '2-unit used-EV package. Trailer hauler + lead and estimates',
    summary:
      'Composite example for a two-truck landscape day: one candidate hauler and one lighter lead truck. Not a real shop.',
    region: 'Treasure Coast, FL',
    trade: 'Landscaping and lawn',
    currentMileage: 52000,
    unitCount: null,
    statedCountNote: 'Fleet size from live listings only',
    workDayNote:
      'Typical day: trailer + crew to coastal jobs; overnight L2 if the shop already has it; tow rating is the open item, not a promise.',
    matchNote:
      'Package matched from dealer listings with a verified seller page. Listing asks only. Buyer’s fee appears only at checkout. No fee $ or % on this screen.',
    packageFit: {
      band: 'Package notes',
      detail:
        'OEM pack kWh on file · tow rating for dual-axle enclosed cargo must be verified · live listings only',
    },
    openOnPackage: null,
    allUnits: LANDSCAPE_UNITS,
    units: LANDSCAPE_UNITS,
    fitShort: [
      { label: 'Tow (dual-axle enclosed)', value: 'Not published · confirm' },
      { label: 'Battery (OEM)', value: 'On file when listed' },
    ],
    fitShortNote:
      'Shop already runs battery-electric tools. Pairing matches the trucks to the same work. No invented GVWR and fuel $.',
    newVsUsed: null,
    tradeIn: {
      status: 'Pending dealer appraisal',
      detail:
        'Hauler yes (current truck year unconfirmed); second unit only if it exists. Estimate pending. No invented ACV.',
    },
    sourcedNote:
      'Sourced from dealer listings and your fleet inputs. We have not seen these trucks or the current hauler in person.',
  },
]

function batteryOpenNote(units) {
  const fact = packageBatteryKwhFact(units)
  if (!fact?.known) {
    return 'OEM usable packs on this package: Not published for remaining live units. Recalls Not checked (no NHTSA lookup in this preview). Confirm before close.'
  }
  return `OEM usable packs on this package: Battery ${fact.text}. Recalls Not checked (no NHTSA lookup in this preview). Confirm before close.`
}

function withListingFacts(pkg, { includeDead = false } = {}) {
  if (!pkg) return null
  const pool = (pkg.allUnits || pkg.units || []).map(applyListingFactsToUnit)
  const units = includeDead ? pool : pool.filter((u) => u.listingLive === true)
  return {
    ...pkg,
    units,
    unitCount: units.length,
    openOnPackage: batteryOpenNote(units),
  }
}

/** Score / audit fixture: all seed units with listing facts (includes dead). */
export function getPackageAllUnits(id) {
  // Exact legacy seed ids keep their fixture pools (score + eligibility tests).
  const exact = PACKAGES.find((p) => p.id === id)
  if (exact) {
    return withListingFacts(exact, { includeDead: true })
  }
  const resolved = resolvePackageId(id)
  if (isTradePackageId(resolved)) {
    // Trade packages share the global seed pool (all facts, including dead).
    const byId = new Map()
    for (const raw of PACKAGES) {
      const pkg = withListingFacts(raw, { includeDead: true })
      for (const unit of pkg?.units || []) {
        if (!byId.has(unit.id)) byId.set(unit.id, unit)
      }
    }
    const def = getTradePackageDef(resolved)
    const units = [...byId.values()]
    return {
      ...tradePackageAsPkg(def),
      units,
      allUnits: units,
      unitCount: units.length,
    }
  }
  return null
}

/**
 * Live listing pool shared by every trade package (real listings only).
 * Deduped by unit id across legacy seed packages.
 */
function liveListingPool() {
  const byId = new Map()
  for (const raw of PACKAGES) {
    const pkg = withListingFacts(raw)
    for (const unit of pkg?.units || []) {
      if (!byId.has(unit.id)) byId.set(unit.id, unit)
    }
  }
  return [...byId.values()]
}

function tradePackageAsPkg(def) {
  if (!def) return null
  const units = liveListingPool()
  return {
    id: def.id,
    path: 'TRADE',
    label: def.label,
    headline: tradePackageHeader(def.trade, def.sizeDefault),
    summary: def.workDayCopy,
    region: 'Treasure Coast, FL',
    trade: def.trade,
    stockMode: def.stockMode,
    sizeDefault: def.sizeDefault,
    sizeMax: def.sizeMax,
    currentMileage: def.currentMileage ?? null,
    currentVehicle: def.currentVehicle,
    jobDefaults: def.jobDefaults,
    workDayNote: def.workDayCopy,
    workDayCopy: def.workDayCopy,
    isTradePackage: true,
    hideWhenEmpty: def.hideWhenEmpty,
    unitCount: units.length,
    statedCountNote: 'Fleet size from live listings only',
    matchNote:
      'Package matched from dealer listings with a verified seller page. Listing asks only.',
    packageFit: {
      band: 'Package notes',
      detail: 'OEM pack kWh on file · recalls Not checked · live listings only',
    },
    openOnPackage: null,
    allUnits: units,
    units,
    tradeIn: {
      status: 'Pending dealer appraisal',
      detail: 'Outgoing units not inventoried by FleetFit. No ACV shown.',
    },
    sourcedNote:
      'Sourced from dealer listings and your fleet inputs. We have not seen these vehicles in person.',
  }
}

export function getPackage(id) {
  // Exact legacy seed packages stay addressable for fixtures / audit.
  const exact = PACKAGES.find((p) => p.id === id)
  if (exact) return withListingFacts(exact)

  const resolved = resolvePackageId(id)
  if (isTradePackageId(resolved)) {
    return tradePackageAsPkg(getTradePackageDef(resolved))
  }
  return null
}

export function getUnit(packageId, unitId) {
  const pkg = getPackage(packageId)
  return pkg?.units.find((u) => u.id === unitId) || null
}

export function findUnitAnywhere(unitId) {
  for (const raw of PACKAGES) {
    // Resolve deep links even for removed (dead) units — page can show unavailable.
    const pkg = withListingFacts(raw, { includeDead: true })
    const unit = pkg.units.find((u) => u.id === unitId)
    if (unit) return { pkg: getPackage(raw.id) || pkg, unit }
  }
  // Trade package shells share the live pool
  for (const def of TRADE_PACKAGES) {
    const pkg = getPackage(def.id)
    const unit = pkg?.units?.find((u) => u.id === unitId)
    if (unit) return { pkg, unit }
  }
  return null
}

export function packageStickerSum(pkg) {
  return (pkg.units || []).reduce((sum, unit) => sum + (unit.askPrice || 0), 0)
}

export function matchPackageIdFromIntake(intake) {
  return matchTradePackageIdFromIntake(intake)
}

export { PACKAGE_ID_ALIASES, TRADE_PACKAGES, isTradePackageId, resolvePackageId }

export function batteryUnknownCount(pkg) {
  return pkg.units.filter((u) => u.battery.soh == null).length
}

/** @deprecated use getPackage(DEFAULT_PACKAGE_ID) */
export const DEMO_PACKAGE = PACKAGES[0]
/** @deprecated use getPackage(...).units */
export const PACKAGE_UNITS = ELECTRICAL_UNITS

/** @deprecated Score v2 — bands unused in public UI */
export const FIT_SCORE_BANDS = [
  'open items',
  'pass',
  'not enough data',
]
