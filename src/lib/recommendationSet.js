/**
 * CLEARED Recommendation body mix — Exact Ted pick · 2026-09-26 ~10:50
 * Every set must offer best-of Truck AND best-of Van when both classes exist.
 * Score = Replacement Score soft-taper. Sidegrades may win their class.
 * Intake Body may boost — must not produce a mono-body set when both available.
 */
import {
  rankUnitsByReplacementScore,
  SCORE_BUILD,
} from './replacementScore'

export const BODY_MIX_BUILD = 'recommendation-body-mix-20260926-1450'

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

/** Soft intake Body preference boost — never erases the other available class. */
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
  const miA = Number(a.unit?.mileage)
  const miB = Number(b.unit?.mileage)
  const aOk = Number.isFinite(miA)
  const bOk = Number.isFinite(miB)
  if (aOk && bOk && miA !== miB) return miA - miB
  return String(a.unit?.id || '').localeCompare(String(b.unit?.id || ''))
}

function bestOfClass(entries, intake) {
  if (!entries.length) return null
  return [...entries].sort((a, b) => compareBoosted(a, b, intake))[0]
}

/**
 * Compose recommendation set after HF-1 / HF-3 (hardReject excluded).
 * Guarantees best Truck + best Van seats when both classes are available.
 */
export function composeRecommendationSet(units, ctx = {}, options = {}) {
  const intake = ctx.intake
  const ranked = rankUnitsByReplacementScore(units, ctx)
  const eligible = ranked.filter((r) => !r.score?.hardReject)
  const rejected = ranked.filter((r) => r.score?.hardReject)

  const trucks = eligible.filter((r) => bodyClassOf(r.unit) === 'truck')
  const vans = eligible.filter((r) => bodyClassOf(r.unit) === 'van')

  const bestTruck = bestOfClass(trucks, intake)
  const bestVan = bestOfClass(vans, intake)

  const maxSlots = Math.max(
    1,
    Number(options.maxSlots) || eligible.length || 1,
  )

  const mandatory = []
  if (bestTruck) {
    mandatory.push({
      ...bestTruck,
      bodyClass: 'truck',
      seat: 'best-truck',
      seatLabel: 'Best Truck',
    })
  }
  if (bestVan) {
    mandatory.push({
      ...bestVan,
      bodyClass: 'van',
      seat: 'best-van',
      seatLabel: 'Best Van',
    })
  }

  // Prefer showing preferred body first among mandatory seats, else Truck then Van
  const pref = String(intake?.body || '')
  mandatory.sort((a, b) => {
    if (pref === 'Van') {
      if (a.bodyClass !== b.bodyClass) return a.bodyClass === 'van' ? -1 : 1
    } else if (pref === 'Pickup') {
      if (a.bodyClass !== b.bodyClass) return a.bodyClass === 'truck' ? -1 : 1
    }
    return compareBoosted(a, b, intake)
  })

  const used = new Set(mandatory.map((m) => m.unit.id))
  const fillPool = eligible
    .filter((r) => !used.has(r.unit.id))
    .sort((a, b) => compareBoosted(a, b, intake))

  // Never drop mandatory best-of-each when filling — grow past maxSlots if needed
  const minRequired = mandatory.length
  const target = Math.max(maxSlots, minRequired)

  const items = [...mandatory]
  for (const row of fillPool) {
    if (items.length >= target) break
    items.push({
      ...row,
      bodyClass: bodyClassOf(row.unit),
      seat: 'fill',
      seatLabel: null,
    })
  }

  // Soft-rank display among the set (overall score), keeping seat labels
  const byId = new Map(items.map((it) => [it.unit.id, it]))
  const displayOrder = [...items].sort((a, b) => compareBoosted(a, b, intake))
  const ordered = displayOrder.map((it, index) => ({
    ...byId.get(it.unit.id),
    rank: index + 1,
  }))

  let missingBodyNote = null
  if (trucks.length && !vans.length) {
    missingBodyNote = 'Van not in this set — none cleared fit in this pool.'
  } else if (vans.length && !trucks.length) {
    missingBodyNote = 'Truck not in this set — none cleared fit in this pool.'
  }

  const monoBodyBlocked =
    trucks.length > 0 && vans.length > 0
      ? Boolean(bestTruck && bestVan)
      : true

  return {
    build: BODY_MIX_BUILD,
    scoreBuild: SCORE_BUILD,
    items: ordered,
    eligible,
    rejected,
    bestTruck: bestTruck
      ? { ...bestTruck, bodyClass: 'truck', seat: 'best-truck', seatLabel: 'Best Truck' }
      : null,
    bestVan: bestVan
      ? { ...bestVan, bodyClass: 'van', seat: 'best-van', seatLabel: 'Best Van' }
      : null,
    hasTruck: trucks.length > 0,
    hasVan: vans.length > 0,
    bothClasses: trucks.length > 0 && vans.length > 0,
    missingBodyNote,
    monoBodyBlocked,
    intakeBody: intake?.body || '',
  }
}
