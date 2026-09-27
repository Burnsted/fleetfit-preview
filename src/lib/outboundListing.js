/**
 * CLEARED outbound listing · vehicle tap → real seller URL (new tab).
 * Prefer dealer_url when present + live; else marketplace listing_url.
 * Never invent URLs. Dead / unknown → plain "Seller listing not available".
 */

export const OUTBOUND_LISTING_BUILD = 'score-v2-20260927-1330'
export const SELLER_LISTING_UNAVAILABLE = 'Seller listing not available'

/**
 * @param {{ listingUrl?: string|null, dealerUrl?: string|null, listingLive?: boolean|null, sourceSite?: string|null, sellerLabel?: string|null, sellerName?: string|null }} vehicle
 */
export function resolveOutboundListing(vehicle) {
  if (!vehicle) {
    return { href: null, label: SELLER_LISTING_UNAVAILABLE, live: false, site: null }
  }
  const live = vehicle.listingLive === true
  const dealer = typeof vehicle.dealerUrl === 'string' && vehicle.dealerUrl.startsWith('http')
    ? vehicle.dealerUrl
    : null
  const market = typeof vehicle.listingUrl === 'string' && vehicle.listingUrl.startsWith('http')
    ? vehicle.listingUrl
    : null
  const href = live ? (dealer || market) : null
  if (!href) {
    return { href: null, label: SELLER_LISTING_UNAVAILABLE, live: false, site: null }
  }
  const site = dealer
    ? shortDealerLabel(vehicle.sellerLabel || vehicle.sellerName)
    : marketSiteLabel(vehicle.sourceSite, href)
  const label = dealer
    ? `View at ${site} ↗`
    : `View on ${site} ↗`
  return { href, label, live: true, site, viaDealer: Boolean(dealer) }
}

function shortDealerLabel(name) {
  const raw = String(name || 'dealer').trim()
  if (!raw) return 'dealer'
  // Keep readable; trim long dealer legal names
  return raw.length > 42 ? `${raw.slice(0, 40)}…` : raw
}

function marketSiteLabel(sourceSite, href) {
  if (sourceSite && String(sourceSite).trim()) return String(sourceSite).trim()
  try {
    const host = new URL(href).hostname.replace(/^www\./, '')
    if (host.includes('cars.com')) return 'Cars.com'
    return host
  } catch {
    return 'listing'
  }
}
