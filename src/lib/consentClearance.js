/**
 * Measure a bottom consent / cookie bar and return clearance (px) so fixed
 * UI (fleet panel foot, reopen) can sit above it. Gap is at least 8px.
 */

export const CONSENT_CLEARANCE_MIN_GAP = 8
export const CONSENT_BAR_SELECTORS = [
  '[data-consent-bar]',
  '[data-cookie-consent]',
  '#cookie-consent',
  '.cookie-consent',
  '.consent-bar',
]

/** Pure: given bar height (or 0 when dismissed), return bottom clearance. */
export function consentClearancePx(barHeight, minGap = CONSENT_CLEARANCE_MIN_GAP) {
  const h = Number(barHeight) || 0
  if (h <= 0) return 0
  return Math.ceil(h + Math.max(minGap, CONSENT_CLEARANCE_MIN_GAP))
}

/**
 * Find a visible fixed/sticky bottom bar that looks like consent.
 * @param {Document} [doc]
 * @returns {{ el: Element, height: number } | null}
 */
export function findConsentBar(doc = typeof document !== 'undefined' ? document : null) {
  if (!doc) return null
  const candidates = []
  for (const sel of CONSENT_BAR_SELECTORS) {
    doc.querySelectorAll(sel).forEach((el) => candidates.push(el))
  }
  // Fallback: fixed bottom elements whose text mentions cookie/consent
  doc.querySelectorAll('div, aside, section, footer').forEach((el) => {
    const text = (el.textContent || '').trim()
    if (!/cookie\s*consent|consent\s*bar|accept\s*cookies/i.test(text)) return
    if (text.length > 200) return
    candidates.push(el)
  })

  let best = null
  for (const el of candidates) {
    const style = doc.defaultView?.getComputedStyle(el)
    if (!style) continue
    if (style.display === 'none' || style.visibility === 'hidden') continue
    if (Number(style.opacity) === 0) continue
    const pos = style.position
    if (pos !== 'fixed' && pos !== 'sticky') continue
    const rect = el.getBoundingClientRect()
    if (rect.height < 24 || rect.width < 80) continue
    // Must sit near the viewport bottom
    const vh = doc.defaultView.innerHeight || 0
    if (rect.bottom < vh - 4 || rect.top > vh) continue
    if (!best || rect.height > best.height) {
      best = { el, height: Math.round(rect.height) }
    }
  }
  return best
}

export function measureConsentClearance(doc = typeof document !== 'undefined' ? document : null) {
  const hit = findConsentBar(doc)
  return {
    barHeight: hit?.height || 0,
    clearance: consentClearancePx(hit?.height || 0),
    el: hit?.el || null,
  }
}
