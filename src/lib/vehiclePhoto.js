/**
 * Considered-unit photos: dealer listing thumbs only.
 * Current (shop’s non-EV) column may use labeled stock — we do not have their truck.
 */

import currentTruck from '../assets/stock/current-truck.webp'
import currentVan from '../assets/stock/current-van.webp'
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

export function applyListingFactsToUnit(unit) {
  const row = listingRowFor(unit)
  if (!unit || !row) return unit
  return {
    ...unit,
    year: row.year,
    make: row.make,
    model: row.model,
    trim: row.trim,
    askPrice: row.price_usd,
    mileage: row.mileage,
    location: { city: row.city, state: row.state },
    sellerLabel: row.dealer,
    sellerType: 'dealer',
    listingUrl: row.listing_url,
    battery: {
      ...unit.battery,
      soh: null,
      usableKwh: null,
      status: 'Not reported by dealer',
    },
  }
}

export function applyListingFactsToListing(listing) {
  const row = listingRowFor(listing)
  if (!listing || !row) return listing
  return {
    ...listing,
    year: row.year,
    make: row.make,
    model: row.model,
    trim: row.trim,
    allInPrice: row.price_usd,
    mileage: row.mileage,
    location: { city: row.city, state: row.state },
    sellerName: row.dealer,
    sellerType: 'dealer',
    listingUrl: row.listing_url,
    soh: null,
    sohMethod: null,
    payload: null,
    ratedRange: null,
    usableKwh: null,
    gvwr: null,
    curb: null,
    cab: null,
    bed: null,
    drivetrain: row.drivetrain || null,
    onboardChargerKw: null,
    dcFastMaxKw: null,
    workValue: 'Incomplete Data',
  }
}
