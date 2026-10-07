/**
 * Per trade-in row score vs its index-matched replacement unit.
 * Reuses scoreReplacementV2 Current total on the same pointsPossible scale.
 */
import {
  FL_COMMERCIAL_ELECTRICITY,
  FL_DIESEL_AAA,
  FL_GAS_REGULAR_AAA,
} from '../data/flEnergyPrices'
import { RANGE_BUFFER, round1 } from '../data/scoreV2Rubric'
import { scoreReplacementV2 } from './scoreV2'

export const TRADE_IN_SCORE_BUILD = 'trade-in-score-20261007'

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
    year != null &&
    Number.isFinite(year) &&
    make &&
    model
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
 * Score one trade-in row against its replacement unit with the shared engine.
 * Returns null when the row has no vehicle identity or there is no unit.
 */
export function scoreTradeInRow(row, unit, opts = {}) {
  if (!unit) return null
  const year = String(row?.year ?? '').trim()
  const make = String(row?.make ?? '').trim()
  const model = String(row?.model ?? '').trim()
  if (!year || !make || !model) return null
  const intake = intakeFromTradeInRow(row, opts.intake, opts.job)
  return scoreReplacementV2(unit, {
    intake,
    pkg: opts.pkg || null,
    assumptions: opts.assumptions || null,
  })
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
