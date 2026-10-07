/**
 * CLEARED Inventory freshness + full option rank · 2026-09-26 ~11:40
 * Full available truck + van options, Replacement Score high → low.
 * Dial + order only — no ordinal chrome labels.
 *
 * 2026-10-01 Ted override: suggest only real listing + good score (dial is-high).
 * Do not pad one-of-each-body with unreal or weak picks.
 */
import {
  rankUnitsByReplacementScore,
  SCORE_BUILD,
} from './replacementScore'
import {
  GOOD_SCORE_RATIO,
  isSuggestibleUnit,
  noBodyRealGood,
} from './suggestionEligibility'

/** CLEARED inventory freshness + full option rank · Score v2 stamp */
export const BODY_MIX_BUILD = 'listing-audit-suggest-20261001'
export const CLEARED_SHIP = 'listing-audit-suggest-20261001'

export function bodyClassOf(unit) {
  if (!unit) return null
  if (unit.bodyType === 'van') return 'van'
  if (unit.bodyType === 'truck') return 'truck'
  return null
}

export function bodyClassLabel(cls) {
  if (cls === 'van') return 'Van'
  if (cls === 'truck') return 'Truck'
  return null
}

/** Soft intake Body preference boost — never erases the other class or drops options. */
function intakeBoost(entry, intake) {
  const pref = String(intake?.body || '')
  const cls = bodyClassOf(entry.unit)
  if (pref === 'Van' && cls === 'van') return 0.15
  if (pref === 'Pickup' && cls === 'truck') return 0.15
  return 0
}

/** Hard body filter from intake. Either / blank → null (keep both). */
export function intakeBodyNeed(intake) {
  const pref = String(intake?.body || '').trim()
  if (pref === 'Van') return 'van'
  if (pref === 'Pickup') return 'truck'
  return null
}

function compareBoosted(a, b, intake) {
  const ka = (a.score?.sortKey ?? -1) + intakeBoost(a, intake)
  const kb = (b.score?.sortKey ?? -1) + intakeBoost(b, intake)
  if (kb !== ka) return kb - ka
  // Look newer first on ties
  const yA = Number(a.unit?.year) || 0
  const yB = Number(b.unit?.year) || 0
  if (yB !== yA) return yB - yA
  const miA = Number(a.unit?.mileage)
  const miB = Number(b.unit?.mileage)
  const aOk = Number.isFinite(miA)
  const bOk = Number.isFinite(miB)
  if (aOk && bOk && miA !== miB) return miA - miB
  return String(a.unit?.id || '').localeCompare(String(b.unit?.id || ''))
}

/**
 * Full option coverage after HF-1 / HF-3, then Ted real-listing + good-score gate.
 * One slot per distinct listing identity (unit id).
 * Ordered Replacement Score high → low.
 * maxSlots truncates by score only — never injects a weak/unreal body to fill a slot.
 */
export function composeRecommendationSet(units, ctx = {}, options = {}) {
  const intake = ctx.intake
  const ranked = rankUnitsByReplacementScore(units, ctx)
  const afterHard = ranked.filter((r) => !r.score?.hardReject)
  const rejected = ranked.filter((r) => r.score?.hardReject)

  // Ted: real verified listing + dial is-high (GOOD_SCORE_RATIO). Drop the rest.
  const eligibleAll = afterHard.filter((r) => isSuggestibleUnit(r.unit, r.score))
  const droppedWeakOrUnreal = afterHard.filter(
    (r) => !isSuggestibleUnit(r.unit, r.score),
  )

  // Hard body filter from intake Van / Pickup — never substitute the other class.
  const bodyNeed = intakeBodyNeed(intake)
  const eligible = bodyNeed
    ? eligibleAll.filter((r) => bodyClassOf(r.unit) === bodyNeed)
    : eligibleAll

  const trucks = eligible.filter((r) => bodyClassOf(r.unit) === 'truck')
  const vans = eligible.filter((r) => bodyClassOf(r.unit) === 'van')

  // Dedupe by unit id (listing identity) — keep highest-ranked instance
  const seen = new Set()
  const unique = []
  for (const row of eligible) {
    const id = row.unit?.id
    if (!id || seen.has(id)) continue
    seen.add(id)
    unique.push({
      ...row,
      bodyClass: bodyClassOf(row.unit),
      seat: null,
      seatLabel: null,
    })
  }

  const ordered = [...unique]
    .sort((a, b) => compareBoosted(a, b, intake))
    .map((it, index) => ({ ...it, rank: index + 1 }))

  // Truncate by score order only — do not force a second body class into the window
  let items = ordered
  const maxSlots = Number(options.maxSlots)
  if (Number.isFinite(maxSlots) && maxSlots > 0 && ordered.length > maxSlots) {
    items = ordered.slice(0, maxSlots).map((it, index) => ({ ...it, rank: index + 1 }))
  }

  let missingBodyNote = null
  if (bodyNeed === 'van' && vans.length === 0) {
    missingBodyNote = noBodyRealGood('vans')
  } else if (bodyNeed === 'truck' && trucks.length === 0) {
    missingBodyNote = noBodyRealGood('trucks')
  } else if (!bodyNeed && trucks.length && !vans.length) {
    missingBodyNote = noBodyRealGood('vans')
  } else if (!bodyNeed && vans.length && !trucks.length) {
    missingBodyNote = noBodyRealGood('trucks')
  }

  const years = items.map((r) => Number(r.unit?.year)).filter((y) => Number.isFinite(y))
  const hasFreshMy = years.some((y) => y >= 2025)

  return {
    build: BODY_MIX_BUILD,
    scoreBuild: SCORE_BUILD,
    goodScoreRatio: GOOD_SCORE_RATIO,
    items,
    eligible,
    rejected,
    droppedWeakOrUnreal,
    hasTruck: trucks.length > 0,
    hasVan: vans.length > 0,
    bothClasses: trucks.length > 0 && vans.length > 0,
    missingBodyNote,
    hasFreshMy,
    intakeBody: intake?.body || '',
  }
}
