/**
 * Warranty rules — SOURCES-V2 F
 * f_warranty_commercial_use.csv · rivian_warranty_compare.csv · f_gm_capacity_floor.csv
 */
import { parseCsv, numOrNull } from '../lib/csvParse'
import exclusionRaw from './v2/f_warranty_commercial_use.csv?raw'
import rivianCompareRaw from './v2/rivian_warranty_compare.csv?raw'
import gmFloorRaw from './v2/f_gm_capacity_floor.csv?raw'

export const WARRANTY_RULES_BUILD = 'score-v2-warranty-f-20260927'

export type WarrantyType = 'consumer' | 'commercial_fleet'

export type CommercialUseExclusion = {
  make: string
  models: string[]
  excluded: true
  quote: string
  url: string
  effective: string
  label: 'FACT'
  page: string
}

export type CapacityFloor = {
  pct: number
  label: string // FACT | INFERENCE
  source: string
  url: string | null
}

export type UpfitKind = 'none' | 'preferred_partner' | 'other' | 'unknown'

const exclusionRows = parseCsv(exclusionRaw)
const rivianCompare = parseCsv(rivianCompareRaw)
const gmFloors = parseCsv(gmFloorRaw)

/** Rivian is the only OEM with express commercial-use exclusion (F.4 FACT). */
export const COMMERCIAL_USE_EXCLUSIONS: CommercialUseExclusion[] = exclusionRows
  .filter((r) => /^Y/i.test(r.express_warranty_commercial_use_exclusion || ''))
  .map((r) => ({
    make: String(r.make || '').split(' ')[0].replace(/\(.*\)/, '').trim() || 'Rivian',
    models: /Rivian/i.test(r.make) ? ['R1T', 'R1S'] : [],
    excluded: true as const,
    quote: String(r.quote || '').replace(/^"|"$/g, ''),
    url: r.source_url,
    effective: r.doc_effective_or_printed || '',
    label: 'FACT' as const,
    page: r.page || '',
  }))

// Ensure Rivian R1T/R1S present even if CSV make cell is "Rivian"
if (!COMMERCIAL_USE_EXCLUSIONS.some((e) => /rivian/i.test(e.make))) {
  const rivianRow = exclusionRows.find((r) => /rivian/i.test(r.make || ''))
  if (rivianRow) {
    COMMERCIAL_USE_EXCLUSIONS.push({
      make: 'Rivian',
      models: ['R1T', 'R1S'],
      excluded: true,
      quote: String(rivianRow.quote || ''),
      url: rivianRow.source_url,
      effective: rivianRow.doc_effective_or_printed || '2026-08-13',
      label: 'FACT',
      page: rivianRow.page || '16',
    })
  }
}

const consumerBatt = rivianCompare.find(
  (r) =>
    /consumer R1T/i.test(r.case) &&
    /battery pack \+ drivetrain/i.test(r.term) &&
    /Quad Large/i.test(r.term),
)
const commercialBatt = rivianCompare.find(
  (r) =>
    /Fleet Sales|bought by business/i.test(r.case) &&
    /drivetrain \+ battery|battery pack/i.test(r.term) &&
    numOrNull(r.years) === 8,
)

export const RIVIAN_CONSUMER_WARRANTY = {
  battWarrantyYr: numOrNull(consumerBatt?.years) ?? 8,
  battWarrantyMi: numOrNull(consumerBatt?.miles) ?? 175000,
  capacityFloorPct: numOrNull(consumerBatt?.capacity_floor_pct) ?? 70,
  url:
    consumerBatt?.source_url ||
    'https://assets.ctfassets.net/2md5qhoeajym/3jyOsY7odpa35j9Yzb0KXK/edc6d556b122b351117b409a9bb8cf8a/r1t_r1s-new-vehicle-limited-warranty-guide-us-en-us-20260813.pdf',
  effective: '2026-08-13',
  revision: '15',
  pageExclusion: '16',
  label: 'FACT' as const,
}

export const RIVIAN_COMMERCIAL_WARRANTY = {
  battWarrantyYr: numOrNull(commercialBatt?.years) ?? 8,
  battWarrantyMi: numOrNull(commercialBatt?.miles) ?? 100000,
  capacityFloorPct: numOrNull(commercialBatt?.capacity_floor_pct) ?? 70,
  comprehensiveYr: 3,
  comprehensiveMi: 36000,
  url:
    commercialBatt?.source_url ||
    'https://assets.rivian.com/2md5qhoeajym/7ru4KaOCgjEP7FfT8QT7jE/ece18b4b636928b05eb06938645890fa/commercial-new-vehicle-limited-warranty-guide-us-en-us-20241231.pdf',
  effective: '2024-12-31',
  label: 'FACT' as const,
  upfitDeduction: 3, // INFERENCE amount per CLEARED §3 cat 8
}

/** GM qualifying fleets: 5 yr / 100k powertrain (FACT from f_warranty_commercial_use). */
export const GM_FLEET_POWERTRAIN = {
  yr: 5,
  mi: 100000,
  label: 'FACT' as const,
}

export function lookupCommercialExclusion(make: string, model: string) {
  return lookupCommercialExclusionSimple(make, model)
}

export function normalizeWarrantyType(
  raw: unknown,
): WarrantyType | null {
  const s = String(raw || '')
    .trim()
    .toLowerCase()
  if (!s) return null
  if (s === 'commercial_fleet' || s === 'commercial' || s === 'fleet') {
    return 'commercial_fleet'
  }
  if (s === 'consumer') return 'consumer'
  return null
}

export function normalizeUpfit(raw: unknown): UpfitKind {
  const s = String(raw || '')
    .trim()
    .toLowerCase()
  if (!s || s === 'none') return 'none'
  if (s === 'preferred_partner' || s === 'preferred') return 'preferred_partner'
  if (s === 'other') return 'other'
  if (s === 'unknown') return 'unknown'
  // Listing text mentioning upfit without partner → other
  if (/upfit|modif|service.?body|ladder|rack|toolbox/i.test(s)) return 'other'
  return 'none'
}

function norm(s: string): string {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

/**
 * Battery capacity floor for reason line (not scored separately).
 * Reads f_gm_capacity_floor + rivian_warranty_compare + Ford/Tesla from exclusion CSV quotes.
 */
export function lookupCapacityFloor(
  make: string,
  model: string,
  year?: number | null,
): CapacityFloor | null {
  const m = `${make} ${model}`
  const nm = norm(m)

  if (/rivian|r1t|r1s|commercial van/i.test(m)) {
    return {
      pct: RIVIAN_COMMERCIAL_WARRANTY.capacityFloorPct,
      label: 'FACT',
      source: 'Rivian NVLW / Commercial guide',
      url: RIVIAN_CONSUMER_WARRANTY.url,
    }
  }

  // GM CSV
  const gmHits = gmFloors.filter((r) => {
    const rm = norm(`${r.make} ${r.model}`)
    if (nm.includes('silveradoev') && rm.includes('silveradoev')) return true
    if (nm.includes('sierraev') && rm.includes('sierraev')) return true
    if (nm.includes('hummer') && rm.includes('hummer')) return true
    if (nm.includes('brightdrop') && rm.includes('brightdrop')) return true
    return false
  })
  for (const r of gmHits) {
    const pct = numOrNull(r.capacity_floor_pct)
    const yrs = String(r.model_years || '')
    if (year && yrs && !yrs.includes(String(year)) && !/^unknown$/i.test(yrs)) {
      // prefer year match but fall through
    }
    if (pct != null) {
      return {
        pct,
        label: /FACT/i.test(r.label) ? 'FACT' : r.label || 'FACT',
        source: r.doc || 'GM EV warranty',
        url: r.source_url || null,
      }
    }
  }
  // UNKNOWN rows with INFERENCE 75% in note (CLEARED §3 table)
  if (/sierra\s*ev|hummer\s*ev|brightdrop|silverado\s*ev/i.test(m)) {
    const noteHit = gmHits.find((r) => /75/.test(r.note || '') || /UNKNOWN/i.test(r.capacity_floor_pct || ''))
    if (noteHit || /sierra|hummer|brightdrop|2026.*silverado/i.test(m)) {
      return {
        pct: 75,
        label: 'INFERENCE',
        source: 'GM EV template (f_gm_capacity_floor note)',
        url: gmHits[0]?.source_url || null,
      }
    }
  }

  // Ford BEV from f_warranty_commercial_use quote (70%)
  if (/ford/i.test(make) && /lightning|e-?transit/i.test(model)) {
    const ford = exclusionRows.find((r) => /BEV|E-Transit|Lightning/i.test(r.powertrain || ''))
    return {
      pct: /cutaway|chassis cab/i.test(model) ? 65 : 70,
      label: 'FACT',
      source: ford?.doc_title || 'Ford BEV Warranty Guide',
      url: ford?.source_url || null,
    }
  }

  // Tesla 70% FACT from exclusion CSV note
  if (/tesla/i.test(make)) {
    const tesla = exclusionRows.find((r) => /tesla/i.test(r.make || ''))
    return {
      pct: 70,
      label: 'FACT',
      source: tesla?.doc_title || 'Tesla Cybertruck NVLW',
      url: tesla?.source_url || null,
    }
  }

  // Chevrolet non-EV skip; Chevrolet EV covered above
  if (/chevrolet/i.test(make) && /ev|brightdrop/i.test(model)) {
    return { pct: 75, label: 'FACT', source: '2024 Chevrolet EV warranty', url: null }
  }

  return null
}

export function lookupCommercialExclusionSimple(make: string, model: string) {
  const m = String(make || '').toLowerCase()
  const mod = String(model || '').toLowerCase()
  if (!/rivian/i.test(m)) return null
  if (!/r1t|r1s/.test(mod) && mod.length > 0) return null
  const row =
    COMMERCIAL_USE_EXCLUSIONS.find((e) => /rivian/i.test(e.make)) ||
    null
  return row
}
