/**
 * CLEARED Replacement Score v2 — Current | Candidate, 10 × 10.
 * Spec: docs/score-v2/CLEARED-FOR-WOZ-SCORE-V2.md §§1–5
 * Anchors: INFERENCE — do not tune. Data: SOURCES-V2 only.
 */
import {
  CATEGORY_KEYS,
  CATEGORY_LABELS,
  RANGE_ANCHORS,
  PAYLOAD_ANCHORS,
  TOW_ANCHORS,
  RESALE_ANCHORS,
  SERVICE_MI_ANCHORS,
  ENERGY_CPM_ANCHORS,
  MAINT_CPM_ANCHORS,
  RANGE_BUFFER,
  POINTS_FLOOR,
  WARRANTY_MAX,
  SCORE_V2_BUILD,
  SCORE_DATE,
  STATUS,
  incompleteLabelFromCategories,
  lin,
  round1,
  clampScore,
  type CategoryKey,
} from '../data/scoreV2Rubric'
import {
  lookupBaseline,
  MAINT_CLASS_AAA,
  ARGONNE_VAN_MAINT_CPM,
  type BaselineVehicle,
} from '../data/baselineVehicles'
import { lookupCandidate, type CandidateVehicle } from '../data/candidateVehicles'
import {
  FL_COMMERCIAL_ELECTRICITY,
  FL_GAS_REGULAR_AAA,
  FL_DIESEL_AAA,
} from '../data/flEnergyPrices'
import {
  lookupCommercialExclusion,
  RIVIAN_COMMERCIAL_WARRANTY,
  RIVIAN_CONSUMER_WARRANTY,
  normalizeWarrantyType,
  normalizeUpfit,
  lookupCapacityFloor,
  warrantyTypeMatters,
  CAPACITY_FLOOR_DEDUCTION,
  defaultEvBattTerms,
  GM_FLEET_POWERTRAIN,
  type WarrantyType,
  type UpfitKind,
} from '../data/warrantyRules'
import { nearestService } from '../data/serviceNetwork'
import { lookupBaselinePayload } from '../data/baselinePayload'
import { lookupSeats, isGasCargoVanModel } from '../data/seatCounts'
import { mergeOemSpecs } from '../data/oemSpecs'

export { SCORE_V2_BUILD }

export type JobInputs = {
  dailyMiles: number | null
  loadLb: number | null
  cargoCuFt: number | null
  crew: number | null
  tows: boolean | null
  trailerLb: number | null
  /** Tongue weight (lb). When towing and unset, default 15% of trailerLb. */
  tongueLb: number | null
  wdh: boolean | null
  shopCity: string | null
}

/**
 * Effective payload load for cat 2 when the job tows:
 * loadLb + tongue (entered, else 15% of trailerLb).
 * If loadLb is null, stay null — do not invent a trade payload from tongue alone.
 */
export function effectivePayloadLoadLb(job: JobInputs): number | null {
  if (job.loadLb == null) return null
  if (job.tows !== true) return job.loadLb
  const tongue =
    job.tongueLb != null && Number.isFinite(job.tongueLb)
      ? job.tongueLb
      : job.trailerLb != null && Number.isFinite(job.trailerLb)
        ? Math.round(job.trailerLb * 0.15)
        : null
  if (tongue == null) return job.loadLb
  return job.loadLb + tongue
}

export type CurrentVehicleInput = {
  year: number | null
  make: string | null
  model: string | null
  engine: string | null
  drivetrain: string | null
  miles: number | null
  cab?: string | null
  warrantyType?: WarrantyType | null
  warrantyProgram?: 'consumer' | 'commercial' | 'commercial_fleet' | null
  oemWrittenConfirmation?: boolean
  fleetAccount?: boolean
}

export type CellResult = {
  points: number | null
  status: string | null // Not used / Not scored / At risk suffix
  display: string // what to show in the cell
  reason: string
  url: string | null
  counted: boolean // contributes to PP
}

export type CategoryRow = {
  key: CategoryKey
  label: string
  current: CellResult
  candidate: CellResult
}

export type ScoreV2Result = {
  build: string
  version: 2
  currentName: string | null
  candidateName: string
  categories: CategoryRow[]
  currentTotal: number | null
  candidateTotal: number | null
  pointsPossible: number
  difference: number | null
  incomplete: boolean
  incompleteLabel: string | null
  /** True when custom intake has no current vehicle (candidate-only mode). */
  missingCurrent: boolean
  /** One-time banner copy when missingCurrent. */
  banner: string | null
  /** Dial: NN.N out of PP */
  dialTotal: string | null
  dialDiff: string | null
  /** Dial muted line: Current NN.N (null when no current / no compare). */
  dialCurrent: string | null
  sortKey: number
  hardReject: boolean
  hardFlag: boolean
  sidegrade: boolean
  /** Compatibility shims for older UI */
  total: number | null
  helps: string[]
  watchOuts: string[]
}

function num(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/** Public reason copy: no FACT / INF / INFERENCE labels (Ted ban on visible tags). */
function scrubPublicReason(raw: string): string {
  if (!raw) return raw
  return raw
    .replace(/\s*\(FACT\)/gi, '')
    .replace(/\s*\(INFERENCE\)/gi, '')
    .replace(/\bINFERENCE\b/gi, 'estimate')
    .replace(/\bINF\b:?\s*/g, '')
    .replace(/\bFACT\b/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:])/g, '$1')
    .replace(/\s+\)/g, ')')
    .replace(/\(\s+/g, '(')
    .replace(/\(\s*\)/g, '')
    .trim()
}

function cell(
  points: number | null,
  opts: {
    status?: string | null
    reason: string
    url?: string | null
    counted?: boolean
    atRisk?: boolean
    unconfirmed?: boolean
  },
): CellResult {
  const counted = opts.counted !== false && points != null && !opts.status?.startsWith('Not ')
  let display: string
  if (opts.status === STATUS.NOT_USED) display = STATUS.NOT_USED
  else if (opts.status?.startsWith('Not scored')) display = opts.status
  else if (points == null) display = opts.status || STATUS.notScored('data')
  else if (opts.unconfirmed) {
    display = `${round1(points).toFixed(1)} · ${STATUS.WARRANTY_UNCONFIRMED}`
  } else if (opts.atRisk) display = `${round1(points).toFixed(1)} · ${STATUS.AT_RISK}`
  else display = round1(points).toFixed(1)
  // Polish: Not scored / Not used — reason only when it adds information
  let reason = opts.reason
  if (
    (opts.status === STATUS.NOT_USED || opts.status?.startsWith('Not scored')) &&
    reason === opts.status
  ) {
    reason = ''
  }
  reason = scrubPublicReason(reason)
  return {
    points: points == null ? null : round1(points),
    status:
      opts.status ||
      (opts.unconfirmed
        ? STATUS.WARRANTY_UNCONFIRMED
        : opts.atRisk
          ? STATUS.AT_RISK
          : null),
    display,
    reason,
    url: opts.url || null,
    counted: Boolean(counted && !opts.status?.startsWith('Not ')),
  }
}

function bothNotUsed(): { current: CellResult; candidate: CellResult } {
  const c = cell(null, { status: STATUS.NOT_USED, reason: '', counted: false })
  return { current: c, candidate: { ...c } }
}

function bothNotScored(field: string, kind: 'published' | 'entered' = 'published', url: string | null = null) {
  const status = STATUS.notScored(field, kind)
  const c = cell(null, { status, reason: '', url, counted: false })
  return { current: c, candidate: { ...c } }
}

/** Pick retained % per conflict rule: candidate lower, current higher. */
function pickRetained(
  entries: { value: number; source: string; basis: string; url: string; label: string }[],
  side: 'candidate' | 'current',
) {
  const ok = entries.filter((e) => {
    const lab = String(e.label || '').toUpperCase()
    if (lab.includes('UNKNOWN')) return false
    // Reject INF-only and ~2-yr already filtered at load; reject CarResaleValue INF
    if (lab.includes('TREAT AS INF') || (lab.includes('WEAK') && lab.includes('INF'))) return false
    if (lab.startsWith('INF') && !lab.includes('FACT')) return false
    return Number.isFinite(e.value)
  })
  if (!ok.length) return null
  const sorted = [...ok].sort((a, b) => a.value - b.value)
  const chosen = side === 'candidate' ? sorted[0] : sorted[sorted.length - 1]
  return { chosen, all: ok }
}

function yearsBetween(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (365.25 * 24 * 3600 * 1000)
}

function scoreRange(
  publishedRange: number | null,
  dailyMiles: number | null,
  url: string | null,
  basisNote: string,
) {
  if (dailyMiles == null) return cell(null, { status: STATUS.notScored('daily miles', 'entered'), reason: STATUS.notScored('daily miles', 'entered'), counted: false })
  if (publishedRange == null) {
    return cell(null, {
      status: STATUS.notScored('range'),
      reason: STATUS.notScored('range'),
      url,
      counted: false,
    })
  }
  const usable = publishedRange * RANGE_BUFFER
  const ratio = usable / dailyMiles
  const pts = clampScore(lin(ratio, RANGE_ANCHORS))
  // G-final Transit polish reason when Fuelly tank range
  if (
    publishedRange === 340 &&
    /13\.6/.test(basisNote) &&
    /Fuelly|mpg/i.test(basisNote)
  ) {
    return cell(pts, {
      reason: `13.6 mpg × 25 gal = 340 mi × 0.7 = 238 mi usable (mpg is an estimate)`,
      url,
    })
  }
  return cell(pts, {
    reason: `${publishedRange} mi ${basisNote} × ${RANGE_BUFFER} = ${round1(usable)} mi usable vs ${dailyMiles} miles a day (ratio ${ratio.toFixed(2)})`,
    url,
  })
}

function scorePayload(
  payloadLb: number | null,
  loadLb: number | null,
  cargoCuFt: number | null,
  cargoNeed: number | null,
  url: string | null,
  isVan: boolean,
  payloadReasonLabel: string | null = null,
) {
  if (loadLb == null) {
    return cell(null, {
      status: STATUS.notScored('load', 'entered'),
      reason: STATUS.notScored('load', 'entered'),
      counted: false,
    })
  }
  if (payloadLb == null) {
    return cell(null, {
      status: STATUS.notScored('payload for this config'),
      reason: STATUS.notScored('payload for this config'),
      url,
      counted: false,
    })
  }
  const ratio = payloadLb / loadLb
  let pts = clampScore(lin(ratio, PAYLOAD_ANCHORS))
  const head =
    payloadReasonLabel ||
    `${payloadLb.toLocaleString()} lb rated payload`
  let reason = `${head} vs ${loadLb.toLocaleString()} lb load (ratio ${ratio.toFixed(2)})`
  if (isVan && cargoNeed != null) {
    if (cargoCuFt == null) {
      reason += ' · cargo volume Not published'
    } else {
      const vRatio = cargoCuFt / cargoNeed
      const vPts = clampScore(lin(vRatio, PAYLOAD_ANCHORS))
      pts = Math.min(pts, vPts)
      reason += ` · ${cargoCuFt} cu ft vs ${cargoNeed} cu ft need (ratio ${vRatio.toFixed(2)}); min used`
    }
  }
  return cell(pts, { reason, url })
}

function scoreCab(
  seats: number | null,
  crew: number | null,
  seatReasonLabel: string | null = null,
  vanNotPublished = false,
) {
  if (crew == null) {
    return cell(null, {
      status: STATUS.notScored('crew', 'entered'),
      reason: STATUS.notScored('crew', 'entered'),
      counted: false,
    })
  }
  if (seats == null) {
    const status = vanNotPublished
      ? 'Not scored: seating not published for this van'
      : STATUS.notScored('seating')
    return cell(null, {
      status,
      reason: status,
      counted: false,
    })
  }
  const short = crew - seats
  let pts = 10
  if (short <= 0) pts = 10
  else if (short === 1) pts = 4
  else pts = 0
  const head = seatReasonLabel || `${seats} seats`
  return cell(pts, {
    reason: `${head} vs crew ${crew}`,
  })
}

function scoreTow(
  tows: boolean | null,
  trailerLb: number | null,
  wdh: boolean | null,
  towLb: number | null,
  towLbNoWdh: number | null,
  url: string | null,
) {
  if (tows === false || tows == null) {
    return cell(null, { status: STATUS.NOT_USED, reason: STATUS.NOT_USED, counted: false })
  }
  if (trailerLb == null) {
    return cell(null, {
      status: STATUS.notScored('trailer weight', 'entered'),
      reason: STATUS.notScored('trailer weight', 'entered'),
      counted: false,
    })
  }
  const rating =
    wdh === true ? towLb : towLbNoWdh != null ? towLbNoWdh : towLb
  if (rating == null) {
    return cell(null, {
      status: STATUS.notScored('tow rating'),
      reason: STATUS.notScored('tow rating'),
      url,
      counted: false,
    })
  }
  const ratio = rating / trailerLb
  let pts: number
  if (ratio < 1.0) pts = 0
  else pts = clampScore(lin(ratio, TOW_ANCHORS))
  return cell(pts, {
    reason: `${rating.toLocaleString()} lb rated tow${wdh ? ' (WDH)' : ' (no WDH)'} vs ${trailerLb.toLocaleString()} lb trailer (ratio ${ratio.toFixed(2)})`,
    url,
  })
}

function scoreResale(
  entries: CandidateVehicle['retained3yrPct'],
  side: 'candidate' | 'current',
) {
  const pick = pickRetained(entries, side)
  if (!pick) {
    return cell(null, {
      status: STATUS.notScored('3-yr retained value'),
      reason: STATUS.notScored('3-yr retained value'),
      counted: false,
    })
  }
  const { chosen, all } = pick
  const pts = clampScore(lin(chosen.value, RESALE_ANCHORS))
  let both: string
  if (all.length > 1) {
    const others = all.filter((e) => e !== chosen)
    both =
      `${chosen.source} ${chosen.value}% (${chosen.basis})` +
      others.map((e) => ` · ${e.source} ${e.value}% (${e.basis})`).join('') +
      `; ${side === 'candidate' ? 'lower' : 'higher'} used`
  } else {
    both = `${chosen.source} ${chosen.value}% (${chosen.basis})`
  }
  return cell(pts, {
    reason: `3-yr retained: ${both}`,
    url: chosen.url,
  })
}

function scoreReliability(
  campaigns: number | null,
  patterns: { counts: boolean; pattern: string; evidenceType: string; url: string }[],
  url: string | null,
  allEnginesNote: boolean,
) {
  if (campaigns == null) {
    return cell(null, {
      status: STATUS.notScored('recall campaign count'),
      reason: STATUS.notScored('recall campaign count'),
      url,
      counted: false,
    })
  }
  const countedPatterns = patterns.filter((p) => p.counts)
  let pts = 10 - 2 * campaigns - 1 * countedPatterns.length
  pts = clampScore(pts)
  const patStr = countedPatterns.length
    ? countedPatterns.map((p) => `${p.evidenceType || 'pattern'} (${p.pattern})`).join(', ')
    : 'no sourced failure patterns counted'
  const reason = `${campaigns} NHTSA campaigns MY${allEnginesNote ? ' (all engines and body styles; open status not checked; no VIN lookup)' : ' (open status not checked; no VIN lookup)'} · ${patStr}`
  return cell(pts, { reason, url })
}

function scoreService(
  make: string,
  shopCity: string | null,
  isCandidate: boolean,
  model: string | null = null,
) {
  if (!shopCity) {
    return cell(null, {
      status: STATUS.notScored('shop location', 'entered'),
      reason: '',
      counted: false,
    })
  }
  const n = nearestService(make, shopCity, {
    model,
    isEvCandidate: isCandidate,
  })
  if (n.notScoredStatus) {
    return cell(null, {
      status: n.notScoredStatus,
      reason: '',
      counted: false,
      url: n.url,
    })
  }
  if (n.miles == null) {
    const field = isCandidate
      ? 'service distance'
      : 'current service distance'
    return cell(null, {
      status: STATUS.notScored(field),
      reason: '',
      counted: false,
    })
  }
  let pts =
    n.pointsOverride != null
      ? n.pointsOverride
      : clampScore(lin(n.miles, SERVICE_MI_ANCHORS))
  let reason = `${n.location?.location || 'Not published'}, ${n.miles} road mi from 32960 (OSRM)`
  if (/rivian/i.test(make)) {
    reason = `Nearest Rivian service: ${n.location?.location || 'Not published'}, ${n.miles} road mi from 32960 (OSRM)`
  }
  if (n.mobile?.available) {
    pts = Math.min(10, pts + 2)
    reason += ` · Rivian Mobile Service available (+2)`
  }
  if (n.reasonExtra) reason += ` · ${n.reasonExtra}`
  return cell(pts, { reason, url: n.url })
}

function scoreLongevity(opts: {
  isEv: boolean
  year: number
  miles: number | null
  battYr: number | null
  battMi: number | null
  powerYr: number | null
  powerMi: number | null
  make: string
  model: string
  warrantyType: WarrantyType
  oemWrittenConfirmation: boolean
  warrantyUrl: string | null
  upfit: UpfitKind
  fleetAccount?: boolean
  /** true = candidate column (INFERENCE floor → −2) */
  isCandidate?: boolean
}) {
  if (opts.miles == null) {
    return cell(null, {
      status: STATUS.notScored('current miles', 'entered'),
      reason: '',
      counted: false,
    })
  }

  if (/rivian/i.test(opts.make) && /\bedv\b/i.test(opts.model)) {
    return cell(null, {
      status: 'Not scored: EDV warranty terms not published',
      reason: '',
      counted: false,
    })
  }

  const start = new Date(`${opts.year}-01-01T00:00:00Z`)
  const end = new Date(`${SCORE_DATE}T00:00:00Z`)
  const yearsUsed = Math.max(0, yearsBetween(start, end))
  const matters = warrantyTypeMatters(opts.make, opts.model)
  const exclusion = lookupCommercialExclusion(opts.make, opts.model)

  // Rivian R1T: consumer / unconfirmed → 0 of 20
  const rivianAtRisk =
    matters &&
    Boolean(exclusion) &&
    !opts.oemWrittenConfirmation &&
    opts.warrantyType !== 'commercial'

  if (rivianAtRisk) {
    const wYr = opts.battYr ?? RIVIAN_CONSUMER_WARRANTY.battWarrantyYr
    const wMi = opts.battMi ?? RIVIAN_CONSUMER_WARRANTY.battWarrantyMi
    const yearsLeft = Math.max(0, wYr - yearsUsed)
    const milesLeft = Math.max(0, wMi - opts.miles)
    const commercialPts = clampScore(
      WARRANTY_MAX *
        Math.min(
          Math.max(0, RIVIAN_COMMERCIAL_WARRANTY.battWarrantyYr - yearsUsed) /
            RIVIAN_COMMERCIAL_WARRANTY.battWarrantyYr,
          Math.max(0, RIVIAN_COMMERCIAL_WARRANTY.battWarrantyMi - opts.miles) /
            RIVIAN_COMMERCIAL_WARRANTY.battWarrantyMi,
        ),
      WARRANTY_MAX,
    )
    const floor = lookupCapacityFloor(opts.make, opts.model, opts.year)
    if (opts.warrantyType === 'unconfirmed') {
      let reason = `${STATUS.WARRANTY_UNCONFIRMED}. Scores as consumer (lower case). Nominal consumer coverage left: ${yearsLeft.toFixed(2)} yr and ${(milesLeft / 1000).toFixed(1)}k mi. On Rivian Commercial terms this unit would score ${commercialPts.toFixed(1)} of ${WARRANTY_MAX}.`
      if (floor?.pct != null) reason += ` · Battery capacity floor ${floor.pct}% (${floor.label})`
      return cell(0, {
        unconfirmed: true,
        reason,
        url: exclusion?.url || RIVIAN_CONSUMER_WARRANTY.url,
        counted: true,
      })
    }
    let reason = `At risk, not counted: Rivian consumer warranty does not apply if "used primarily for business or commercial purposes" (NVLW Guide Rev ${RIVIAN_CONSUMER_WARRANTY.revision}, eff. ${RIVIAN_CONSUMER_WARRANTY.effective}, p${RIVIAN_CONSUMER_WARRANTY.pageExclusion}). Nominal consumer coverage left: ${yearsLeft.toFixed(2)} yr and ${(milesLeft / 1000).toFixed(1)}k mi.`
    if (floor?.pct != null) reason += ` · Battery capacity floor ${floor.pct}% (${floor.label})`
    return cell(0, {
      atRisk: true,
      reason,
      url: exclusion?.url || RIVIAN_CONSUMER_WARRANTY.url,
      counted: true,
    })
  }

  let wYr = opts.isEv ? opts.battYr : opts.powerYr
  let wMi = opts.isEv ? opts.battMi : opts.powerMi
  let url = opts.warrantyUrl

  if (opts.warrantyType === 'commercial' && /rivian/i.test(opts.make)) {
    wYr = RIVIAN_COMMERCIAL_WARRANTY.battWarrantyYr
    wMi = RIVIAN_COMMERCIAL_WARRANTY.battWarrantyMi
    url = RIVIAN_COMMERCIAL_WARRANTY.url
  }

  if (opts.isEv && (wYr == null || wMi == null)) {
    const d = defaultEvBattTerms(opts.make, opts.model)
    if (d) {
      wYr = wYr ?? d.yr
      wMi = wMi ?? d.mi
    }
  }

  if (
    !opts.isEv &&
    opts.fleetAccount &&
    /chevrolet|gmc|gm/i.test(opts.make)
  ) {
    wYr = GM_FLEET_POWERTRAIN.yr
    wMi = GM_FLEET_POWERTRAIN.mi
  }

  if (wYr == null || wMi == null) {
    return cell(null, {
      status: STATUS.notScored('warranty terms'),
      reason: '',
      url,
      counted: false,
    })
  }

  const yearsLeft = Math.max(0, wYr - yearsUsed)
  const milesLeft = Math.max(0, wMi - opts.miles)
  const frac = Math.min(yearsLeft / wYr, milesLeft / wMi)
  let pts = clampScore(WARRANTY_MAX * frac, WARRANTY_MAX)

  if (
    opts.warrantyType === 'commercial' &&
    /rivian/i.test(opts.make) &&
    (opts.upfit === 'other' || opts.upfit === 'unknown')
  ) {
    pts = clampScore(pts - RIVIAN_COMMERCIAL_WARRANTY.upfitDeduction, WARRANTY_MAX)
  }

  // Gas over 150k → −4 of 20
  if (!opts.isEv && opts.miles > 150000) {
    pts = clampScore(pts - 4, WARRANTY_MAX)
  }

  const floor = opts.isEv
    ? lookupCapacityFloor(opts.make, opts.model, opts.year)
    : null
  if (floor && opts.isCandidate && floor.deductCandidate) {
    pts = clampScore(pts - CAPACITY_FLOOR_DEDUCTION, WARRANTY_MAX)
  }

  let reason: string
  if (opts.warrantyType === 'commercial' && /rivian/i.test(opts.make)) {
    reason = `Commercial ${wYr} yr · ${(wMi / 1000).toFixed(0)}k: 20 × min(${yearsLeft.toFixed(2)}/${wYr}, ${(milesLeft / 1000).toFixed(1)}k/${(wMi / 1000).toFixed(0)}k) = ${(WARRANTY_MAX * frac).toFixed(1)}`
    if (opts.upfit === 'other' || opts.upfit === 'unknown') {
      reason +=
        opts.upfit === 'unknown'
          ? `; upfit −${RIVIAN_COMMERCIAL_WARRANTY.upfitDeduction} (installer not documented)`
          : `; upfit −${RIVIAN_COMMERCIAL_WARRANTY.upfitDeduction} (not Rivian Preferred Upfit Partner)`
    } else {
      reason += '; no upfit'
    }
  } else if (!opts.isEv && yearsLeft <= 0) {
    reason = `powertrain ${wYr} yr · ${(wMi / 1000).toFixed(0)}k expired; ≤150k mi, no modifier`
  } else {
    reason = `${opts.isEv ? 'battery and drivetrain' : 'powertrain'} ${wYr} yr · ${(wMi / 1000).toFixed(0)}k · start Jan 1 ${opts.year} · ${yearsLeft.toFixed(2)} yr left, ${(milesLeft / 1000).toFixed(1)}k mi left · 20 × min = ${(WARRANTY_MAX * frac).toFixed(1)}`
  }
  if (floor) {
    if (floor.label === 'NONE') {
      reason += ` · Battery capacity floor None${opts.isCandidate ? ` · −${CAPACITY_FLOOR_DEDUCTION}` : ''}`
    } else {
      reason += ` · Battery capacity floor ${floor.pct}%${
        opts.isCandidate && floor.deductCandidate
          ? ` · −${CAPACITY_FLOOR_DEDUCTION}`
          : ''
      }`
    }
  }
  return cell(pts, { reason, url })
}

function scoreEnergyEv(
  kwhPer100: number | null,
  url: string | null,
  energyBasis: string | null = null,
) {
  if (!FL_COMMERCIAL_ELECTRICITY || FL_COMMERCIAL_ELECTRICITY.value == null) {
    return cell(null, { status: STATUS.FL_PRICE, reason: '', counted: false })
  }
  if (kwhPer100 == null) {
    return cell(null, {
      status: STATUS.notScored('EPA efficiency'),
      reason: '',
      url,
      counted: false,
    })
  }
  const cpm = (kwhPer100 / 100) * FL_COMMERCIAL_ELECTRICITY.value
  const pts = clampScore(lin(cpm, ENERGY_CPM_ANCHORS))
  const basis =
    energyBasis && !/^EPA$/i.test(energyBasis)
      ? energyBasis
      : 'EPA'
  return cell(pts, {
    reason: `${kwhPer100} kWh per 100 mi (${basis}) × ${FL_COMMERCIAL_ELECTRICITY.value}¢ per kWh FL commercial (EIA, Jul 2026) = ${cpm.toFixed(1)}¢ per mi`,
    url: url || FL_COMMERCIAL_ELECTRICITY.url,
  })
}

function scoreEnergyGas(
  mpg: number | null,
  fuel: string,
  url: string | null,
  fuelly?: { mpg: number; url: string | null; label: string | null } | null,
  isVanOver8500?: boolean,
) {
  let useMpg = mpg
  let reasonMpg = ''
  let mpgUrl = url
  if (isVanOver8500) {
    if (!fuelly?.mpg) {
      return cell(null, {
        status: 'Not scored: mpg not published (van >8,500 GVWR)',
        reason: 'Not scored: mpg not published (van >8,500 GVWR)',
        counted: false,
      })
    }
    useMpg = fuelly.mpg
    reasonMpg = `Fuelly crowd-sourced mpg (not EPA-rated: GVWR over 8,500)`
    mpgUrl = fuelly.url
  }
  if (useMpg == null) {
    return cell(null, {
      status: STATUS.notScored('mpg'),
      reason: STATUS.notScored('mpg'),
      url,
      counted: false,
    })
  }
  const diesel = /diesel/i.test(fuel)
  const price = diesel ? FL_DIESEL_AAA : FL_GAS_REGULAR_AAA
  if (!price || price.value == null) {
    return cell(null, { status: STATUS.FL_PRICE, reason: STATUS.FL_PRICE, counted: false })
  }
  const cpm = (100 * price.value) / useMpg
  const pts = clampScore(lin(cpm, ENERGY_CPM_ANCHORS))
  const mid = /midgrade/i.test(fuel)
    ? ' · rated on midgrade; priced at regular'
    : ''
  const reason = reasonMpg
    ? `${reasonMpg}: ${useMpg} mpg · $${price.value} per gal FL ${diesel ? 'diesel' : 'regular'} (AAA, 9/27/26) = ${cpm.toFixed(1)}¢ per mi`
    : `$${price.value} per gal FL ${diesel ? 'diesel' : 'regular'} (AAA, 9/27/26) ÷ ${useMpg} mpg (EPA) = ${cpm.toFixed(1)}¢ per mi${mid}`
  return cell(pts, { reason, url: price.url || mpgUrl })
}

function scoreMaint(
  maintClass: string | null,
  isVan: boolean,
  opts?: { argonVanCurrent?: boolean },
) {
  // G-final: Transit current can score Argonne $0.31/mi; pair drops if candidate lacks same basis
  if (isVan || maintClass === 'van') {
    if (opts?.argonVanCurrent) {
      const pts = clampScore(lin(ARGONNE_VAN_MAINT_CPM.cpm, MAINT_CPM_ANCHORS))
      return cell(pts, {
        reason: ARGONNE_VAN_MAINT_CPM.detail,
        url: ARGONNE_VAN_MAINT_CPM.url,
      })
    }
    return cell(null, {
      status: STATUS.notScored('van maintenance cost'),
      reason: '',
      counted: false,
    })
  }
  const key = maintClass === 'midsize' ? 'midsize' : maintClass === 'ev-pickup' ? 'ev-pickup' : 'half-ton'
  const row = MAINT_CLASS_AAA[key]
  const pts = clampScore(lin(row.cpm, MAINT_CPM_ANCHORS))
  const argonne =
    key === 'ev-pickup'
      ? ` · Argonne scheduled-only BEV ${MAINT_CLASS_AAA.argonneEv.cpm}¢ vs ICEV ${MAINT_CLASS_AAA.argonneIce.cpm}¢`
      : ''
  return cell(pts, {
    reason: `Class-level, not model-specific: ${row.detail}${argonne}`,
    url: row.url,
  })
}

function pairCells(
  cur: CellResult,
  cand: CellResult,
): { current: CellResult; candidate: CellResult } {
  // If either is Not scored / Not used, both drop out with same status when one side missing input for the pair rule
  // Spec: missing for EITHER vehicle → both Not scored and drop out
  const curDrop = !cur.counted
  const candDrop = !cand.counted
  if (cur.status === STATUS.NOT_USED || cand.status === STATUS.NOT_USED) {
    return bothNotUsed()
  }
  if (curDrop || candDrop) {
    // Prefer a Not scored status from either side
    const status =
      (cur.status?.startsWith('Not scored') && cur.status) ||
      (cand.status?.startsWith('Not scored') && cand.status) ||
      STATUS.notScored('data')
    const c = cell(null, {
      status,
      reason: status,
      url: cur.url || cand.url,
      counted: false,
    })
    return { current: c, candidate: { ...c } }
  }
  return { current: cur, candidate: cand }
}

export function parseJobFromIntake(
  intake: Record<string, unknown> | null | undefined,
  pkg?: Record<string, unknown> | null,
): JobInputs {
  const job = (intake?.job as Record<string, unknown>) || {}
  const defaults = (pkg?.jobDefaults as Record<string, unknown>) || {}
  const daily =
    num(job.dailyMiles) ??
    num(intake?.dailyMiles) ??
    (typeof intake?.dailyMiles === 'string' && /^\d+/.test(intake.dailyMiles)
      ? num(String(intake.dailyMiles).match(/\d+/)?.[0])
      : null) ??
    num(defaults.dailyMiles)
  // loadLb: top of payload bracket or explicit
  let loadLb = num(job.loadLb) ?? num(intake?.loadLb) ?? num(defaults.loadLb)
  if (loadLb == null) {
    const p = String(intake?.payload || job.payload || '')
    if (/light/i.test(p)) loadLb = 500
    else if (/medium/i.test(p)) loadLb = 1000
    else if (/heavy/i.test(p)) loadLb = 1500
  }
  const crew = num(job.crew) ?? num(intake?.crew) ?? num(defaults.crew)
  let tows: boolean | null = null
  if (job.tows === true || job.tows === false) tows = job.tows as boolean
  else if (intake?.tows === true || intake?.tows === false) tows = intake.tows as boolean
  else if (defaults.tows === true || defaults.tows === false) tows = defaults.tows as boolean
  else if (intake || Object.keys(job).length) {
    const haul = String(intake?.haul || '')
    if (!haul || /none/i.test(haul)) tows = false
    else if (/not sure/i.test(haul)) tows = null
    else tows = true
  }
  const trailerLb = num(job.trailerLb) ?? num(intake?.trailerLb) ?? num(defaults.trailerLb)
  let tongueLb = num(job.tongueLb) ?? num(intake?.tongueLb) ?? num(defaults.tongueLb)
  // Landscaping / tow jobs: when tongue unset and trailer known, default 15%.
  if (tongueLb == null && tows === true && trailerLb != null) {
    tongueLb = Math.round(trailerLb * 0.15)
  }
  const wdh =
    job.wdh === true || intake?.wdh === true
      ? true
      : job.wdh === false || intake?.wdh === false
        ? false
        : null
  const shopCity =
    (job.shopCity as string) ||
    (intake?.shopCity as string) ||
    inferShopCity(String(intake?.address || '')) ||
    (defaults.shopCity as string) ||
    null
  const cargoCuFt = num(job.cargoCuFt) ?? num(intake?.cargoCuFt) ?? num(defaults.cargoCuFt)
  return {
    dailyMiles: daily,
    loadLb,
    cargoCuFt,
    crew,
    tows,
    trailerLb,
    tongueLb,
    wdh,
    shopCity,
  }
}

function inferShopCity(address: string): string | null {
  const a = address.toLowerCase()
  if (a.includes('vero')) return 'Vero Beach'
  if (a.includes('fort pierce') || a.includes('ft pierce')) return 'Fort Pierce'
  if (a.includes('west palm') || a.includes('palm beach')) return 'West Palm Beach'
  return null
}

export function parseCurrentFromIntake(
  intake: Record<string, unknown> | null | undefined,
  pkg?: {
    currentMileage?: number
    currentVehicle?: Record<string, unknown> | null
  } | null,
): CurrentVehicleInput | null {
  const cur = (intake?.current as Record<string, unknown>) || {}
  let year = num(cur.year) ?? num(intake?.currentYear)
  let make = (cur.make as string) || (intake?.currentMake as string) || null
  let model = (cur.model as string) || (intake?.currentModel as string) || null
  let engine = (cur.engine as string) || (intake?.currentEngine as string) || null
  let drivetrain =
    (cur.drivetrain as string) || (intake?.currentDrivetrain as string) || null
  let miles =
    num(cur.miles) ??
    num(intake?.currentMiles) ??
    num(intake?.currentMileage) ??
    num(pkg?.currentMileage)
  // tradeInModel free text parse: "2018 Ford F-150 3.5 EcoBoost 4x4"
  if ((!year || !make || !model) && intake?.tradeInModel) {
    const parsed = parseTradeInModel(String(intake.tradeInModel))
    if (parsed) {
      year = year || parsed.year
      make = make || parsed.make
      model = model || parsed.model
      engine = engine || parsed.engine
      drivetrain = drivetrain || parsed.drivetrain
    }
  }
  // Demo package seed when intake has no current vehicle
  const seed = pkg?.currentVehicle
  if ((!year || !make || !model) && seed) {
    year = year || num(seed.year)
    make = make || (seed.make as string) || null
    model = model || (seed.model as string) || null
    engine = engine || (seed.engine as string) || null
    drivetrain = drivetrain || (seed.drivetrain as string) || null
    miles = miles ?? num(seed.miles)
  }
  if (!year || !make || !model) return null
  return {
    year,
    make,
    model,
    engine,
    drivetrain,
    miles,
    cab: (cur.cab as string) || (intake?.cab as string) || null,
    warrantyType:
      normalizeWarrantyType(cur.warrantyType ?? cur.warrantyProgram) || null,
    oemWrittenConfirmation: Boolean(cur.oemWrittenConfirmation),
    fleetAccount: Boolean(cur.fleetAccount),
  }
}

export function parseTradeInModel(text: string): {
  year: number
  make: string
  model: string
  engine: string | null
  drivetrain: string | null
} | null {
  const t = String(text || '').trim()
  const m = t.match(
    /^(\d{4})\s+(\w+)\s+(F-?150|Silverado\s*1500|Ram\s*1500|Tacoma|Colorado|Transit(?:-\d+)?|ProMaster(?:\s*\d+)?)\b(.*)$/i,
  )
  if (!m) return null
  const year = Number(m[1])
  const make = m[2]
  let model = m[3].replace(/f150/i, 'F-150').replace(/\s+/g, ' ').trim()
  if (/^f-?150$/i.test(model)) model = 'F-150'
  const rest = m[4] || ''
  let engine: string | null = null
  if (/3\.5|ecoboost/i.test(rest)) engine = 'EcoBoost 3.5L'
  else if (/5\.0/i.test(rest)) engine = '5.0L V8'
  else if (/5\.3/i.test(rest)) engine = '5.3L V8'
  let drivetrain: string | null = null
  if (/4x4|4wd/i.test(rest)) drivetrain = '4x4'
  else if (/4x2|2wd/i.test(rest)) drivetrain = '4x2'
  return { year, make, model, engine, drivetrain }
}

export function scoreReplacementV2(
  unit: Record<string, unknown>,
  opts: {
    intake?: Record<string, unknown> | null
    pkg?: {
      currentMileage?: number
      currentVehicle?: Record<string, unknown> | null
      jobDefaults?: Record<string, unknown> | null
    } | null
    scoringDate?: string
  } = {},
): ScoreV2Result {
  const intake = opts.intake || null
  const pkg = opts.pkg || null
  const job = parseJobFromIntake(intake, pkg)
  const currentIn = parseCurrentFromIntake(intake, pkg)
  const missingCurrent = !currentIn
  const merged = mergeOemSpecs(unit) as Record<string, unknown>
  const candRow = lookupCandidate({
    year: num(merged.year) ?? undefined,
    make: String(merged.make || ''),
    model: String(merged.model || ''),
    trim: String(merged.trim || ''),
  })

  const candidateName = `${merged.year} ${merged.make} ${merged.model}${merged.trim ? ` ${merged.trim}` : ''}`

  const { vehicle: baseline, reasonNote: baselineNote } = currentIn
    ? lookupBaseline(currentIn)
    : { vehicle: null, reasonNote: null }
  const exampleLabel =
    typeof pkg?.currentVehicle?.label === 'string'
      ? String(pkg.currentVehicle.label)
      : null
  const currentName = missingCurrent
    ? null
    : exampleLabel
      ? `${exampleLabel} · ${
          baseline
            ? `${baseline.year} ${baseline.make} ${baseline.model} ${baseline.engine}`
            : `${currentIn!.year} ${currentIn!.make} ${currentIn!.model}`
        }`
      : baseline
        ? `${baseline.year} ${baseline.make} ${baseline.model} ${baseline.engine}`
        : `${currentIn!.year} ${currentIn!.make} ${currentIn!.model}`

  // Build candidate effective fields (CSV row + OEM merge)
  const cand: Partial<CandidateVehicle> = candRow || {
    year: num(merged.year) || 0,
    make: String(merged.make || ''),
    model: String(merged.model || ''),
    trim: String(merged.trim || ''),
    bodyType: merged.bodyType === 'van' ? 'van' : 'truck',
    payloadLb: num(merged.payload) ?? num(merged.payloadLb),
    towLb: num(merged.tow) ?? num(merged.towingLb),
    towLbNoWdh: num(merged.towLbNoWdh) ?? num(merged.tow) ?? num(merged.towingLb),
    towLbWdh: num(merged.towLbWdh) ?? num(merged.tow) ?? num(merged.towingLb),
    epaRangeMi: num(merged.ratedRange) ?? num(merged.epaRangeMi),
    rangeBasis: null,
    epaKwhPer100mi: num(merged.epaKwhPer100mi),
    usableKwh: num((merged.battery as { usableKwh?: number })?.usableKwh) ?? num(merged.usableKwh),
    seats: num(merged.seats),
    battWarrantyYr: num(merged.battWarrantyYr),
    battWarrantyMi: num(merged.battWarrantyMi),
    warrantyProgram:
      normalizeWarrantyType(
        merged.warrantyType ?? merged.warrantyProgram,
      ) === 'commercial_fleet'
        ? 'commercial'
        : 'consumer',
    retained3yrPct: [],
    recallCampaignsMy: num(merged.recallCampaignsMy),
    recallUrl: null,
    failurePatterns: [],
    maintClass: merged.bodyType === 'van' ? 'van' : 'ev-pickup',
    epaSourceUrl: null,
    payloadSourceUrl: null,
    towSourceUrl: null,
    warrantySourceUrl: null,
  }

  const isVanCand = cand.bodyType === 'van'
  const isVanCur = baseline?.bodyType === 'van'

  // --- Category cells (score each side, then pair-drop) ---
  const curMiles = currentIn?.miles ?? null
  const notEntered = () =>
    cell(null, {
      status: STATUS.NOT_ENTERED,
      reason: '',
      counted: false,
    })

  // 1 Range
  const curRangeMi =
    baseline && baseline.epaCombMpg != null && baseline.fuelTankGal != null
      ? baseline.epaCombMpg * baseline.fuelTankGal
      : null
  let c1curFinal = missingCurrent
    ? notEntered()
    : baseline
      ? scoreRange(curRangeMi, job.dailyMiles, baseline.epaSourceUrl, 'EPA tank')
      : cell(null, {
          status: STATUS.notScored('current vehicle'),
          reason: STATUS.notScored('current vehicle'),
          counted: false,
        })
  if (baseline && baselineNote && c1curFinal.counted) {
    c1curFinal.reason += ` · ${baselineNote}`
  }
  // Gas vans: use Fuelly for range via mpg × tank
  if (!missingCurrent && baseline && isVanCur && baseline.fuellyMpg != null && baseline.fuelTankGal != null) {
    const fuellyLabel = `${baseline.fuellyMpg} mpg Fuelly (estimate)`
    c1curFinal = scoreRange(
      baseline.fuellyMpg * baseline.fuelTankGal,
      job.dailyMiles,
      baseline.fuellyUrl,
      fuellyLabel,
    )
  } else if (!missingCurrent && baseline && isVanCur && !baseline.fuellyMpg) {
    c1curFinal = cell(null, {
      status: 'Not scored: mpg not published (van >8,500 GVWR)',
      reason: 'Not scored: mpg not published (van >8,500 GVWR)',
      counted: false,
    })
  }
  const rangeBasis =
    cand.rangeBasis && !/^EPA$/i.test(cand.rangeBasis)
      ? 'OEM estimate, not EPA'
      : 'EPA'
  const c1cand = scoreRange(
    cand.epaRangeMi ?? null,
    job.dailyMiles,
    cand.epaSourceUrl ?? null,
    rangeBasis,
  )
  const p1 = missingCurrent
    ? { current: notEntered(), candidate: c1cand }
    : pairCells(c1curFinal, c1cand)

  // 2 Payload — section F low-end rule for baselines; listing/OEM low for candidates
  const curCab = currentIn?.cab || (intake?.cab as string) || null
  const listingPayload = num(merged.payload) ?? num(merged.payloadLb)
  const baselinePayloadHit = baseline
    ? lookupBaselinePayload({
        year: baseline.year,
        make: baseline.make,
        model: baseline.model,
        engine: baseline.engine,
        drivetrain: baseline.drivetrain,
        cab: curCab,
      })
    : null
  const loadNote =
    pkg?.jobDefaults && typeof (pkg.jobDefaults as { loadNote?: string }).loadNote === 'string'
      ? String((pkg.jobDefaults as { loadNote: string }).loadNote)
      : null
  const loadUrl =
    pkg?.jobDefaults && typeof (pkg.jobDefaults as { loadUrl?: string }).loadUrl === 'string'
      ? String((pkg.jobDefaults as { loadUrl: string }).loadUrl)
      : null
  // Towing jobs: payload load = loadLb + tongue (15% of trailer when tongue unset).
  // loadLb null → Not scored (do not invent trade payload from tongue alone).
  const payloadLoadLb = effectivePayloadLoadLb(job)
  const c2cur = missingCurrent
    ? notEntered()
    : baseline
      ? (() => {
          const cell2 = scorePayload(
            baselinePayloadHit?.payloadLb ?? baseline.payloadLb,
            payloadLoadLb,
            null,
            job.cargoCuFt,
            baselinePayloadHit?.url ?? loadUrl,
            isVanCur,
            baselinePayloadHit?.reasonLabel ?? null,
          )
          if (loadNote) {
            const note = scrubPublicReason(loadNote)
            cell2.reason = cell2.reason
              ? `${cell2.reason} · ${note}${loadUrl ? ` (${loadUrl})` : ''}`
              : `${note}${loadUrl ? ` (${loadUrl})` : ''}`
          }
          return cell2
        })()
      : cell(null, {
          status: STATUS.notScored('current payload'),
          reason: STATUS.notScored('current payload'),
          counted: false,
        })
  // Candidate: G-final shrink-the-lead low (cand.payloadLb) when present; else OEM/listing
  const oemOrListingPayload =
    num(unit.payload) ??
    num((unit as { payloadLb?: unknown }).payloadLb) ??
    listingPayload
  const candPayload =
    cand.payloadLb != null
      ? cand.payloadLb
      : oemOrListingPayload ?? null
  const candPayloadLabel =
    candPayload != null
      ? cand.payloadLb != null &&
        oemOrListingPayload != null &&
        cand.payloadLb < oemOrListingPayload
        ? `${candPayload.toLocaleString()} lb (lowest config)`
        : `${candPayload.toLocaleString()} lb`
      : null
  const c2cand = scorePayload(
    candPayload,
    payloadLoadLb,
    num(merged.cargoCuFt),
    job.cargoCuFt,
    cand.payloadSourceUrl ?? null,
    isVanCand,
    candPayloadLabel,
  )
  const p2 = missingCurrent
    ? { current: notEntered(), candidate: c2cand }
    : pairCells(c2cur, c2cand)

  // 3 Cab / seats — f_seat_counts.csv
  const curSeatHit = baseline
    ? lookupSeats({
        year: baseline.year,
        make: baseline.make,
        model: baseline.model,
        cab: curCab,
        listingSeats: null,
        side: 'current',
      })
    : null
  const candSeatHit = lookupSeats({
    year: num(merged.year) || cand.year || 0,
    make: String(cand.make || merged.make),
    model: String(cand.model || merged.model),
    cab: (merged.cab as string) || null,
    listingSeats: num(merged.seats),
    side: 'candidate',
  })
  const crewNote =
    pkg?.jobDefaults && typeof (pkg.jobDefaults as { crewNote?: string }).crewNote === 'string'
      ? String((pkg.jobDefaults as { crewNote: string }).crewNote)
      : null
  const c3cur = missingCurrent
    ? notEntered()
    : (() => {
        const cell3 = scoreCab(
          curSeatHit?.seats ?? baseline?.seats ?? null,
          job.crew,
          curSeatHit?.reasonLabel ?? null,
          baseline ? isGasCargoVanModel(baseline.make, baseline.model) : false,
        )
        if (crewNote) {
          const note = scrubPublicReason(crewNote)
          if (cell3.reason) cell3.reason += ` · ${note}`
          else cell3.reason = note
        }
        return cell3
      })()
  const c3cand = scoreCab(
    candSeatHit?.seats ?? cand.seats ?? null,
    job.crew,
    candSeatHit?.reasonLabel ?? null,
    isGasCargoVanModel(String(cand.make || merged.make), String(cand.model || merged.model)),
  )
  const p3 = missingCurrent
    ? { current: notEntered(), candidate: c3cand }
    : pairCells(c3cur, c3cand)

  // 4 Tow
  const c4cand = scoreTow(
    job.tows,
    job.trailerLb,
    job.wdh,
    cand.towLbWdh ?? cand.towLb ?? null,
    cand.towLbNoWdh ?? null,
    cand.towSourceUrl ?? null,
  )
  const p4 =
    job.tows === false || job.tows == null
      ? bothNotUsed()
      : missingCurrent
        ? { current: notEntered(), candidate: c4cand }
        : pairCells(
            baseline?.towLb == null && job.tows
              ? cell(null, {
                  status: STATUS.notScored('current tow rating'),
                  reason: STATUS.notScored('current tow rating'),
                  counted: false,
                })
              : scoreTow(
                  job.tows,
                  job.trailerLb,
                  job.wdh,
                  baseline?.towLb ?? null,
                  baseline?.towLb ?? null,
                  null,
                ),
            c4cand,
          )

  // 5 Resale
  const c5cand = scoreResale(cand.retained3yrPct || [], 'candidate')
  const p5 = missingCurrent
    ? { current: notEntered(), candidate: c5cand }
    : pairCells(scoreResale(baseline?.retained3yrPct || [], 'current'), c5cand)

  // 6 Reliability
  const c6cand = scoreReliability(
    cand.recallCampaignsMy ?? null,
    cand.failurePatterns || [],
    cand.recallUrl ?? null,
    false,
  )
  const p6 = missingCurrent
    ? { current: notEntered(), candidate: c6cand }
    : pairCells(
        baseline
          ? scoreReliability(
              baseline.recallCampaignsMy,
              baseline.failurePatterns,
              baseline.recallUrl,
              true,
            )
          : cell(null, {
              status: STATUS.notScored('recall campaign count'),
              reason: STATUS.notScored('recall campaign count'),
              counted: false,
            }),
        c6cand,
      )

  // 7 Service — f_service_distance.csv at Vero Beach
  const c7cand = scoreService(
    String(cand.make || merged.make),
    job.shopCity,
    true,
    String(cand.model || merged.model),
  )
  const p7 = missingCurrent
    ? { current: notEntered(), candidate: c7cand }
    : pairCells(
        baseline
          ? scoreService(baseline.make, job.shopCity, false, baseline.model)
          : cell(null, {
              status: STATUS.notScored('current service distance'),
              reason: STATUS.notScored('current service distance'),
              counted: false,
            }),
        c7cand,
      )

  // 8 Longevity — G-final: 20 points; warranty_type commercial|consumer|unconfirmed
  const candMiles =
    num((unit as { scoreMileage?: unknown }).scoreMileage) ?? num(merged.mileage)
  const candWarrantyType: WarrantyType = normalizeWarrantyType(
    merged.warrantyType ?? merged.warrantyProgram ?? cand.warrantyProgram,
  )
  const candUpfit = normalizeUpfit(merged.upfit ?? 'none')
  const defaultsBatt = defaultEvBattTerms(
    String(cand.make || merged.make),
    String(cand.model || merged.model),
  )
  const c8cand = scoreLongevity({
    isEv: true,
    year: num(merged.year) || cand.year || 0,
    miles: candMiles,
    battYr: cand.battWarrantyYr ?? defaultsBatt?.yr ?? null,
    battMi: cand.battWarrantyMi ?? defaultsBatt?.mi ?? null,
    powerYr: null,
    powerMi: null,
    make: String(cand.make || merged.make),
    model: String(cand.model || merged.model),
    warrantyType: candWarrantyType,
    oemWrittenConfirmation: Boolean(merged.oemWrittenConfirmation),
    warrantyUrl: cand.warrantySourceUrl ?? null,
    upfit: candUpfit,
    isCandidate: true,
  })
  const p8 = missingCurrent
    ? { current: notEntered(), candidate: c8cand }
    : pairCells(
        baseline
          ? scoreLongevity({
              isEv: false,
              year: baseline.year,
              miles: curMiles,
              battYr: null,
              battMi: null,
              powerYr: baseline.powertrainWarrantyYr,
              powerMi: baseline.powertrainWarrantyMi,
              make: baseline.make,
              model: baseline.model,
              warrantyType: currentIn?.warrantyType || 'unconfirmed',
              oemWrittenConfirmation: false,
              warrantyUrl: baseline.warrantySourceUrl,
              upfit: 'none',
              fleetAccount: Boolean(currentIn?.fleetAccount),
              isCandidate: false,
            })
          : cell(null, {
              status: STATUS.notScored('warranty terms'),
              reason: '',
              counted: false,
            }),
        c8cand,
      )

  // 9 Energy
  const c9cand = scoreEnergyEv(
    cand.epaKwhPer100mi ?? null,
    cand.energyUrl ?? cand.epaSourceUrl ?? null,
    cand.energyBasis ?? null,
  )
  const p9 = missingCurrent
    ? { current: notEntered(), candidate: c9cand }
    : pairCells(
        baseline
          ? scoreEnergyGas(
              baseline.epaCombMpg,
              baseline.epaFuel,
              baseline.epaSourceUrl,
              baseline.fuellyMpg != null
                ? {
                    mpg: baseline.fuellyMpg,
                    url: baseline.fuellyUrl,
                    label: baseline.fuellyLabel,
                  }
                : null,
              isVanCur,
            )
          : cell(null, {
              status: STATUS.notScored('mpg'),
              reason: STATUS.notScored('mpg'),
              counted: false,
            }),
        c9cand,
      )

  // 10 Maintenance — same-basis rule (G-final: Transit Argonne; EV vans lack it → drop)
  const c10cand = scoreMaint(cand.maintClass ?? null, Boolean(isVanCand))
  const c10cur = missingCurrent
    ? notEntered()
    : isVanCur
      ? scoreMaint('van', true, { argonVanCurrent: true })
      : scoreMaint(baseline?.maintClass ?? null, Boolean(isVanCur))
  const p10 = missingCurrent
    ? { current: notEntered(), candidate: c10cand }
    : isVanCur && !isVanCand
      ? // Transit Argonne vs EV pickup AAA — different basis → both drop
        bothNotScored('van maintenance cost')
      : isVanCur && isVanCand
        ? // EV van lacks Argonne → both Not scored
          bothNotScored('van maintenance cost')
        : pairCells(c10cur, c10cand)

  const pairs = [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10]
  const categories: CategoryRow[] = CATEGORY_KEYS.map((key, i) => ({
    key,
    label: CATEGORY_LABELS[key],
    current: pairs[i].current,
    candidate: pairs[i].candidate,
  }))

  let currentTotal = 0
  let candidateTotal = 0
  let pp = 0
  for (const row of categories) {
    const catMax = row.key === 'longevity' ? WARRANTY_MAX : 10
    if (missingCurrent) {
      if (row.candidate.counted) {
        candidateTotal += row.candidate.points || 0
        pp += catMax
      }
    } else if (row.current.counted && row.candidate.counted) {
      currentTotal += row.current.points || 0
      candidateTotal += row.candidate.points || 0
      pp += catMax
    }
  }
  currentTotal = round1(currentTotal)
  candidateTotal = round1(candidateTotal)
  const difference = missingCurrent ? null : round1(candidateTotal - currentTotal)

  // §1.6 G-final: incomplete when PP < 2/3 of job-applicable (66.7 with tow not used)
  const incomplete = pp < POINTS_FLOOR
  const incompleteLabel = incomplete ? incompleteLabelFromCategories(categories) : null
  const banner =
    missingCurrent && !incomplete ? STATUS.ADD_CURRENT_BANNER : null

  const hf3 = hf3Title(merged)
  const hardReject = hf3.status === 'reject'
  const hardFlag = hf3.status === 'flag'

  const sidegrade =
    !missingCurrent &&
    curMiles != null &&
    candMiles != null &&
    Math.abs(curMiles - candMiles) / Math.max(curMiles, 1) < 0.15

  const sortKey = hardReject
    ? -1
    : incomplete
      ? 0
      : pp > 0
        ? candidateTotal / pp
        : 0

  // Polish 2 / §1.6: incomplete → no total, no difference on card or readout
  const dialTotal = incomplete || pp <= 0 ? null : `${candidateTotal.toFixed(1)} out of ${pp}`
  const dialDiff =
    incomplete || missingCurrent || difference == null
      ? null
      : `${difference > 0 ? '+' : ''}${difference.toFixed(1)} vs current`
  const dialCurrent =
    incomplete || missingCurrent ? null : `Current ${currentTotal.toFixed(1)}`

  return {
    build: SCORE_V2_BUILD,
    version: 2,
    currentName,
    candidateName,
    categories,
    currentTotal: incomplete || missingCurrent ? null : currentTotal,
    candidateTotal: incomplete ? null : candidateTotal,
    pointsPossible: pp,
    difference: incomplete || missingCurrent ? null : difference,
    incomplete,
    incompleteLabel,
    missingCurrent,
    banner,
    dialTotal,
    dialDiff,
    dialCurrent,
    sortKey,
    hardReject,
    hardFlag,
    sidegrade,
    total: incomplete ? null : candidateTotal,
    helps: [],
    watchOuts: [],
  }
}

function hf3Title(unit: Record<string, unknown>) {
  const title = String(unit.titleStatus || unit.title || '')
  if (/salvage|flood|lemon|rebuilt/i.test(title)) {
    return { status: 'reject' as const, label: 'Title brand' }
  }
  if (/warranty\s*void/i.test(title)) {
    return { status: 'reject' as const, label: 'Warranty void' }
  }
  return { status: 'ok' as const, label: '' }
}

export function rankUnitsByScoreV2(
  units: Record<string, unknown>[],
  ctx: {
    intake?: Record<string, unknown> | null
    pkg?: {
      currentMileage?: number
      currentVehicle?: Record<string, unknown> | null
      jobDefaults?: Record<string, unknown> | null
    } | null
  },
) {
  return [...units]
    .map((unit) => ({
      unit,
      score: scoreReplacementV2(unit, ctx),
    }))
    .sort((a, b) => {
      if (a.score.hardReject !== b.score.hardReject) {
        return a.score.hardReject ? 1 : -1
      }
      if (b.score.sortKey !== a.score.sortKey) return b.score.sortKey - a.score.sortKey
      const priceA = num(a.unit.askPrice) ?? Number.POSITIVE_INFINITY
      const priceB = num(b.unit.askPrice) ?? Number.POSITIVE_INFINITY
      if (priceA !== priceB) return priceA - priceB
      const miA = num(a.unit.mileage) ?? Number.POSITIVE_INFINITY
      const miB = num(b.unit.mileage) ?? Number.POSITIVE_INFINITY
      return miA - miB
    })
}

/** §6 validation helper — section F re-run */
export function scoreV2ValidationExample(
  warrantyType: WarrantyType = 'consumer',
  upfit: UpfitKind = 'none',
) {
  const intake = {
    job: {
      dailyMiles: 120,
      loadLb: 1000,
      crew: 2,
      tows: false,
      shopCity: 'Vero Beach',
    },
    current: {
      year: 2018,
      make: 'Ford',
      model: 'F-150',
      engine: 'EcoBoost 3.5L',
      drivetrain: '4x4',
      miles: 120000,
      // cab not entered
    },
    rolePreset: 'Supervisor and team lead',
  }
  const unit = {
    id: 'unit-r1t-val',
    year: 2022,
    make: 'Rivian',
    model: 'R1T',
    trim: 'Adventure',
    mileage: 41446,
    askPrice: 53343,
    bodyType: 'truck',
    warrantyType,
    upfit,
  }
  return scoreReplacementV2(unit, { intake })
}
