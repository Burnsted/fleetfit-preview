/**
 * CLEARED outbound listing status · oem-bar2-20260926-1915
 *
 * listingStatus: 'live' | 'dead'
 * checkedAt: ISO date (YYYY-MM-DD) of last human/script check
 * dealer_url: preferred when live (never invented)
 *
 * Re-check: `npm run check-listings`
 * Cars.com HTML is often Cloudflare-blocked from CI hosts — treat CF as
 * inconclusive unless sold/"No longer listed" text is visible; Steve/Pages
 * spot-checks still win (e.g. unit-e4 Cars.com = No longer listed → dead).
 */

export const LISTING_OUTBOUND_CHECKED_AT = '2026-09-26'

/** @type {Record<string, {
 *  listingStatus: 'live'|'dead',
 *  checkedAt: string,
 *  dealer_url: string|null,
 *  check_note: string,
 * }>} */
export const LISTING_OUTBOUND = {
  'unit-e1': {
    listingStatus: 'live',
    checkedAt: LISTING_OUTBOUND_CHECKED_AT,
    dealer_url:
      'https://www.zeiglerford.com/used-Plainwell-2023-Ford-E+Transit+350-Base+Navigation+system+Connected+Navigation-1FTBW9CK9PKA27642',
    check_note: 'Dealer VDP HTTP 200 + VIN; Cars.com CF-blocked from host',
  },
  'unit-e2': {
    listingStatus: 'live',
    checkedAt: LISTING_OUTBOUND_CHECKED_AT,
    dealer_url: null,
    check_note: 'Cars.com CF-blocked; Fort Lauderdale classified activity recent for VIN — keep live pending dealer URL',
  },
  'unit-e3': {
    listingStatus: 'dead',
    checkedAt: LISTING_OUTBOUND_CHECKED_AT,
    dealer_url: null,
    check_note: 'VIN absent from Soerens Ford inventory; no live dealer VDP',
  },
  'unit-e4': {
    listingStatus: 'dead',
    checkedAt: LISTING_OUTBOUND_CHECKED_AT,
    dealer_url: null,
    check_note: 'Cars.com VDP shows "No longer listed" (Steve Pages bar 2026-09-26); no dealer_url in data',
  },
  'unit-e5': {
    listingStatus: 'live',
    checkedAt: LISTING_OUTBOUND_CHECKED_AT,
    dealer_url:
      'https://www.jimmybrittchevrolet.com/vehicle/1GT1ESEH3TU406433/Used--2026--GMC--Sierra_EV--Greensboro--Georgia/',
    check_note: 'Dealer VDP HTTP 200 + VIN (re-checked)',
  },
  'unit-e6': {
    listingStatus: 'dead',
    checkedAt: LISTING_OUTBOUND_CHECKED_AT,
    dealer_url: null,
    check_note: 'VIN not confirmed on Baha Auto inventory',
  },
  'unit-e7': {
    listingStatus: 'dead',
    checkedAt: LISTING_OUTBOUND_CHECKED_AT,
    dealer_url: null,
    check_note: 'Score v2 validation unit (2022 R1T Quad Large sample); no live dealer VDP pinned',
  },
  'unit-l1': {
    listingStatus: 'live',
    checkedAt: LISTING_OUTBOUND_CHECKED_AT,
    dealer_url:
      'https://www.socalchevy.com/inventory/Used-2026-Chevrolet-Silverado_EV-Extended_Range_Trail_Boss-1GC403ED1TU400628/',
    check_note: 'Dealer VDP HTTP 200 + VIN (re-checked)',
  },
  'unit-l2': {
    listingStatus: 'dead',
    checkedAt: LISTING_OUTBOUND_CHECKED_AT,
    dealer_url: null,
    check_note: 'VIN not found at AutoNation White Marsh',
  },
  'vnd-001': {
    listingStatus: 'dead',
    checkedAt: LISTING_OUTBOUND_CHECKED_AT,
    dealer_url: null,
    check_note: 'VIN sold via Copart; not at Berkenkotter',
  },
  'vnd-002': {
    listingStatus: 'dead',
    checkedAt: LISTING_OUTBOUND_CHECKED_AT,
    dealer_url: null,
    check_note: 'Left Montrose Nissan; no live URL in our data',
  },
  'vnd-003': {
    listingStatus: 'live',
    checkedAt: LISTING_OUTBOUND_CHECKED_AT,
    dealer_url:
      'https://www.suntrupbuickgmc.com/used-St+Peters-2026-GMC-Sierra+EV-Elevation-1GT1ESEH2TU401725',
    check_note: 'Dealer VDP HTTP 200 + VIN (re-checked)',
  },
  'vnd-004': {
    listingStatus: 'live',
    checkedAt: LISTING_OUTBOUND_CHECKED_AT,
    dealer_url: null,
    check_note: 'Nelson GMC Wagoner classified activity recent for VIN; dealer site CF/SSL from host',
  },
  'vnd-005': {
    listingStatus: 'dead',
    checkedAt: LISTING_OUTBOUND_CHECKED_AT,
    dealer_url: null,
    check_note: 'Parkline inventory shows R1S only; this R1T VIN not listed',
  },
  'vnd-006': {
    listingStatus: 'live',
    checkedAt: LISTING_OUTBOUND_CHECKED_AT,
    dealer_url: null,
    check_note: 'West Palm Beach classified activity recent for VIN; no verified dealer VDP',
  },
  'vnd-007': {
    listingStatus: 'dead',
    checkedAt: LISTING_OUTBOUND_CHECKED_AT,
    dealer_url: null,
    check_note: 'No verified live Webb Chevy VDP for VIN',
  },
  'vnd-008': {
    listingStatus: 'live',
    checkedAt: LISTING_OUTBOUND_CHECKED_AT,
    dealer_url: null,
    check_note: 'Culver City classified activity recent for VIN; LAX CDJR VDP missing',
  },
}

/** @deprecated use listingStatus === 'live' */
export function isListingLive(id) {
  return LISTING_OUTBOUND[id]?.listingStatus === 'live'
}
