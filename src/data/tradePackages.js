/**
 * Preset Trade Packages — ids, seeds, aliases.
 * Units are NOT invented seeds: ranked from real live listings only
 * (see src/lib/tradePackageSet.js + suggestionEligibility).
 */
import { TRADE_NEEDS } from './tradeNeeds'

export const TRADE_PACKAGE_BUILD = 'trade-packages-20261001'

/** New stable trade-package ids. */
export const TRADE_PACKAGE_IDS = {
  electrical: 'pkg-trade-electrical',
  hvac: 'pkg-trade-hvac',
  plumbing: 'pkg-trade-plumbing',
  landscaping: 'pkg-trade-landscaping',
  gc: 'pkg-trade-gc',
}

/** Legacy demo ids → trade packages (decision 11). */
export const PACKAGE_ID_ALIASES = {
  'pkg-tc-electrical-4': TRADE_PACKAGE_IDS.electrical,
  'pkg-tc-landscape-2': TRADE_PACKAGE_IDS.landscaping,
}

export const DEFAULT_TRADE_PACKAGE_ID = TRADE_PACKAGE_IDS.electrical

/**
 * Example current vehicle for Electrical only (decision 12).
 * Other trades: no invented example — current reads Not entered.
 */
const ELECTRICAL_CURRENT = {
  label: 'Example current vehicle',
  year: 2018,
  make: 'Ford',
  model: 'Transit-250',
  engine: '3.7L V6',
  drivetrain: '4x2',
  miles: 48000,
  roof: 'high roof',
}

function jobDefaultsFromNeeds(needs) {
  return {
    trade: needs.trade,
    dailyMiles: needs.dailyMiles,
    loadLb: needs.loadLb,
    crew: needs.crew,
    tows: needs.tows,
    trailerLb: needs.trailerLb,
    tongueLb: needs.tongueLb,
    wdh: null,
    shopCity: 'Vero Beach',
    cargoCuFt: null,
  }
}

/**
 * @type {Array<{
 *   id: string
 *   trade: string
 *   label: string
 *   stockMode: 'Used'
 *   sizeDefault: number
 *   sizeMax: number
 *   jobDefaults: object
 *   currentVehicle: object | null
 *   workDayCopy: string
 *   hideWhenEmpty: boolean
 * }>}
 */
export const TRADE_PACKAGES = [
  {
    id: TRADE_PACKAGE_IDS.electrical,
    trade: 'Electrical',
    label: 'Electrical trade package',
    stockMode: 'Used',
    sizeDefault: 2,
    sizeMax: 5,
    jobDefaults: jobDefaultsFromNeeds(TRADE_NEEDS.Electrical),
    currentVehicle: ELECTRICAL_CURRENT,
    currentMileage: 48000,
    workDayCopy: TRADE_NEEDS.Electrical.workDayCopy,
    hideWhenEmpty: false,
  },
  {
    id: TRADE_PACKAGE_IDS.hvac,
    trade: 'HVAC',
    label: 'HVAC trade package',
    stockMode: 'Used',
    sizeDefault: 2,
    sizeMax: 5,
    jobDefaults: jobDefaultsFromNeeds(TRADE_NEEDS.HVAC),
    currentVehicle: null,
    workDayCopy: TRADE_NEEDS.HVAC.workDayCopy,
    hideWhenEmpty: false,
  },
  {
    id: TRADE_PACKAGE_IDS.plumbing,
    trade: 'Plumbing',
    label: 'Plumbing trade package',
    stockMode: 'Used',
    sizeDefault: 2,
    sizeMax: 5,
    jobDefaults: jobDefaultsFromNeeds(TRADE_NEEDS.Plumbing),
    currentVehicle: null,
    workDayCopy: TRADE_NEEDS.Plumbing.workDayCopy,
    hideWhenEmpty: false,
  },
  {
    id: TRADE_PACKAGE_IDS.landscaping,
    trade: 'Landscaping',
    label: 'Landscaping trade package',
    stockMode: 'Used',
    sizeDefault: 2,
    sizeMax: 5,
    jobDefaults: jobDefaultsFromNeeds(TRADE_NEEDS.Landscaping),
    currentVehicle: null,
    workDayCopy: TRADE_NEEDS.Landscaping.workDayCopy,
    hideWhenEmpty: false,
  },
  {
    id: TRADE_PACKAGE_IDS.gc,
    trade: 'General contracting',
    label: 'General contracting trade package',
    stockMode: 'Used',
    sizeDefault: 2,
    sizeMax: 5,
    jobDefaults: jobDefaultsFromNeeds(TRADE_NEEDS['General contracting']),
    currentVehicle: null,
    workDayCopy: TRADE_NEEDS['General contracting'].workDayCopy,
    /** Decision 13: hide chip when pool empty. */
    hideWhenEmpty: true,
  },
]

export function resolvePackageId(id) {
  if (!id) return null
  if (PACKAGE_ID_ALIASES[id]) return PACKAGE_ID_ALIASES[id]
  return id
}

export function getTradePackageDef(id) {
  const resolved = resolvePackageId(id)
  return TRADE_PACKAGES.find((p) => p.id === resolved) || null
}

export function isTradePackageId(id) {
  const resolved = resolvePackageId(id)
  return TRADE_PACKAGES.some((p) => p.id === resolved)
}

export function matchTradePackageIdFromIntake(intake) {
  const trade = String(intake?.trade || '')
  if (/landscap|lawn/i.test(trade)) return TRADE_PACKAGE_IDS.landscaping
  if (/hvac/i.test(trade)) return TRADE_PACKAGE_IDS.hvac
  if (/plumb/i.test(trade)) return TRADE_PACKAGE_IDS.plumbing
  if (/general|contract/i.test(trade)) return TRADE_PACKAGE_IDS.gc
  if (/electric/i.test(trade)) return TRADE_PACKAGE_IDS.electrical
  return DEFAULT_TRADE_PACKAGE_ID
}

/**
 * Package page title count. Pass the number of vehicles actually shown
 * (the rendered active set), not the planned fleet-size chip.
 */
export function tradePackageHeader(trade, shownCount) {
  const needs = TRADE_NEEDS[trade] || TRADE_NEEDS.Electrical
  const raw = Number(shownCount)
  const count = Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : 0
  return needs.headerPattern(count)
}
