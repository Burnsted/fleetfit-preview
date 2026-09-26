import { LISTINGS } from '../data/listings'

/** CLEARED OEM specs: unknown = plain "Not published", never em dash. */
export const NOT_PUBLISHED = 'Not published'
/** @deprecated use NOT_PUBLISHED for vehicle specs */
export const DASH = NOT_PUBLISHED

function norm(value) {
  return String(value ?? '').trim().toLowerCase()
}

/**
 * Exact year + make + model + trim match only.
 * Nearby years or sibling trims are not borrowed.
 */
export function findExactListingMatch(unit) {
  if (!unit) return null
  return (
    LISTINGS.find(
      (listing) =>
        listing.year === unit.year &&
        norm(listing.make) === norm(unit.make) &&
        norm(listing.model) === norm(unit.model) &&
        norm(listing.trim) === norm(unit.trim),
    ) || null
  )
}

export function formatLb(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return NOT_PUBLISHED
  return `${n.toLocaleString()} lb`
}

export function formatCabBed(cab, bed) {
  const c = cab != null && String(cab).trim() ? String(cab).trim() : ''
  const b = bed != null && String(bed).trim() ? String(bed).trim() : ''
  if (c && b) return `${c} / ${b}`
  if (c) return c
  if (b) return b
  return NOT_PUBLISHED
}

function factField(raw, format) {
  if (raw == null || raw === '') {
    return { text: NOT_PUBLISHED, known: false }
  }
  const text = format ? format(raw) : String(raw)
  if (!text || text === NOT_PUBLISHED) return { text: NOT_PUBLISHED, known: false }
  return { text, known: true }
}

export function formatEnergy(rangeMi, kwh) {
  const rangeKnown = rangeMi != null && rangeMi !== '' && Number.isFinite(Number(rangeMi))
  const kwhKnown = kwh != null && kwh !== '' && Number.isFinite(Number(kwh))
  if (rangeKnown && kwhKnown) {
    return {
      text: `${Number(rangeMi).toLocaleString()} mi (${Number(kwh)} kWh)`,
      known: true,
    }
  }
  if (rangeKnown) {
    return { text: `${Number(rangeMi).toLocaleString()} mi`, known: true }
  }
  if (kwhKnown) {
    return { text: `${NOT_PUBLISHED} (${Number(kwh)} kWh)`, known: true }
  }
  return { text: NOT_PUBLISHED, known: false }
}

function finiteNumber(value) {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

/**
 * Current-column Energy: tank range mi (MPG), parallel to EV range mi (kWh).
 * Tank miles = gallons × MPG only when both FACT. Never invent gallons, MPG, or tank range.
 */
export function formatTankEnergy({ tankRangeMi, mpg, tankGallons } = {}) {
  const mpgN = finiteNumber(mpg)
  const gallonsN = finiteNumber(tankGallons)
  const storedRange = finiteNumber(tankRangeMi)
  const computedRange =
    gallonsN != null && mpgN != null ? Math.round(gallonsN * mpgN) : null
  const rangeN = computedRange ?? storedRange

  if (rangeN != null && mpgN != null) {
    return {
      text: `${rangeN.toLocaleString()} mi (${mpgN} MPG)`,
      known: true,
    }
  }
  if (rangeN != null) {
    return { text: `${rangeN.toLocaleString()} mi`, known: true }
  }
  if (mpgN != null) {
    return { text: `${NOT_PUBLISHED} (${mpgN} MPG)`, known: true }
  }
  return { text: NOT_PUBLISHED, known: false }
}

export function formatMpg(value) {
  return formatTankEnergy({ mpg: value }).text
}

export function formatAsk(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return { text: NOT_PUBLISHED, known: false }
  return { text: `$${n.toLocaleString()}`, known: true }
}

function firstDefined(...vals) {
  for (const v of vals) {
    if (v != null && v !== '') return v
  }
  return null
}

/**
 * Work specs from unit (OEM-merged) with optional listing overlay.
 * Truly unknown → "Not published" (never em dash). Never invent.
 */
export function displayWorkSpec(unit) {
  // Prefer unit (OEM-merged via getPackage / listing overlay). Listing seed is fallback only.
  const listing = findExactListingMatch(unit)
  const payload = firstDefined(unit?.payload, listing?.payload)
  const bed = firstDefined(unit?.bed, listing?.bed)
  const cab = firstDefined(unit?.cab, listing?.cab)
  const tow = firstDefined(unit?.tow, unit?.towingLb, listing?.tow, listing?.towingLb)
  const range = firstDefined(unit?.ratedRange, listing?.ratedRange)
  const kwh = firstDefined(
    unit?.usableKwh,
    unit?.battery?.usableKwh,
    listing?.usableKwh,
    listing?.battery?.usableKwh,
  )
  const drivetrain = firstDefined(unit?.drivetrain, listing?.drivetrain)
  const cargo = firstDefined(
    unit?.cargoCuFt,
    unit?.cargoVolume,
    unit?.cargo,
    listing?.cargoCuFt,
    listing?.cargoVolume,
    listing?.cargo,
  )

  const cargoField = factField(cargo, (v) => {
    const n = Number(v)
    if (!Number.isFinite(n)) return String(v)
    // Keep one decimal when OEM publishes tenths (e.g. 358.7, 614.7)
    const text = Number.isInteger(n) ? String(n) : String(n)
    return `${text} cu ft`
  })

  const gvwr = firstDefined(unit?.gvwrLb, unit?.gvwr, listing?.gvwrLb, listing?.gvwr)
  const curb = firstDefined(unit?.curbLb, unit?.curb, listing?.curbLb, listing?.curb)
  const acKw = firstDefined(
    unit?.onboardAcKw,
    unit?.onboardChargerKw,
    listing?.onboardAcKw,
    listing?.onboardChargerKw,
  )
  const dcKw = firstDefined(unit?.dcFastMaxKw, listing?.dcFastMaxKw)

  return {
    payload: factField(payload, formatLb),
    bed: factField(bed),
    cab: factField(cab),
    cabBed: factField(formatCabBed(cab, bed)),
    tow: factField(tow, formatLb),
    energy: formatEnergy(range, kwh),
    ask: formatAsk(unit?.askPrice),
    mpg: { text: NOT_PUBLISHED, known: false },
    kbbTradeIn: { text: NOT_PUBLISHED, known: false },
    drivetrain: factField(drivetrain),
    cargo: cargoField,
    range: factField(range, (v) => `${Number(v).toLocaleString()} mi`),
    usableKwh: factField(kwh, (v) => {
      const n = Number(v)
      if (!Number.isFinite(n)) return NOT_PUBLISHED
      return Number.isInteger(n) ? `${n} kWh` : `${n} kWh`
    }),
    gvwr: factField(gvwr, formatLb),
    curb: factField(curb, formatLb),
    onboardAcKw: factField(acKw, (v) => `${Number(v)} kW`),
    dcFastMaxKw: factField(dcKw, (v) => `${Number(v)} kW`),
    source: listing?.id || unit?.oemSpecKey || null,
  }
}

/**
 * Current non-EV work vehicle for the compare moment.
 * Intake does not capture current-vehicle specs — placeholder role only.
 * Never invent payload / cab / bed / tow / tank gallons / MPG for the current column.
 */
export function currentWorkVehicle(intake, pkg) {
  const trade = intake?.trade || pkg?.trade || ''
  let role = 'Lead van'
  if (trade.startsWith('Landscaping')) role = 'Trailer hauler'
  else if (trade === 'Electrical' || trade === 'HVAC' || trade === 'Plumbing') {
    role = 'Service van'
  } else if (trade) {
    role = 'Work truck'
  }

  const empty = { text: NOT_PUBLISHED, known: false }
  const energy = formatTankEnergy({
    tankRangeMi: intake?.tankRangeMi ?? pkg?.currentTankRangeMi,
    mpg: intake?.mpg ?? pkg?.currentMpg,
    tankGallons: intake?.tankGallons ?? pkg?.currentTankGallons,
  })
  const kbb = factField(intake?.kbbTradeIn ?? pkg?.currentKbbTradeIn)
  const milesRaw = intake?.currentMileage ?? intake?.currentMiles ?? pkg?.currentMileage
  const milesN = milesRaw == null || milesRaw === '' ? null : Number(milesRaw)
  const mileage =
    milesN != null && Number.isFinite(milesN)
      ? { text: `${milesN.toLocaleString()} mi`, known: true, value: milesN }
      : { text: NOT_PUBLISHED, known: false, value: null }
  return {
    heading: 'Your current work vehicle',
    role,
    kind: 'Your current',
    bodyType: /van/i.test(role) ? 'van' : 'truck',
    mileage: mileage.value,
    spec: {
      payload: empty,
      bed: empty,
      cab: empty,
      cabBed: empty,
      tow: empty,
      energy,
      ask: empty,
      mpg: energy,
      kbbTradeIn: kbb,
      drivetrain: empty,
      cargo: empty,
      range: empty,
      usableKwh: empty,
      gvwr: empty,
      curb: empty,
      onboardAcKw: empty,
      dcFastMaxKw: empty,
      source: null,
    },
  }
}

/** Package Match Facts: OEM usable-kWh band across units, else Not published. */
export function packageBatteryKwhFact(units = []) {
  const vals = units
    .map((u) => finiteNumber(u?.usableKwh ?? u?.battery?.usableKwh))
    .filter((n) => n != null)
  if (!vals.length) return { text: NOT_PUBLISHED, known: false }
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const fmt = (n) => (Number.isInteger(n) ? String(n) : String(n))
  if (min === max) return { text: `${fmt(min)} kWh`, known: true }
  return { text: `${fmt(min)}–${fmt(max)} kWh`, known: true }
}

/** Package + unit cards: payload · bed/cab · tow */
export const WORK_SPEC_ROWS = [
  { key: 'payload', label: 'Payload' },
  { key: 'cabBed', label: 'Bed / cab' },
  { key: 'tow', label: 'Tow' },
]

/** Compare moment: capacity primary, then one Energy row */
export const COMPARE_SPEC_ROWS = [
  { key: 'payload', label: 'Payload' },
  { key: 'bed', label: 'Bed' },
  { key: 'cab', label: 'Cab' },
  { key: 'tow', label: 'Tow' },
  { key: 'energy', label: 'Energy' },
]

/** Expanded stack only — never the collapsed default */
export const EXPAND_SPEC_ROWS = [
  { key: 'cargo', label: 'Cargo' },
  { key: 'drivetrain', label: 'Drivetrain' },
  { key: 'payload', label: 'Payload' },
  { key: 'bed', label: 'Bed' },
  { key: 'cab', label: 'Cab' },
  { key: 'tow', label: 'Tow' },
  { key: 'energy', label: 'Energy' },
]
