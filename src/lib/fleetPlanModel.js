/** Pure fleet-plan helpers (no React) — safe for node tests. */

export function createVehiclePlanItem({ pickId, label, examplePrice = null }) {
  if (!pickId || typeof pickId !== 'string') return null
  return {
    id: `vehicle:${pickId}`,
    kind: 'vehicle',
    label: String(label || 'Vehicle').trim() || 'Vehicle',
    units: 1,
    examplePrice: Number.isFinite(examplePrice) ? examplePrice : null,
    pickIds: [pickId],
  }
}

export function createPackagePlanItem({
  packageId,
  label,
  examplePrice = null,
  pickIds = [],
}) {
  if (!packageId || typeof packageId !== 'string') return null
  const ids = Array.isArray(pickIds)
    ? [...new Set(pickIds.filter((id) => typeof id === 'string' && id))]
    : []
  if (!ids.length) return null
  return {
    id: `package:${packageId}`,
    kind: 'package',
    label: String(label || 'Package').trim() || 'Package',
    units: ids.length,
    examplePrice: Number.isFinite(examplePrice) ? examplePrice : null,
    pickIds: ids,
  }
}

/** Append a plan item. No double-add by item id or overlapping vehicle pick. */
export function appendPlanItem(items, item) {
  const list = Array.isArray(items) ? items.slice() : []
  if (!item || !item.id) return list
  if (list.some((row) => row.id === item.id)) return list
  if (item.kind === 'vehicle') {
    const pickId = item.pickIds?.[0]
    if (pickId && list.some((row) => row.pickIds?.includes(pickId))) return list
  }
  if (item.kind === 'package') {
    // Refresh existing package row in place if present (already guarded by id).
  }
  list.push({
    ...item,
    pickIds: [...(item.pickIds || [])],
  })
  return list
}

export function removePlanItemById(items, itemId) {
  const list = Array.isArray(items) ? items : []
  if (!itemId) return list.slice()
  return list.filter((row) => row.id !== itemId)
}

/** Drop a pick from every plan row; remove empty rows. Syncs photo-check removals. */
export function removePickFromPlan(items, pickId) {
  const list = Array.isArray(items) ? items : []
  if (!pickId) return list.slice()
  return list
    .map((row) => {
      const pickIds = (row.pickIds || []).filter((id) => id !== pickId)
      if (!pickIds.length) return null
      const examplePrice =
        row.kind === 'vehicle'
          ? row.examplePrice
          : row.examplePrice != null && row.units > 0
            ? Math.round((row.examplePrice / row.units) * pickIds.length)
            : row.examplePrice
      return {
        ...row,
        pickIds,
        units: pickIds.length,
        examplePrice: Number.isFinite(examplePrice) ? examplePrice : row.examplePrice,
      }
    })
    .filter(Boolean)
}

export function collectPlanPickIds(items) {
  const list = Array.isArray(items) ? items : []
  const out = []
  for (const row of list) {
    for (const id of row.pickIds || []) {
      if (id && !out.includes(id)) out.push(id)
    }
  }
  return out
}

export function planExampleTotal(items) {
  const list = Array.isArray(items) ? items : []
  let sum = 0
  let any = false
  for (const row of list) {
    const n = Number(row.examplePrice)
    if (Number.isFinite(n) && n > 0) {
      sum += n
      any = true
    }
  }
  return any ? sum : null
}

export function planUnitCount(items) {
  const list = Array.isArray(items) ? items : []
  return list.reduce((n, row) => n + (Number(row.units) || 0), 0)
}

/** Merge pick ids into a list without duplicates. */
export function mergePickIds(ids, nextIds) {
  const list = Array.isArray(ids) ? ids.slice() : []
  for (const id of nextIds || []) {
    if (id && typeof id === 'string' && !list.includes(id)) list.push(id)
  }
  return list
}

export function dropPickIds(ids, removeIds) {
  const drop = new Set(
    (removeIds || []).filter((id) => typeof id === 'string' && id),
  )
  return (Array.isArray(ids) ? ids : []).filter((id) => !drop.has(id))
}
