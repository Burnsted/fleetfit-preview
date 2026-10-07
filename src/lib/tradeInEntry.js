/**
 * Typed-in trade-in values per current vehicle (CLEARED-FOR-WOZ trade-in entry).
 * No KBB numbers are fetched, scraped, or shown. User types the estimate.
 */

export const TRADE_IN_STORAGE_KEY = 'fleetfit-trade-in-entries'
export const TRADE_IN_ENTRY_BUILD = 'trade-in-entry-20261002'

/** Confirmed 200 with browser UA — Instant Used Car Value page. No query string. */
export const KBB_LOOKUP_HREF = 'https://www.kbb.com/whats-my-car-worth/'
export const KBB_LOOKUP_LABEL = 'Look up on KBB'
export const KBB_LOOKUP_REL = 'noopener noreferrer'
export const KBB_LOOKUP_TARGET = '_blank'
export const KBB_LOOKUP_HELP =
  'Opens kbb.com in a new tab. Type the range you see there into this row.'

export const ESTIMATE_NOT_QUOTE = 'Estimate, not a quote'
export const DOLLAR_AMOUNT_ERROR = 'Enter a dollar amount.'
export const ADD_SOURCE_AND_DATE = 'Add source and date'
export const ENTERED_FOR_LABEL = (n, m) => `Entered for ${n} of ${m} vehicles.`

export const CONDITION_OPTIONS = ['Excellent', 'Good', 'Fair', 'Poor']

export const EMPTY_TRADE_IN_ROW = Object.freeze({
  year: '',
  make: '',
  model: '',
  mileage: '',
  condition: '',
  value: '',
  source: '',
  date: '',
  label: '',
})

/** Labeled Example demo rows for the default starting state (no intake vehicle). */
export const EXAMPLE_TRADE_IN_SEEDS = Object.freeze([
  Object.freeze({
    year: '2018',
    make: 'Ford',
    model: 'Transit-250',
    mileage: '48000',
    condition: 'Good',
    value: '12500',
    source: 'Example',
    date: '2026-10-01',
    label: 'Example',
  }),
  Object.freeze({
    year: '2019',
    make: 'Chevrolet',
    model: 'Silverado 1500',
    mileage: '67000',
    condition: 'Good',
    value: '14500',
    source: 'Example',
    date: '2026-10-01',
    label: 'Example',
  }),
])

export function createEmptyTradeInRow() {
  return { ...EMPTY_TRADE_IN_ROW }
}

export function createTradeInRows(count) {
  const n = Math.max(0, Math.min(5, Number(count) || 0))
  return Array.from({ length: n }, () => createEmptyTradeInRow())
}

/** Default demo trade-in rows: each labeled Example with year/make/model/miles/value. */
export function createExampleTradeInRows(count) {
  const n = Math.max(0, Math.min(5, Number(count) || 0))
  return Array.from({ length: n }, (_, i) => {
    const seed =
      EXAMPLE_TRADE_IN_SEEDS[i] ||
      EXAMPLE_TRADE_IN_SEEDS[EXAMPLE_TRADE_IN_SEEDS.length - 1]
    return {
      ...createEmptyTradeInRow(),
      year: seed.year,
      make: seed.make,
      model: seed.model,
      mileage: seed.mileage,
      condition: seed.condition,
      value: seed.value,
      source: seed.source,
      date: seed.date,
      label: 'Example',
    }
  })
}

/**
 * Pull year / make / model / mileage from intake current-vehicle fields.
 * Returns null when intake has no vehicle identity (do not invent).
 */
export function tradeInSeedFromIntake(intake) {
  if (!intake || typeof intake !== 'object') return null
  const cur = intake.current && typeof intake.current === 'object' ? intake.current : {}
  const year = cur.year ?? intake.currentYear
  const make = cur.make ?? intake.currentMake
  const model =
    cur.model ??
    intake.currentModel ??
    (intake.tradeIn === 'Yes' ? intake.tradeInModel : null)
  const mileage = cur.miles ?? intake.currentMiles
  const hasAny = [year, make, model, mileage].some(
    (v) => v != null && String(v).trim() !== '',
  )
  if (!hasAny) return null
  return {
    year: year != null && String(year).trim() !== '' ? String(year).trim() : '',
    make: make != null && String(make).trim() !== '' ? String(make).trim() : '',
    model: model != null && String(model).trim() !== '' ? String(model).trim() : '',
    mileage:
      mileage != null && String(mileage).trim() !== '' ? String(mileage).trim() : '',
  }
}

/**
 * Create trade-in rows for a package open.
 * No intake vehicle → labeled Example demo rows (default starting state).
 * Intake vehicle identity prefills row 1 only; remaining rows stay blank.
 */
export function createTradeInRowsFromIntake(count, intake) {
  const seed = tradeInSeedFromIntake(intake)
  if (!seed) return createExampleTradeInRows(count)
  const rows = createTradeInRows(count)
  if (rows.length === 0) return rows
  rows[0] = {
    ...rows[0],
    year: seed.year,
    make: seed.make,
    model: seed.model,
    mileage: seed.mileage,
  }
  return rows
}

export function resizeTradeInRows(rows, count) {
  const next = createTradeInRows(count)
  const prev = Array.isArray(rows) ? rows : []
  for (let i = 0; i < next.length; i += 1) {
    if (prev[i] && typeof prev[i] === 'object') {
      next[i] = {
        ...createEmptyTradeInRow(),
        year: String(prev[i].year ?? ''),
        make: String(prev[i].make ?? ''),
        model: String(prev[i].model ?? ''),
        mileage: String(prev[i].mileage ?? ''),
        condition: String(prev[i].condition ?? ''),
        value: String(prev[i].value ?? ''),
        source: String(prev[i].source ?? ''),
        date: String(prev[i].date ?? ''),
        label: String(prev[i].label ?? ''),
      }
    }
  }
  return next
}

/**
 * Parse a typed dollar amount.
 * Empty → { ok: true, value: null } (blank is allowed).
 * Valid non-negative finite → { ok: true, value: number }.
 * Negative or non-number → { ok: false, error: DOLLAR_AMOUNT_ERROR }.
 */
export function parseTradeInDollar(raw) {
  if (raw == null) return { ok: true, value: null }
  const trimmed = String(raw).trim()
  if (!trimmed) return { ok: true, value: null }
  const cleaned = trimmed.replace(/[$,\s]/g, '')
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) {
    return { ok: false, error: DOLLAR_AMOUNT_ERROR, value: null }
  }
  const n = Number(cleaned)
  if (!Number.isFinite(n) || n < 0) {
    return { ok: false, error: DOLLAR_AMOUNT_ERROR, value: null }
  }
  return { ok: true, value: n }
}

/** Confirmed positive trade-in dollar for package math (0 does not count). */
export function confirmedTradeInDollar(raw) {
  const parsed = parseTradeInDollar(raw)
  if (!parsed.ok || parsed.value == null) return null
  return parsed.value > 0 ? parsed.value : null
}

export function rowNeedsSourceDate(row) {
  if (!row) return false
  const dollars = confirmedTradeInDollar(row.value)
  if (dollars == null) return false
  const source = String(row.source ?? '').trim()
  const date = String(row.date ?? '').trim()
  return !source || !date
}

export function rowsMissingSourceDate(rows) {
  const list = Array.isArray(rows) ? rows : []
  const missing = []
  list.forEach((row, i) => {
    if (rowNeedsSourceDate(row)) missing.push(i + 1)
  })
  return missing
}

/** Plain-words note listing which vehicle rows lack source or date. */
export function missingSourceDateNote(rows) {
  const missing = rowsMissingSourceDate(rows)
  if (missing.length === 0) return ''
  if (missing.length === 1) {
    return `Source and date missing on vehicle ${missing[0]}.`
  }
  if (missing.length === 2) {
    return `Source and date missing on vehicle ${missing[0]} and vehicle ${missing[1]}.`
  }
  const head = missing.slice(0, -1).map((n) => `vehicle ${n}`).join(', ')
  const last = missing[missing.length - 1]
  return `Source and date missing on ${head}, and vehicle ${last}.`
}

/**
 * Sum typed values only when every row has a confirmed positive dollar.
 * Otherwise null (credit not confirmed).
 */
export function sumTradeInEntries(rows) {
  const list = Array.isArray(rows) ? rows : []
  if (list.length === 0) return null
  let sum = 0
  let count = 0
  for (const row of list) {
    const dollars = confirmedTradeInDollar(row?.value)
    if (dollars == null) return null
    sum += dollars
    count += 1
  }
  return count === list.length ? sum : null
}

export function countEnteredTradeInValues(rows) {
  const list = Array.isArray(rows) ? rows : []
  let n = 0
  for (const row of list) {
    if (confirmedTradeInDollar(row?.value) != null) n += 1
  }
  return n
}

/** Merge typed trade-in dollars onto package units by index for Package total. */
export function unitsWithTradeInValues(units, rows) {
  const list = Array.isArray(units) ? units : []
  const entries = Array.isArray(rows) ? rows : []
  return list.map((unit, i) => {
    const dollars = confirmedTradeInDollar(entries[i]?.value)
    if (dollars == null) {
      if (unit && Object.prototype.hasOwnProperty.call(unit, 'tradeInValue')) {
        const { tradeInValue: _drop, ...rest } = unit
        return rest
      }
      return unit
    }
    return { ...unit, tradeInValue: dollars }
  })
}

export function kbbLookupLinkProps() {
  return {
    href: KBB_LOOKUP_HREF,
    target: KBB_LOOKUP_TARGET,
    rel: KBB_LOOKUP_REL,
  }
}

export function readStoredTradeInRows(packageId) {
  if (!packageId) return null
  try {
    const raw = sessionStorage.getItem(TRADE_IN_STORAGE_KEY)
    if (!raw) return null
    const all = JSON.parse(raw)
    const entry = all?.[packageId]
    if (!entry || !Array.isArray(entry.rows)) return null
    return resizeTradeInRows(entry.rows, entry.rows.length)
  } catch {
    return null
  }
}

export function writeStoredTradeInRows(packageId, rows) {
  if (!packageId) return
  try {
    const raw = sessionStorage.getItem(TRADE_IN_STORAGE_KEY)
    const all = raw ? JSON.parse(raw) : {}
    all[packageId] = { rows: Array.isArray(rows) ? rows : [] }
    sessionStorage.setItem(TRADE_IN_STORAGE_KEY, JSON.stringify(all))
  } catch {
    /* ignore quota */
  }
}
