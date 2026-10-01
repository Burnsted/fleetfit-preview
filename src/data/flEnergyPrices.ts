/**
 * FL energy prices — SOURCES-V2 section D · data-v2/d_fl_energy_prices.csv
 * Static with as_of + url per row (no live fetch in preview).
 */
import { parseCsv, numOrNull } from '../lib/csvParse'
import raw from './v2/d_fl_energy_prices.csv?raw'

export type EnergyPriceRow = {
  item: string
  value: number | null
  unit: string
  period: string
  asOf: string
  source: string
  url: string
  label: string
}

const rows = parseCsv(raw).map((r) => ({
  item: r.item,
  value: numOrNull(r.value),
  unit: r.unit,
  period: r.period,
  asOf: r.as_of,
  source: r.source,
  url: r.url,
  label: r.label,
})) as EnergyPriceRow[]

function byItem(item: string): EnergyPriceRow | null {
  return rows.find((r) => r.item === item) || null
}

export const FL_ENERGY_PRICES_BUILD = 'score-v2-fl-energy-20260927'

/** EIA EPM Table 5.6.A — FL commercial ¢/kWh (July 2026) */
export const FL_COMMERCIAL_ELECTRICITY = byItem('electricity_commercial_avg')

/** AAA FL regular $/gal as of 9/27/26 */
export const FL_GAS_REGULAR_AAA = byItem('gasoline_regular_aaa')

/** AAA FL diesel $/gal as of 9/27/26 */
export const FL_DIESEL_AAA = byItem('diesel_aaa')

export function getFlEnergyPrice(item: string): EnergyPriceRow | null {
  return byItem(item)
}

export const FL_ENERGY_PRICE_ROWS = rows
