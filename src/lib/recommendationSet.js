/**
 * CLEARED Inventory freshness + full option rank · 2026-09-26 ~11:40
 * Full available truck + van options, Replacement Score high → low.
 * Dial + order only — no ordinal chrome labels.
 */
import {
  rankUnitsByReplacementScore,
  SCORE_BUILD,
} from './replacementScore'

/** CLEARED inventory freshness + full option rank · Score v2 stamp */
export const BODY_MIX_BUILD = 'score-v2-rank-f-pages-20260927-1515'
export const CLEARED_SHIP = 'score-v2-f-pages-20260927-1515'

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
 * Full option coverage after HF-1 / HF-3.
 * One slot per distinct listing identity (unit id) — all eligible truck + van options.
 * Ordered Replacement Score high → low.
 */
export function composeRecommendationSet(units, ctx = {}, options = {}) {
  const intake = ctx.intake
  const ranked = rankUnitsByReplacementScore(units, ctx)
  const eligible = ranked.filter((r) => !r.score?.hardReject)
  const rejected = ranked.filter((r) => r.score?.hardReject)

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

  // Optional maxSlots still must keep both classes when both available
  let items = ordered
  const maxSlots = Number(options.maxSlots)
  if (Number.isFinite(maxSlots) && maxSlots > 0 && ordered.length > maxSlots) {
    const pref = String(intake?.body || '')
    const keep = []
    const rest = []
    // Ensure ≥1 of each available class in the truncated window
    const firstTruck = ordered.find((r) => r.bodyClass === 'truck')
    const firstVan = ordered.find((r) => r.bodyClass === 'van')
    if (firstTruck && firstVan) {
      // Prefer preferred body earlier but keep both
      const pair =
        pref === 'Van' ? [firstVan, firstTruck] : [firstTruck, firstVan]
      for (const p of pair) {
        if (!keep.find((k) => k.unit.id === p.unit.id)) keep.push(p)
      }
    } else if (firstTruck) keep.push(firstTruck)
    else if (firstVan) keep.push(firstVan)

    for (const row of ordered) {
      if (keep.find((k) => k.unit.id === row.unit.id)) continue
      rest.push(row)
    }
    items = [...keep, ...rest].slice(0, Math.max(maxSlots, keep.length))
    items = items
      .sort((a, b) => compareBoosted(a, b, intake))
      .map((it, index) => ({ ...it, rank: index + 1 }))
  }

  let missingBodyNote = null
  if (trucks.length && !vans.length) {
    missingBodyNote = 'Van not in this set — none cleared fit in this pool.'
  } else if (vans.length && !trucks.length) {
    missingBodyNote = 'Truck not in this set — none cleared fit in this pool.'
  }

  const years = items.map((r) => Number(r.unit?.year)).filter((y) => Number.isFinite(y))
  const hasFreshMy = years.some((y) => y >= 2025)

  return {
    build: BODY_MIX_BUILD,
    scoreBuild: SCORE_BUILD,
    items,
    eligible,
    rejected,
    hasTruck: trucks.length > 0,
    hasVan: vans.length > 0,
    bothClasses: trucks.length > 0 && vans.length > 0,
    missingBodyNote,
    hasFreshMy,
    intakeBody: intake?.body || '',
  }
}
