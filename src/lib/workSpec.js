import { LISTINGS } from '../data/listings'

/** Em dash for unknown work specs. Never invent payload / cab / bed / tow. */
export const DASH = '—'

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
  if (!Number.isFinite(n)) return DASH
  return `${n.toLocaleString()} lb`
}

export function formatCabBed(cab, bed) {
  const c = cab != null && String(cab).trim() ? String(cab).trim() : ''
  const b = bed != null && String(bed).trim() ? String(bed).trim() : ''
  if (c && b) return `${c} / ${b}`
  if (c) return c
  if (b) return b
  return DASH
}

function factField(raw, format) {
  if (raw == null || raw === '') {
    return { text: DASH, known: false }
  }
  const text = format ? format(raw) : String(raw)
  if (!text || text === DASH) return { text: DASH, known: false }
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
    return { text: `${DASH} (${Number(kwh)} kWh)`, known: true }
  }
  return { text: DASH, known: false }
}

function finiteNumber(value) {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

/**
 * Current-column Energy: tank range mi (MPG), parallel to EV range mi (kWh).
 * Tank miles = gallons × MPG only when both FACT. Never invent gallons, MPG, or tank range.
 * Bare MPG is not allowed — missing tank miles stay a dash: `— (18 MPG)`.
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
    return { text: `${DASH} (${mpgN} MPG)`, known: true }
  }
  return { text: DASH, known: false }
}

export function formatMpg(value) {
  return formatTankEnergy({ mpg: value }).text
}

export function formatAsk(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return { text: DASH, known: false }
  return { text: `$${n.toLocaleString()}`, known: true }
}

/** Work specs from an exact listing match, or em dashes. */
export function displayWorkSpec(unit) {
  const listing = findExactListingMatch(unit)
  const range = listing?.ratedRange ?? unit?.ratedRange
  const kwh = listing?.usableKwh ?? unit?.battery?.usableKwh
  const empty = { text: DASH, known: false }

  return {
    payload: listing ? factField(listing.payload, formatLb) : empty,
    bed: listing ? factField(listing.bed) : empty,
    cab: listing ? factField(listing.cab) : empty,
    cabBed: listing ? factField(formatCabBed(listing.cab, listing.bed)) : empty,
    tow: listing ? factField(listing.tow, formatLb) : empty,
    energy: formatEnergy(range, kwh),
    ask: formatAsk(unit?.askPrice),
    mpg: empty,
    kbbTradeIn: empty,
    drivetrain: listing ? factField(listing.drivetrain) : empty,
    cargo: listing ? factField(listing.cargoVolume ?? listing.cargo) : empty,
    source: listing?.id || null,
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

  const empty = { text: DASH, known: false }
  const energy = formatTankEnergy({
    tankRangeMi: intake?.tankRangeMi ?? pkg?.currentTankRangeMi,
    mpg: intake?.mpg ?? pkg?.currentMpg,
    tankGallons: intake?.tankGallons ?? pkg?.currentTankGallons,
  })
  const kbb = factField(intake?.kbbTradeIn ?? pkg?.currentKbbTradeIn)
  return {
    heading: 'Your current work vehicle',
    role,
    kind: 'Your current',
    bodyType: /van/i.test(role) ? 'van' : 'truck',
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
      source: null,
    },
  }
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
