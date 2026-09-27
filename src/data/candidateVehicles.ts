/**
 * Candidate EV score inputs — SOURCES-V2 A (R1T) + B (preview EVs).
 * Extends oemSpecs fields for scoring; null seats/service for non-Rivian light up later.
 */
import { parseCsv, numOrNull, isFactLabel } from '../lib/csvParse'
import r1tSpecs from './v2/a_r1t_specs.csv?raw'
import r1tDep from './v2/a_r1t_depreciation.csv?raw'
import r1tRecall from './v2/a_r1t_recall_complaint_counts.csv?raw'
import r1tFail from './v2/a_r1t_failure_patterns.csv?raw'
import previewSpecs from './v2/b_preview_ev_specs.csv?raw'
import previewRetained from './v2/b_retained_value.csv?raw'
import previewRecalls from './v2/b_preview_ev_recalls.csv?raw'
import type { RetainedEntry, FailurePattern } from './baselineVehicles'

export const CANDIDATE_VEHICLES_BUILD = 'score-v2-candidates-g-final-20260927'

export type CandidateVehicle = {
  year: number
  make: string
  model: string
  trim: string
  trimConfig: string
  bodyType: 'truck' | 'van'
  payloadLb: number | null
  towLb: number | null
  towLbNoWdh: number | null
  towLbWdh: number | null
  epaRangeMi: number | null
  rangeBasis: string | null // 'EPA' | 'OEM estimate…'
  epaKwhPer100mi: number | null
  /** Reason label for energy source (EPA vs third-party test). */
  energyBasis: string | null
  energyUrl: string | null
  usableKwh: number | null
  seats: number | null
  battWarrantyYr: number | null
  battWarrantyMi: number | null
  warrantyProgram: 'consumer' | 'commercial' | null
  retained3yrPct: RetainedEntry[]
  recallCampaignsMy: number | null
  recallUrl: string | null
  failurePatterns: FailurePattern[]
  maintClass: 'ev-pickup' | 'van' | null
  epaSourceUrl: string | null
  payloadSourceUrl: string | null
  towSourceUrl: string | null
  warrantySourceUrl: string | null
  label: string
}

function yearInRange(year: number, range: string): boolean {
  const m = String(range || '').match(/(\d{4})\s*[-–]\s*(\d{4})/)
  if (m) return year >= Number(m[1]) && year <= Number(m[2])
  return String(range).includes(String(year))
}

const r1tRetained: RetainedEntry[] = parseCsv(r1tDep)
  .filter((r) => Number(r.horizon_yr) === 3 && numOrNull(r.retained_pct) != null)
  .filter((r) => !/segment/i.test(r.basis))
  .map((r) => ({
    value: numOrNull(r.retained_pct) as number,
    source: r.source,
    basis: r.basis,
    url: r.source_url,
    label: r.label,
    horizonYr: 3,
  }))

const r1tRecalls = parseCsv(r1tRecall)
const r1tFailures = parseCsv(r1tFail)

function r1tFailuresFor(year: number): FailurePattern[] {
  return r1tFailures
    .filter((f) => yearInRange(year, f.model_years) || f.model_years === 'model-level')
    .map((f) => {
      const label = f.label || ''
      // FACT TSB / service program — not INF anecdotes, not CR survey, not complaint-keyword
      const counts =
        /^FACT$/i.test(label.trim()) ||
        (/FACT/i.test(label) &&
          /TSB|RCA|RSB|service program|customer-satisfaction/i.test(f.evidence_type + f.detail) &&
          !/complaint/i.test(label) &&
          !/INF/i.test(label) &&
          !/CR survey/i.test(label) &&
          !/Consumer Reports/i.test(f.evidence_type))
      // Only count TSB rows that are pure FACT
      const isTsb = /TSB/i.test(f.evidence_type)
      return {
        pattern: f.pattern,
        modelYears: f.model_years,
        evidenceType: f.evidence_type,
        detail: f.detail,
        label,
        url: f.source_url,
        counts: Boolean(isTsb && /^FACT$/i.test(label.trim())),
      }
    })
}

const R1T_ROWS: CandidateVehicle[] = parseCsv(r1tSpecs).map((r) => {
  const year = Number(r.year)
  const rec = r1tRecalls.find((x) => Number(x.year) === year)
  return {
    year,
    make: r.make,
    model: r.model,
    trim: r.trim_config,
    trimConfig: r.trim_config,
    bodyType: 'truck' as const,
    payloadLb: numOrNull(r.payload_lb),
    towLb: numOrNull(r.tow_lb_wdh),
    towLbNoWdh: numOrNull(r.tow_lb_no_wdh),
    towLbWdh: numOrNull(r.tow_lb_wdh),
    epaRangeMi: numOrNull(r.epa_range_mi),
    rangeBasis: 'EPA',
    epaKwhPer100mi: numOrNull(r.epa_kwh_per_100mi),
    energyBasis: 'EPA',
    energyUrl: r.epa_source_url || null,
    usableKwh: numOrNull(r.usable_kwh),
    seats: 5,
    battWarrantyYr: numOrNull(r.batt_warranty_yr),
    battWarrantyMi: numOrNull(r.batt_warranty_mi),
    warrantyProgram: 'consumer' as const,
    retained3yrPct: r1tRetained,
    recallCampaignsMy: rec ? numOrNull(rec.recall_campaigns_api) : null,
    recallUrl: rec?.recall_api_url || null,
    failurePatterns: r1tFailuresFor(year),
    maintClass: 'ev-pickup' as const,
    epaSourceUrl: r.epa_source_url,
    payloadSourceUrl: r.payload_source_url,
    towSourceUrl: r.tow_source_url,
    warrantySourceUrl: r.warranty_source_url,
    label: r.label,
  }
})

/** Count distinct NHTSA campaigns per MY from B recall rows.
 *  NONE_RETURNED (API 0) → count 0 (scored), not null (Not scored). */
/** G-final: ProMaster EV counts only 24V715 + 25V665. */
const PROMASTER_EV_CAMPAIGNS = new Set(['24V715000', '24V715', '25V665000', '25V665'])

function previewRecallCount(year: number, make: string, model: string) {
  const rows = parseCsv(previewRecalls).filter(
    (r) =>
      Number(r.year) === year &&
      r.make.toLowerCase() === make.toLowerCase() &&
      (r.model.toLowerCase().includes(model.toLowerCase()) ||
        model.toLowerCase().includes(r.model.toLowerCase().split(' ')[0])),
  )
  if (!rows.length) return { count: null as number | null, url: null as string | null }

  const noneReturned = rows.some((r) => r.nhtsa_campaign === 'NONE_RETURNED')
  let campaigns = new Set(
    rows
      .map((r) => r.nhtsa_campaign)
      .filter((c) => c && c !== 'NONE_RETURNED' && !/^n\/a$/i.test(c)),
  )
  if (/promaster/i.test(model) && /ev/i.test(model + make)) {
    campaigns = new Set(
      [...campaigns].filter((c) =>
        [...PROMASTER_EV_CAMPAIGNS].some(
          (id) =>
            String(c).replace(/000$/, '') === id.replace(/000$/, '') ||
            String(c).includes(id.replace(/000$/, '')),
        ),
      ),
    )
    // Force the two EV-confirmed campaigns when MY matches 2024–2025
    if (year >= 2024 && year <= 2025) {
      campaigns = new Set(['24V715000', '25V665000'])
    }
  }
  const url = rows[0]?.api_query_url || rows[0]?.recall_url || null
  if (campaigns.size > 0) return { count: campaigns.size, url }
  // FACT API returned 0 → score as 0 campaigns (not "not published")
  if (noneReturned) return { count: 0, url }
  return { count: null, url }
}

/** FACT customer-satisfaction / service programs counted as failure patterns (−1). */
function previewFailurePatterns(
  year: number,
  make: string,
  model: string,
): FailurePattern[] {
  // SOURCES-V2 B: BrightDrop MY2025 CSP N252502891 (EDM / differential nut) — not a recall
  if (
    year === 2025 &&
    /chevrolet|brightdrop/i.test(make + model) &&
    /brightdrop/i.test(model)
  ) {
    return [
      {
        counts: true,
        pattern: 'N252502891 rear EDM / differential nut',
        modelYears: '2025',
        evidenceType: 'CSP',
        detail:
          'GM Customer Satisfaction Program N252502891 — rear electric drive module (differential nut may be cross-threaded or missing)',
        label: 'FACT',
        url: 'https://gmauthority.com/blog/2025/08/some-chevy-brightdrop-units-need-an-electric-drive-transmission-module-replacement/',
      },
    ]
  }
  return []
}

/**
 * G-final energy kWh/100 mi (EPA combE or third-party van tests).
 * Shrink-the-lead: higher kWh/100 when trim unknown.
 */
function energyForPreview(
  year: number,
  make: string,
  model: string,
  trim: string,
): { kwh: number | null; basis: string | null; url: string | null } {
  const m = `${make} ${model} ${trim}`.toLowerCase()
  // Third-party vans
  if (/e-?transit/.test(m)) {
    return {
      kwh: 71.4,
      basis:
        '1.4 mi/kWh; EV Pulse highway 70 mph, max GVWR, ~40°F · note 1.2 mi/kWh stop-and-go/heater not used for FL',
      url: 'https://www.evpulse.com/features/we-test-the-range-of-the-ford-e-transit-at-maximum-payload',
    }
  }
  if (/promaster/.test(m) && /ev/.test(m)) {
    return {
      kwh: 50.1,
      basis: 'Motor Illustrated, ~800 lb load (2025-08-17)',
      url: 'https://motorillustrated.com/2025-chevrolet-brightdrop-vs-ford-e-transit-vs-mercedes-benz-esprinter-vs-ram-promaster-ev-big-batteries-bigger-jobs-real-world-testing-of-new-electric-commercial-vans/158742/',
    }
  }
  if (/brightdrop/.test(m)) {
    return {
      kwh: 67.1,
      basis: 'Motor Illustrated, >1,700 lb load (2025-08-17)',
      url: 'https://motorillustrated.com/2025-chevrolet-brightdrop-vs-ford-e-transit-vs-mercedes-benz-esprinter-vs-ram-promaster-ev-big-batteries-bigger-jobs-real-world-testing-of-new-electric-commercial-vans/158742/',
    }
  }
  // EPA combE (Sherlock) — higher when trim unknown
  if (/sierra\s*ev/.test(m)) {
    if (/ext|extended/.test(m)) return { kwh: 52.4, basis: 'EPA', url: 'https://www.fueleconomy.gov/ws/rest/vehicle/49659' }
    return { kwh: 50.3, basis: 'EPA', url: 'https://www.fueleconomy.gov/ws/rest/vehicle/49660' }
  }
  if (/silverado\s*ev/.test(m)) {
    if (year >= 2026) return { kwh: 50.3, basis: 'EPA', url: 'https://www.fueleconomy.gov/ws/rest/vehicle/49643' }
    // WT: 50.5 / 53.4 — higher (less favorable) when trim unknown
    return { kwh: 53.4, basis: 'EPA', url: 'https://www.fueleconomy.gov/ws/rest/vehicle/46946' }
  }
  if (/lightning/.test(m)) {
    if (/platinum|er|extended/.test(m)) return { kwh: 50.7, basis: 'EPA', url: 'https://www.fueleconomy.gov/ws/rest/vehicle/45316' }
    // SR Pro default
    return { kwh: 49.4, basis: 'EPA', url: 'https://www.fueleconomy.gov/ws/rest/vehicle/45318' }
  }
  if (/cybertruck/.test(m)) {
    return { kwh: 42.9, basis: 'EPA', url: 'https://www.fueleconomy.gov/ws/rest/vehicle/49123' }
  }
  return { kwh: null, basis: null, url: null }
}

/** Shrink-the-lead payload / range overrides from §6.1 G-final. */
function payloadRangeForPreview(
  year: number,
  make: string,
  model: string,
  trim: string,
  csvPayload: number | null,
  csvRange: number | null,
): { payload: number | null; range: number | null } {
  const m = `${make} ${model} ${trim}`.toLowerCase()
  let payload = csvPayload
  let range = csvRange
  if (/brightdrop/.test(m)) {
    payload = 1420 // lowest AWD Max / std conflict — §6.1
    range = 166
  }
  if (/promaster/.test(m) && /ev/.test(m)) {
    payload = 2030 // early OEM low
    range = 162
  }
  if (/e-?transit/.test(m)) {
    payload = 3330 // high roof / extended low
    range = 108 // roof unknown → lowest OEM est
  }
  if (/lightning/.test(m)) {
    payload = 1800 // lowest SR/ER
    if (!/er|extended|platinum/.test(m)) range = 230
  }
  if (/silverado\s*ev/.test(m) && year === 2024) {
    payload = 1400 // lower WT
    range = 393
  }
  if (/sierra\s*ev/.test(m)) {
    payload = 2250
    range = 283
  }
  return { payload, range }
}

function previewRetainedFor(year: number, make: string, model: string): RetainedEntry[] {
  return parseCsv(previewRetained)
    .filter(
      (r) =>
        Number(r.year) === year &&
        r.make.toLowerCase() === make.toLowerCase() &&
        (r.model.toLowerCase().includes(model.toLowerCase()) ||
          model.toLowerCase().includes(r.model.toLowerCase())),
    )
    .filter((r) => {
      const h = String(r.horizon || '')
      // Accept 3 yr / 36-mo only; reject ~2 yr
      if (/~?\s*2\s*yr/i.test(h) && !/3\s*yr|36/i.test(h)) return false
      if (!/3\s*yr|36/i.test(h)) return false
      const v = numOrNull(r.retained_value_pct)
      if (v == null) return false
      const lab = String(r.label || '')
      if (/INFERENCE/i.test(lab) && !/FACT/i.test(lab)) return false
      if (/listing sample/i.test(r.trim_or_config || '')) return false
      return true
    })
    .map((r) => ({
      value: numOrNull(r.retained_value_pct) as number,
      source: r.retained_value_source,
      basis: `${r.horizon}; ${r.baseline || ''}`.trim(),
      url: r.source_url,
      label: r.label,
      horizonYr: 3,
    }))
}

const PREVIEW_ROWS: CandidateVehicle[] = parseCsv(previewSpecs).map((r) => {
  const year = Number(r.year)
  const make = r.make
  const model = r.model
  const bodyType: 'truck' | 'van' = /van|brightdrop|promaster|e-transit|transit/i.test(
    `${r.body} ${model}`,
  )
    ? 'van'
    : 'truck'
  const rec = previewRecallCount(year, make, model)
  const rangeBasis = String(r.range_basis || '')
  const isEpa =
    /EPA/i.test(rangeBasis) &&
    !/not on fueleconomy|GM estimate|OEM/i.test(rangeBasis)
  const csvPayload = numOrNull(String(r.payload_lb).replace(/,/g, '').split('/')[0])
  const csvRange = numOrNull(String(r.range_mi).split(/[\/–-]/)[0])
  const pr = payloadRangeForPreview(year, make, model, r.trim, csvPayload, csvRange)
  const energy = energyForPreview(year, make, model, r.trim)
  // BrightDrop / ProMaster seats INFERENCE 2
  let seats: number | null = null
  if (/brightdrop/i.test(model) || (/promaster/i.test(model) && /ev/i.test(model))) seats = 2
  return {
    year,
    make,
    model,
    trim: r.trim,
    trimConfig: r.trim,
    bodyType,
    payloadLb: pr.payload,
    towLb: numOrNull(r.tow_lb),
    towLbNoWdh: numOrNull(r.tow_lb),
    towLbWdh: numOrNull(r.tow_lb),
    epaRangeMi: pr.range,
    rangeBasis: isEpa ? 'EPA' : rangeBasis || 'OEM estimate, not EPA',
    epaKwhPer100mi: energy.kwh,
    energyBasis: energy.basis,
    energyUrl: energy.url,
    usableKwh: numOrNull(r.usable_kwh),
    seats,
    battWarrantyYr: numOrNull(r.batt_warranty_yr) ?? 8,
    battWarrantyMi: numOrNull(r.batt_warranty_mi) ?? 100000,
    warrantyProgram: 'consumer' as const,
    retained3yrPct: previewRetainedFor(year, make, model),
    recallCampaignsMy: rec.count,
    recallUrl: rec.url,
    failurePatterns: previewFailurePatterns(year, make, model),
    maintClass: bodyType === 'van' ? ('van' as const) : ('ev-pickup' as const),
    epaSourceUrl: energy.url || (r.source_urls || '').split('|')[0]?.trim() || null,
    payloadSourceUrl: (r.source_urls || '').split('|')[0]?.trim() || null,
    towSourceUrl: (r.source_urls || '').split('|')[0]?.trim() || null,
    warrantySourceUrl: (r.source_urls || '').split('|').find((u) => /warranty/i.test(u))?.trim() || null,
    label: r.field_labels || '',
  }
})

/** Fill EPA kWh/100 for preview EVs that have EPA listings — from known EPA when in B notes.
 *  Only R1T CSV has kWh/100 today; Lightning/Silverado etc. → null → Not scored energy. */

export const CANDIDATE_VEHICLES: CandidateVehicle[] = [...R1T_ROWS, ...PREVIEW_ROWS]

function norm(s: string) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

/**
 * Lookup candidate score row. Prefers exact trim_config match; else closest year/make/model.
 * For R1T Adventure / Quad Large → 2022 Quad Large (EPA 44462) when year=2022.
 */
export function lookupCandidate(unit: {
  year?: number
  make?: string
  model?: string
  trim?: string
}): CandidateVehicle | null {
  if (!unit?.year || !unit?.make || !unit?.model) return null
  const year = Number(unit.year)
  const make = norm(unit.make)
  const model = norm(unit.model)
  const trim = norm(unit.trim || '')

  const pool = CANDIDATE_VEHICLES.filter(
    (c) => c.year === year && norm(c.make) === make && norm(c.model) === model,
  )
  if (!pool.length) return null

  if (trim) {
    const exact = pool.find(
      (c) => norm(c.trim) === trim || norm(c.trimConfig) === trim || trim.includes(norm(c.trim)),
    )
    if (exact) return exact
    // R1T Adventure → Quad Large (most-listed / INF mapping per A1)
    if (make === 'rivian' && /adventure|quad|launch/i.test(unit.trim || '')) {
      const quad = pool.find((c) => /quad\s*large/i.test(c.trimConfig))
      if (quad) return quad
    }
    if (make === 'rivian' && /dual/i.test(unit.trim || '')) {
      const dual = pool.find((c) => /dual\s*large/i.test(c.trimConfig) && !/performance/i.test(c.trimConfig))
      if (dual) return dual
    }
  }

  // Default R1T: Quad Large for that year
  if (make === 'rivian') {
    const quad = pool.find((c) => /quad\s*large/i.test(c.trimConfig))
    if (quad) return quad
  }

  return pool[0]
}

export { isFactLabel }
