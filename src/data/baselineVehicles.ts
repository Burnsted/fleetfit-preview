/**
 * Current (replaced) vehicles — SOURCES-V2 C.
 * payloadLb / towLb / seats / serviceDistance = null until Sherlock adds them
 * (null fields light up automatically when CSV rows gain values — no code change).
 */
import { parseCsv, numOrNull, isFactLabel } from '../lib/csvParse'
import specsRaw from './v2/c_baseline_specs.csv?raw'
import tankRaw from './v2/c_baseline_fuel_tank.csv?raw'
import retainedRaw from './v2/c_retained_value.csv?raw'
import recallRaw from './v2/c_baseline_recall_complaint_counts.csv?raw'
import failRaw from './v2/c_baseline_failures.csv?raw'
import vansRaw from './v2/c_baseline_vans.csv?raw'
import maintRaw from './v2/c_maintenance.csv?raw'

export const BASELINE_VEHICLES_BUILD = 'score-v2-baseline-20260927'

export type RetainedEntry = {
  value: number
  source: string
  basis: string
  url: string
  label: string
  horizonYr: number
}

export type FailurePattern = {
  pattern: string
  modelYears: string
  evidenceType: string
  detail: string
  label: string
  url: string
  counts: boolean // true = FACT sourced failure pattern for scoring
}

export type BaselineVehicle = {
  year: number
  make: string
  model: string
  engine: string
  drivetrain: string
  transmission: string
  epaCombMpg: number | null
  epaFuel: string
  fuelTankGal: number | null
  powertrainWarrantyYr: number | null
  powertrainWarrantyMi: number | null
  feId: string
  epaSourceUrl: string
  warrantySourceUrl: string
  retained3yrPct: RetainedEntry[]
  recallCampaignsMy: number | null
  recallUrl: string | null
  failurePatterns: FailurePattern[]
  maintClass: 'half-ton' | 'midsize' | 'van' | null
  /** Gaps — null until sourced */
  payloadLb: number | null
  towLb: number | null
  seats: number | null
  serviceDistanceMi: number | null
  bodyType: 'truck' | 'van'
  fuellyMpg: number | null
  fuellyUrl: string | null
  fuellyLabel: string | null
  label: string
}

const tanks = parseCsv(tankRaw)
const retained = parseCsv(retainedRaw)
const recalls = parseCsv(recallRaw)
const failures = parseCsv(failRaw)
const vans = parseCsv(vansRaw)
const maint = parseCsv(maintRaw)

function tankFor(make: string, model: string, year: number): { gal: number | null; url: string } {
  const hits = tanks.filter(
    (t) =>
      t.make.toLowerCase() === make.toLowerCase() &&
      t.model.toLowerCase() === model.toLowerCase(),
  )
  if (!hits.length) return { gal: null, url: '' }
  // Prefer exact year, else nearest year row
  const exact = hits.find((t) => Number(t.years) === year)
  const row = exact || hits[0]
  return { gal: numOrNull(row.fuel_tank_gal), url: row.source_url }
}

function retainedFor(make: string, model: string): RetainedEntry[] {
  return retained
    .filter(
      (r) =>
        r.make.toLowerCase() === make.toLowerCase() &&
        (r.model.toLowerCase() === model.toLowerCase() ||
          model.toLowerCase().includes(r.model.toLowerCase())),
    )
    .map((r) => ({
      value: numOrNull(r.retained_3yr_pct) as number,
      source: r.source,
      basis: r.basis_note || 'model-level',
      url: r.source_url,
      label: r.label,
      horizonYr: 3,
    }))
    .filter((e) => e.value != null && Number.isFinite(e.value))
}

function recallFor(year: number, make: string, model: string) {
  const hit = recalls.find(
    (r) =>
      Number(r.year) === year &&
      r.make.toLowerCase() === make.toLowerCase() &&
      (r.model.toLowerCase() === model.toLowerCase() ||
        r.model.toLowerCase().startsWith(model.toLowerCase()) ||
        model.toLowerCase().startsWith(r.model.toLowerCase().split(' ')[0])),
  )
  if (!hit) return { count: null as number | null, url: null as string | null }
  return { count: numOrNull(hit.recall_campaigns_api), url: hit.recall_api_url }
}

function yearInRange(year: number, range: string): boolean {
  const m = String(range || '').match(/(\d{4})\s*[-–]\s*(\d{4})/)
  if (m) return year >= Number(m[1]) && year <= Number(m[2])
  if (/(\d{4})\+/.test(range)) return year >= Number(RegExp.$1)
  return String(range).includes(String(year))
}

function failuresFor(year: number, make: string, model: string, engine: string): FailurePattern[] {
  return failures
    .filter((f) => {
      if (f.make.toLowerCase() !== make.toLowerCase()) return false
      if (!yearInRange(year, f.model_years)) return false
      const me = f.model_engine.toLowerCase()
      const mod = model.toLowerCase().replace(/\s+/g, '')
      if (mod.includes('f-150') || mod.includes('f150')) {
        return me.includes('f-150') || me.includes('f150')
      }
      return me.includes(model.toLowerCase().split(' ')[0])
    })
    .map((f) => {
      const label = f.label || ''
      // FACT TSB / CSP / recall-cluster; not INF alleged / complaint-keyword / CR survey
      const counts =
        /^FACT$/i.test(label.trim()) ||
        (/^FACT\b/i.test(label) &&
          !/alleged/i.test(label) &&
          !/INF/i.test(label) &&
          !/complaint/i.test(label))
      return {
        pattern: f.pattern,
        modelYears: f.model_years,
        evidenceType: f.evidence,
        detail: f.nhtsa_keyword_hits,
        label,
        url: f.source_url,
        counts,
        _engineHint: engine,
      }
    })
    .filter((f) => {
      if (/cam phaser/i.test(f.pattern)) {
        return /3\.5|ecoboost/i.test(engine)
      }
      // INF alleged rows already have counts=false
      return true
    })
    .map(({ _engineHint, ...rest }) => rest)
}

function maintClassFor(model: string, bodyType: 'truck' | 'van'): BaselineVehicle['maintClass'] {
  if (bodyType === 'van') return 'van'
  if (/tacoma|colorado/i.test(model)) return 'midsize'
  return 'half-ton'
}

function fuellyFor(year: number, make: string, model: string) {
  for (const v of vans) {
    if (v.make.toLowerCase() !== make.toLowerCase()) continue
    if (!model.toLowerCase().includes(v.model.toLowerCase().split('-')[0]) &&
        !v.model.toLowerCase().includes(model.toLowerCase().split(' ')[0])) {
      // Transit-250 / Transit-350 / ProMaster 2500
      const vm = v.model.toLowerCase()
      const mm = model.toLowerCase()
      if (!(mm.includes('transit') && vm.includes('transit')) &&
          !(mm.includes('promaster') && vm.includes('promaster'))) {
        continue
      }
      // Prefer exact size match
      if (vm.includes('350') && !mm.includes('350')) continue
      if (vm.includes('250') && mm.includes('350')) continue
    }
    // Parse Fuelly values like "2017 ~15.3 (n~25); 2018 ~13.6"
    const alt = v.alt_mpg || ''
    if (/UNKNOWN/i.test(alt) || !alt.trim()) {
      return { mpg: null as number | null, url: v.alt_mpg_source_url || null, label: v.alt_mpg_label || null, modelKey: v.model }
    }
    const yearHit = alt.match(new RegExp(`${year}\\s*[~≈]?\\s*(\\d+(?:\\.\\d+)?)`))
    if (yearHit) {
      return { mpg: Number(yearHit[1]), url: v.alt_mpg_source_url, label: v.alt_mpg_label, modelKey: v.model }
    }
    // highest captured for that model (shrinks candidate lead)
    const all = [...alt.matchAll(/(\d{4})\s*[~≈]?\s*(\d+(?:\.\d+)?)/g)].map((m) => ({
      y: Number(m[1]),
      mpg: Number(m[2]),
    }))
    if (all.length) {
      const topMpg = all.reduce((a, b) => (b.mpg > a.mpg ? b : a))
      return { mpg: topMpg.mpg, url: v.alt_mpg_source_url, label: v.alt_mpg_label, modelKey: v.model }
    }
    return { mpg: null, url: v.alt_mpg_source_url || null, label: v.alt_mpg_label || null, modelKey: v.model }
  }
  return { mpg: null, url: null, label: null, modelKey: null }
}

const SPEC_ROWS = parseCsv(specsRaw)

export const BASELINE_VEHICLES: BaselineVehicle[] = SPEC_ROWS.map((r) => {
  const year = Number(r.year)
  const make = r.make
  const model = r.model
  const tank = tankFor(make, model, year)
  const rec = recallFor(year, make, model)
  const bodyType: 'truck' | 'van' = /transit|promaster/i.test(model) ? 'van' : 'truck'
  const fuelly = bodyType === 'van' ? fuellyFor(year, make, model) : { mpg: null, url: null, label: null }
  return {
    year,
    make,
    model,
    engine: r.engine,
    drivetrain: r.drivetrain,
    transmission: r.transmission,
    epaCombMpg: numOrNull(r.comb_mpg),
    epaFuel: r.epa_fuel,
    fuelTankGal: tank.gal,
    powertrainWarrantyYr: numOrNull(r.powertrain_warranty_yr),
    powertrainWarrantyMi: numOrNull(r.powertrain_warranty_mi),
    feId: r.fe_id,
    epaSourceUrl: r.epa_source_url,
    warrantySourceUrl: r.warranty_source_url,
    retained3yrPct: retainedFor(make, model),
    recallCampaignsMy: rec.count,
    recallUrl: rec.url,
    failurePatterns: failuresFor(year, make, model, r.engine),
    maintClass: maintClassFor(model, bodyType),
    payloadLb: null,
    towLb: null,
    seats: null,
    serviceDistanceMi: null,
    bodyType,
    fuellyMpg: fuelly.mpg,
    fuellyUrl: fuelly.url,
    fuellyLabel: fuelly.label,
    label: r.label,
  }
})

/** AAA 2026 class maintenance ¢/mi (same-basis rule). */
export const MAINT_CLASS_AAA = {
  'ev-pickup': {
    cpm: 10.79,
    url: 'https://newsroom.aaa.com/wp-content/uploads/2026/09/8-YDC-Brochure_2026-1.pdf',
    label: 'FACT/INFERENCE',
    detail: 'AAA 2026 EV pickup 10.79¢/mi',
  },
  'half-ton': {
    cpm: 11.82,
    url: 'https://newsroom.aaa.com/wp-content/uploads/2026/09/8-YDC-Brochure_2026-1.pdf',
    label: 'FACT',
    detail: 'AAA 2026 half-ton pickup 11.82¢/mi',
  },
  midsize: {
    cpm: 11.26,
    url: 'https://newsroom.aaa.com/wp-content/uploads/2026/09/8-YDC-Brochure_2026-1.pdf',
    label: 'FACT',
    detail: 'AAA 2026 midsize pickup 11.26¢/mi',
  },
  argonneEv: {
    cpm: 6.1,
    url: 'https://publications.anl.gov/anlpubs/2021/05/167399.pdf',
    detail: 'Argonne scheduled-only BEV 6.1¢',
  },
  argonneIce: {
    cpm: 10.1,
    url: 'https://publications.anl.gov/anlpubs/2021/05/167399.pdf',
    detail: 'ICEV 10.1¢',
  },
} as const

export type CurrentLookup = {
  year?: number | string | null
  make?: string | null
  model?: string | null
  engine?: string | null
  drivetrain?: string | null
}

/**
 * Resolve baseline row. When engine/drivetrain missing and several match,
 * pick the row that shrinks the candidate's lead (highest EPA mpg).
 */
export function lookupBaseline(q: CurrentLookup): {
  vehicle: BaselineVehicle | null
  reasonNote: string | null
} {
  const year = q.year != null && q.year !== '' ? Number(q.year) : null
  const make = String(q.make || '').trim()
  const model = String(q.model || '').trim()
  if (!year || !make || !model) return { vehicle: null, reasonNote: null }

  let pool = BASELINE_VEHICLES.filter(
    (v) =>
      v.year === year &&
      v.make.toLowerCase() === make.toLowerCase() &&
      (v.model.toLowerCase() === model.toLowerCase() ||
        v.model.toLowerCase().replace('-', '') === model.toLowerCase().replace('-', '')),
  )
  if (!pool.length) {
    // soft model match (F150 vs F-150)
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
    pool = BASELINE_VEHICLES.filter(
      (v) => v.year === year && norm(v.make) === norm(make) && norm(v.model) === norm(model),
    )
  }
  if (!pool.length) return { vehicle: null, reasonNote: null }

  const eng = String(q.engine || '').trim()
  const drive = String(q.drivetrain || '').trim()
  let filtered = pool
  let reasonNote: string | null = null

  if (eng) {
    const e = eng.toLowerCase()
    const byEng = filtered.filter(
      (v) =>
        v.engine.toLowerCase().includes(e) ||
        e.includes(v.engine.toLowerCase().slice(0, 8)) ||
        (/3\.5|ecoboost/i.test(e) && /3\.5|ecoboost/i.test(v.engine)) ||
        (/5\.0/i.test(e) && /5\.0/i.test(v.engine)),
    )
    if (byEng.length) filtered = byEng
  }
  if (drive) {
    const d = drive.toLowerCase().replace(/\s+/g, '')
    const byD = filtered.filter((v) => {
      const vd = v.drivetrain.toLowerCase().replace(/\s+/g, '')
      if (d.includes('4x4') || d.includes('4wd')) return vd.includes('4x4') || vd.includes('4wd')
      if (d.includes('4x2') || d.includes('2wd')) return vd.includes('4x2') || vd.includes('2wd')
      return vd.includes(d)
    })
    if (byD.length) filtered = byD
  }

  // Prefer primary_row when available — re-check from raw
  // Shrink candidate lead: highest mpg
  if (!eng || !drive) {
    filtered = [...filtered].sort(
      (a, b) => (b.epaCombMpg || 0) - (a.epaCombMpg || 0),
    )
    const top = filtered[0]
    if (!eng && top) {
      reasonNote = `engine not entered; highest published mpg for ${year} ${make} ${model} used`
    }
  }

  // Prefer Regular fuel primary when tied
  const primary = filtered.find((v) => /regular/i.test(v.epaFuel)) || filtered[0]
  return { vehicle: primary || null, reasonNote }
}

/** Convenience: AAA half-ton from c_maintenance.csv (sanity). */
export const AAA_HALF_TON_FROM_CSV = (() => {
  const row = maint.find((r) => /half-ton/i.test(r.class) && numOrNull(r.value_cents_per_mi) != null)
  return row ? numOrNull(row.value_cents_per_mi) : 11.82
})()
