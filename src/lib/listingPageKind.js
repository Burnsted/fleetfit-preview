/**
 * Classify a fetch result as a specific vehicle detail page (VDP) vs an
 * inventory / search / index page. Used by check-listings and by the
 * real-listing rule so a 200 that lands on a dealer index is treated as dead.
 *
 * A live listing must resolve to a specific vehicle page — not a search,
 * home, or inventory-index page (Ted / fleet-list CLEARED).
 */

/** Marketplace / OEM search-style final paths. */
const SEARCH_PATH_RE =
  /\/shopping\/|\/for-sale\/|\/search(?:\/|$)|\/results(?:\/|$)|\/vehicles\/?$/i

/**
 * Dealer inventory SRP / make-model index (no year+VIN / stock vehicle slug).
 * Examples that are INDEX, not VDP:
 *   /inventory/used-chevrolet-silverado_ev/
 *   /inventory/used/
 *   /new-inventory/
 * Examples that stay VDP:
 *   /inventory/Used-2026-Chevrolet-Silverado_EV-...-1GC4.../
 *   /vehicle/1GT1.../Used--2026--GMC--Sierra_EV--.../
 *   /used-Plainwell-2023-Ford-...-1FTB...
 */
const INVENTORY_INDEX_PATH_RE =
  /\/(?:new-)?inventory\/?(?:used|new)?\/?$/i

/** Make/model inventory bucket without a year or VIN/stock token in the last segment. */
function lastSegmentLooksLikeModelIndex(pathname) {
  const parts = String(pathname || '')
    .split('/')
    .filter(Boolean)
  if (parts.length === 0) return false
  const last = parts[parts.length - 1]
  // VIN-like (17 alphanumeric) anywhere in the slug → vehicle page
  if (/[A-HJ-NPR-Z0-9]{17}/i.test(last)) return false
  // Explicit stock / vehicle id tokens
  if (/\b(stock|stk|vin)[-_]?\d+/i.test(last)) return false
  // Year in slug (19xx/20xx) usually means a specific unit path
  if (/\b(19|20)\d{2}\b/.test(last)) return false
  // /vehicle/{id}/… style
  if (parts.some((p) => /^vehicle$/i.test(p))) return false
  // Inventory / new-inventory / used-inventory buckets
  const invIdx = parts.findIndex((p) => /^(?:new-)?inventory$/i.test(p))
  if (invIdx >= 0) {
    const after = parts.slice(invIdx + 1)
    if (after.length === 0) return true
    if (after.length === 1 && /^(used|new|certified|all)$/i.test(after[0])) return true
    // Single segment like used-chevrolet-silverado_ev (no year, no VIN)
    if (
      after.length === 1 &&
      /^used[-_]/i.test(after[0]) &&
      !/\b(19|20)\d{2}\b/.test(after[0]) &&
      !/[A-HJ-NPR-Z0-9]{17}/i.test(after[0])
    ) {
      return true
    }
  }
  return false
}

/**
 * True when finalUrl is a search / home / inventory-index page rather than a VDP.
 * @param {string|null|undefined} finalUrl
 * @param {string|null|undefined} [originalUrl]
 */
export function isInventoryIndexOrSearchUrl(finalUrl, originalUrl = null) {
  if (!finalUrl || typeof finalUrl !== 'string') return false
  let path = ''
  try {
    path = new URL(finalUrl).pathname
  } catch {
    return false
  }
  if (SEARCH_PATH_RE.test(path)) return true
  if (INVENTORY_INDEX_PATH_RE.test(path)) return true
  if (lastSegmentLooksLikeModelIndex(path)) return true

  // Redirect stripped a VIN/year that was in the original request → index fallback
  if (originalUrl && typeof originalUrl === 'string') {
    try {
      const origPath = new URL(originalUrl).pathname
      const vinInOrig = origPath.match(/[A-HJ-NPR-Z0-9]{17}/i)?.[0]
      if (vinInOrig && !path.toUpperCase().includes(vinInOrig.toUpperCase())) {
        // Original looked like a VDP; final lost the VIN → treat as index redirect
        if (/inventory|vehicle|used-|new-/i.test(origPath)) return true
      }
    } catch {
      /* ignore bad original */
    }
  }
  return false
}

/**
 * True when body/title look like a vehicle detail page for optionalVin.
 * Index pages may mention a VIN in card links; require title or og signals.
 * @param {{ title?: string, text?: string, finalUrl?: string, vin?: string|null }} opts
 */
export function bodyLooksLikeVehicleDetail({ title = '', text = '', finalUrl = '', vin = null } = {}) {
  const t = `${title}\n${String(text || '').slice(0, 8000)}`
  // Inventory SEO titles
  if (/explore .+ for sale|vehicles? for sale in|search results|inventory results/i.test(title)) {
    return false
  }
  if (isInventoryIndexOrSearchUrl(finalUrl)) return false
  if (vin) {
    const v = String(vin).toUpperCase()
    // VIN should appear in title or near "VIN" label on a VDP; mere card href is weak
    if (title.toUpperCase().includes(v)) return true
    if (new RegExp(`vin[^A-HJ-NPR-Z0-9]{0,12}${v}`, 'i').test(t)) return true
    // Final URL still carries the VIN
    if (String(finalUrl).toUpperCase().includes(v)) return true
    return false
  }
  // No VIN to check — trust URL shape only
  return !isInventoryIndexOrSearchUrl(finalUrl)
}

/**
 * Classify a fetch of a listing URL.
 * @returns {'LIVE'|'DEAD'|'BLOCKED'}
 */
export function classifyListingFetch({
  status,
  finalUrl,
  originalUrl,
  text = '',
  vin = null,
} = {}) {
  const title =
    (String(text).match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]
      ?.replace(/\s+/g, ' ')
      .trim() || ''
  const sampleHead = `${title}\n${String(text).slice(0, 4000)}`
  if (/just a moment|attention required|cf-browser-verification|challenge-platform/i.test(sampleHead)) {
    return { kind: 'BLOCKED', title, reason: 'cloudflare' }
  }

  const DEAD_RE =
    /no longer listed|no longer available|this vehicle is sold|vehicle has been sold|listing (is )?(no longer|not) available|page not found|vehicle not found|this listing is unavailable|has been removed|sorry,? this vehicle|is no longer in our inventory|this vehicle has sold|we couldn.?t find this/i

  const indexRedirect = isInventoryIndexOrSearchUrl(finalUrl, originalUrl)
  const sold = DEAD_RE.test(`${title}\n${String(text).slice(0, 300000)}`)
  const notDetail =
    indexRedirect ||
    (vin
      ? !bodyLooksLikeVehicleDetail({ title, text, finalUrl, vin })
      : false)

  if (status === 404 || status === 410 || sold || indexRedirect || notDetail) {
    return {
      kind: 'DEAD',
      title,
      sold,
      indexRedirect,
      notDetail,
      reason: sold
        ? 'sold-copy'
        : indexRedirect
          ? 'redirect-to-index'
          : notDetail
            ? 'not-vehicle-detail'
            : `http-${status}`,
    }
  }
  if (status >= 200 && status < 400) {
    return { kind: 'LIVE', title, reason: 'ok' }
  }
  return { kind: 'DEAD', title, reason: `http-${status}` }
}
