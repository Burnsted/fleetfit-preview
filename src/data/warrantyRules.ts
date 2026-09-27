/**
 * Commercial-use warranty exclusion rules — SOURCES-V2 A (Rivian).
 * Generalized: any OEM with sourced commercialUseExclusion gets At risk → 0 pts.
 */

export type CommercialUseExclusion = {
  make: string
  models: string[]
  excluded: true
  quote: string
  url: string
  effective: string
  label: 'FACT'
}

export const WARRANTY_RULES_BUILD = 'score-v2-warranty-20260927'

const RIVIAN_CONSUMER_GUIDE =
  'https://assets.ctfassets.net/2md5qhoeajym/3jyOsY7odpa35j9Yzb0KXK/edc6d556b122b351117b409a9bb8cf8a/r1t_r1s-new-vehicle-limited-warranty-guide-us-en-us-20260813.pdf'

const RIVIAN_COMMERCIAL_GUIDE =
  'https://assets.rivian.com/2md5qhoeajym/7ru4KaOCgjEP7FfT8QT7jE/ece18b4b636928b05eb06938645890fa/commercial-new-vehicle-limited-warranty-guide-us-en-us-20241231.pdf'

/** Today only Rivian is sourced. Ford/GM/Ram/Tesla score normally until Sherlock sources an exclusion. */
export const COMMERCIAL_USE_EXCLUSIONS: CommercialUseExclusion[] = [
  {
    make: 'Rivian',
    models: ['R1T', 'R1S'],
    excluded: true,
    quote:
      'the vehicle or product is used primarily for business or commercial purposes',
    url: RIVIAN_CONSUMER_GUIDE,
    effective: '2026-08-13',
    label: 'FACT',
  },
]

export const RIVIAN_COMMERCIAL_WARRANTY = {
  battWarrantyYr: 8,
  battWarrantyMi: 100000,
  capacityGuaranteePct: 70,
  comprehensiveYr: 3,
  comprehensiveMi: 36000,
  url: RIVIAN_COMMERCIAL_GUIDE,
  effective: '2024-12-31',
  label: 'FACT' as const,
}

export function lookupCommercialExclusion(make: string, model: string) {
  const m = String(make || '').toLowerCase()
  const mod = String(model || '').toLowerCase()
  return (
    COMMERCIAL_USE_EXCLUSIONS.find(
      (e) =>
        e.make.toLowerCase() === m &&
        e.models.some((x) => mod.includes(x.toLowerCase())),
    ) || null
  )
}
