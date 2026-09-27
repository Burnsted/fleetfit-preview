/**
 * OEM service network — a_r1t_service.csv
 * ICE dealer distances UNKNOWN until Sherlock sources them → null lights up later.
 */
import { parseCsv, numOrNull } from '../lib/csvParse'
import raw from './v2/a_r1t_service.csv?raw'

export const SERVICE_NETWORK_BUILD = 'score-v2-service-20260927'

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
}

export type MobileService = {
  make: string
  available: boolean
  url: string
  detail: string
  label: string
}

const rows = parseCsv(raw)

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

const rivianCenters: ServiceLocation[] = rows
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
  }))

const mobileRow = rows.find((r) => /mobile service/i.test(r.location) || /mobile service/i.test(r.type))

export const RIVIAN_MOBILE_SERVICE: MobileService | null = mobileRow
  ? {
      make: 'Rivian',
      available: true,
      url: mobileRow.source_url,
      detail: mobileRow.type,
      label: mobileRow.label,
    }
  : null

/** Nearest OEM-authorized service for make from shop city. Null distance → not published. */
export function nearestService(
  make: string,
  shopCityRaw: string | undefined | null,
): {
  location: ServiceLocation | null
  miles: number | null
  shopCity: ShopCity | null
  mobile: MobileService | null
  url: string | null
} {
  const shopCity = parseShopCity(shopCityRaw)
  const m = String(make || '').toLowerCase()
  if (m !== 'rivian') {
    // Gap: ICE / other EV dealer distances not sourced
    return {
      location: null,
      miles: null,
      shopCity,
      mobile: null,
      url: null,
    }
  }
  if (!shopCity) {
    return {
      location: null,
      miles: null,
      shopCity: null,
      mobile: RIVIAN_MOBILE_SERVICE,
      url: RIVIAN_MOBILE_SERVICE?.url || null,
    }
  }
  let best: ServiceLocation | null = null
  let bestMi: number | null = null
  for (const loc of rivianCenters) {
    const mi = loc.roadMi[shopCity]
    if (mi == null) continue
    if (bestMi == null || mi < bestMi) {
      bestMi = mi
      best = loc
    }
  }
  return {
    location: best,
    miles: bestMi,
    shopCity,
    mobile: RIVIAN_MOBILE_SERVICE,
    url: best?.url || RIVIAN_MOBILE_SERVICE?.url || null,
  }
}

export function normalizeShopCity(input: string | undefined | null): ShopCity | null {
  return parseShopCity(input)
}

export const SERVICE_LOCATIONS = rivianCenters
