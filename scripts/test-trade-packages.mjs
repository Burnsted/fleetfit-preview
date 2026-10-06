/**
 * Trade packages unit tests — ranking, auto-replace, remove, Undo,
 * add-unit blocked at size 5, package total math with active set.
 *
 * Run: npx vite-node scripts/test-trade-packages.mjs
 */
import assert from 'node:assert/strict'
import { DEFAULT_PACKAGE_ID, getPackage, matchPackageIdFromIntake } from '../src/data/package.js'
import {
  PACKAGE_ID_ALIASES,
  TRADE_PACKAGE_IDS,
  resolvePackageId,
  tradePackageHeader,
} from '../src/data/tradePackages.js'
import { TRADE_PACKAGE_COPY } from '../src/data/tradeNeeds.js'
import {
  addUnitToPackage,
  composeTradePackageSet,
  collectCandidateUnits,
  intakeBodyFilter,
  removeAndAutoReplace,
  rankTradePool,
  sliceActiveSet,
  undoRemove,
} from '../src/lib/tradePackageSet.js'
import { NO_VANS_REAL_LISTING } from '../src/lib/suggestionEligibility.js'
import { computePackageTotal } from '../src/lib/packageTotal.js'
import { effectivePayloadLoadLb, parseJobFromIntake } from '../src/lib/scoreV2.ts'

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log('ok', passed, name)
}

test('1. Alias redirects resolve to trade package ids', () => {
  assert.equal(resolvePackageId('pkg-tc-electrical-4'), TRADE_PACKAGE_IDS.electrical)
  assert.equal(resolvePackageId('pkg-tc-landscape-2'), TRADE_PACKAGE_IDS.landscaping)
  assert.equal(PACKAGE_ID_ALIASES['pkg-tc-electrical-4'], TRADE_PACKAGE_IDS.electrical)
  assert.equal(DEFAULT_PACKAGE_ID, TRADE_PACKAGE_IDS.electrical)
  const elec = getPackage(TRADE_PACKAGE_IDS.electrical)
  assert.ok(elec)
  assert.equal(elec.id, TRADE_PACKAGE_IDS.electrical)
  assert.equal(elec.stockMode, 'Used')
  assert.equal(elec.isTradePackage, true)
  // Legacy fixture id still serves the seed pool for score / eligibility tests
  const legacy = getPackage('pkg-tc-electrical-4')
  assert.ok(legacy)
  assert.equal(legacy.id, 'pkg-tc-electrical-4')
  assert.notEqual(legacy.isTradePackage, true)
})

test('2. Intake trade maps to trade package ids', () => {
  assert.equal(matchPackageIdFromIntake({ trade: 'Electrical' }), TRADE_PACKAGE_IDS.electrical)
  assert.equal(matchPackageIdFromIntake({ trade: 'HVAC' }), TRADE_PACKAGE_IDS.hvac)
  assert.equal(matchPackageIdFromIntake({ trade: 'Plumbing' }), TRADE_PACKAGE_IDS.plumbing)
  assert.equal(
    matchPackageIdFromIntake({ trade: 'Landscaping and lawn' }),
    TRADE_PACKAGE_IDS.landscaping,
  )
  assert.equal(
    matchPackageIdFromIntake({ trade: 'Landscaping / lawn' }),
    TRADE_PACKAGE_IDS.landscaping,
  )
})

test('3. Ranking returns only suggestible units in eligible (real + ≥0.7)', () => {
  const pkg = getPackage(TRADE_PACKAGE_IDS.electrical)
  const { eligible, all } = rankTradePool(collectCandidateUnits(), {
    pkg,
    intake: null,
  })
  assert.ok(all.length >= eligible.length)
  for (const row of eligible) {
    assert.equal(row.suggestible, true)
    assert.equal(row.unit.listingLive, true)
    assert.ok(
      row.score.candidateTotal / row.score.pointsPossible >= 0.7,
      `${row.unit.id} must pass 0.7 bar`,
    )
  }
  // Tiny real-listing pool after Culver City index-redirect drop:
  // only unit-e5 stays suggestible on electrical trade seeds.
  assert.equal(eligible.length, 1, `electrical eligible expected 1, got ${eligible.length}`)
  assert.equal(eligible[0].unit.id, 'unit-e5')
  console.log('   eligibleCount=', eligible.length, eligible.map((e) => e.unit.id).join(','))
})

test('3b. Per-trade eligible counts after index-redirect drop', () => {
  const expected = {
    [TRADE_PACKAGE_IDS.electrical]: ['unit-e5'],
    [TRADE_PACKAGE_IDS.hvac]: ['unit-e5', 'unit-e1'],
    [TRADE_PACKAGE_IDS.plumbing]: ['unit-e5'],
    [TRADE_PACKAGE_IDS.landscaping]: ['unit-e5'],
    [TRADE_PACKAGE_IDS.gc]: [],
  }
  for (const [id, ids] of Object.entries(expected)) {
    const pkg = getPackage(id)
    const set = composeTradePackageSet(pkg, { pkg, intake: null }, 4)
    assert.deepEqual(
      set.eligible.map((e) => e.unit.id),
      ids,
      `${id} eligible mismatch`,
    )
    assert.ok(!set.eligible.some((e) => e.unit.id === 'unit-l1'), `${id} must not include dead unit-l1`)
  }
})

test('4. Size slice does not invent fillers when pool is short', () => {
  const pkg = getPackage(TRADE_PACKAGE_IDS.electrical)
  const set = composeTradePackageSet(pkg, { pkg, intake: null }, 4)
  assert.ok(set.active.length <= set.eligibleCount)
  assert.ok(set.active.length <= 4)
  assert.equal(set.shortfall, Math.max(0, 4 - set.active.length))
  assert.equal(set.stockMode, 'Used')
  // Honest shortfall when fewer than size chip
  if (set.eligibleCount < 4) {
    assert.ok(set.shortfall > 0)
  }
})

test('4b. Title count syncs with rendered active set (0 / 1 / 4, singular + plural)', () => {
  assert.equal(tradePackageHeader('Electrical', 0), 'Electrical package · 0 vehicles')
  assert.equal(tradePackageHeader('Electrical', 1), 'Electrical package · 1 vehicle')
  assert.equal(tradePackageHeader('Electrical', 4), 'Electrical package · 4 vehicles')
  assert.equal(tradePackageHeader('HVAC', 1), 'HVAC package · 1 vehicle')
  assert.equal(tradePackageHeader('HVAC', 4), 'HVAC package · 4 vehicles')
  assert.equal(tradePackageHeader('Landscaping', 0), 'Landscaping package · 0 vehicles')

  // Live electrical pool: planned size 4, but title must use shown count.
  const pkg = getPackage(TRADE_PACKAGE_IDS.electrical)
  const set = composeTradePackageSet(pkg, { pkg, intake: null }, 4)
  const title = tradePackageHeader(pkg.trade, set.active.length)
  assert.equal(
    title,
    tradePackageHeader('Electrical', set.active.length),
    'header must use active.length, not planned size',
  )
  assert.ok(
    !title.includes('4 vehicles') || set.active.length === 4,
    `title "${title}" must not claim 4 when only ${set.active.length} shown`,
  )
  assert.match(title, new RegExp(`· ${set.active.length} vehicles?$`))
  if (set.active.length === 1) {
    assert.equal(title, 'Electrical package · 1 vehicle')
  }
  if (set.active.length === 0) {
    assert.equal(title, 'Electrical package · 0 vehicles')
  }
  // Planned size alone must not drive the title when shortfall exists.
  if (set.shortfall > 0) {
    assert.notEqual(title, tradePackageHeader(pkg.trade, set.size))
  }
})

test('5. Remove then auto-replace (or empty notice) + Undo restores', () => {
  const pkg = getPackage(TRADE_PACKAGE_IDS.electrical)
  const set = composeTradePackageSet(pkg, { pkg, intake: null }, 1)
  if (set.active.length === 0) {
    console.log('   skip remove test — no eligible units in pool')
    return
  }
  const unitId = set.active[0].unit.id
  const beforeTotal = computePackageTotal(set.active.map((a) => a.unit))
  const removed = removeAndAutoReplace(set.active, set.eligible, unitId)
  assert.ok(removed.removed)
  assert.equal(removed.removed.unitId, unitId)
  // With only one eligible unit, no replacement — size shrinks
  if (set.eligibleCount <= 1) {
    assert.equal(removed.active.length, 0)
    assert.equal(removed.notice, TRADE_PACKAGE_COPY.noOtherListing)
    const after = computePackageTotal(removed.active.map((a) => a.unit))
    assert.equal(after.slotCount, 0)
    const undone = undoRemove(removed.active, removed.removed, removed.added?.unitId)
    assert.equal(undone.active.length, 1)
    assert.equal(undone.active[0].unit.id, unitId)
    const restored = computePackageTotal(undone.active.map((a) => a.unit))
    assert.equal(restored.total, beforeTotal.total)
  } else {
    assert.ok(removed.added)
    assert.notEqual(removed.added.unitId, unitId)
    const undone = undoRemove(removed.active, removed.removed, removed.added.unitId)
    assert.ok(undone.active.some((a) => a.unit.id === unitId))
    assert.ok(!undone.active.some((a) => a.unit.id === removed.added.unitId))
  }
})

test('6. Add unit blocked at size 5', () => {
  const fakeActive = Array.from({ length: 5 }, (_, i) => ({
    unit: { id: `u${i}`, askPrice: 1000 * (i + 1), listingLive: true },
    score: { sortKey: 1 - i * 0.01 },
    sortKey: 1 - i * 0.01,
    rank: i + 1,
  }))
  const eligible = [
    ...fakeActive.map((a) => ({
      unit: a.unit,
      score: a.score,
      sortKey: a.sortKey,
      suggestible: true,
      live: true,
    })),
    {
      unit: { id: 'extra', askPrice: 999, listingLive: true },
      score: { sortKey: 0.5 },
      sortKey: 0.5,
      suggestible: true,
      live: true,
    },
  ]
  const result = addUnitToPackage(fakeActive, eligible, 'extra', 5)
  assert.equal(result.ok, false)
  assert.equal(result.blocked, true)
  assert.equal(result.message, TRADE_PACKAGE_COPY.atSizeFive)
})

test('7. Package total tracks active slots after remove', () => {
  const units = [
    { id: 'a', askPrice: 48000 },
    { id: 'b', askPrice: 44500 },
    { id: 'c', askPrice: 39000 },
    { id: 'd', askPrice: 36500 },
  ]
  let active = units.map((u, i) => ({ unit: u, rank: i + 1, sortKey: 1 - i * 0.01 }))
  let total = computePackageTotal(active.map((a) => a.unit))
  assert.equal(total.total, 168000)
  assert.equal(total.askCountLabel, '4 of 4 vehicles')
  // remove b, auto-add e
  const e = { id: 'e', askPrice: 41000 }
  active = [active[0], active[2], { unit: e, rank: 3 }, active[3]]
  total = computePackageTotal(active.map((a) => a.unit))
  assert.equal(total.total, 164500)
  assert.equal(total.slotCount, 4)
  assert.equal(total.tradeInDisplay, 'not confirmed')
  assert.equal(total.netDisplay, 'net not confirmed')
})

test('8. tongueLb: effective load adds tongue when towing; null load stays null', () => {
  assert.equal(
    effectivePayloadLoadLb({
      loadLb: 500,
      tows: true,
      tongueLb: 1050,
      trailerLb: 7000,
      dailyMiles: null,
      cargoCuFt: null,
      crew: 3,
      wdh: null,
      shopCity: null,
    }),
    1550,
  )
  assert.equal(
    effectivePayloadLoadLb({
      loadLb: null,
      tows: true,
      tongueLb: 1050,
      trailerLb: 7000,
      dailyMiles: null,
      cargoCuFt: null,
      crew: 3,
      wdh: null,
      shopCity: null,
    }),
    null,
  )
  const job = parseJobFromIntake(null, {
    jobDefaults: {
      tows: true,
      trailerLb: 7000,
      tongueLb: null,
      loadLb: null,
      dailyMiles: null,
      crew: 3,
    },
  })
  assert.equal(job.tows, true)
  assert.equal(job.trailerLb, 7000)
  assert.equal(job.tongueLb, 1050) // 15% default
  assert.equal(job.loadLb, null)
})

test('9. COPY strings are exact (no Customize in Intake / Size / trucks)', () => {
  assert.equal(TRADE_PACKAGE_COPY.entry, 'Trade packages')
  assert.equal(TRADE_PACKAGE_COPY.fleetSize, 'Fleet size')
  assert.equal(TRADE_PACKAGE_COPY.buildYourOwn, 'Build your own')
  assert.equal(TRADE_PACKAGE_COPY.removedToast, 'Removed from package.')
  assert.equal(TRADE_PACKAGE_COPY.atSizeFive, 'This package has 5 units. Remove one to add another.')
  assert.ok(!/Customize in Intake/.test(TRADE_PACKAGE_COPY.buildYourOwn))
})

test('10. Pill/slash cleanup: cab/bed keys and dialTotal wording', async () => {
  const { formatCabBed } = await import('../src/lib/workSpec.js')
  const { CAB_BED_OPTIONS } = await import('../src/data/listings.js')
  assert.equal(formatCabBed('Crew', '5.5 ft'), 'Crew and 5.5 ft')
  assert.ok(CAB_BED_OPTIONS.length > 0)
  assert.ok(CAB_BED_OPTIONS.every((o) => !o.includes(' / ') && /\band\b/.test(o)))
  const pkg = getPackage(TRADE_PACKAGE_IDS.electrical)
  const { eligible } = rankTradePool(collectCandidateUnits(), { pkg, intake: null })
  const withDial = eligible.find((r) => r.score?.dialTotal)
  assert.ok(withDial, 'expected a scored eligible unit')
  assert.match(withDial.score.dialTotal, / out of /)
  assert.ok(!withDial.score.dialTotal.includes(' / '))
})

test('11. sliceActiveSet respects size and eligibility order', () => {
  const eligible = [
    { unit: { id: 'a' }, live: true, suggestible: true, score: {}, sortKey: 0.9 },
    { unit: { id: 'b' }, live: true, suggestible: true, score: {}, sortKey: 0.8 },
    { unit: { id: 'c' }, live: false, suggestible: false, score: {}, sortKey: 0.7 },
  ]
  const two = sliceActiveSet(eligible, 2)
  assert.equal(two.length, 2)
  assert.equal(two[0].unit.id, 'a')
  assert.equal(two[1].rank, 2)
  const five = sliceActiveSet(eligible, 5)
  assert.equal(five.length, 2) // only 2 live suggestible
})

test('12. Intake body Van / Pickup hard-filters; never silent substitute', () => {
  assert.equal(intakeBodyFilter({ body: 'Van' }), 'van')
  assert.equal(intakeBodyFilter({ body: 'Pickup' }), 'truck')
  assert.equal(intakeBodyFilter({ body: 'Either' }), null)
  assert.equal(intakeBodyFilter({}), null)

  const hvac = getPackage(TRADE_PACKAGE_IDS.hvac)
  const vanSet = composeTradePackageSet(hvac, { pkg: hvac, intake: { body: 'Van' } }, 4)
  assert.ok(vanSet.active.length >= 1, 'HVAC van intake should find a real van')
  for (const slot of vanSet.active) {
    assert.equal(slot.unit.bodyType, 'van', `${slot.unit.id} must be van`)
  }
  assert.equal(vanSet.bodyShortfallNote, null)

  const pickupSet = composeTradePackageSet(hvac, { pkg: hvac, intake: { body: 'Pickup' } }, 4)
  for (const slot of pickupSet.active) {
    assert.equal(slot.unit.bodyType, 'truck', `${slot.unit.id} must be truck`)
  }

  const elec = getPackage(TRADE_PACKAGE_IDS.electrical)
  const elecVan = composeTradePackageSet(elec, { pkg: elec, intake: { body: 'Van' } }, 4)
  // Real van listing exists (E-Transit) but is not dial-high without current —
  // shortfall only when zero real vans exist, so no shortfall line here.
  assert.equal(elecVan.bodyShortfallNote, null)
  assert.ok(!elecVan.active.some((s) => s.unit.bodyType === 'truck'))
})

test('13. Van + current: incomplete real vans still show; no shortfall; no invented score', () => {
  const hvac = getPackage(TRADE_PACKAGE_IDS.hvac)
  const intake = {
    body: 'Van',
    current: { year: 2019, make: 'Ford', model: 'Transit-250', miles: 62000 },
    currentYear: '2019',
    currentMake: 'Ford',
    currentModel: 'Transit-250',
    currentMiles: '62000',
  }
  const set = composeTradePackageSet(hvac, { pkg: hvac, intake }, 4)
  assert.ok(set.active.length >= 1, 'real van listings must still pack when incomplete')
  assert.equal(set.bodyShortfallNote, null, 'shortfall only when zero real van listings')
  for (const slot of set.active) {
    assert.equal(slot.unit.bodyType, 'van', `${slot.unit.id} must be van`)
    if (slot.packIncomplete || slot.score?.incomplete) {
      assert.equal(slot.score?.incomplete, true)
      assert.ok(
        typeof slot.score?.incompleteLabel === 'string' &&
          slot.score.incompleteLabel.startsWith('Score incomplete:'),
        `plain incomplete label, got ${slot.score?.incompleteLabel}`,
      )
      assert.equal(slot.score?.dialTotal, null, 'never invent a numeric dial total')
      assert.equal(slot.score?.candidateTotal, null, 'never invent candidateTotal')
    }
  }
  // Complete (suggestible) rows, if any, rank before incomplete pack rows.
  const { eligible } = rankTradePool(collectCandidateUnits(), { pkg: hvac, intake })
  const firstIncomplete = eligible.findIndex((r) => r.packIncomplete)
  if (firstIncomplete >= 0) {
    for (let i = 0; i < firstIncomplete; i += 1) {
      assert.equal(eligible[i].suggestible, true)
      assert.equal(eligible[i].packIncomplete, false)
    }
  }
})

test('14. Body shortfall only when zero real listings of that body exist', () => {
  const hvac = getPackage(TRADE_PACKAGE_IDS.hvac)
  // Empty pool → shortfall for Van.
  const { bodyShortfallNote, eligible } = rankTradePool([], {
    pkg: hvac,
    intake: { body: 'Van' },
  })
  assert.equal(eligible.length, 0)
  assert.equal(bodyShortfallNote, NO_VANS_REAL_LISTING)
})

console.log(`\n${passed} trade-package tests passed`)
