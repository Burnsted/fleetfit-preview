#!/usr/bin/env node
/**
 * Unit checks for Ted listing + good-score suggestion gate.
 * Run: node scripts/test-suggestion-eligibility.mjs
 */
import { getPackage, getPackageAllUnits, packageStickerSum } from '../src/data/package.js'
import { LISTINGS } from '../src/data/listings.js'
import { composeRecommendationSet } from '../src/lib/recommendationSet.js'
import {
  GOOD_SCORE_RATIO,
  passesGoodScore,
  hasRealListing,
  isSuggestibleUnit,
  NO_VANS_REAL_GOOD,
  NO_SUGGESTIONS,
} from '../src/lib/suggestionEligibility.js'

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

assert(GOOD_SCORE_RATIO === 0.7, `GOOD_SCORE_RATIO must be 0.7 (dial is-high), got ${GOOD_SCORE_RATIO}`)
assert(
  NO_SUGGESTIONS === 'No suggestions to show right now.',
  'zero-eligible copy must match CLEARED line',
)

// Dual rule: real listing AND score ratio >= 0.7 (incomplete fails).
assert(
  !isSuggestibleUnit(
    { listingLive: true, dealerUrl: 'https://example.com/v' },
    { incomplete: true, candidateTotal: 80, pointsPossible: 80 },
  ),
  'incomplete score must fail eligibility',
)
assert(
  !isSuggestibleUnit(
    { listingLive: true, dealerUrl: 'https://example.com/v' },
    { incomplete: false, candidateTotal: 54.6, pointsPossible: 90 },
  ),
  'mid score (<0.7) must fail eligibility',
)
assert(
  !isSuggestibleUnit(
    { listingLive: false, dealerUrl: null },
    { incomplete: false, candidateTotal: 64.8, pointsPossible: 80 },
  ),
  'dead listing must fail eligibility even with high score',
)
assert(
  isSuggestibleUnit(
    { listingLive: true, dealerUrl: 'https://example.com/v' },
    { incomplete: false, candidateTotal: 64.8, pointsPossible: 80 },
  ),
  'real listing + score >= 0.7 must pass',
)

const all = getPackageAllUnits('pkg-tc-electrical-4')
assert(all.units.length === 7, `fixture pool should stay 7, got ${all.units.length}`)

const pkg = getPackage('pkg-tc-electrical-4')
assert(pkg.units.every((u) => u.listingLive === true), 'getPackage must drop dead listings')
assert(
  pkg.units.every((u) => hasRealListing(u)),
  'live package units must resolve a seller URL',
)
assert(pkg.unitCount === pkg.units.length, 'unitCount must match remaining live units')

const reco = composeRecommendationSet(pkg.units, { pkg, intake: null })
assert(
  reco.items.every((r) => passesGoodScore(r.score) && hasRealListing(r.unit)),
  'recommendation items must be real listing + good score',
)
assert(!reco.hasVan, 'no suggestible van should remain on electrical package')
assert(
  reco.missingBodyNote === NO_VANS_REAL_GOOD,
  `van note mismatch: ${reco.missingBodyNote}`,
)
assert(
  reco.items.length === 1 && /Sierra EV/i.test(reco.items[0].unit.model),
  `expected only Sierra EV kept, got ${reco.items.map((r) => r.unit.model).join(', ')}`,
)
assert(
  reco.items.every((r) => r.score.candidateTotal / r.score.pointsPossible >= GOOD_SCORE_RATIO),
  'kept scores must be >= good threshold',
)

// No blank ranks / count mismatch
const ranks = reco.items.map((r) => r.rank)
assert(
  ranks.length === 0 || (ranks[0] === 1 && ranks.every((n, i) => n === i + 1)),
  'ranks must be dense 1..n',
)
assert(packageStickerSum(pkg) === pkg.units.reduce((s, u) => s + u.askPrice, 0), 'sticker sum')

const landscape = getPackage('pkg-tc-landscape-2')
assert(landscape.units.length === 0, 'landscape live pool must be empty after Culver City index redirect')
const landReco = composeRecommendationSet(landscape.units, { pkg: landscape, intake: null })
assert(
  landReco.items.every((r) => passesGoodScore(r.score)),
  'landscape suggestions must pass good score',
)
// unit-l1 was live-but-incomplete under PR4; now dead (VDP → inventory index). No suggestible units.
assert(landReco.items.length === 0, 'landscape should have no good-score suggestible units')

// unit-l1 must not be suggestible anywhere: redirect-to-index → listingLive false
const allLand = getPackageAllUnits('pkg-tc-landscape-2')
const l1 = allLand.units.find((u) => u.id === 'unit-l1')
assert(l1, 'unit-l1 fixture must still exist in all-units pool')
assert(l1.listingLive !== true, 'unit-l1 must be dead (Culver City VDP redirects to inventory index)')
assert(!hasRealListing(l1), 'unit-l1 must fail hasRealListing')

const liveShop = LISTINGS.filter((l) => l.listingLive === true)
assert(liveShop.length === 0, 'shop seed has no fetch-verified live listings after audit')

console.log('OK test-suggestion-eligibility', {
  goodRatio: GOOD_SCORE_RATIO,
  electricalLive: pkg.units.map((u) => u.id),
  electricalSuggestible: reco.items.map((r) => `${r.unit.id} ${r.score.candidateTotal}/${r.score.pointsPossible}`),
  vanNote: reco.missingBodyNote,
  landscapeSuggestible: landReco.items.length,
  shopLive: liveShop.length,
})
