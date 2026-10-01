/**
 * Trade package ranking, size slice, remove → auto-replace, Undo, add-unit.
 *
 * Hard rule (fleet-list CLEARED): a unit appears only when it has a
 * fetch-verified real listing AND passes the 0.7 score bar.
 * Never invent listings to fill size chips.
 *
 * REV2 remove behavior (mock 06 + package-total §9–10):
 * removing a unit collapses to an Undo row and auto-adds the next-ranked
 * live eligible unit when one exists. Size stays; total updates.
 */
import { PACKAGES, getPackageAllUnits } from '../data/package'
import { TRADE_PACKAGE_COPY } from '../data/tradeNeeds'
import { rankUnitsByScoreV2 } from './scoreV2'
import { isSuggestibleUnit, hasRealListing } from './suggestionEligibility'
import { resolveOutboundListing } from './outboundListing'

export const TRADE_PACKAGE_SET_BUILD = 'trade-package-set-20261001'
export const SIZE_MAX = 5

/**
 * Deduped candidate pool: every seed unit across packages that has listing
 * facts applied. Live + dead both present so dead auto-replace can detect
 * dead slots; suggestible filter decides who can fill a package.
 */
export function collectCandidateUnits() {
  const byId = new Map()
  for (const raw of PACKAGES) {
    const pkg = getPackageAllUnits(raw.id)
    if (!pkg) continue
    for (const unit of pkg.units || []) {
      if (!byId.has(unit.id)) byId.set(unit.id, unit)
    }
  }
  return [...byId.values()]
}

/**
 * Score + order the full pool for a trade package job context.
 * Returns all scored rows (including non-suggestible) for diagnostics;
 * `eligible` is the ranked suggestible list used for package slots.
 */
export function rankTradePool(units, scoreCtx = {}) {
  const pool = Array.isArray(units) ? units : collectCandidateUnits()
  const ranked = rankUnitsByScoreV2(pool, scoreCtx)
  const withMeta = ranked.map((row, i) => {
    const outbound = resolveOutboundListing(row.unit)
    const live = hasRealListing(row.unit) && outbound.live !== false
    const suggestible = isSuggestibleUnit(row.unit, row.score)
    return {
      ...row,
      poolIndex: i,
      live,
      suggestible,
      outbound,
    }
  })
  const eligible = withMeta.filter((r) => r.suggestible)
  return { all: withMeta, eligible }
}

/**
 * Build the initial active set for a desired fleet size.
 * Takes the top `size` eligible live units. Does not invent fillers.
 */
export function sliceActiveSet(eligible, size) {
  const n = Math.max(0, Math.min(SIZE_MAX, Number(size) || 0))
  const liveEligible = eligible.filter((r) => r.live && r.suggestible)
  return liveEligible.slice(0, n).map((r, i) => ({
    unit: r.unit,
    score: r.score,
    sortKey: r.sortKey,
    rank: i + 1,
    bodyClass: r.bodyClass,
    newlyAdded: false,
    replacedFromId: null,
  }))
}

/**
 * After selecting active ids, ensure dead slots are auto-replaced.
 * @returns {{ active, replacements: Array<{ deadId, replacementId, deadUnit, deadYmm }> }}
 */
export function autoReplaceDeadSlots(active, eligible) {
  const replacements = []
  const used = new Set(active.map((a) => a.unit.id))
  const nextLive = () =>
    eligible.find((r) => r.live && r.suggestible && !used.has(r.unit.id))

  const nextActive = []
  for (const slot of active) {
    const outbound = resolveOutboundListing(slot.unit)
    const live = hasRealListing(slot.unit) && outbound.live !== false
    if (live) {
      nextActive.push(slot)
      continue
    }
    const replacement = nextLive()
    if (!replacement) {
      // Keep dead slot marked; UI shows Seller listing not available + no next.
      nextActive.push({
        ...slot,
        dead: true,
        noReplacement: true,
      })
      continue
    }
    used.add(replacement.unit.id)
    replacements.push({
      deadId: slot.unit.id,
      replacementId: replacement.unit.id,
      deadUnit: slot.unit,
      deadYmm: ymmOf(slot.unit),
    })
    nextActive.push({
      unit: replacement.unit,
      score: replacement.score,
      sortKey: replacement.sortKey,
      rank: 0,
      bodyClass: replacement.bodyClass,
      newlyAdded: true,
      replacedFromId: slot.unit.id,
      replacedFromUnit: slot.unit,
    })
  }
  return {
    active: renumber(nextActive),
    replacements,
  }
}

function ymmOf(unit) {
  if (!unit) return 'Unit'
  return `${unit.year} ${unit.make} ${unit.model}`
}

function renumber(active) {
  return active.map((slot, i) => ({ ...slot, rank: i + 1 }))
}

/**
 * Remove a unit (REV2): collapse to removed-row + auto-add next ranked.
 * Size target stays the same when a replacement fills; otherwise shrinks.
 */
export function removeAndAutoReplace(active, eligible, unitId) {
  const idx = active.findIndex((a) => a.unit.id === unitId)
  if (idx < 0) {
    return {
      active,
      removed: null,
      added: null,
      notice: null,
    }
  }
  const removedSlot = active[idx]
  const without = active.filter((a) => a.unit.id !== unitId)
  const used = new Set(without.map((a) => a.unit.id))
  used.add(unitId) // do not re-pick the unit just removed
  const next = eligible.find(
    (r) => r.live && r.suggestible && !used.has(r.unit.id),
  )

  if (!next) {
    return {
      active: renumber(without),
      removed: {
        unitId: removedSlot.unit.id,
        ymm: ymmOf(removedSlot.unit),
        unit: removedSlot.unit,
        score: removedSlot.score,
        canUndo: true,
      },
      added: null,
      notice: TRADE_PACKAGE_COPY.noOtherListing,
      sizeSync: without.length,
    }
  }

  const added = {
    unit: next.unit,
    score: next.score,
    sortKey: next.sortKey,
    rank: 0,
    bodyClass: next.bodyClass,
    newlyAdded: true,
    replacedFromId: removedSlot.unit.id,
  }
  // Insert replacement roughly where the removed unit was, then re-sort by score.
  const merged = [...without, added]
  merged.sort((a, b) => {
    const sk = (b.sortKey ?? b.score?.sortKey ?? 0) - (a.sortKey ?? a.score?.sortKey ?? 0)
    if (sk !== 0) return sk
    const pa = Number(a.unit.askPrice) || 0
    const pb = Number(b.unit.askPrice) || 0
    if (pa !== pb) return pa - pb
    return (Number(a.unit.mileage) || 0) - (Number(b.unit.mileage) || 0)
  })

  return {
    active: renumber(merged),
    removed: {
      unitId: removedSlot.unit.id,
      ymm: ymmOf(removedSlot.unit),
      unit: removedSlot.unit,
      score: removedSlot.score,
      canUndo: true,
    },
    added: {
      unitId: next.unit.id,
      ymm: ymmOf(next.unit),
    },
    notice: TRADE_PACKAGE_COPY.nextRankedFilledSlot,
    sizeSync: merged.length,
  }
}

/**
 * Undo a remove: restore the removed unit, drop the auto-added replacement if any.
 */
export function undoRemove(active, removed, addedUnitId = null) {
  if (!removed?.unit) return { active: renumber(active) }
  let next = active.filter((a) => a.unit.id !== addedUnitId)
  // Avoid dup if somehow still present
  next = next.filter((a) => a.unit.id !== removed.unit.id)
  next.push({
    unit: removed.unit,
    score: removed.score,
    sortKey: removed.score?.sortKey ?? 0,
    rank: 0,
    bodyClass: null,
    newlyAdded: false,
    replacedFromId: null,
  })
  next.sort((a, b) => {
    const sk = (b.sortKey ?? b.score?.sortKey ?? 0) - (a.sortKey ?? a.score?.sortKey ?? 0)
    if (sk !== 0) return sk
    return (Number(a.unit.askPrice) || 0) - (Number(b.unit.askPrice) || 0)
  })
  return { active: renumber(next), sizeSync: next.length }
}

/**
 * Undo a dead-listing replace: restore prior unit, drop replacement.
 */
export function undoReplace(active, priorUnit, priorScore, replacementId) {
  if (!priorUnit) return { active: renumber(active) }
  let next = active.filter((a) => a.unit.id !== replacementId)
  next = next.filter((a) => a.unit.id !== priorUnit.id)
  next.push({
    unit: priorUnit,
    score: priorScore,
    sortKey: priorScore?.sortKey ?? 0,
    rank: 0,
    bodyClass: null,
    newlyAdded: false,
    replacedFromId: null,
  })
  next.sort((a, b) => (b.sortKey ?? 0) - (a.sortKey ?? 0))
  return { active: renumber(next) }
}

/**
 * Add a unit from the ranked picker. Blocked at size 5 (decision 10).
 */
export function addUnitToPackage(active, eligible, unitId, sizeMax = SIZE_MAX) {
  if (active.length >= sizeMax) {
    return {
      ok: false,
      blocked: true,
      message: TRADE_PACKAGE_COPY.atSizeFive,
      active,
    }
  }
  if (active.some((a) => a.unit.id === unitId)) {
    return { ok: false, blocked: false, message: 'Already in package.', active }
  }
  const row = eligible.find((r) => r.unit.id === unitId)
  if (!row || !row.suggestible) {
    return {
      ok: false,
      blocked: false,
      message: TRADE_PACKAGE_COPY.noOtherListing,
      active,
    }
  }
  const next = [
    ...active,
    {
      unit: row.unit,
      score: row.score,
      sortKey: row.sortKey,
      rank: 0,
      bodyClass: row.bodyClass,
      newlyAdded: true,
      replacedFromId: null,
    },
  ]
  next.sort((a, b) => (b.sortKey ?? 0) - (a.sortKey ?? 0))
  return {
    ok: true,
    blocked: false,
    active: renumber(next),
    sizeSync: next.length,
  }
}

/**
 * Compose a full trade-package view model.
 */
export function composeTradePackageSet(pkgDef, scoreCtx, size) {
  const desired = Math.max(1, Math.min(SIZE_MAX, Number(size) || pkgDef.sizeDefault || 4))
  const { all, eligible } = rankTradePool(collectCandidateUnits(), scoreCtx)
  let active = sliceActiveSet(eligible, desired)
  const deadPass = autoReplaceDeadSlots(active, eligible)
  active = deadPass.active

  return {
    build: TRADE_PACKAGE_SET_BUILD,
    size: desired,
    sizeMax: SIZE_MAX,
    active,
    eligible,
    allRanked: all,
    eligibleCount: eligible.length,
    shortfall: Math.max(0, desired - active.length),
    replacements: deadPass.replacements,
    stockMode: pkgDef.stockMode || 'Used',
  }
}

export function sumActiveAsks(active) {
  return active.reduce((sum, slot) => {
    const n = Number(slot.unit?.askPrice)
    return Number.isFinite(n) && n > 0 ? sum + n : sum
  }, 0)
}
