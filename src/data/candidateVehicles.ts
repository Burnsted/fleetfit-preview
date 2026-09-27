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

export const CANDIDATE_VEHICLES_BUILD = 'score-v2-candidates-20260927'

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
    usableKwh: numOrNull(r.usable_kwh),
    seats: null,
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

/** Count distinct NHTSA campaigns per MY from B recall rows (skip NONE_RETURNED). */
function previewRecallCount(year: number, make: string, model: string) {
  const rows = parseCsv(previewRecalls).filter(
    (r) =>
      Number(r.year) === year &&
      r.make.toLowerCase() === make.toLowerCase() &&
      (r.model.toLowerCase().includes(model.toLowerCase()) ||
        model.toLowerCase().includes(r.model.toLowerCase().split(' ')[0])),
  )
  const campaigns = new Set(
    rows
      .map((r) => r.nhtsa_campaign)
      .filter((c) => c && c !== 'NONE_RETURNED' && !/^n\/a$/i.test(c)),
  )
  const url = rows[0]?.api_query_url || rows[0]?.recall_url || null
  return { count: campaigns.size || null, url }
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
  const isEpa = /EPA/i.test(rangeBasis) && !/not on fueleconomy/i.test(rangeBasis)
  return {
    year,
    make,
    model,
    trim: r.trim,
    trimConfig: r.trim,
    bodyType,
    payloadLb: numOrNull(String(r.payload_lb).split('/')[0]),
    towLb: numOrNull(r.tow_lb),
    towLbNoWdh: numOrNull(r.tow_lb),
    towLbWdh: numOrNull(r.tow_lb),
    epaRangeMi: numOrNull(String(r.range_mi).split('/')[0]),
    rangeBasis: isEpa ? 'EPA' : rangeBasis || 'OEM estimate, not EPA',
    epaKwhPer100mi: null, // B sheet doesn't have kWh/100 — Not scored until present
    usableKwh: numOrNull(r.usable_kwh),
    seats: null,
    battWarrantyYr: numOrNull(r.batt_warranty_yr),
    battWarrantyMi: numOrNull(r.batt_warranty_mi),
    warrantyProgram: 'consumer' as const,
    retained3yrPct: previewRetainedFor(year, make, model),
    recallCampaignsMy: rec.count,
    recallUrl: rec.url,
    failurePatterns: [],
    maintClass: bodyType === 'van' ? ('van' as const) : ('ev-pickup' as const),
    epaSourceUrl: (r.source_urls || '').split('|')[0]?.trim() || null,
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
