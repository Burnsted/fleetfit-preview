/**
 * Ted rule (2026-10-01): a vehicle appears in suggestions / package picks only if
 * (a) listingLive with a resolvable seller URL that was verified as a specific
 *     vehicle detail page (not a search / home / inventory-index redirect —
 *     see listingPageKind.js + listingOutbound.js), and
 * (b) Replacement Score passes the dial "high" threshold (ScoreDial is-high).
 * One-of-each-body must not force unreal or weak picks.
 */

/** ScoreDial.jsx tone: pct >= 0.7 → is-high. Do not invent another bar. */
export const GOOD_SCORE_RATIO = 0.7

export const NO_VANS_REAL_GOOD =
  'No vans with a real listing and a good score right now.'

export const NO_TRUCKS_REAL_GOOD =
  'No trucks with a real listing and a good score right now.'

export const NO_SUGGESTIONS =
  'No suggestions to show right now.'

/** Plain empty line when zero of a body type qualify. */
export function noBodyRealGood(typeWord) {
  const word = String(typeWord || '').trim().toLowerCase()
  if (!word) return NO_SUGGESTIONS
  if (word === 'van' || word === 'vans') return NO_VANS_REAL_GOOD
  if (word === 'truck' || word === 'trucks') return NO_TRUCKS_REAL_GOOD
  return `No ${word} with a real listing and a good score right now.`
}

export function scoreRatio(score) {
  if (!score || score.incomplete || score.hardReject) return null
  const pp = Number(score.pointsPossible) || 0
  const total = Number(score.candidateTotal)
  if (pp <= 0 || !Number.isFinite(total)) return null
  return total / pp
}

/** True when dial would render is-high (pct >= GOOD_SCORE_RATIO). */
export function passesGoodScore(score) {
  const ratio = scoreRatio(score)
  return ratio != null && ratio >= GOOD_SCORE_RATIO
}

/** Real seller link already verified into listingLive + outbound href resolution. */
export function hasRealListing(unit) {
  if (!unit || unit.listingLive !== true) return false
  const dealer =
    typeof unit.dealerUrl === 'string' && unit.dealerUrl.startsWith('http')
      ? unit.dealerUrl
      : null
  const market =
    typeof unit.listingUrl === 'string' && unit.listingUrl.startsWith('http')
      ? unit.listingUrl
      : null
  return Boolean(dealer || market)
}

export function isSuggestibleUnit(unit, score) {
  return hasRealListing(unit) && passesGoodScore(score)
}
