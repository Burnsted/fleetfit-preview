/**
 * Considered-unit photos: dealer listing thumbs only (hot-deals thumbnail_url FACT).
 * No listing photo → pending stub — never OEM/lifestyle stock for considered.
 * Current (shop’s non-EV) column may use labeled stock — we do not have their truck.
 * CLEARED listing-photos · 2026-09-26
 * CLEARED OEM specs · merge real OEM by year/make/model/trim (never null wipe).
 */
export const PHOTO_BUILD = 'listing-photos-20260926-1337'

import currentTruck from '../assets/stock/current-truck.webp'
import currentVan from '../assets/stock/current-van.webp'
import { LISTING_OUTBOUND } from '../data/listingOutbound'
import { mergeOemSpecs } from '../data/oemSpecs'
import {
  LISTING_ALIASES,
  LISTING_PHOTO_FILES,
  LISTING_ROWS,
} from '../data/listingPhotos'

export function currentWorkPhoto({ bodyType } = {}) {
  return bodyType === 'van' ? currentVan : currentTruck
}

export function resolveListingKey(vehicleOrKey) {
  if (vehicleOrKey == null) return null
  if (typeof vehicleOrKey === 'string') {
    return LISTING_ALIASES[vehicleOrKey] || vehicleOrKey
  }
  const id = vehicleOrKey.id
  if (id && (LISTING_ROWS[id] || LISTING_ALIASES[id])) {
    return LISTING_ALIASES[id] || id
  }
  return null
}

export function listingRowFor(vehicleOrKey) {
  const key = resolveListingKey(vehicleOrKey)
  return (key && LISTING_ROWS[key]) || null
}

export function listingPhotoRecord(vehicleOrKey) {
  const row = listingRowFor(vehicleOrKey)
  if (!row) return { src: null, pending: true, row: null }
  const src = row.has_photo ? LISTING_PHOTO_FILES[row.id] || null : null
  return { src, pending: !src, row }
}

/** @deprecated prefer listingPhotoRecord — returns src or null (never stock). */
export function vehiclePhotoFor(vehicle = {}) {
  return listingPhotoRecord(vehicle).src
}

export function exampleStripPhoto(kind) {
  return listingPhotoRecord(`strip-${kind}`).src
}

export const HERO_PLATE_PHOTO = listingPhotoRecord('hero').src

/**
 * Overlay dealer listing YMMT / price / miles, then merge OEM specs.
 * Dealer-stated numeric specs would win — listing rows today only carry drivetrain.
 * Battery SOH stays dealer-reported only (never OEM-filled).
 */
/**
 * Cars.com overlay rows do not publish payload/range/kWh/cab/bed.
 * Clear demo-seed capability fields, keep drivetrain when listing states it,
 * then fill from OEM table. Dealer-stated values would win only if present on row.
 */
function capabilityCleared(base) {
  return {
    ...base,
    payload: null,
    tow: null,
    towingLb: null,
    ratedRange: null,
    usableKwh: null,
    gvwr: null,
    curb: null,
    cab: null,
    bed: null,
    cargo: null,
    cargoVolume: null,
    onboardChargerKw: null,
    dcFastMaxKw: null,
  }
}

export function applyListingFactsToUnit(unit) {
  const row = listingRowFor(unit)
  if (!unit) return unit
  let base = capabilityCleared({
    ...unit,
    battery: {
      ...unit.battery,
      usableKwh: null,
      soh: null,
      status: 'Not reported by dealer',
    },
  })
  if (row) {
    const outbound = LISTING_OUTBOUND[row.id] || {}
    base = {
      ...base,
      year: row.year,
      make: row.make,
      model: row.model,
      trim: row.trim,
      askPrice: row.price_usd,
      mileage: row.mileage,
      location: { city: row.city, state: row.state },
      sellerLabel: row.dealer,
      sellerType: 'dealer',
      listingUrl: row.listing_url || null,
      dealerUrl: outbound.dealer_url || null,
      listingLive: outbound.listing_live === true,
      sourceSite: row.source_site || null,
      drivetrain: row.drivetrain || null,
    }
  } else {
    base = {
      ...base,
      listingLive: false,
      dealerUrl: null,
    }
  }
  return mergeOemSpecs(base)
}

export function applyListingFactsToListing(listing) {
  const row = listingRowFor(listing)
  if (!listing) return listing
  let base = capabilityCleared({
    ...listing,
    soh: null,
    sohMethod: null,
    workValue: listing.workValue || 'Incomplete Data',
  })
  if (row) {
    const outbound = LISTING_OUTBOUND[row.id] || {}
    base = {
      ...base,
      year: row.year,
      make: row.make,
      model: row.model,
      trim: row.trim,
      allInPrice: row.price_usd,
      mileage: row.mileage,
      location: { city: row.city, state: row.state },
      sellerName: row.dealer,
      sellerType: 'dealer',
      listingUrl: row.listing_url || null,
      dealerUrl: outbound.dealer_url || null,
      listingLive: outbound.listing_live === true,
      sourceSite: row.source_site || null,
      drivetrain: row.drivetrain || null,
    }
  } else {
    base = {
      ...base,
      listingLive: false,
      dealerUrl: null,
    }
  }
  return mergeOemSpecs(base)
}
