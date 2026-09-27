/**
 * OEM service network — SOURCES-V2 F · f_service_distance.csv (Vero Beach 32960)
 * Rivian Fort Pierce / WPB from a_r1t_service.csv.
 * GM EV candidates → Not scored until EV-certified dealer sourced.
 */
import { parseCsv, numOrNull } from '../lib/csvParse'
import fRaw from './v2/f_service_distance.csv?raw'
import aRaw from './v2/a_r1t_service.csv?raw'

export const SERVICE_NETWORK_BUILD = 'score-v2-service-f-20260927'

export type ServiceLocation = {
  make: string
  location: string
  address: string
  type: string
  roadMi: {
    'Vero Beach': number | null
    'Fort Pierce': number | null
    'West Palm Beach': number | null
  }
  url: string
  label: string
  evCertifiedUnknown?: boolean
  mobileAvailable?: boolean
}

export type MobileService = {
  make: string
  available: boolean
  url: string
  detail: string
  label: string
}

const SHOP_KEYS = ['Vero Beach', 'Fort Pierce', 'West Palm Beach'] as const
export type ShopCity = (typeof SHOP_KEYS)[number]

function parseShopCity(input: string | undefined | null): ShopCity | null {
  const s = String(input || '').trim().toLowerCase()
  if (!s) return null
  if (s.includes('vero')) return 'Vero Beach'
  if (s.includes('fort pierce') || s.includes('ft pierce') || s.includes('ft. pierce')) {
    return 'Fort Pierce'
  }
  if (s.includes('west palm') || s.includes('wpb') || s.includes('palm beach')) {
    return 'West Palm Beach'
  }
  return null
}

function brandKey(make: string): string {
  const m = String(make || '').toLowerCase()
  if (m.includes('ford')) return 'Ford'
  if (m.includes('chevrolet') || m.includes('chevy')) return 'Chevrolet'
  if (m.includes('gmc')) return 'GMC'
  if (m.includes('ram') || m.includes('chrysler')) return 'Ram'
  if (m.includes('toyota')) return 'Toyota'
  if (m.includes('tesla')) return 'Tesla'
  if (m.includes('rivian')) return 'Rivian'
  return String(make || '')
}

/** GM EV models that require EV-certified dealer (FACT). */
export function isGmEv(make: string, model: string): boolean {
  const m = `${make} ${model}`.toLowerCase()
  return (
    /silverado\s*ev|sierra\s*ev|hummer\s*ev|brightdrop/.test(m) ||
    ((/chevrolet|gmc/.test(m)) && /\bev\b|electric/.test(m) && /silverado|sierra|hummer|brightdrop/.test(m))
  )
}

export function isFordEv(make: string, model: string): boolean {
  const m = `${make} ${model}`.toLowerCase()
  return /lightning|e-?transit/.test(m) && /ford/.test(m)
}

type FRow = {
  brand: string
  location: string
  address: string
  roadMi: number | null
  url: string
  nearest: boolean
  mobile: boolean
  evCertifiedUnknown: boolean
}

const fRows: FRow[] = parseCsv(fRaw)
  .filter((r) => /Vero Beach/i.test(r.origin || '') && numOrNull(r.road_mi) != null)
  .filter((r) => !/planned|check for closer|2nd|second/i.test(r.service_type || ''))
  .map((r) => {
    const brand = String(r.brand || '').replace(/\s*\(.*\)/, '').trim()
    // Keep only nearest service center / franchised dealer (first row per brand)
    return {
      brand: brand.startsWith('Ram') ? 'Ram' : brand,
      location: r.location_name,
      address: r.address,
      roadMi: numOrNull(r.road_mi),
      url: r.address_source_url || '',
      nearest: !/2nd|second/i.test(r.service_type || ''),
      mobile: /FACT.*[Mm]obile|[Mm]obile Service available/i.test(r.mobile_service_note || ''),
      evCertifiedUnknown: /UNKNOWN/.test(r.ev_certified_note || ''),
    }
  })
  .filter((r) => r.nearest)

// First (nearest) row per brand
const fByBrand = new Map<string, FRow>()
for (const r of fRows) {
  if (!fByBrand.has(r.brand)) fByBrand.set(r.brand, r)
}

const aRows = parseCsv(aRaw)
const rivianCenters: ServiceLocation[] = aRows
  .filter((r) => /service center/i.test(r.type) && !/NOT a service/i.test(r.type))
  .map((r) => ({
    make: 'Rivian',
    location: r.location,
    address: r.address,
    type: r.type,
    roadMi: {
      'Vero Beach': numOrNull(r.road_mi_from_vero_beach),
      'Fort Pierce': numOrNull(r.road_mi_from_fort_pierce),
      'West Palm Beach': numOrNull(r.road_mi_from_west_palm_beach),
    },
    url: r.source_url,
    label: r.label,
    mobileAvailable: false,
  }))

const mobileRow = aRows.find(
  (r) => /mobile service/i.test(r.location) || /mobile service/i.test(r.type),
)

export const RIVIAN_MOBILE_SERVICE: MobileService | null = mobileRow
  ? {
      make: 'Rivian',
      available: true,
      url: mobileRow.source_url,
      detail: mobileRow.type,
      label: mobileRow.label,
    }
  : null

export type ServiceLookup = {
  location: ServiceLocation | null
  miles: number | null
  shopCity: ShopCity | null
  mobile: MobileService | null
  url: string | null
  /** Exact status override for GM EV */
  notScoredStatus: string | null
  reasonExtra: string | null
}

export function nearestService(
  make: string,
  shopCityRaw: string | undefined | null,
  opts?: { model?: string | null; isEvCandidate?: boolean },
): ServiceLookup {
  const shopCity = parseShopCity(shopCityRaw)
  const brand = brandKey(make)
  const model = String(opts?.model || '')

  if (opts?.isEvCandidate && isGmEv(make, model)) {
    return {
      location: null,
      miles: null,
      shopCity,
      mobile: null,
      url: null,
      notScoredStatus: 'Not scored: EV-certified dealer distance not published',
      reasonExtra: null,
    }
  }

  if (!shopCity) {
    return {
      location: null,
      miles: null,
      shopCity: null,
      mobile: brand === 'Rivian' ? RIVIAN_MOBILE_SERVICE : null,
      url: RIVIAN_MOBILE_SERVICE?.url || null,
      notScoredStatus: null,
      reasonExtra: null,
    }
  }

  // Vero Beach: f_service_distance.csv for all makes
  if (shopCity === 'Vero Beach') {
    const lookupBrand = brand === 'GMC' ? 'Chevrolet' : brand
    const row = fByBrand.get(lookupBrand)
    if (!row || row.roadMi == null) {
      return {
        location: null,
        miles: null,
        shopCity,
        mobile: brand === 'Rivian' ? RIVIAN_MOBILE_SERVICE : null,
        url: null,
        notScoredStatus: null,
        reasonExtra: null,
      }
    }
    const loc: ServiceLocation = {
      make: brand,
      location: row.location,
      address: row.address,
      type: 'service',
      roadMi: { 'Vero Beach': row.roadMi, 'Fort Pierce': null, 'West Palm Beach': null },
      url: row.url,
      label: 'INFERENCE (OSRM)',
      evCertifiedUnknown: row.evCertifiedUnknown,
      mobileAvailable: row.mobile,
    }
    let reasonExtra: string | null = null
    if (opts?.isEvCandidate && isFordEv(make, model)) {
      reasonExtra = 'EV certification not verified'
    }
    return {
      location: loc,
      miles: row.roadMi,
      shopCity,
      mobile: brand === 'Rivian' && (row.mobile || RIVIAN_MOBILE_SERVICE) ? RIVIAN_MOBILE_SERVICE : null,
      url: row.url || RIVIAN_MOBILE_SERVICE?.url || null,
      notScoredStatus: null,
      reasonExtra,
    }
  }

  // Fort Pierce / WPB: only Rivian sourced in A
  if (brand !== 'Rivian') {
    return {
      location: null,
      miles: null,
      shopCity,
      mobile: null,
      url: null,
      notScoredStatus: `Not scored: service distance not published for ${shopCity}`,
      reasonExtra: null,
    }
  }

  let nearest: ServiceLocation | null = null
  let nearestMi: number | null = null
  for (const loc of rivianCenters) {
    const mi = loc.roadMi[shopCity]
    if (mi == null) continue
    if (nearestMi == null || mi < nearestMi) {
      nearestMi = mi
      nearest = loc
    }
  }
  return {
    location: nearest,
    miles: nearestMi,
    shopCity,
    mobile: RIVIAN_MOBILE_SERVICE,
    url: nearest?.url || RIVIAN_MOBILE_SERVICE?.url || null,
    notScoredStatus: null,
    reasonExtra: null,
  }
}

export function normalizeShopCity(input: string | undefined | null): ShopCity | null {
  return parseShopCity(input)
}

export const SERVICE_LOCATIONS = rivianCenters
