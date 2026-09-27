/**
 * OEM service network — G-final: f_service_distance + g_gaps EV-certified rows.
 * INFERENCE certification → one rubric step below FACT distance score (10→7→4→0).
 * BrightDrop: AutoNation Chevrolet Greenacres 80.4 mi → 2.0.
 */
import { parseCsv, numOrNull } from '../lib/csvParse'
import fRaw from './v2/f_service_distance.csv?raw'
import aRaw from './v2/a_r1t_service.csv?raw'
import gRaw from './v2/g_gaps.csv?raw'

export const SERVICE_NETWORK_BUILD = 'score-v2-service-g-final-20260927'

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
  certLabel?: 'FACT' | 'INFERENCE' | null
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

export function isBrightDrop(make: string, model: string): boolean {
  return /brightdrop/i.test(`${make} ${model}`)
}

export function isFordEv(make: string, model: string): boolean {
  const m = `${make} ${model}`.toLowerCase()
  return /lightning|e-?transit/.test(m) && /ford/.test(m)
}

export function isGmEv(make: string, model: string): boolean {
  const m = `${make} ${model}`.toLowerCase()
  return (
    /silverado\s*ev|sierra\s*ev|hummer\s*ev|brightdrop/.test(m) ||
    ((/chevrolet|gmc/.test(m)) && /\bev\b|electric/.test(m))
  )
}

type GService = {
  brand: string
  location: string
  address: string
  roadMi: number | null
  url: string
  certLabel: 'FACT' | 'INFERENCE' | null
  isBrightDrop: boolean
}

const gRows = parseCsv(gRaw).filter((r) => String(r.item) === '1')

function gCertLabel(value: string, label: string): 'FACT' | 'INFERENCE' | null {
  if (/YES:\s*listed|YES:\s*service codes|FACT \(OEM/i.test(value) && /FACT/i.test(label)) {
    return 'FACT'
  }
  if (/LIKELY YES|INFERENCE/i.test(label) || /LIKELY YES/i.test(value)) return 'INFERENCE'
  if (/YES/i.test(value) && /FACT/i.test(label)) return 'FACT'
  if (/UNKNOWN/i.test(value)) return null
  return /INFERENCE/i.test(label) ? 'INFERENCE' : /FACT/i.test(label) ? 'FACT' : null
}

const gServices: GService[] = []
for (const r of gRows) {
  const brand = String(r.brand || '').replace(/\s*\(.*\)/, '').trim()
  if (!brand) continue
  if (r.metric === 'road_mi_from_32960') {
    const isBd = /BrightDrop/i.test(brand)
    gServices.push({
      brand: isBd ? 'BrightDrop' : brand.startsWith('Ram') ? 'Ram' : brand,
      location: r.location_name,
      address: r.address || '',
      roadMi: numOrNull(r.value),
      url: r.source_url || '',
      certLabel: null,
      isBrightDrop: isBd,
    })
  }
}
// Attach cert from ev_certified rows
for (const r of gRows) {
  if (!/ev_certified|brightdrop_certified/i.test(r.metric || '')) continue
  const brandRaw = String(r.brand || '')
  const isBd = /BrightDrop/i.test(brandRaw)
  const brand = isBd ? 'BrightDrop' : brandRaw.replace(/\s*\(.*\)/, '').trim().startsWith('Ram')
    ? 'Ram'
    : brandRaw.replace(/\s*\(.*\)/, '').trim()
  const hit = gServices.find(
    (s) => s.brand === brand && (!r.location_name || s.location === r.location_name),
  )
  if (hit) {
    hit.certLabel = gCertLabel(String(r.value || ''), String(r.label || ''))
    if (!hit.url && r.source_url) hit.url = r.source_url
  } else if (isBd && /Greenacres/i.test(r.location_name || '')) {
    // cert row without road_mi — attach to Greenacres
  }
}
// BrightDrop Greenacres cert INFERENCE
const bdGreen = gServices.find((s) => s.isBrightDrop && /Greenacres/i.test(s.location))
if (bdGreen) bdGreen.certLabel = 'INFERENCE'

type FRow = {
  brand: string
  location: string
  address: string
  roadMi: number | null
  url: string
}

const fByBrand = new Map<string, FRow>()
for (const r of parseCsv(fRaw).filter(
  (row) => /Vero Beach/i.test(row.origin || '') && numOrNull(row.road_mi) != null,
)) {
  if (/planned|check for closer|2nd|second/i.test(r.service_type || '')) continue
  const brand = String(r.brand || '')
    .replace(/\s*\(.*\)/, '')
    .trim()
  const key = brand.startsWith('Ram') ? 'Ram' : brand
  if (!fByBrand.has(key)) {
    fByBrand.set(key, {
      brand: key,
      location: r.location_name,
      address: r.address,
      roadMi: numOrNull(r.road_mi),
      url: r.address_source_url || '',
    })
  }
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
    certLabel: 'FACT' as const,
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

/** Step-down ladder for INFERENCE certification: 10 → 7 → 4 → 0 */
export function inferenceCertStepDown(factPts: number): number {
  if (factPts >= 10) return 7
  if (factPts >= 7) return 4
  if (factPts >= 4) return 0
  return 0
}

export type ServiceLookup = {
  location: ServiceLocation | null
  miles: number | null
  shopCity: ShopCity | null
  mobile: MobileService | null
  url: string | null
  notScoredStatus: string | null
  reasonExtra: string | null
  certLabel: 'FACT' | 'INFERENCE' | null
  /** When set, scoreService uses this instead of lin(miles) (BrightDrop 2.0, etc.) */
  pointsOverride: number | null
}

function pickGService(brand: string, brightDrop: boolean): GService | null {
  if (brightDrop) {
    return (
      gServices.find((s) => s.isBrightDrop && /Greenacres/i.test(s.location)) ||
      gServices.find((s) => s.isBrightDrop) ||
      null
    )
  }
  return gServices.find((s) => s.brand === brand && s.roadMi != null) || null
}

export function nearestService(
  make: string,
  shopCityRaw: string | undefined | null,
  opts?: { model?: string | null; isEvCandidate?: boolean },
): ServiceLookup {
  const shopCity = parseShopCity(shopCityRaw)
  const brand = brandKey(make)
  const model = String(opts?.model || '')
  const brightDrop = isBrightDrop(make, model)
  const empty = {
    location: null as ServiceLocation | null,
    miles: null as number | null,
    shopCity,
    mobile: brand === 'Rivian' ? RIVIAN_MOBILE_SERVICE : null,
    url: null as string | null,
    notScoredStatus: null as string | null,
    reasonExtra: null as string | null,
    certLabel: null as 'FACT' | 'INFERENCE' | null,
    pointsOverride: null as number | null,
  }

  if (!shopCity) return { ...empty, shopCity: null }

  if (shopCity === 'Vero Beach') {
    // BrightDrop → Greenacres 80.4
    if (opts?.isEvCandidate && brightDrop) {
      const g = pickGService('BrightDrop', true)
      const miles = g?.roadMi ?? 80.4
      return {
        location: {
          make: 'BrightDrop',
          location: g?.location || 'AutoNation Chevrolet Greenacres',
          address: g?.address || '',
          type: 'service',
          roadMi: { 'Vero Beach': miles, 'Fort Pierce': null, 'West Palm Beach': null },
          url: g?.url || 'https://www.autonationchevroletgreenacres.com/',
          label: 'INFERENCE (OSRM)',
          certLabel: 'INFERENCE',
        },
        miles,
        shopCity,
        mobile: null,
        url: g?.url || 'https://www.autonationchevroletgreenacres.com/',
        notScoredStatus: null,
        reasonExtra: 'BrightDrop certification estimate (new-unit sales)',
        certLabel: 'INFERENCE',
        // Spec: score on distance 80.4 → lin ≈ 2.0; no further step-down
        pointsOverride: 2.0,
      }
    }

    // GMC EV → Linus 2.5 INFERENCE → 7.0
    if (opts?.isEvCandidate && brand === 'GMC') {
      const g = pickGService('GMC', false)
      const miles = g?.roadMi ?? 2.5
      return {
        location: {
          make: 'GMC',
          location: g?.location || 'Linus Buick GMC',
          address: g?.address || '1401 US 1, Vero Beach, FL 32960',
          type: 'service',
          roadMi: { 'Vero Beach': miles, 'Fort Pierce': null, 'West Palm Beach': null },
          url: g?.url || 'https://www.linusautomotive.com/',
          label: 'INFERENCE (OSRM)',
          certLabel: 'INFERENCE',
        },
        miles,
        shopCity,
        mobile: null,
        url: g?.url || 'https://www.linusautomotive.com/',
        notScoredStatus: null,
        reasonExtra: 'EV-certified estimate → 7.0 (one step below confirmed 10)',
        certLabel: 'INFERENCE',
        pointsOverride: 7.0,
      }
    }

    // Chevrolet non-BrightDrop EV → Dyer 2.6 INFERENCE → 7.0
    if (opts?.isEvCandidate && brand === 'Chevrolet' && !brightDrop) {
      const g = pickGService('Chevrolet', false) || {
        brand: 'Chevrolet',
        location: 'Dyer Chevrolet Vero Beach',
        address: '1000 US Hwy 1, Vero Beach, FL 32960',
        roadMi: 2.6,
        url: 'https://www.dyerchevy.com/',
        certLabel: 'INFERENCE' as const,
        isBrightDrop: false,
      }
      const miles = g.roadMi ?? 2.6
      return {
        location: {
          make: 'Chevrolet',
          location: g.location,
          address: g.address,
          type: 'service',
          roadMi: { 'Vero Beach': miles, 'Fort Pierce': null, 'West Palm Beach': null },
          url: g.url,
          label: 'INFERENCE (OSRM)',
          certLabel: 'INFERENCE',
        },
        miles,
        shopCity,
        mobile: null,
        url: g.url,
        notScoredStatus: null,
        reasonExtra: 'EV-certified estimate → 7.0 (one step below confirmed 10)',
        certLabel: 'INFERENCE',
        pointsOverride: 7.0,
      }
    }

    // Ford / Ram EV from g_gaps FACT cert
    if (opts?.isEvCandidate && (brand === 'Ford' || brand === 'Ram')) {
      const g = pickGService(brand, false)
      const f = fByBrand.get(brand)
      const miles = g?.roadMi ?? f?.roadMi ?? null
      const cert = g?.certLabel || (brand === 'Ford' || brand === 'Ram' ? 'FACT' : null)
      return {
        location: {
          make: brand,
          location: g?.location || f?.location || '',
          address: g?.address || f?.address || '',
          type: 'service',
          roadMi: { 'Vero Beach': miles, 'Fort Pierce': null, 'West Palm Beach': null },
          url: g?.url || f?.url || '',
          label: 'INFERENCE (OSRM)',
          certLabel: cert,
        },
        miles,
        shopCity,
        mobile: null,
        url: g?.url || f?.url || null,
        notScoredStatus: null,
        reasonExtra:
          cert === 'FACT'
            ? brand === 'Ford'
              ? 'EV Certified'
              : 'LEV + PMCD (ProMaster EV)'
            : null,
        certLabel: cert,
        pointsOverride: null, // lin(4.1)=10, lin(4.9)=10
      }
    }

    // Gas / other / Rivian / Tesla from f sheet
    const lookupBrand = brand
    const row = fByBrand.get(lookupBrand)
    if (brand === 'Rivian') {
      // Prefer a_r1t Vero Beach miles
      let nearest: ServiceLocation | null = null
      let nearestMi: number | null = null
      for (const loc of rivianCenters) {
        const mi = loc.roadMi['Vero Beach']
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
        certLabel: 'FACT',
        pointsOverride: null,
      }
    }
    if (!row || row.roadMi == null) {
      return { ...empty, notScoredStatus: null }
    }
    return {
      location: {
        make: brand,
        location: row.location,
        address: row.address,
        type: 'service',
        roadMi: { 'Vero Beach': row.roadMi, 'Fort Pierce': null, 'West Palm Beach': null },
        url: row.url,
        label: 'INFERENCE (OSRM)',
        certLabel: null,
      },
      miles: row.roadMi,
      shopCity,
      mobile: null,
      url: row.url,
      notScoredStatus: null,
      reasonExtra: null,
      certLabel: null,
      pointsOverride: null,
    }
  }

  // Fort Pierce / WPB: only Rivian sourced
  if (brand !== 'Rivian') {
    return {
      ...empty,
      notScoredStatus: `Not scored: service distance not published for ${shopCity}`,
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
    certLabel: 'FACT',
    pointsOverride: null,
  }
}

export function normalizeShopCity(input: string | undefined | null): ShopCity | null {
  return parseShopCity(input)
}

export const SERVICE_LOCATIONS = rivianCenters
