/**
 * Per trade-in row score vs its index-matched replacement unit.
 * Reuses scoreReplacementV2 Current total on the same pointsPossible scale.
 */
import {
  FL_COMMERCIAL_ELECTRICITY,
  FL_DIESEL_AAA,
  FL_GAS_REGULAR_AAA,
} from '../data/flEnergyPrices'
import {
  ARGONNE_VAN_MAINT_CPM,
  MAINT_CLASS_AAA,
} from '../data/baselineVehicles'
import { RANGE_BUFFER, WARRANTY_MAX, round1 } from '../data/scoreV2Rubric'
import { scoreReplacementV2 } from './scoreV2'
import {
  scrubSheetReason as scrubSheetReasonImpl,
  hasBrokenSheetPunctuation,
  hasNestedOrChainedParens,
  hasExcessMoneyDecimals,
  VISIBLE_NOTE_MAX,
  formatFormulaSourceText,
  formulaSourceLines,
} from './tradeInScoreNotes'

export const TRADE_IN_SCORE_BUILD = 'trade-in-score-20261007-f'
export {
  scrubSheetReasonImpl as scrubSheetReason,
  hasBrokenSheetPunctuation,
  hasNestedOrChainedParens,
  hasExcessMoneyDecimals,
  VISIBLE_NOTE_MAX,
  formatFormulaSourceText,
  formulaSourceLines,
}

/** Duty-fit category keys grouped under one heading. */
export const DUTY_FIT_KEYS = Object.freeze(['range', 'cab', 'tow'])

/**
 * Infer trade-in body type from year/make/model text.
 * Van models: Transit, ProMaster, Sprinter, BrightDrop, EDV/RCV, etc.
 * Everything else defaults to pickup (truck).
 */
export function inferTradeInBodyType(row) {
  const text = `${row?.make || ''} ${row?.model || ''} ${row?.label || ''}`
  if (
    /transit|promaster|sprinter|bright\s*drop|e-?transit|\bedv\b|\brcv\b|nv200|metris|cargo\s*van/i.test(
      text,
    )
  ) {
    return 'van'
  }
  return 'truck'
}

export function unitBodyType(unit) {
  if (!unit) return null
  return unit.bodyType === 'van' ? 'van' : 'truck'
}

/**
 * Pair each trade-in row to a unique replacement unit of the same body type.
 * Consumes units in package order; does not reuse a unit across rows.
 */
export function pairTradeInsToUnits(rows, units) {
  const list = Array.isArray(rows) ? rows : []
  const pool = Array.isArray(units) ? [...units] : []
  return list.map((row) => {
    const want = inferTradeInBodyType(row)
    const idx = pool.findIndex((u) => unitBodyType(u) === want)
    if (idx < 0) return null
    const [unit] = pool.splice(idx, 1)
    return unit
  })
}

function scrubCellForSheet(cell) {
  if (!cell) return cell
  return {
    ...cell,
    reason: scrubSheetReasonImpl(cell.reason),
    // Keep display numbers; scrub jargon only from reason notes
  }
}

/** Plain Example default annual depreciation ($/yr). Not from a published source. */
export const EXAMPLE_DEPRECIATION_USD_PER_YEAR = 2500

const FACTOR_LABELS = Object.freeze({
  range: 'Range fit',
  payload: 'Payload and cargo',
  cab: 'Cab and crew',
  tow: 'Tow fit',
  resale: 'Resale 3-yr',
  reliability: 'Reliability',
  service: 'Service network',
  longevity: 'Age and miles',
  energy: 'Fuel or energy cost',
  maintenance: 'Maintenance cost, rises with age and miles',
})

/** Example-default assumption fields derived from the existing scoring engine. */
export function defaultScoreAssumptions(job = null) {
  const dailyFromJob =
    job?.dailyMiles != null && Number.isFinite(Number(job.dailyMiles))
      ? Number(job.dailyMiles)
      : null
  return {
    rangeBuffer: RANGE_BUFFER,
    gasUsdPerGal: FL_GAS_REGULAR_AAA?.value ?? null,
    dieselUsdPerGal: FL_DIESEL_AAA?.value ?? null,
    electricityCentsPerKwh: FL_COMMERCIAL_ELECTRICITY?.value ?? null,
    dailyMiles: dailyFromJob,
    depreciationUsdPerYear: EXAMPLE_DEPRECIATION_USD_PER_YEAR,
    /** Optional overrides for ownership dollars when engine side lacks ¢/mi. */
    energyUsdPerYearTradeIn: null,
    energyUsdPerYearReplacement: null,
    maintUsdPerYearTradeIn: null,
    maintUsdPerYearReplacement: null,
  }
}

/**
 * Metadata for the editable formula panel.
 * `sourced` true = value comes from engine data already in the app.
 * `sourced` false = input was missing; show editable Example default and say so.
 */
export function assumptionFieldMeta(assumptions, job = null) {
  const defaults = defaultScoreAssumptions(job)
  const dailyEntered =
    job?.dailyMiles != null && Number.isFinite(Number(job.dailyMiles))
  return [
    {
      key: 'rangeBuffer',
      label: 'Usable range buffer',
      unit: '×',
      step: '0.05',
      formula: 'published range × buffer = usable miles vs daily miles',
      sourced: true,
      sourceNote: 'Engine default (same buffer as unit score)',
      value: assumptions?.rangeBuffer ?? defaults.rangeBuffer,
      exampleDefault: defaults.rangeBuffer,
    },
    {
      key: 'dailyMiles',
      label: 'Daily miles',
      unit: 'mi/day',
      step: '1',
      formula: 'duty fit and annual energy cost use this daily miles figure',
      sourced: dailyEntered,
      sourceNote: dailyEntered
        ? 'From job inputs'
        : 'Not entered; Example default shown',
      value:
        assumptions?.dailyMiles != null
          ? assumptions.dailyMiles
          : defaults.dailyMiles ?? 80,
      exampleDefault: defaults.dailyMiles ?? 80,
    },
    {
      key: 'gasUsdPerGal',
      label: 'FL regular gas',
      unit: '$/gal',
      step: '0.01',
      formula: '($/gal ÷ mpg) × 100 = ¢ per mi energy score',
      sourced: FL_GAS_REGULAR_AAA?.value != null,
      sourceNote:
        FL_GAS_REGULAR_AAA?.value != null
          ? 'AAA FL regular (Sep 27, 2026)'
          : 'Not in app data; Example default shown',
      value: assumptions?.gasUsdPerGal ?? defaults.gasUsdPerGal,
      exampleDefault: defaults.gasUsdPerGal,
      isDollar: true,
    },
    {
      key: 'dieselUsdPerGal',
      label: 'FL diesel',
      unit: '$/gal',
      step: '0.01',
      formula: '($/gal ÷ mpg) × 100 = ¢ per mi when fuel is diesel',
      sourced: FL_DIESEL_AAA?.value != null,
      sourceNote:
        FL_DIESEL_AAA?.value != null
          ? 'AAA FL diesel (Sep 27, 2026)'
          : 'Not in app data; Example default shown',
      value: assumptions?.dieselUsdPerGal ?? defaults.dieselUsdPerGal,
      exampleDefault: defaults.dieselUsdPerGal,
      isDollar: true,
    },
    {
      key: 'electricityCentsPerKwh',
      label: 'FL commercial electricity',
      unit: '¢/kWh',
      step: '0.01',
      formula: '(kWh per 100 mi ÷ 100) × ¢/kWh = ¢ per mi energy score',
      sourced: FL_COMMERCIAL_ELECTRICITY?.value != null,
      sourceNote:
        FL_COMMERCIAL_ELECTRICITY?.value != null
          ? 'EIA FL commercial (Jul 2026)'
          : 'Not in app data; Example default shown',
      value:
        assumptions?.electricityCentsPerKwh ?? defaults.electricityCentsPerKwh,
      exampleDefault: defaults.electricityCentsPerKwh,
    },
    {
      key: 'depreciationUsdPerYear',
      label: 'Depreciation per year',
      unit: '$/yr',
      step: '50',
      formula:
        'cost of ownership per year = fuel or energy + maintenance + depreciation',
      sourced: false,
      sourceNote: 'Example default; not from a published source',
      value:
        assumptions?.depreciationUsdPerYear ??
        defaults.depreciationUsdPerYear,
      exampleDefault: defaults.depreciationUsdPerYear,
      isDollar: true,
    },
  ]
}

/** Map a typed trade-in row onto intake.current for the Current column. */
export function intakeFromTradeInRow(row, baseIntake = null, job = null) {
  const base =
    baseIntake && typeof baseIntake === 'object' ? { ...baseIntake } : {}
  const yearRaw = String(row?.year ?? '').trim()
  const make = String(row?.make ?? '').trim()
  const model = String(row?.model ?? '').trim()
  const milesRaw = String(row?.mileage ?? '').trim()
  const year = yearRaw ? Number(yearRaw) : null
  const miles = milesRaw ? Number(String(milesRaw).replace(/,/g, '')) : null
  const hasVehicle =
    year != null && Number.isFinite(year) && make && model
  const mergedJob = {
    ...(base.job && typeof base.job === 'object' ? base.job : {}),
    ...(job && typeof job === 'object' ? job : {}),
  }
  return {
    ...base,
    job: mergedJob,
    dailyMiles: mergedJob.dailyMiles ?? base.dailyMiles,
    loadLb: mergedJob.loadLb ?? base.loadLb,
    crew: mergedJob.crew ?? base.crew,
    tows: mergedJob.tows ?? base.tows,
    trailerLb: mergedJob.trailerLb ?? base.trailerLb,
    tongueLb: mergedJob.tongueLb ?? base.tongueLb,
    wdh: mergedJob.wdh ?? base.wdh,
    shopCity: mergedJob.shopCity ?? base.shopCity,
    cargoCuFt: mergedJob.cargoCuFt ?? base.cargoCuFt,
    current: hasVehicle
      ? {
          year,
          make,
          model,
          miles: miles != null && Number.isFinite(miles) ? miles : null,
        }
      : null,
  }
}

/**
 * Package-card score for a unit (baseline / package current — not the trade-in row).
 * Same call path as TradeUnitCard / rankTradePool.
 */
export function scoreUnitCard(unit, opts = {}) {
  if (!unit) return null
  return scoreReplacementV2(unit, {
    intake: opts.intake || null,
    pkg: opts.pkg || null,
    assumptions: opts.assumptions || null,
  })
}

/**
 * Align a trade-in-as-current score to the unit card's replacement scale.
 * Replacement cells/totals/PP come from the card; trade-in keeps its own
 * current points on every factor the card counts. Rows still sum to totals.
 */
export function alignTradeSheetToCard(tradeScore, cardScore) {
  if (!tradeScore || !cardScore) return tradeScore
  const byKey = Object.fromEntries(
    (tradeScore.categories || []).map((c) => [c.key, c]),
  )
  const categories = (cardScore.categories || []).map((cardRow) => {
    const tradeRow = byKey[cardRow.key]
    const cardCand = cardRow.candidate
    const tradeCur = tradeRow?.current
    // Same factor set as the card: drop anything the card does not count.
    if (!cardCand?.counted) {
      return {
        key: cardRow.key,
        label: cardRow.label,
        current: { ...cardRow.current },
        candidate: { ...cardCand },
      }
    }
    // Card counts this factor — keep trade-in current points when available.
    const current =
      tradeCur?.counted
        ? { ...tradeCur }
        : { ...cardRow.current }
    return {
      key: cardRow.key,
      label: cardRow.label,
      current,
      candidate: { ...cardCand },
    }
  })

  let currentTotal = 0
  let candidateTotal = 0
  let pp = 0
  for (const row of categories) {
    const catMax = row.key === 'longevity' ? WARRANTY_MAX : 10
    if (row.current?.counted && row.candidate?.counted) {
      currentTotal += Number(row.current.points) || 0
      candidateTotal += Number(row.candidate.points) || 0
      pp += catMax
    }
  }
  currentTotal = round1(currentTotal)
  candidateTotal = round1(candidateTotal)
  // Replacement must match the card exactly (shop sees one score per truck).
  candidateTotal = round1(cardScore.candidateTotal)
  pp = Number(cardScore.pointsPossible) || pp
  const difference = round1(candidateTotal - currentTotal)

  return {
    ...tradeScore,
    categories,
    currentName: tradeScore.currentName,
    candidateName: cardScore.candidateName || tradeScore.candidateName,
    currentTotal: cardScore.incomplete ? null : currentTotal,
    candidateTotal: cardScore.incomplete ? null : candidateTotal,
    pointsPossible: pp,
    difference: cardScore.incomplete ? null : difference,
    incomplete: Boolean(cardScore.incomplete),
    incompleteLabel: cardScore.incompleteLabel || tradeScore.incompleteLabel,
    cardScore,
    alignedToCard: true,
  }
}

/**
 * Score one trade-in row against its replacement unit with the shared engine.
 * Replacement total and pointsPossible match that unit's package card.
 * Returns null when the row has no vehicle identity or there is no unit.
 */
export function scoreTradeInRow(row, unit, opts = {}) {
  if (!unit) return null
  const year = String(row?.year ?? '').trim()
  const make = String(row?.make ?? '').trim()
  const model = String(row?.model ?? '').trim()
  if (!year || !make || !model) return null
  const intake = intakeFromTradeInRow(row, opts.intake, opts.job)
  const tradeScore = scoreReplacementV2(unit, {
    intake,
    pkg: opts.pkg || null,
    assumptions: opts.assumptions || null,
  })
  // Card uses package intake as-is (baseline current), not the trade-in row.
  const cardScore = scoreUnitCard(unit, {
    intake: opts.intake || null,
    pkg: opts.pkg || null,
    assumptions: opts.assumptions || null,
  })
  return alignTradeSheetToCard(tradeScore, cardScore)
}

/** Sum counted category points for one side; must equal that side's total. */
export function sumCountedCategoryPoints(score, side) {
  if (!score?.categories) return 0
  const key = side === 'candidate' ? 'candidate' : 'current'
  let sum = 0
  for (const row of score.categories) {
    const cell = row[key]
    if (cell?.counted) sum += Number(cell.points) || 0
  }
  return round1(sum)
}

export function tradeInScoreBadgeCopy(score) {
  if (!score) return null
  const pp = Number(score.pointsPossible) || 0
  if (score.incomplete || score.currentTotal == null || pp <= 0) {
    return {
      tradeIn: score.incompleteLabel || 'Score incomplete',
      replacement: null,
      diff: null,
      incomplete: true,
    }
  }
  const cur = Number(score.currentTotal)
  const cand = Number(score.candidateTotal)
  const diff = score.difference
  return {
    tradeIn: `${cur.toFixed(1)} out of ${pp}`,
    replacement: `Replacement ${cand.toFixed(1)}`,
    diff:
      diff == null
        ? null
        : `${diff > 0 ? '+' : ''}${Number(diff).toFixed(1)}`,
    incomplete: false,
    currentTotal: cur,
    candidateTotal: cand,
    pointsPossible: pp,
    difference: diff,
  }
}

function cellNotScored(cell) {
  if (!cell) return true
  if (cell.counted) return false
  const d = String(cell.display || cell.status || '')
  return /not scored|not used|not entered/i.test(d) || cell.points == null
}

/** Parse ¢/mi from an energy or maintenance reason string. */
export function parseCentsPerMile(reason) {
  if (!reason) return null
  const m = String(reason).match(/(\d+(?:\.\d+)?)\s*¢\s*per\s*mi/i)
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? n : null
}

function annualMilesFromAssumptions(assumptions, job) {
  const daily =
    assumptions?.dailyMiles != null && Number.isFinite(assumptions.dailyMiles)
      ? Number(assumptions.dailyMiles)
      : job?.dailyMiles != null && Number.isFinite(Number(job.dailyMiles))
        ? Number(job.dailyMiles)
        : 80
  return daily * 365
}

function usdFromCpm(cpm, annualMiles) {
  if (cpm == null || !Number.isFinite(cpm)) return null
  return Math.round((cpm / 100) * annualMiles)
}

/** Example fallback maint ¢/mi when a side is not scored (AAA half-ton class). */
function exampleMaintCpm(kind = 'half-ton') {
  if (kind === 'van') {
    return ARGONNE_VAN_MAINT_CPM?.cpm ?? MAINT_CLASS_AAA?.['half-ton']?.cpm ?? 12
  }
  if (kind === 'ev-pickup') {
    return MAINT_CLASS_AAA?.['ev-pickup']?.cpm ?? MAINT_CLASS_AAA?.['half-ton']?.cpm ?? 12
  }
  return MAINT_CLASS_AAA?.['half-ton']?.cpm ?? ARGONNE_VAN_MAINT_CPM?.cpm ?? 12
}

/** Example ¢/mi note for an unscored maintenance row (does not add points). */
export function exampleMaintNote(kind = 'half-ton') {
  const cpm = exampleMaintCpm(kind)
  const n = Number(cpm)
  const shown = Number.isFinite(n) ? n.toFixed(1) : String(cpm)
  return `${shown}¢ per mi Example`
}

function maintExampleKindForSide(score, side) {
  const name =
    side === 'candidate'
      ? String(score?.candidateName || '')
      : String(score?.currentName || '')
  if (/transit|promaster|sprinter|bright\s*drop|e-?transit|\bedv\b|\brcv\b|cargo\s*van/i.test(name)) {
    return 'van'
  }
  if (/EV|Lightning|Sierra|Silverado EV|R1T|Cybertruck/i.test(name)) {
    return 'ev-pickup'
  }
  return 'half-ton'
}

function maintenanceExampleRow(score) {
  const label = FACTOR_LABELS.maintenance
  const curNote = exampleMaintNote(maintExampleKindForSide(score, 'current'))
  const candNote = exampleMaintNote(maintExampleKindForSide(score, 'candidate'))
  return {
    key: 'maintenance',
    label,
    kind: 'row',
    unscoredExample: true,
    current: {
      display: 'Not scored',
      reason: curNote,
      counted: false,
      points: null,
      status: 'Not scored: Example cents per mile',
    },
    candidate: {
      display: 'Not scored',
      reason: candNote,
      counted: false,
      points: null,
      status: 'Not scored: Example cents per mile',
    },
  }
}

/**
 * Cost of ownership per year for one side.
 * total = energy + maintenance + depreciation (all Example-labeled dollars).
 * OUT of the points table; does not affect score sums.
 */
export function costOfOwnershipForSide(score, side, assumptions = null, job = null) {
  const defaults = defaultScoreAssumptions(job)
  const a = { ...defaults, ...(assumptions || {}) }
  const annualMiles = annualMilesFromAssumptions(a, job)
  const key = side === 'candidate' || side === 'replacement' ? 'candidate' : 'current'
  const cats = score?.categories || []
  const energyRow = cats.find((c) => c.key === 'energy')
  const maintRow = cats.find((c) => c.key === 'maintenance')
  const energyCell = energyRow?.[key]
  const maintCell = maintRow?.[key]

  const overrideEnergy =
    key === 'current' ? a.energyUsdPerYearTradeIn : a.energyUsdPerYearReplacement
  const overrideMaint =
    key === 'current' ? a.maintUsdPerYearTradeIn : a.maintUsdPerYearReplacement

  let energyUsd = null
  let energyFromEngine = false
  if (overrideEnergy != null && Number.isFinite(Number(overrideEnergy))) {
    energyUsd = Math.round(Number(overrideEnergy))
  } else {
    const cpm = parseCentsPerMile(energyCell?.reason)
    if (cpm != null && energyCell?.counted) {
      energyUsd = usdFromCpm(cpm, annualMiles)
      energyFromEngine = true
    } else {
      // Example default: gas at FL regular × 15 mpg placeholder when not scored
      const gas = a.gasUsdPerGal ?? FL_GAS_REGULAR_AAA?.value ?? 4
      const exampleCpm = (100 * gas) / 15
      energyUsd = usdFromCpm(exampleCpm, annualMiles)
      energyFromEngine = false
    }
  }

  let maintUsd = null
  let maintFromEngine = false
  if (overrideMaint != null && Number.isFinite(Number(overrideMaint))) {
    maintUsd = Math.round(Number(overrideMaint))
  } else {
    const cpm = parseCentsPerMile(maintCell?.reason)
    if (cpm != null && maintCell?.counted) {
      maintUsd = usdFromCpm(cpm, annualMiles)
      maintFromEngine = true
    } else {
      maintUsd = usdFromCpm(exampleMaintCpm(), annualMiles)
      maintFromEngine = false
    }
  }

  const depreciationUsd = Math.round(
    Number(a.depreciationUsdPerYear ?? EXAMPLE_DEPRECIATION_USD_PER_YEAR) || 0,
  )
  const energy = Math.round(Number(energyUsd) || 0)
  const maintenance = Math.round(Number(maintUsd) || 0)
  const total = energy + maintenance + depreciationUsd

  return {
    energyUsdPerYear: energy,
    maintUsdPerYear: maintenance,
    depreciationUsdPerYear: depreciationUsd,
    totalUsdPerYear: total,
    energyFromEngine,
    maintFromEngine,
    annualMiles,
    formula:
      'cost of ownership per year = fuel or energy + maintenance + depreciation',
  }
}

export function costOfOwnershipBoth(score, assumptions = null, job = null) {
  return {
    tradeIn: costOfOwnershipForSide(score, 'current', assumptions, job),
    replacement: costOfOwnershipForSide(score, 'candidate', assumptions, job),
  }
}

export function formatUsd(n) {
  const v = Math.round(Number(n) || 0)
  return `$${v.toLocaleString('en-US')}`
}

/**
 * Build readable factor rows for the sheet:
 * - Duty fit group (range + cab + tow counted parts)
 * - Renamed scored factors
 * - Collapsed not-scored into one muted bucket
 */
export function buildFactorPresentation(score) {
  const cats = Array.isArray(score?.categories) ? score.categories : []
  const byKey = Object.fromEntries(cats.map((c) => [c.key, c]))

  const notScored = []
  const scoredSingles = []
  const dutyParts = []

  for (const key of DUTY_FIT_KEYS) {
    const row = byKey[key]
    if (!row) continue
    const curNs = cellNotScored(row.current)
    const candNs = cellNotScored(row.candidate)
    // Pair rule: if either not counted, both drop; treat as not scored for display
    if (curNs && candNs) {
      notScored.push({
        key: row.key,
        label: FACTOR_LABELS[row.key] || row.label,
        current: scrubCellForSheet(row.current),
        candidate: scrubCellForSheet(row.candidate),
      })
    } else {
      dutyParts.push({
        key: row.key,
        label: FACTOR_LABELS[row.key] || row.label,
        current: scrubCellForSheet(row.current),
        candidate: scrubCellForSheet(row.candidate),
      })
    }
  }

  const dutyFit =
    dutyParts.length > 0
      ? {
          key: 'duty-fit',
          label: 'Duty fit',
          kind: 'group',
          parts: dutyParts,
          currentPoints: round1(
            dutyParts.reduce(
              (s, p) => s + (p.current.counted ? Number(p.current.points) || 0 : 0),
              0,
            ),
          ),
          candidatePoints: round1(
            dutyParts.reduce(
              (s, p) =>
                s + (p.candidate.counted ? Number(p.candidate.points) || 0 : 0),
              0,
            ),
          ),
        }
      : null

  const orderedSingles = [
    'energy',
    'maintenance',
    'longevity',
    'payload',
    'resale',
    'reliability',
    'service',
  ]
  let maintenanceVisible = false
  for (const key of orderedSingles) {
    const row = byKey[key]
    if (!row) continue
    const curNs = cellNotScored(row.current)
    const candNs = cellNotScored(row.candidate)
    if (key === 'maintenance' && curNs && candNs) {
      // Ted: always show Maintenance by name; Example ¢/mi when unscored.
      scoredSingles.push(maintenanceExampleRow(score))
      maintenanceVisible = true
      continue
    }
    if (curNs && candNs) {
      notScored.push({
        key: row.key,
        label: FACTOR_LABELS[row.key] || row.label,
        current: scrubCellForSheet(row.current),
        candidate: scrubCellForSheet(row.candidate),
      })
    } else {
      scoredSingles.push({
        key: row.key,
        label: FACTOR_LABELS[row.key] || row.label,
        kind: 'row',
        current: scrubCellForSheet(row.current),
        candidate: scrubCellForSheet(row.candidate),
      })
      if (key === 'maintenance') maintenanceVisible = true
    }
  }

  // Any leftover keys
  for (const row of cats) {
    if (DUTY_FIT_KEYS.includes(row.key) || orderedSingles.includes(row.key)) {
      continue
    }
    const curNs = cellNotScored(row.current)
    const candNs = cellNotScored(row.candidate)
    if (curNs && candNs) {
      notScored.push({
        key: row.key,
        label: FACTOR_LABELS[row.key] || row.label,
        current: scrubCellForSheet(row.current),
        candidate: scrubCellForSheet(row.candidate),
      })
    } else {
      scoredSingles.push({
        key: row.key,
        label: FACTOR_LABELS[row.key] || row.label,
        kind: 'row',
        current: scrubCellForSheet(row.current),
        candidate: scrubCellForSheet(row.candidate),
      })
    }
  }

  if (!maintenanceVisible) {
    const energyIdx = scoredSingles.findIndex((r) => r.key === 'energy')
    const maintRow = maintenanceExampleRow(score)
    if (energyIdx >= 0) scoredSingles.splice(energyIdx + 1, 0, maintRow)
    else scoredSingles.unshift(maintRow)
  }

  const rows = []
  if (dutyFit) rows.push(dutyFit)
  rows.push(...scoredSingles)

  // Assert duty group total equals sum of parts (caller also tests)
  if (dutyFit) {
    const partCur = round1(
      dutyFit.parts.reduce(
        (s, p) => s + (p.current.counted ? Number(p.current.points) || 0 : 0),
        0,
      ),
    )
    const partCand = round1(
      dutyFit.parts.reduce(
        (s, p) => s + (p.candidate.counted ? Number(p.candidate.points) || 0 : 0),
        0,
      ),
    )
    dutyFit.currentPoints = partCur
    dutyFit.candidatePoints = partCand
  }

  return {
    rows,
    notScored,
    factorLabels: FACTOR_LABELS,
  }
}

/** Points shown in factor table (excludes ownership). Must still sum to score totals. */
export function sumPresentedCountedPoints(presentation, side) {
  const key = side === 'candidate' ? 'candidate' : 'current'
  let sum = 0
  for (const row of presentation.rows || []) {
    if (row.kind === 'group') {
      sum +=
        key === 'candidate' ? Number(row.candidatePoints) || 0 : Number(row.currentPoints) || 0
    } else {
      const cell = row[key]
      if (cell?.counted) sum += Number(cell.points) || 0
    }
  }
  // notScored contribute 0
  return round1(sum)
}
