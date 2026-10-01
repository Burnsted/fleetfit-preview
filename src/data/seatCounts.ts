/**
 * Seat counts — SOURCES-V2 F · f_seat_counts.csv
 * Cab not entered → lowest seats_min across matching cabs.
 * Gas cargo vans → Not scored unless listing/VIN seats stated.
 */
import { parseCsv, numOrNull } from '../lib/csvParse'
import raw from './v2/f_seat_counts.csv?raw'

export const SEAT_COUNTS_BUILD = 'score-v2-seats-f-20260927'

export type SeatHit = {
  seats: number
  reasonLabel: string
  url: string | null
  label: string
  inference: boolean
}

type SeatRow = Record<string, string>
const ROWS: SeatRow[] = parseCsv(raw)

function norm(s: string): string {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function yearInRange(years: string, year: number): boolean {
  const m = String(years || '').match(/(\d{4})\s*[-–]\s*(\d{4})/)
  if (m) {
    const a = Number(m[1])
    const b = Number(m[2])
    return year >= a && year <= b
  }
  const single = String(years || '').match(/(\d{4})/g)
  if (single?.length === 1) return Number(single[0]) === year
  if (single?.length === 2) {
    return year >= Number(single[0]) && year <= Number(single[1])
  }
  return String(years || '').includes(String(year))
}

function isGasCargoVan(make: string, model: string): boolean {
  const m = `${make} ${model}`.toLowerCase()
  return (
    /transit-?250|transit-?350/.test(m) ||
    (/promaster/.test(m) && !/ev/.test(m))
  )
}

function cabMatch(rowCab: string, qCab: string | null | undefined): boolean {
  if (!qCab) return true
  const rc = String(rowCab || '').toLowerCase()
  const c = String(qCab).toLowerCase()
  if (c.includes('supercrew') || (c.includes('crew') && !c.includes('super'))) {
    return rc.includes('supercrew') || (rc.includes('crew') && !rc.includes('van'))
  }
  if (c.includes('supercab') || c.includes('extended') || c.includes('quad') || c.includes('double') || c.includes('access')) {
    return (
      rc.includes('supercab') ||
      rc.includes('extended') ||
      rc.includes('quad') ||
      rc.includes('double') ||
      rc.includes('access')
    )
  }
  if (c.includes('regular')) return rc.includes('regular')
  return rc.includes(c.split(' ')[0]) || c.includes(rc.split(' ')[0])
}

function modelMatch(rowModel: string, qModel: string): boolean {
  const a = norm(rowModel)
  const b = norm(qModel)
  if (a === b) return true
  if (a.includes(b) || b.includes(a)) return true
  // Silverado EV / Sierra EV / Hummer
  if (b.includes('silveradoev') && a.includes('silveradoev')) return true
  if (b.includes('sierraev') && a.includes('sierraev')) return true
  if (b.includes('hummer') && a.includes('hummer')) return true
  if (b.includes('brightdrop') && a.includes('brightdrop')) return true
  if (b.includes('lightning') && a.includes('lightning')) return true
  if (b.includes('etransit') && a.includes('etransit')) return true
  if (b.includes('promasterev') && a.includes('promasterev')) return true
  if (b.includes('cybertruck') && a.includes('cybertruck')) return true
  if (b === 'r1t' && a === 'r1t') return true
  return false
}

export function lookupSeats(opts: {
  year: number
  make: string
  model: string
  cab?: string | null
  listingSeats?: number | null
  side?: 'candidate' | 'current'
}): SeatHit | null {
  const { year, make, model, cab, listingSeats, side = 'candidate' } = opts

  if (listingSeats != null && Number.isFinite(listingSeats)) {
    return {
      seats: listingSeats,
      reasonLabel: `${listingSeats} seats (listing)`,
      url: null,
      label: 'listing',
      inference: false,
    }
  }

  // G-final: 2018 Transit-250 cargo = 2 seats FACT (Ford brochure / g_gaps item 3)
  if (isGasCargoVan(make, model)) {
    if (
      year === 2018 &&
      /ford/i.test(make) &&
      /transit-?250/i.test(model)
    ) {
      return {
        seats: 2,
        reasonLabel: '2 seats (Ford 2018 Transit brochure)',
        url: 'https://cdn.dealereprocess.org/cdn/brochures/ford/2018-transit.pdf',
        label: 'FACT',
        inference: false,
      }
    }
    return null // Not scored: seating not published for this van
  }

  const hits = ROWS.filter(
    (r) =>
      yearInRange(r.years, year) &&
      norm(r.make) === norm(make) &&
      modelMatch(r.model, model) &&
      numOrNull(r.seats_min) != null,
  )
  if (!hits.length) return null

  const cabFiltered = cab ? hits.filter((r) => cabMatch(r.cab_or_body, cab)) : hits
  const pool = cabFiltered.length ? cabFiltered : hits

  // E-Transit conflict: candidate uses lower (1 from cars.com conflict) per global rule
  const isETransit = /e-?transit/i.test(model)
  if (isETransit && side === 'candidate') {
    // Row has seats_min=2 with CONFLICT note about cars.com 1
    const row = pool[0]
    return {
      seats: 1,
      reasonLabel:
        '1 seat (cars.com) · Car and Driver / Edmunds 2; lower used for candidate',
      url: row?.source_url || null,
      label: row?.label || '',
      inference: false,
    }
  }

  // Lowest seats_min across matching cabs when cab not entered; within-cab use low
  let best: SeatRow | null = null
  let bestSeats = Infinity
  for (const r of pool) {
    const n = numOrNull(r.seats_min)
    if (n == null) continue
    if (n < bestSeats) {
      bestSeats = n
      best = r
    }
  }
  if (!best || !Number.isFinite(bestSeats)) return null

  const inference = /INFERENCE/i.test(best.label || '')
  const cabNote = cab
    ? String(best.cab_or_body || cab)
    : `lowest across ${make} ${model} cabs; cab not entered`
  const fromCars =
    /cars\.com/i.test(best.label || '') || /cars\.com/i.test(best.source_url || '')
  const reasonLabel = inference
    ? `${bestSeats} seats (estimate)`
    : `${bestSeats} seats (${fromCars ? 'cars.com' : 'sourced'}; ${cabNote})`

  return {
    seats: bestSeats,
    reasonLabel,
    url: best.source_url || null,
    label: best.label,
    inference,
  }
}

export function isGasCargoVanModel(make: string, model: string): boolean {
  return isGasCargoVan(make, model)
}
