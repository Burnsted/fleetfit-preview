/**
 * Resolve display meta for a fleet pick id (unit / listing / catalog).
 * Used when photo chip or Add to fleet toggles without explicit plan meta.
 */
import { LISTINGS } from '../data/listings'
import { getNewCatalog } from '../data/newEvCatalog'
import { findUnitAnywhere, getPackage, getUnit } from '../data/package'

function moneyNumber(n) {
  const v = Number(n)
  return Number.isFinite(v) && v > 0 ? v : null
}

export function parseFleetPickId(pickId) {
  if (!pickId || typeof pickId !== 'string') return null
  if (pickId.startsWith('unit:')) {
    const rest = pickId.slice('unit:'.length)
    const split = rest.indexOf(':')
    if (split <= 0) return null
    return {
      kind: 'unit',
      packageId: rest.slice(0, split),
      unitId: rest.slice(split + 1),
    }
  }
  if (pickId.startsWith('listing:')) {
    return { kind: 'listing', listingId: pickId.slice('listing:'.length) }
  }
  if (pickId.startsWith('catalog:')) {
    return { kind: 'catalog', catalogId: pickId.slice('catalog:'.length) }
  }
  return null
}

export function resolveFleetPickMeta(pickId) {
  const parsed = parseFleetPickId(pickId)
  if (!parsed) return null

  if (parsed.kind === 'unit') {
    const unit =
      getUnit(parsed.packageId, parsed.unitId) ||
      findUnitAnywhere(parsed.unitId)?.unit ||
      null
    if (!unit) {
      return {
        pickId,
        label: parsed.unitId,
        examplePrice: null,
      }
    }
    const label = `${unit.year} ${unit.make} ${unit.model}`.trim()
    return {
      pickId,
      label,
      examplePrice: moneyNumber(unit.askPrice),
    }
  }

  if (parsed.kind === 'listing') {
    const listing = LISTINGS.find((row) => row.id === parsed.listingId)
    if (!listing) {
      return { pickId, label: parsed.listingId, examplePrice: null }
    }
    const label = `${listing.year} ${listing.make} ${listing.model}`.trim()
    return {
      pickId,
      label,
      examplePrice: moneyNumber(listing.allInPrice ?? listing.askPrice),
    }
  }

  if (parsed.kind === 'catalog') {
    let card = null
    try {
      card = getNewCatalog().find((row) => row.id === parsed.catalogId) || null
    } catch {
      card = null
    }
    if (!card) {
      return { pickId, label: parsed.catalogId, examplePrice: null }
    }
    return {
      pickId,
      label: card.title || parsed.catalogId,
      examplePrice: moneyNumber(card.msrpUsd),
    }
  }

  return null
}

export function resolvePackagePlanMeta(packageId, pickIds, units) {
  const pkg = getPackage(packageId)
  const label =
    pkg?.trade ||
    pkg?.name ||
    pkg?.title ||
    `Package ${packageId}`
  let examplePrice = null
  if (Array.isArray(units) && units.length) {
    let sum = 0
    let any = false
    for (const unit of units) {
      const n = moneyNumber(unit?.askPrice)
      if (n != null) {
        sum += n
        any = true
      }
    }
    if (any) examplePrice = sum
  }
  return {
    packageId,
    label,
    examplePrice,
    pickIds: pickIds || [],
  }
}
