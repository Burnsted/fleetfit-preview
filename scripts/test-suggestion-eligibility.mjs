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
  NO_VANS_REAL_GOOD,
} from '../src/lib/suggestionEligibility.js'

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

assert(GOOD_SCORE_RATIO === 0.7, `GOOD_SCORE_RATIO must be 0.7 (dial is-high), got ${GOOD_SCORE_RATIO}`)

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
const landReco = composeRecommendationSet(landscape.units, { pkg: landscape, intake: null })
assert(
  landReco.items.every((r) => passesGoodScore(r.score)),
  'landscape suggestions must pass good score',
)
// l1 is live but incomplete → dropped
assert(landReco.items.length === 0, 'landscape should have no good-score suggestible units')

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
