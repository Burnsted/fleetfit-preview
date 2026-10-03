#!/usr/bin/env node
/**
 * Generate typed gas-twin module from Sherlock CSVs.
 * Fails if any FACT row is missing source_url or source_date.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const pairsPath = join(root, 'src/data/gasTwin/gas_twin_pairs.csv')
const factorsPath = join(root, 'src/data/gasTwin/gas_twin_factors.csv')
const outPath = join(root, 'src/data/gasTwin/generated.ts')

function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let i = 0
  let inQuotes = false
  const s = String(text || '').replace(/^\uFEFF/, '')
  while (i < s.length) {
    const ch = s[i]
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          cell += '"'
          i += 2
          continue
        }
        inQuotes = false
        i += 1
        continue
      }
      cell += ch
      i += 1
      continue
    }
    if (ch === '"') {
      inQuotes = true
      i += 1
      continue
    }
    if (ch === ',') {
      row.push(cell)
      cell = ''
      i += 1
      continue
    }
    if (ch === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
      i += 1
      continue
    }
    if (ch === '\r') {
      i += 1
      continue
    }
    cell += ch
    i += 1
  }
  if (cell.length || row.length) {
    row.push(cell)
    rows.push(row)
  }
  if (!rows.length) return []
  const headers = rows[0].map((h) => h.trim())
  return rows
    .slice(1)
    .filter((r) => r.some((c) => String(c).trim() !== ''))
    .map((r) => {
      const obj = {}
      headers.forEach((h, idx) => {
        obj[h] = r[idx] != null ? String(r[idx]) : ''
      })
      return obj
    })
}

function isFactStatus(status) {
  const s = String(status || '').trim()
  if (!s) return false
  // "not scored: not confirmed" must not count
  if (/^not\b/i.test(s)) return false
  return /^FACT\b/i.test(s)
}

function assertFactSources(factors) {
  const missing = []
  for (const row of factors) {
    if (!isFactStatus(row.status)) continue
    const url = String(row.source_url || '').trim()
    const date = String(row.source_date || '').trim()
    if (!url || !date) {
      missing.push({
        vehicle: row.vehicle,
        factor: row.factor,
        status: row.status,
        source_url: url,
        source_date: date,
      })
    }
  }
  if (missing.length) {
    const sample = missing
      .slice(0, 8)
      .map((m) => `${m.vehicle} · ${m.factor} (${m.status})`)
      .join('\n  ')
    throw new Error(
      `generate-gas-twin: ${missing.length} FACT row(s) missing source_url or source_date.\n  ${sample}`,
    )
  }
}

function cellOrNull(raw) {
  const s = String(raw ?? '').trim()
  if (!s) return null
  if (/^not confirmed$/i.test(s)) return null
  if (/^unknown$/i.test(s)) return null
  if (/^not scored/i.test(s)) return null
  return s
}

function numOrNull(raw) {
  const s = cellOrNull(raw)
  if (s == null) return null
  const cleaned = s.replace(/,/g, '')
  const m = cleaned.match(/-?\d+(\.\d+)?/)
  if (!m) return null
  const n = Number(m[0])
  return Number.isFinite(n) ? n : null
}

function evKey(make, model, variant) {
  return `${make}|||${model}|||${variant}`
}

function gasKey(make, model, variant) {
  return `${make}|||${model}|||${variant}`
}

function parseSource(raw) {
  const s = String(raw || '').trim()
  if (!s || /^not confirmed$/i.test(s)) {
    return { url: null, note: null, raw: s || null }
  }
  const http = s.match(/https?:\/\/\S+/)
  const url = http ? http[0].replace(/[),.;]+$/, '') : null
  let note = null
  if (url) {
    const before = s.slice(0, s.indexOf(url)).replace(/[\s—–\-|:]+$/g, '').trim()
    if (before) note = before.replace(/—/g, ',').replace(/–/g, '-').trim()
  } else {
    note = s.replace(/—/g, ',').replace(/–/g, '-').trim()
  }
  return { url, note: note || null, raw: s }
}

function main() {
  const pairs = parseCsv(readFileSync(pairsPath, 'utf8'))
  const factors = parseCsv(readFileSync(factorsPath, 'utf8'))
  assertFactSources(factors)

  const pairRecords = pairs.map((r, idx) => ({
    id: idx + 1,
    evMake: r.ev_make,
    evModel: r.ev_model,
    evVariant: r.ev_variant,
    evYearBasis: r.ev_year_basis,
    evClass: r.ev_class,
    gasMake: r.gas_twin_make,
    gasModel: r.gas_twin_model,
    gasVariant: r.gas_twin_variant,
    gasFuel: r.gas_twin_fuel,
    gasClass: r.gas_twin_class,
    twinType: r.twin_type,
    candidateRank: Number(r.candidate_rank) || 0,
    primaryTwin: String(r.primary_twin).toLowerCase() === 'yes',
    matchBasis: r.match_basis,
    evPayloadLb: cellOrNull(r.ev_payload_lb),
    gasPayloadLb: cellOrNull(r.gas_payload_lb),
    evTowLb: cellOrNull(r.ev_tow_lb),
    gasTowLb: cellOrNull(r.gas_tow_lb),
    evBedOrCargo: cellOrNull(r.ev_bed_or_cargo),
    gasBedOrCargo: cellOrNull(r.gas_bed_or_cargo),
    evRangeMi: cellOrNull(r.ev_range_mi),
    gasRangeMi: cellOrNull(r.gas_range_mi),
    evTowRangeMi: cellOrNull(r.ev_tow_range_mi),
    gasTowRangeMi: cellOrNull(r.gas_tow_range_mi),
    evEfficiencyBasis: cellOrNull(r.ev_efficiency_basis),
    gasMpgCombined: cellOrNull(r.gas_mpg_combined),
    evEnergyUsdPerMi: numOrNull(r.ev_energy_usd_per_mi),
    gasEnergyUsdPerMi: numOrNull(r.gas_energy_usd_per_mi),
    gasTwinBaseMsrpUsd: numOrNull(r.gas_twin_base_msrp_usd),
    evBaseMsrpUsd: numOrNull(r.ev_base_msrp_usd),
    classMatchScore: cellOrNull(r.class_match_score),
    scorePayloadCloseness: cellOrNull(r.score_payload_closeness),
    scoreTowCloseness: cellOrNull(r.score_tow_closeness),
    scoreCargoCloseness: cellOrNull(r.score_cargo_closeness),
    scoreCabCloseness: cellOrNull(r.score_cab_closeness),
    scoreRangeCloseness: cellOrNull(r.score_range_closeness),
    scorePriceCloseness: cellOrNull(r.score_price_closeness),
    rankMetric: cellOrNull(r.rank_metric),
    evTedTotal: numOrNull(r.ev_ted_total),
    gasTedTotal: numOrNull(r.gas_ted_total),
    tedScoreDiffEvMinusGas: cellOrNull(r.ted_score_diff_ev_minus_gas),
    evTedPointsPossible: numOrNull(r.ev_ted_points_possible),
    gasTedPointsPossible: numOrNull(r.gas_ted_points_possible),
    matchQuality: String(r.match_quality || '').toLowerCase(),
    gapNotes: r.gap_notes || '',
    sourceUrls: r.source_urls || '',
    factStatus: r.fact_status || '',
  }))

  const factorRecords = factors.map((r, idx) => {
    const src = parseSource(r.source_url)
    return {
      id: idx + 1,
      vehicleRole: r.vehicle_role,
      vehicle: r.vehicle,
      evContext: r.ev_context,
      factor: r.factor,
      value: cellOrNull(r.value),
      valueRaw: String(r.value || ''),
      unit: r.unit || '',
      score: cellOrNull(r.score),
      sourceUrl: src.url,
      sourceNote: src.note,
      sourceDate: cellOrNull(r.source_date),
      status: r.status || '',
      trimMatchChecked: r.trim_match_checked || '',
    }
  })

  const byEv = {}
  for (const p of pairRecords) {
    const key = evKey(p.evMake, p.evModel, p.evVariant)
    if (!byEv[key]) {
      byEv[key] = {
        evMake: p.evMake,
        evModel: p.evModel,
        evVariant: p.evVariant,
        evYearBasis: p.evYearBasis,
        evClass: p.evClass,
        primaryPairId: null,
        pairIds: [],
      }
    }
    byEv[key].pairIds.push(p.id)
    if (p.primaryTwin) byEv[key].primaryPairId = p.id
  }

  const factorsByEvGas = {}
  for (const f of factorRecords) {
    const k = `${f.evContext}|||${f.vehicleRole}|||${f.vehicle}`
    if (!factorsByEvGas[k]) factorsByEvGas[k] = []
    factorsByEvGas[k].push(f.id)
  }

  const payload = {
    generatedAt: '2026-10-03',
    pairsCount: pairRecords.length,
    factorsCount: factorRecords.length,
    pairs: pairRecords,
    factors: factorRecords,
    evIndex: byEv,
    factorIndex: factorsByEvGas,
  }

  mkdirSync(dirname(outPath), { recursive: true })
  const body = `/* AUTO-GENERATED by scripts/generate-gas-twin.mjs - do not edit */
/* eslint-disable */
export const GAS_TWIN_GENERATED_AT = ${JSON.stringify(payload.generatedAt)} as const
export const GAS_TWIN_PAIRS_COUNT = ${payload.pairsCount} as const
export const GAS_TWIN_FACTORS_COUNT = ${payload.factorsCount} as const

export type GasTwinPair = ${typeFromSample(pairRecords[0])}
export type GasTwinFactor = ${typeFromSample(factorRecords[0])}

export const GAS_TWIN_PAIRS: GasTwinPair[] = ${JSON.stringify(pairRecords)}

export const GAS_TWIN_FACTORS: GasTwinFactor[] = ${JSON.stringify(factorRecords)}

export const GAS_TWIN_EV_INDEX: Record<string, {
  evMake: string
  evModel: string
  evVariant: string
  evYearBasis: string
  evClass: string
  primaryPairId: number | null
  pairIds: number[]
}> = ${JSON.stringify(byEv)}

export const GAS_TWIN_FACTOR_INDEX: Record<string, number[]> = ${JSON.stringify(factorsByEvGas)}
`
  writeFileSync(outPath, body)
  console.log(
    `generate-gas-twin: wrote ${pairRecords.length} pairs, ${factorRecords.length} factors → ${outPath}`,
  )
}

function typeFromSample(sample) {
  const lines = Object.entries(sample).map(([k, v]) => {
    let t = 'string'
    if (typeof v === 'number') t = 'number'
    else if (typeof v === 'boolean') t = 'boolean'
    else if (v === null) t = 'string | number | null'
    else if (typeof v === 'string' || v == null) {
      // nullable numeric fields in pairs
      if (
        /Usd|Total|Points|Rank|Id|Energy|Msrp|Payload|Tow|Range|Mpg/.test(k) ||
        k.endsWith('Lb') ||
        k.endsWith('Mi')
      ) {
        t = 'string | number | null'
      } else {
        t = 'string | null'
      }
    }
    // tighten known fields
    if (k === 'primaryTwin') t = 'boolean'
    if (k === 'candidateRank' || k === 'id') t = 'number'
    if (
      [
        'evEnergyUsdPerMi',
        'gasEnergyUsdPerMi',
        'gasTwinBaseMsrpUsd',
        'evBaseMsrpUsd',
        'evTedTotal',
        'gasTedTotal',
        'evTedPointsPossible',
        'gasTedPointsPossible',
      ].includes(k)
    ) {
      t = 'number | null'
    }
    if (
      [
        'evPayloadLb',
        'gasPayloadLb',
        'evTowLb',
        'gasTowLb',
        'evBedOrCargo',
        'gasBedOrCargo',
        'evRangeMi',
        'gasRangeMi',
        'evTowRangeMi',
        'gasTowRangeMi',
        'value',
        'score',
        'sourceUrl',
        'sourceNote',
        'sourceDate',
      ].includes(k)
    ) {
      t = 'string | null'
    }
    return `  ${k}: ${t}`
  })
  return `{\n${lines.join('\n')}\n}`
}

try {
  main()
} catch (err) {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
}
