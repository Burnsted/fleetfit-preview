/** Pure fleet-pick key helpers (no React) — safe for node tests. */

export function fleetUnitKey(packageId, unitId) {
  return `unit:${packageId}:${unitId}`
}

export function fleetListingKey(listingId) {
  return `listing:${listingId}`
}

/** New OEM catalog card id → fleet pick key. */
export function fleetCatalogKey(catalogId) {
  return `catalog:${catalogId}`
}

/** Pure toggle helper — never duplicates; returns next id list. */
export function toggleFleetPick(ids, id) {
  const list = Array.isArray(ids) ? ids : []
  if (!id || typeof id !== 'string') return list.slice()
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
}
