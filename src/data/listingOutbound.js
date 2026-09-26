/**
 * CLEARED outbound listing live-check · 2026-09-26
 * Cars.com HTML is Cloudflare-blocked from this deploy host (HTTP 403 challenge).
 * Live = verified dealer VDP HTTP 200 + VIN on page, OR marketplace URL kept when
 * VIN still shows as actively listed at the same dealer city via aggregator/history
 * within ~1 day. Dead = sold / gone / not found → UI shows "Seller listing not available".
 * Never invent URLs — dealer_url only when a real dealer inventory page was fetched.
 */

export const LISTING_OUTBOUND = {
  'unit-e1': {
    listing_live: true,
    dealer_url:
      'https://www.zeiglerford.com/used-Plainwell-2023-Ford-E+Transit+350-Base+Navigation+system+Connected+Navigation-1FTBW9CK9PKA27642',
    check_note: 'Dealer VDP HTTP 200 + VIN; Cars.com CF-blocked from host',
  },
  'unit-e2': {
    listing_live: true,
    dealer_url: null,
    check_note: 'Cars.com URL retained; Fort Lauderdale classified activity recent (VIN 1GC10UED6RU202225); dealer site SSL fail from host',
  },
  'unit-e3': {
    listing_live: false,
    dealer_url: null,
    check_note: 'VIN absent from Soerens Ford Cars.com inventory; no live dealer VDP found',
  },
  'unit-e4': {
    listing_live: true,
    dealer_url: null,
    check_note: 'University Dodge still listing VIN 3C6MRWAZ8RE100219 (aggregator VDP); dealer site CF-blocked',
  },
  'unit-e5': {
    listing_live: true,
    dealer_url:
      'https://www.jimmybrittchevrolet.com/vehicle/1GT1ESEH3TU406433/Used--2026--GMC--Sierra_EV--Greensboro--Georgia/',
    check_note: 'Dealer VDP HTTP 200 + VIN',
  },
  'unit-e6': {
    listing_live: false,
    dealer_url: null,
    check_note: 'VIN 2G5ZJ3T6XS9106235 not confirmed on Baha Auto inventory',
  },
  'unit-l1': {
    listing_live: true,
    dealer_url:
      'https://www.socalchevy.com/inventory/Used-2026-Chevrolet-Silverado_EV-Extended_Range_Trail_Boss-1GC403ED1TU400628/',
    check_note: 'Dealer VDP HTTP 200 + VIN (Culver City Chevy)',
  },
  'unit-l2': {
    listing_live: false,
    dealer_url: null,
    check_note: 'VIN 1FTVW1EL1PWG34938 not found at AutoNation White Marsh',
  },
  'vnd-001': {
    listing_live: false,
    dealer_url: null,
    check_note: 'VIN 1FTVW1EL1NWG14881 sold via Copart auction; not at Berkenkotter',
  },
  'vnd-002': {
    listing_live: false,
    dealer_url: null,
    check_note: 'Left Montrose Nissan; Apex Infiniti VDP 404; no live URL in our data to keep',
  },
  'vnd-003': {
    listing_live: true,
    dealer_url:
      'https://www.suntrupbuickgmc.com/used-St+Peters-2026-GMC-Sierra+EV-Elevation-1GT1ESEH2TU401725',
    check_note: 'Dealer VDP HTTP 200 + VIN',
  },
  'vnd-004': {
    listing_live: true,
    dealer_url: null,
    check_note: 'Nelson GMC Wagoner classified activity hours-old for VIN; dealer site SSL/CF from host',
  },
  'vnd-005': {
    listing_live: false,
    dealer_url: null,
    check_note: 'Parkline inventory shows R1S only; this R1T VIN not listed',
  },
  'vnd-006': {
    listing_live: true,
    dealer_url: null,
    check_note: 'West Palm Beach classified activity hours-old for VIN; no verified dealer VDP',
  },
  'vnd-007': {
    listing_live: false,
    dealer_url: null,
    check_note: 'No verified live Webb Chevy VDP for VIN 1GT40FDA7PU000006',
  },
  'vnd-008': {
    listing_live: true,
    dealer_url: null,
    check_note: 'Culver City classified activity hours-old for VIN; LAX CDJR VDP missing redirect',
  },
}
