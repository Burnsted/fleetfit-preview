/**
 * Warranty rules — G-final
 * used_ev_commercial_warranty.csv · f_warranty_commercial_use.csv · rivian_warranty_compare.csv
 */
import { parseCsv, numOrNull } from '../lib/csvParse'
import exclusionRaw from './v2/f_warranty_commercial_use.csv?raw'
import rivianCompareRaw from './v2/rivian_warranty_compare.csv?raw'
import gmFloorRaw from './v2/f_gm_capacity_floor.csv?raw'
import usedEvRaw from './v2/used_ev_commercial_warranty.csv?raw'

export const WARRANTY_RULES_BUILD = 'score-v2-warranty-g-final-20260927'

/** G-final enum: commercial | consumer | unconfirmed */
export type WarrantyType = 'commercial' | 'consumer' | 'unconfirmed'

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
  pct: number | null
  label: string // FACT | INFERENCE | NONE
  source: string
  url: string | null
  /** Candidate gets −2 when NONE or INFERENCE (shrink-the-lead). */
  deductCandidate: boolean
}

export type UpfitKind = 'none' | 'preferred_partner' | 'other' | 'unknown'

const exclusionRows = parseCsv(exclusionRaw)
const rivianCompare = parseCsv(rivianCompareRaw)
const gmFloors = parseCsv(gmFloorRaw)
const usedEvRows = parseCsv(usedEvRaw)

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
  /** G-final: −6 of 20 */
  upfitDeduction: 6,
}

export const GM_FLEET_POWERTRAIN = {
  yr: 5,
  mi: 100000,
  label: 'FACT' as const,
}

/** Capacity-floor modifier −2 of 20 (G-final). */
export const CAPACITY_FLOOR_DEDUCTION = 2

export function lookupCommercialExclusion(make: string, model: string) {
  return lookupCommercialExclusionSimple(make, model)
}

export function normalizeWarrantyType(raw: unknown): WarrantyType {
  const s = String(raw || '')
    .trim()
    .toLowerCase()
  if (s === 'commercial_fleet' || s === 'commercial' || s === 'fleet') {
    return 'commercial'
  }
  if (s === 'consumer') return 'consumer'
  return 'unconfirmed'
}

/** warranty_type only matters for Rivian R1T, Hummer Edition 1, VW MY2025 EV HV, Tesla note. */
export function warrantyTypeMatters(make: string, model: string): boolean {
  const m = `${make} ${model}`.toLowerCase()
  if (/rivian/.test(m) && /r1t|r1s/.test(m)) return true
  if (/hummer/.test(m) && /edition\s*1|edition1/.test(m)) return true
  if (/volkswagen|vw/.test(m)) return true
  return false
}

export function normalizeUpfit(raw: unknown): UpfitKind {
  const s = String(raw || '')
    .trim()
    .toLowerCase()
  if (!s || s === 'none') return 'none'
  if (s === 'preferred_partner' || s === 'preferred') return 'preferred_partner'
  if (s === 'other') return 'other'
  if (s === 'unknown') return 'unknown'
  if (/upfit|modif|service.?body|ladder|rack|toolbox/i.test(s)) return 'other'
  return 'none'
}

function norm(s: string): string {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

export function lookupCapacityFloor(
  make: string,
  model: string,
  year?: number | null,
): CapacityFloor | null {
  const m = `${make} ${model}`
  const nm = norm(m)

  // ProMaster EV: NONE (FACT) → deduct candidate
  if (/promaster/.test(nm) && /ev/.test(nm)) {
    const row = usedEvRows.find((r) => /promaster/i.test(r.model || ''))
    return {
      pct: null,
      label: 'NONE',
      source: row?.warranty_doc || 'Ram Heavy Duty Gas/Diesel/EV Warranty',
      url: row?.doc_url || null,
      deductCandidate: true,
    }
  }

  if (/rivian|r1t|r1s/.test(nm) && !/commercial|edv|van/.test(nm)) {
    return {
      pct: RIVIAN_CONSUMER_WARRANTY.capacityFloorPct,
      label: 'FACT',
      source: 'Rivian NVLW',
      url: RIVIAN_CONSUMER_WARRANTY.url,
      deductCandidate: false,
    }
  }
  if (/rivian/.test(nm) && /commercial|van|edv/.test(nm)) {
    return {
      pct: 70,
      label: 'INFERENCE',
      source: 'Rivian Commercial guide (van floor INFERENCE)',
      url: RIVIAN_COMMERCIAL_WARRANTY.url,
      deductCandidate: true,
    }
  }

  // Ford BEV FACT 70%
  if (/ford/i.test(make) && /lightning|e-?transit/i.test(model)) {
    return {
      pct: /cutaway|chassis cab/i.test(model) ? 65 : 70,
      label: 'FACT',
      source: 'Ford BEV Warranty Guide',
      url:
        usedEvRows.find((r) => /Lightning|E-Transit/i.test(r.model || ''))?.doc_url || null,
      deductCandidate: false,
    }
  }

  // Silverado EV 2024 FACT 75%; 2026 INFERENCE
  if (/silveradoev/.test(nm)) {
    if (year != null && year >= 2026) {
      return {
        pct: 75,
        label: 'INFERENCE',
        source: 'GM EV template (2026 Silverado EV)',
        url: null,
        deductCandidate: true,
      }
    }
    return {
      pct: 75,
      label: 'FACT',
      source: '2024 Chevrolet EV Limited Warranty',
      url:
        usedEvRows.find((r) => /Silverado/i.test(r.model || ''))?.doc_url || null,
      deductCandidate: false,
    }
  }

  // Sierra / Hummer / BrightDrop → 75% INFERENCE → deduct candidate
  if (/sierraev|hummer|brightdrop/.test(nm)) {
    return {
      pct: 75,
      label: 'INFERENCE',
      source: 'GMC/BrightDrop EV booklet not retrieved (INFERENCE 75%)',
      url: gmFloors[0]?.source_url || null,
      deductCandidate: true,
    }
  }

  if (/tesla/i.test(make)) {
    return {
      pct: 70,
      label: 'FACT',
      source: 'Tesla Cybertruck NVLW',
      url: usedEvRows.find((r) => /tesla/i.test(r.make || ''))?.doc_url || null,
      deductCandidate: false,
    }
  }

  return null
}

export function lookupCommercialExclusionSimple(make: string, model: string) {
  const m = String(make || '').toLowerCase()
  const mod = String(model || '').toLowerCase()
  if (!/rivian/i.test(m)) return null
  if (!/r1t|r1s/.test(mod) && mod.length > 0) return null
  return COMMERCIAL_USE_EXCLUSIONS.find((e) => /rivian/i.test(e.make)) || null
}

/** Default batt warranty terms for preview EVs (8/100k) when OEM merge lacks them. */
export function defaultEvBattTerms(make: string, model: string): {
  yr: number
  mi: number
} | null {
  const m = `${make} ${model}`.toLowerCase()
  if (/tesla|cybertruck/.test(m)) return { yr: 8, mi: 150000 }
  if (/rivian/.test(m) && /r1t|r1s/.test(m)) return { yr: 8, mi: 175000 }
  if (/lightning|e-?transit|silverado\s*ev|sierra\s*ev|brightdrop|promaster\s*ev|hummer/.test(m)) {
    return { yr: 8, mi: 100000 }
  }
  return null
}
