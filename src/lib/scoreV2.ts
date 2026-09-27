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
  SCORE_V2_BUILD,
  SCORE_DATE,
  STATUS,
  lin,
  round1,
  clampScore,
  type CategoryKey,
} from '../data/scoreV2Rubric'
import {
  lookupBaseline,
  MAINT_CLASS_AAA,
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
} from '../data/warrantyRules'
import { nearestService } from '../data/serviceNetwork'
import { mergeOemSpecs } from '../data/oemSpecs'

export { SCORE_V2_BUILD }

export type JobInputs = {
  dailyMiles: number | null
  loadLb: number | null
  cargoCuFt: number | null
  crew: number | null
  tows: boolean | null
  trailerLb: number | null
  wdh: boolean | null
  shopCity: string | null
}

export type CurrentVehicleInput = {
  year: number | null
  make: string | null
  model: string | null
  engine: string | null
  drivetrain: string | null
  miles: number | null
  warrantyProgram?: 'consumer' | 'commercial' | null
  oemWrittenConfirmation?: boolean
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
  /** Dial: NN.N / PP */
  dialTotal: string | null
  dialDiff: string | null
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

function cell(
  points: number | null,
  opts: {
    status?: string | null
    reason: string
    url?: string | null
    counted?: boolean
    atRisk?: boolean
  },
): CellResult {
  const counted = opts.counted !== false && points != null && !opts.status?.startsWith('Not ')
  let display: string
  if (opts.status === STATUS.NOT_USED) display = STATUS.NOT_USED
  else if (opts.status?.startsWith('Not scored')) display = opts.status
  else if (points == null) display = opts.status || STATUS.notScored('data')
  else if (opts.atRisk) display = `${round1(points).toFixed(1)} · ${STATUS.AT_RISK}`
  else display = round1(points).toFixed(1)
  return {
    points: points == null ? null : round1(points),
    status: opts.status || (opts.atRisk ? STATUS.AT_RISK : null),
    display,
    reason: opts.reason,
    url: opts.url || null,
    counted: Boolean(counted && !opts.status?.startsWith('Not ')),
  }
}

function bothNotUsed(reason = STATUS.NOT_USED): { current: CellResult; candidate: CellResult } {
  const c = cell(null, { status: STATUS.NOT_USED, reason, counted: false })
  return { current: c, candidate: { ...c } }
}

function bothNotScored(field: string, kind: 'published' | 'entered' = 'published', url: string | null = null) {
  const status = STATUS.notScored(field, kind)
  const c = cell(null, { status, reason: status, url, counted: false })
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
  return cell(pts, {
    reason: `${publishedRange} mi ${basisNote} × ${RANGE_BUFFER} = ${round1(usable)} mi usable vs ${dailyMiles} mi/day (ratio ${ratio.toFixed(2)})`,
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
      status: STATUS.notScored('payload'),
      reason: STATUS.notScored('payload'),
      url,
      counted: false,
    })
  }
  const ratio = payloadLb / loadLb
  let pts = clampScore(lin(ratio, PAYLOAD_ANCHORS))
  let reason = `${payloadLb.toLocaleString()} lb rated payload vs ${loadLb.toLocaleString()} lb load (ratio ${ratio.toFixed(2)})`
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

function scoreCab(seats: number | null, crew: number | null) {
  if (crew == null) {
    return cell(null, {
      status: STATUS.notScored('crew', 'entered'),
      reason: STATUS.notScored('crew', 'entered'),
      counted: false,
    })
  }
  if (seats == null) {
    return cell(null, {
      status: STATUS.notScored('seating'),
      reason: STATUS.notScored('seating'),
      counted: false,
    })
  }
  const short = crew - seats
  let pts = 10
  if (short <= 0) pts = 10
  else if (short === 1) pts = 4
  else pts = 0
  return cell(pts, {
    reason: `${seats} seats vs crew ${crew}`,
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
  const reason = `${campaigns} NHTSA campaigns MY${allEnginesNote ? ' (all engines/body styles; open status not checked; no VIN lookup)' : ' (open status not checked; no VIN lookup)'} · ${patStr}`
  return cell(pts, { reason, url })
}

function scoreService(make: string, shopCity: string | null, isCandidate: boolean) {
  if (!shopCity) {
    return cell(null, {
      status: STATUS.notScored('shop location', 'entered'),
      reason: STATUS.notScored('shop location', 'entered'),
      counted: false,
    })
  }
  const n = nearestService(make, shopCity)
  if (n.miles == null) {
    const field = isCandidate
      ? 'service distance'
      : 'current service distance'
    return cell(null, {
      status: STATUS.notScored(field),
      reason: STATUS.notScored(field),
      counted: false,
    })
  }
  let pts = clampScore(lin(n.miles, SERVICE_MI_ANCHORS))
  let reason = `Nearest ${make} service: ${n.location?.location || 'Not published'}, ${n.miles} mi road (OSRM)`
  if (n.mobile?.available) {
    pts = Math.min(10, pts + 2)
    reason += ` · ${make} Mobile Service available (+2)`
  }
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
  warrantyProgram: 'consumer' | 'commercial' | null
  oemWrittenConfirmation: boolean
  warrantyUrl: string | null
}) {
  if (opts.miles == null) {
    return cell(null, {
      status: STATUS.notScored('current miles', 'entered'),
      reason: STATUS.notScored('current miles', 'entered'),
      counted: false,
    })
  }
  const exclusion = lookupCommercialExclusion(opts.make, opts.model)
  const commercialOk =
    opts.warrantyProgram === 'commercial' || opts.oemWrittenConfirmation === true

  if (exclusion && !commercialOk) {
    return cell(0, {
      atRisk: true,
      reason: `At risk: ${opts.make} consumer warranty excludes vehicles used primarily for business or commercial purposes (Warranty Guide eff. ${exclusion.effective}, Exclusions). 0 warranty points unless on Rivian Commercial warranty or Rivian confirms in writing.`,
      url: exclusion.url,
      counted: true,
    })
  }

  let wYr = opts.isEv ? opts.battYr : opts.powerYr
  let wMi = opts.isEv ? opts.battMi : opts.powerMi
  let url = opts.warrantyUrl

  if (opts.warrantyProgram === 'commercial' && /rivian/i.test(opts.make)) {
    wYr = RIVIAN_COMMERCIAL_WARRANTY.battWarrantyYr
    wMi = RIVIAN_COMMERCIAL_WARRANTY.battWarrantyMi
    url = RIVIAN_COMMERCIAL_WARRANTY.url
  }

  if (wYr == null || wMi == null) {
    return cell(null, {
      status: STATUS.notScored('warranty terms'),
      reason: STATUS.notScored('warranty terms'),
      url,
      counted: false,
    })
  }

  // Warranty start = Jan 1 of model year (INFERENCE)
  const start = new Date(`${opts.year}-01-01T00:00:00Z`)
  const end = new Date(`${SCORE_DATE}T00:00:00Z`)
  const yearsUsed = Math.max(0, yearsBetween(start, end))
  const yearsLeft = Math.max(0, wYr - yearsUsed)
  const milesLeft = Math.max(0, wMi - opts.miles)
  const frac = Math.min(yearsLeft / wYr, milesLeft / wMi)
  let pts = clampScore(10 * frac)

  // Degradation modifier: only model-specific FACT — none in A/B today (class/anecdote never trigger)
  // Gas/diesel over 150k → −2
  if (!opts.isEv && opts.miles > 150000) pts = clampScore(pts - 2)

  const reason = `${opts.isEv ? 'battery/drivetrain' : 'powertrain'} ${wYr} yr/${(wMi / 1000).toFixed(0)}k · start Jan 1 ${opts.year} (INFERENCE) · ${yearsLeft.toFixed(2)} yr left, ${(milesLeft / 1000).toFixed(1)}k mi left`
  return cell(pts, { reason, url })
}

function scoreEnergyEv(kwhPer100: number | null, url: string | null) {
  if (!FL_COMMERCIAL_ELECTRICITY || FL_COMMERCIAL_ELECTRICITY.value == null) {
    return cell(null, { status: STATUS.FL_PRICE, reason: STATUS.FL_PRICE, counted: false })
  }
  if (kwhPer100 == null) {
    return cell(null, {
      status: STATUS.notScored('EPA efficiency'),
      reason: STATUS.notScored('EPA efficiency'),
      url,
      counted: false,
    })
  }
  const cpm = (kwhPer100 / 100) * FL_COMMERCIAL_ELECTRICITY.value
  const pts = clampScore(lin(cpm, ENERGY_CPM_ANCHORS))
  return cell(pts, {
    reason: `${kwhPer100} kWh/100 mi (EPA) × ${FL_COMMERCIAL_ELECTRICITY.value}¢/kWh FL commercial (EIA, Jul 2026) = ${cpm.toFixed(1)}¢/mi`,
    url: FL_COMMERCIAL_ELECTRICITY.url || url,
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
    reasonMpg = `Fuelly crowd-sourced mpg (INF, not EPA-rated: GVWR >8,500)`
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
    ? `${reasonMpg}: ${useMpg} mpg · $${price.value}/gal FL ${diesel ? 'diesel' : 'regular'} (AAA, 9/27/26) = ${cpm.toFixed(1)}¢/mi`
    : `$${price.value}/gal FL ${diesel ? 'diesel' : 'regular'} (AAA, 9/27/26) ÷ ${useMpg} mpg (EPA) = ${cpm.toFixed(1)}¢/mi${mid}`
  return cell(pts, { reason, url: price.url || mpgUrl })
}

function scoreMaint(maintClass: string | null, isVan: boolean) {
  if (isVan || maintClass === 'van') {
    return cell(null, {
      status: STATUS.notScored('van maintenance cost'),
      reason: STATUS.notScored('van maintenance cost'),
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

export function parseJobFromIntake(intake: Record<string, unknown> | null | undefined): JobInputs {
  const job = (intake?.job as Record<string, unknown>) || {}
  const daily =
    num(job.dailyMiles) ??
    num(intake?.dailyMiles) ??
    (typeof intake?.dailyMiles === 'string' && /^\d+/.test(intake.dailyMiles)
      ? num(String(intake.dailyMiles).match(/\d+/)?.[0])
      : null)
  // loadLb: top of payload bracket or explicit
  let loadLb = num(job.loadLb) ?? num(intake?.loadLb)
  if (loadLb == null) {
    const p = String(intake?.payload || job.payload || '')
    if (/light/i.test(p)) loadLb = 500
    else if (/medium/i.test(p)) loadLb = 1000
    else if (/heavy/i.test(p)) loadLb = 1500
  }
  const crew = num(job.crew) ?? num(intake?.crew)
  let tows: boolean | null = null
  if (job.tows === true || job.tows === false) tows = job.tows as boolean
  else if (intake?.tows === true || intake?.tows === false) tows = intake.tows as boolean
  else {
    const haul = String(intake?.haul || '')
    if (!haul || /none/i.test(haul)) tows = false
    else if (/not sure/i.test(haul)) tows = null
    else tows = true
  }
  const trailerLb = num(job.trailerLb) ?? num(intake?.trailerLb)
  const wdh =
    job.wdh === true || intake?.wdh === true
      ? true
      : job.wdh === false || intake?.wdh === false
        ? false
        : null
  const shopCity =
    (job.shopCity as string) ||
    (intake?.shopCity as string) ||
    inferShopCity(String(intake?.address || ''))
  const cargoCuFt = num(job.cargoCuFt) ?? num(intake?.cargoCuFt)
  return {
    dailyMiles: daily,
    loadLb,
    cargoCuFt,
    crew,
    tows,
    trailerLb,
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
  pkg?: { currentMileage?: number } | null,
): CurrentVehicleInput | null {
  const cur = (intake?.current as Record<string, unknown>) || {}
  const year = num(cur.year) ?? num(intake?.currentYear)
  const make = (cur.make as string) || (intake?.currentMake as string) || null
  const model = (cur.model as string) || (intake?.currentModel as string) || null
  const engine = (cur.engine as string) || (intake?.currentEngine as string) || null
  const drivetrain =
    (cur.drivetrain as string) || (intake?.currentDrivetrain as string) || null
  const miles =
    num(cur.miles) ??
    num(intake?.currentMiles) ??
    num(intake?.currentMileage) ??
    num(pkg?.currentMileage)
  // tradeInModel free text parse: "2018 Ford F-150 3.5 EcoBoost 4x4"
  if ((!year || !make || !model) && intake?.tradeInModel) {
    const parsed = parseTradeInModel(String(intake.tradeInModel))
    if (parsed) {
      return {
        year: year || parsed.year,
        make: make || parsed.make,
        model: model || parsed.model,
        engine: engine || parsed.engine,
        drivetrain: drivetrain || parsed.drivetrain,
        miles,
        warrantyProgram: (cur.warrantyProgram as 'consumer' | 'commercial') || null,
        oemWrittenConfirmation: Boolean(cur.oemWrittenConfirmation),
      }
    }
  }
  if (!year || !make || !model) return null
  return {
    year,
    make,
    model,
    engine,
    drivetrain,
    miles,
    warrantyProgram: (cur.warrantyProgram as 'consumer' | 'commercial') || null,
    oemWrittenConfirmation: Boolean(cur.oemWrittenConfirmation),
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
    pkg?: { currentMileage?: number } | null
    scoringDate?: string
  } = {},
): ScoreV2Result {
  const intake = opts.intake || null
  const job = parseJobFromIntake(intake)
  const currentIn = parseCurrentFromIntake(intake, opts.pkg)
  const merged = mergeOemSpecs(unit) as Record<string, unknown>
  const candRow = lookupCandidate({
    year: num(merged.year) ?? undefined,
    make: String(merged.make || ''),
    model: String(merged.model || ''),
    trim: String(merged.trim || ''),
  })

  const candidateName = `${merged.year} ${merged.make} ${merged.model}${merged.trim ? ` ${merged.trim}` : ''}`

  if (!currentIn) {
    const emptyCats: CategoryRow[] = CATEGORY_KEYS.map((key) => ({
      key,
      label: CATEGORY_LABELS[key],
      current: cell(null, {
        status: STATUS.INCOMPLETE_CURRENT,
        reason: STATUS.INCOMPLETE_CURRENT,
        counted: false,
      }),
      candidate: cell(null, {
        status: STATUS.INCOMPLETE_CURRENT,
        reason: STATUS.INCOMPLETE_CURRENT,
        counted: false,
      }),
    }))
    return {
      build: SCORE_V2_BUILD,
      version: 2,
      currentName: null,
      candidateName,
      categories: emptyCats,
      currentTotal: null,
      candidateTotal: null,
      pointsPossible: 0,
      difference: null,
      incomplete: true,
      incompleteLabel: STATUS.INCOMPLETE_CURRENT,
      dialTotal: null,
      dialDiff: null,
      sortKey: 0,
      hardReject: false,
      hardFlag: false,
      sidegrade: false,
      total: null,
      helps: [],
      watchOuts: [],
    }
  }

  const { vehicle: baseline, reasonNote: baselineNote } = lookupBaseline(currentIn)
  const currentName = baseline
    ? `${baseline.year} ${baseline.make} ${baseline.model} ${baseline.engine}${baselineNote ? '' : ''}`
    : `${currentIn.year} ${currentIn.make} ${currentIn.model}`

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
    warrantyProgram: (merged.warrantyProgram as 'consumer' | 'commercial') || 'consumer',
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
  const curMiles = currentIn.miles

  // 1 Range
  const curRangeMi =
    baseline && baseline.epaCombMpg != null && baseline.fuelTankGal != null
      ? baseline.epaCombMpg * baseline.fuelTankGal
      : null
  const c1cur = baseline
    ? scoreRange(curRangeMi, job.dailyMiles, baseline.epaSourceUrl, 'EPA tank')
    : cell(null, { status: STATUS.notScored('current vehicle'), reason: STATUS.notScored('current vehicle'), counted: false })
  if (baseline && baselineNote && c1cur.counted) {
    c1cur.reason += ` · ${baselineNote}`
  }
  // Gas vans: use Fuelly for range via mpg × tank
  let c1curFinal = c1cur
  if (baseline && isVanCur && baseline.fuellyMpg != null && baseline.fuelTankGal != null) {
    c1curFinal = scoreRange(
      baseline.fuellyMpg * baseline.fuelTankGal,
      job.dailyMiles,
      baseline.fuellyUrl,
      'Fuelly INF tank',
    )
  } else if (baseline && isVanCur && !baseline.fuellyMpg) {
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
  const p1 = pairCells(c1curFinal, c1cand)

  // 2 Payload
  const c2cur = baseline
    ? scorePayload(baseline.payloadLb, job.loadLb, null, job.cargoCuFt, null, isVanCur)
    : cell(null, { status: STATUS.notScored('current payload'), reason: STATUS.notScored('current payload'), counted: false })
  // Force gap message for gas pickup with null payload
  const c2curFixed =
    baseline && baseline.payloadLb == null
      ? cell(null, {
          status: STATUS.notScored('current payload'),
          reason: STATUS.notScored('current payload'),
          counted: false,
        })
      : c2cur
  const c2cand = scorePayload(
    cand.payloadLb ?? null,
    job.loadLb,
    num(merged.cargoCuFt),
    job.cargoCuFt,
    cand.payloadSourceUrl ?? null,
    isVanCand,
  )
  const p2 = pairCells(c2curFixed, c2cand)

  // 3 Cab
  const c3cur = scoreCab(baseline?.seats ?? null, job.crew)
  const c3cand = scoreCab(cand.seats ?? null, job.crew)
  const p3 = pairCells(c3cur, c3cand)

  // 4 Tow
  const c4cur = scoreTow(
    job.tows,
    job.trailerLb,
    job.wdh,
    baseline?.towLb ?? null,
    baseline?.towLb ?? null,
    null,
  )
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
      : pairCells(
          baseline?.towLb == null && job.tows
            ? cell(null, {
                status: STATUS.notScored('current tow rating'),
                reason: STATUS.notScored('current tow rating'),
                counted: false,
              })
            : c4cur,
          c4cand,
        )

  // 5 Resale
  const c5cur = scoreResale(baseline?.retained3yrPct || [], 'current')
  const c5cand = scoreResale(cand.retained3yrPct || [], 'candidate')
  const p5 = pairCells(c5cur, c5cand)

  // 6 Reliability
  const c6cur = baseline
    ? scoreReliability(
        baseline.recallCampaignsMy,
        baseline.failurePatterns,
        baseline.recallUrl,
        true,
      )
    : cell(null, { status: STATUS.notScored('recall campaign count'), reason: STATUS.notScored('recall campaign count'), counted: false })
  const c6cand = scoreReliability(
    cand.recallCampaignsMy ?? null,
    cand.failurePatterns || [],
    cand.recallUrl ?? null,
    false,
  )
  const p6 = pairCells(c6cur, c6cand)

  // 7 Service
  const c7cur = baseline
    ? scoreService(baseline.make, job.shopCity, false)
    : cell(null, {
        status: STATUS.notScored('current service distance'),
        reason: STATUS.notScored('current service distance'),
        counted: false,
      })
  const c7cand = scoreService(String(cand.make || merged.make), job.shopCity, true)
  const p7 = pairCells(c7cur, c7cand)

  // 8 Longevity — current miles used for BOTH (candidate uses its own listing miles)
  const candMiles = num(merged.mileage)
  const c8cur = baseline
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
        warrantyProgram: null,
        oemWrittenConfirmation: false,
        warrantyUrl: baseline.warrantySourceUrl,
      })
    : cell(null, { status: STATUS.notScored('warranty terms'), reason: STATUS.notScored('warranty terms'), counted: false })
  const c8cand = scoreLongevity({
    isEv: true,
    year: num(merged.year) || cand.year || 0,
    miles: candMiles,
    battYr: cand.battWarrantyYr ?? null,
    battMi: cand.battWarrantyMi ?? null,
    powerYr: null,
    powerMi: null,
    make: String(cand.make || merged.make),
    model: String(cand.model || merged.model),
    warrantyProgram: (merged.warrantyProgram as 'consumer' | 'commercial') || cand.warrantyProgram || 'consumer',
    oemWrittenConfirmation: Boolean(merged.oemWrittenConfirmation),
    warrantyUrl: cand.warrantySourceUrl ?? null,
  })
  // Longevity: if current miles missing, both drop; if candidate miles missing for cand — still need pair rule
  let p8 = pairCells(c8cur, c8cand)
  // Special: At risk stays counted — pairCells already keeps both if both counted
  // If current expired at 0 and candidate At risk at 0, both counted ✓

  // 9 Energy
  const c9cur = baseline
    ? scoreEnergyGas(
        baseline.epaCombMpg,
        baseline.epaFuel,
        baseline.epaSourceUrl,
        baseline.fuellyMpg != null
          ? { mpg: baseline.fuellyMpg, url: baseline.fuellyUrl, label: baseline.fuellyLabel }
          : null,
        isVanCur,
      )
    : cell(null, { status: STATUS.notScored('mpg'), reason: STATUS.notScored('mpg'), counted: false })
  const c9cand = scoreEnergyEv(cand.epaKwhPer100mi ?? null, cand.epaSourceUrl ?? null)
  const p9 = pairCells(c9cur, c9cand)

  // 10 Maintenance
  const c10cur = scoreMaint(baseline?.maintClass ?? null, Boolean(isVanCur))
  const c10cand = scoreMaint(cand.maintClass ?? null, Boolean(isVanCand))
  const p10 = pairCells(c10cur, c10cand)

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
    if (row.current.counted && row.candidate.counted) {
      currentTotal += row.current.points || 0
      candidateTotal += row.candidate.points || 0
      pp += 10
    }
  }
  currentTotal = round1(currentTotal)
  candidateTotal = round1(candidateTotal)
  const difference = round1(candidateTotal - currentTotal)

  const incomplete = pp < POINTS_FLOOR
  const incompleteLabel = incomplete ? STATUS.INCOMPLETE_KEY : null

  const hf3 = hf3Title(merged)
  const hardReject = hf3.status === 'reject'
  const hardFlag = hf3.status === 'flag'

  // Similar miles soft label (does not affect score)
  const sidegrade =
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

  const dialTotal = incomplete ? null : `${candidateTotal.toFixed(1)} / ${pp}`
  const dialDiff =
    incomplete || difference == null
      ? null
      : `${difference > 0 ? '+' : ''}${difference.toFixed(1)} vs current`

  return {
    build: SCORE_V2_BUILD,
    version: 2,
    currentName,
    candidateName,
    categories,
    currentTotal: incomplete ? null : currentTotal,
    candidateTotal: incomplete ? null : candidateTotal,
    pointsPossible: pp,
    difference: incomplete ? null : difference,
    incomplete,
    incompleteLabel,
    dialTotal,
    dialDiff,
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
  ctx: { intake?: Record<string, unknown> | null; pkg?: { currentMileage?: number } | null },
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

/** §6 validation helper */
export function scoreV2ValidationExample() {
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
    },
    rolePreset: 'Supervisor / team lead',
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
    warrantyProgram: 'consumer',
  }
  return scoreReplacementV2(unit, { intake })
}
