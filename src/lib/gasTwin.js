/**
 * Gas twin data accessors — values and scores from generated CSVs only.
 * UI never recomputes closeness or TED scores.
 */
import {
  GAS_TWIN_EV_INDEX,
  GAS_TWIN_FACTOR_INDEX,
  GAS_TWIN_FACTORS,
  GAS_TWIN_PAIRS,
  GAS_TWIN_FACTORS_COUNT,
  GAS_TWIN_PAIRS_COUNT,
} from '../data/gasTwin/generated'
import {
  COPY,
  FACTOR_ROWS,
  NOT_CONFIRMED,
  OVERALL_POINTS_FLOOR,
} from '../data/gasTwin/constants'
import { formatOverallScore } from './gasTwinMoney'

export const GAS_TWIN_DATA_BUILD = 'gas-twin-data-20261003'
export { GAS_TWIN_PAIRS_COUNT, GAS_TWIN_FACTORS_COUNT }

const FACTORS_BY_ID = new Map(GAS_TWIN_FACTORS.map((f) => [f.id, f]))
const PAIRS_BY_ID = new Map(GAS_TWIN_PAIRS.map((p) => [p.id, p]))

/** Explicit New-catalog → data row maps (make, model, variant). */
export const NEW_CATALOG_EV_MAP = {
  tesla_cybertruck_dual: {
    evMake: 'Tesla',
    evModel: 'Cybertruck',
    evVariant: 'AWD',
  },
  rivian_rcv_500: {
    evMake: 'Rivian',
    evModel: 'Commercial Van RCV/EDV',
    evVariant: 'Delivery 500',
  },
  rivian_r1t_premium: {
    evMake: 'Rivian',
    evModel: 'R1T',
    evVariant: 'Dual Motor Standard',
  },
  chevy_silverado_ev_wt_4wt: {
    evMake: 'Chevrolet',
    evModel: 'Silverado EV',
    evVariant: 'WT Short Range',
  },
  mb_esprinter_81: {
    evMake: 'Mercedes-Benz',
    evModel: 'eSprinter',
    evVariant: '2500 144 WB SR 81kWh',
  },
  // Intentionally unmapped (no matching variant in deck) → Gas twin not confirmed
  ford_etransit_cargo_van_low_roof_148_wb: null,
  gmc_sierra_ev_elevation_standard: null,
}

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function evKey(make, model, variant) {
  return `${make}|||${model}|||${variant}`
}

export function getPairById(id) {
  return PAIRS_BY_ID.get(id) || null
}

export function listPairsForEv(make, model, variant) {
  const key = evKey(make, model, variant)
  const idx = GAS_TWIN_EV_INDEX[key]
  if (!idx) return []
  return idx.pairIds.map((id) => PAIRS_BY_ID.get(id)).filter(Boolean)
}

export function getPrimaryPair(make, model, variant) {
  const key = evKey(make, model, variant)
  const idx = GAS_TWIN_EV_INDEX[key]
  if (!idx?.primaryPairId) return null
  return PAIRS_BY_ID.get(idx.primaryPairId) || null
}

/**
 * Map an app vehicle (new catalog card or used unit) to a primary gas-twin pair.
 */
export function mapVehicleToPrimaryPair(vehicle) {
  if (!vehicle) return null

  if (vehicle.id && Object.prototype.hasOwnProperty.call(NEW_CATALOG_EV_MAP, vehicle.id)) {
    const mapped = NEW_CATALOG_EV_MAP[vehicle.id]
    if (!mapped) return null
    return getPrimaryPair(mapped.evMake, mapped.evModel, mapped.evVariant)
  }

  const make = vehicle.make || vehicle.evMake
  const model = vehicle.model || vehicle.evModel
  const trim =
    vehicle.variant ||
    vehicle.evVariant ||
    vehicle.trim ||
    vehicle.trimLabel ||
    vehicle.title ||
    ''

  if (!make || !model) return null

  // Exact variant hits first
  const exact = Object.values(GAS_TWIN_EV_INDEX).filter(
    (e) => norm(e.evMake) === norm(make) && modelMatches(e.evModel, model),
  )
  if (!exact.length) return null

  const trimN = norm(trim)
  let best = null
  let bestScore = -1
  for (const e of exact) {
    let score = 0
    const v = norm(e.evVariant)
    if (trimN && v && (trimN.includes(v) || v.includes(trimN))) score += 5
    // keyword boosts
    if (/pro\b|standard range|4wd sr/.test(trimN) && /pro standard|4wd sr/.test(v)) score += 3
    if (/flash|extended|er\b/.test(trimN) && /flash|extended/.test(v)) score += 3
    if (/cyberbeast|beast/.test(trimN) && /cyberbeast/.test(v)) score += 4
    if (/\bawd\b|dual/.test(trimN) && /\bawd\b/.test(v) && !/cyberbeast/.test(v)) score += 3
    if (/max|11k/.test(trimN) && /max/.test(v)) score += 3
    if (/premium|dual motor|standard/.test(trimN) && /dual motor standard/.test(v)) score += 2
    if (/delivery 500|rcv 500|edv 500/.test(trimN) && /delivery 500/.test(v)) score += 4
    if (/delivery 700|rcv 700|edv 700/.test(trimN) && /delivery 700/.test(v)) score += 4
    if (/wt|short range|4wt/.test(trimN) && /wt short/.test(v)) score += 3
    if (/lt|extended range/.test(trimN) && /lt extended/.test(v)) score += 3
    if (score > bestScore) {
      bestScore = score
      best = e
    }
  }

  // If no keyword win, prefer the sole EV index entry for that make/model
  if (bestScore <= 0) {
    if (exact.length === 1) best = exact[0]
    else {
      // Prefer primary-present rows; pick first by stable key
      best = exact.find((e) => e.primaryPairId) || exact[0]
    }
  }

  if (!best?.primaryPairId) return null
  return PAIRS_BY_ID.get(best.primaryPairId) || null
}

function modelMatches(dataModel, appModel) {
  const a = norm(dataModel)
  const b = norm(appModel)
  if (!a || !b) return false
  if (a === b) return true
  if (a.includes(b) || b.includes(a)) return true
  // F-150 Lightning
  if (a.includes('lightning') && b.includes('lightning')) return true
  if (a.includes('commercial van') && (b.includes('commercial') || b.includes('rcv') || b.includes('edv'))) {
    return true
  }
  if (a.includes('silverado ev') && b.includes('silverado') && b.includes('ev')) return true
  if (a.includes('sierra ev') && b.includes('sierra') && b.includes('ev')) return true
  if (a.includes('hummer') && b.includes('hummer')) return true
  if (a.includes('esprinter') && b.includes('esprinter')) return true
  if (a.includes('e transit') && (b.includes('e transit') || b.includes('etransit'))) return true
  if (a.includes('promaster') && b.includes('promaster')) return true
  if (a.includes('brightdrop') && b.includes('brightdrop')) return true
  if (a === 'r1t' && b.includes('r1t')) return true
  if (a.includes('cybertruck') && b.includes('cybertruck')) return true
  return false
}

export function gasTwinDisplayName(pair) {
  if (!pair) return COPY.gasTwinMissing
  const bits = [pair.gasMake, pair.gasModel, pair.gasVariant].filter(Boolean)
  return bits.join(' ')
}

export function shortGasTwinName(pair) {
  if (!pair) return COPY.gasTwinMissing
  const model = pair.gasModel || ''
  const variant = pair.gasVariant || ''
  // Keep readable but short
  const shortVariant = variant
    .replace(/Crew Cab /i, '')
    .replace(/Double Cab /i, '')
    .replace(/SuperCrew /i, '')
  return `${pair.gasMake} ${model}${shortVariant ? ` ${shortVariant}` : ''}`.trim()
}

export function isRoughMatch(pair) {
  if (!pair) return false
  return pair.matchQuality === 'weak' || pair.matchQuality === 'fair'
}

export function whyThisTwinText(pair) {
  if (!pair) return COPY.gasTwinMissing
  const parts = []
  if (isRoughMatch(pair)) parts.push(COPY.roughMatch)
  const gap = String(pair.gapNotes || '').trim()
  if (gap) {
    // Strip banned punctuation from display
    parts.push(sanitizeCopy(gap))
  } else {
    parts.push('Twin chosen by closeness from listed specs.')
  }
  return parts.join(' ')
}

export function sanitizeCopy(text) {
  return String(text || '')
    .replace(/\u2014/g, ', ')
    .replace(/\u2013/g, '-')
    .replace(/\s\/\s/g, ', ')
    .replace(/\//g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function factorsFor(evContext, role, vehicleName) {
  const key = `${evContext}|||${role}|||${vehicleName}`
  const ids = GAS_TWIN_FACTOR_INDEX[key] || []
  return ids.map((id) => FACTORS_BY_ID.get(id)).filter(Boolean)
}

function findFactor(list, factorKey) {
  return list.find((f) => f.factor === factorKey) || null
}

function formatFactorValue(factor, unitHint) {
  if (!factor || factor.value == null) return NOT_CONFIRMED
  const raw = String(factor.valueRaw || factor.value)
  if (/^not confirmed$/i.test(raw)) return NOT_CONFIRMED
  const unit = factor.unit || unitHint || ''
  if (unit === 'usd' || unitHint === 'usd') {
    const n = Number(String(factor.value).replace(/,/g, ''))
    if (!Number.isFinite(n)) return NOT_CONFIRMED
    return `$${n.toLocaleString('en-US')}`
  }
  if (unit === 'lb' || unitHint === 'lb') {
    const n = Number(String(factor.value).replace(/,/g, ''))
    if (!Number.isFinite(n)) return String(factor.value)
    return `${n.toLocaleString('en-US')} lb`
  }
  if (unit === 'mi' || unitHint === 'mi') {
    return `${factor.value} mi`
  }
  if (unit === 'seats' || unitHint === 'seats') {
    return `${factor.value} seats`
  }
  if (unit === 'pct' || unitHint === 'pct' || factor.factor === 'resale_3yr_retained') {
    return `${factor.value}% retained`
  }
  // cargo / bed free text
  return sanitizeCopy(String(factor.value))
}

function scoreDisplay(scoreRaw, max = 10) {
  if (scoreRaw == null || scoreRaw === '' || /^not/i.test(String(scoreRaw))) {
    return NOT_CONFIRMED
  }
  const n = Number(scoreRaw)
  if (!Number.isFinite(n)) return NOT_CONFIRMED
  const text = Number.isInteger(n) ? String(n) : n.toFixed(1)
  return `${text} out of ${max}`
}

/**
 * Build Full comparison rows from data only.
 * If either side lacks a confirmed value, both value cells read "not confirmed".
 */
export function buildComparisonRows(pair) {
  if (!pair) return []
  const evName = `${pair.evMake} ${pair.evModel} ${pair.evVariant}`
  const gasName = `${pair.gasMake} ${pair.gasModel} ${pair.gasVariant}`
  const evFactors = factorsFor(evName, 'ev', evName)
  const gasFactors = factorsFor(evName, 'gas_candidate', gasName)

  const rows = []
  for (const def of FACTOR_ROWS) {
    const evF = findFactor(evFactors, def.key)
    const gasF = findFactor(gasFactors, def.key)
    const evConfirmed = evF?.value != null
    const gasConfirmed = gasF?.value != null

    if (def.onlyIfConfirmed && !evConfirmed && !gasConfirmed) continue

    const bothValuesOk = evConfirmed && gasConfirmed
    const evValue = bothValuesOk ? formatFactorValue(evF, def.unitSuffix) : NOT_CONFIRMED
    const gasValue = bothValuesOk ? formatFactorValue(gasF, def.unitSuffix) : NOT_CONFIRMED

    // Scores: prefer TED for EV, closeness on gas factor / pair field
    let evScoreRaw = null
    let gasScoreRaw = null
    if (def.tedFactor) {
      evScoreRaw = findFactor(evFactors, def.tedFactor)?.score
      gasScoreRaw = findFactor(gasFactors, def.tedFactor)?.score
    }
    if (gasScoreRaw == null && def.closenessField) {
      gasScoreRaw = pair[def.closenessField]
    }
    if (gasScoreRaw == null) gasScoreRaw = gasF?.score
    if (evScoreRaw == null) evScoreRaw = evF?.score

    const evScoreOk = evScoreRaw != null && !/^not/i.test(String(evScoreRaw))
    const gasScoreOk = gasScoreRaw != null && !/^not/i.test(String(gasScoreRaw))
    const bothScoresOk = evScoreOk && gasScoreOk

    const inference =
      (evF && /INFERENCE/i.test(evF.status)) ||
      (gasF && /INFERENCE/i.test(gasF.status))

    const sourceLinks = []
    for (const f of [evF, gasF]) {
      if (f && /^FACT\b/i.test(f.status) && f.sourceUrl) {
        sourceLinks.push({
          href: f.sourceUrl,
          label: 'Source',
          note: f.sourceNote,
          date: f.sourceDate,
          side: f.vehicleRole,
          factor: f.factor,
        })
      }
    }

    rows.push({
      key: def.key,
      label: def.label,
      evValue,
      gasValue,
      evScore: bothScoresOk ? scoreDisplay(evScoreRaw) : NOT_CONFIRMED,
      gasScore: bothScoresOk ? scoreDisplay(gasScoreRaw) : NOT_CONFIRMED,
      inference,
      sourceLinks,
      gasSourceNote: gasF?.sourceNote || null,
      gasSourceUrl: gasF?.sourceUrl || null,
    })
  }
  return rows
}

export function buildOtherCandidates(pair) {
  if (!pair) return []
  const all = listPairsForEv(pair.evMake, pair.evModel, pair.evVariant)
  return all
    .filter((p) => !p.primaryTwin)
    .sort((a, b) => a.candidateRank - b.candidateRank)
    .map((p) => ({
      name: shortGasTwinName(p),
      rankMetric: p.rankMetric != null ? String(p.rankMetric) : NOT_CONFIRMED,
      matchQuality: p.matchQuality,
    }))
}

export function buildOverallScores(pair) {
  if (!pair) {
    return {
      ev: { display: NOT_CONFIRMED, showTotal: false },
      gas: { display: NOT_CONFIRMED, showTotal: false },
    }
  }
  return {
    ev: formatOverallScore(pair.evTedTotal, pair.evTedPointsPossible),
    gas: formatOverallScore(pair.gasTedTotal, pair.gasTedPointsPossible),
    pointsFloor: OVERALL_POINTS_FLOOR,
  }
}

export function stripSpecLine(pair) {
  if (!pair) return COPY.gasTwinMissing
  const payloadEv = pair.evPayloadLb != null ? `${Number(pair.evPayloadLb).toLocaleString('en-US')} lb` : NOT_CONFIRMED
  const payloadGas = pair.gasPayloadLb != null ? `${Number(pair.gasPayloadLb).toLocaleString('en-US')} lb` : NOT_CONFIRMED
  const towEv = pair.evTowLb != null ? `${Number(pair.evTowLb).toLocaleString('en-US')} lb` : NOT_CONFIRMED
  const towGas = pair.gasTowLb != null ? `${Number(pair.gasTowLb).toLocaleString('en-US')} lb` : NOT_CONFIRMED
  const rangeEv = pair.evRangeMi != null ? `${pair.evRangeMi} mi` : NOT_CONFIRMED
  const rangeGas = pair.gasRangeMi != null ? `${pair.gasRangeMi} mi` : NOT_CONFIRMED
  return `Payload ${payloadEv} vs ${payloadGas}, Tow ${towEv} vs ${towGas}, Range ${rangeEv} vs ${rangeGas}`
}

export function evDisplayName(pair) {
  if (!pair) return 'EV'
  return sanitizeCopy(`${pair.evMake} ${pair.evModel}`)
}

export function disclosureCopy() {
  return {
    title: COPY.howScored,
    formulas: [
      'Upfront equals EV base MSRP minus gas twin base MSRP.',
      'Per year equals yearly miles times (gas energy plus gas maintenance per mile, minus EV energy plus EV maintenance per mile).',
      'Maintenance per mile uses AFDC class-level figures: $0.061 EV and $0.101 gas.',
      'Over N years equals N times Per year, minus the upfront price difference.',
      'Closeness and TED category scores come from the sourced data file. This screen does not recompute them.',
      'Rank metric in the data is (0.35 times class match plus 0.65 times mean closeness) times coverage.',
      'Overall totals are omitted when points possible is under 60.',
    ],
    notes: [
      COPY.classLevelMaint,
      COPY.estimateFooter,
      COPY.insuranceNote,
    ],
  }
}
