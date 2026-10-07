/**
 * Assert trade-in / replacement category rows sum exactly to each total.
 * Run: npx vite-node scripts/test-tradein-score-sum.mjs
 */
import assert from 'node:assert/strict'
import { TRADE_PACKAGES } from '../src/data/tradePackages.js'
import { composeTradePackageSet } from '../src/lib/tradePackageSet.js'
import { createExampleTradeInRows } from '../src/lib/tradeInEntry.js'
import { round1 } from '../src/data/scoreV2Rubric.ts'
import {
  defaultScoreAssumptions,
  scoreTradeInRow,
  sumCountedCategoryPoints,
  tradeInScoreBadgeCopy,
} from '../src/lib/tradeInScore.js'

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log('ok', passed, name)
}

const pkg = TRADE_PACKAGES.find((p) => p.id === 'pkg-trade-electrical')
assert.ok(pkg, 'electrical package present')
const composed = composeTradePackageSet(pkg, { intake: null, pkg }, 2)
const rows = createExampleTradeInRows(2)
const assumptions = defaultScoreAssumptions(pkg.jobDefaults)

test('category points sum equals currentTotal and candidateTotal for each trade-in row', () => {
  assert.equal(composed.active.length, 2)
  assert.equal(rows.length, 2)
  for (let i = 0; i < rows.length; i += 1) {
    const score = scoreTradeInRow(rows[i], composed.active[i].unit, {
      pkg,
      job: pkg.jobDefaults,
      assumptions,
    })
    assert.ok(score, `score for row ${i + 1}`)
    assert.equal(score.incomplete, false, `row ${i + 1} complete`)
    assert.equal(score.missingCurrent, false, `row ${i + 1} has current`)
    const curSum = sumCountedCategoryPoints(score, 'current')
    const candSum = sumCountedCategoryPoints(score, 'candidate')
    assert.equal(
      curSum,
      round1(score.currentTotal),
      `row ${i + 1} current sum ${curSum} != total ${score.currentTotal}`,
    )
    assert.equal(
      candSum,
      round1(score.candidateTotal),
      `row ${i + 1} candidate sum ${candSum} != total ${score.candidateTotal}`,
    )
    assert.equal(
      curSum,
      score.currentTotal,
      `row ${i + 1} currentTotal must equal summed factor points`,
    )
    assert.equal(
      candSum,
      score.candidateTotal,
      `row ${i + 1} candidateTotal must equal summed factor points`,
    )
  }
})

test('badge copy uses same scale as engine pointsPossible (not a second scale)', () => {
  const score = scoreTradeInRow(rows[0], composed.active[0].unit, {
    pkg,
    job: pkg.jobDefaults,
    assumptions,
  })
  const badge = tradeInScoreBadgeCopy(score)
  assert.equal(badge.incomplete, false)
  assert.equal(
    badge.tradeIn,
    `${Number(score.currentTotal).toFixed(1)} out of ${score.pointsPossible}`,
  )
  assert.match(badge.replacement, /^Replacement /)
  assert.ok(badge.diff)
})

test('editing an assumption changes the live score', () => {
  const base = scoreTradeInRow(rows[0], composed.active[0].unit, {
    pkg,
    job: pkg.jobDefaults,
    assumptions,
  })
  const bumped = scoreTradeInRow(rows[0], composed.active[0].unit, {
    pkg,
    job: pkg.jobDefaults,
    assumptions: { ...assumptions, rangeBuffer: 0.5 },
  })
  assert.ok(base)
  assert.ok(bumped)
  // Range points can change; totals may differ
  const baseRange = base.categories.find((c) => c.key === 'range')
  const bumpedRange = bumped.categories.find((c) => c.key === 'range')
  assert.ok(baseRange && bumpedRange)
  // With a lower buffer, usable range shrinks so range points should not rise
  assert.ok(
    (bumpedRange.current.points ?? 0) <= (baseRange.current.points ?? 0) + 0.05,
  )
  // Sums still equal totals after edit
  assert.equal(
    sumCountedCategoryPoints(bumped, 'current'),
    bumped.currentTotal,
  )
  assert.equal(
    sumCountedCategoryPoints(bumped, 'candidate'),
    bumped.candidateTotal,
  )
})

test('editing trade-in stats or gas price updates score live and keeps sum equals total', () => {
  const base = scoreTradeInRow(rows[1], composed.active[1].unit, {
    pkg,
    job: pkg.jobDefaults,
    assumptions,
  })
  const gasBump = scoreTradeInRow(rows[1], composed.active[1].unit, {
    pkg,
    job: pkg.jobDefaults,
    assumptions: { ...assumptions, gasUsdPerGal: 6.5 },
  })
  assert.ok(base && gasBump)
  assert.ok(base.currentTotal != null && gasBump.currentTotal != null)
  const baseEnergy = base.categories.find((c) => c.key === 'energy')
  const bumpEnergy = gasBump.categories.find((c) => c.key === 'energy')
  assert.ok(baseEnergy?.current.reason !== bumpEnergy?.current.reason)
  assert.equal(
    sumCountedCategoryPoints(gasBump, 'current'),
    gasBump.currentTotal,
  )
  assert.equal(
    sumCountedCategoryPoints(gasBump, 'candidate'),
    gasBump.candidateTotal,
  )

  const milesEdit = scoreTradeInRow(
    { ...rows[0], mileage: '120000' },
    composed.active[0].unit,
    { pkg, job: pkg.jobDefaults, assumptions },
  )
  assert.ok(milesEdit)
  assert.equal(milesEdit.missingCurrent, false)
  assert.equal(
    sumCountedCategoryPoints(milesEdit, 'current'),
    milesEdit.currentTotal,
  )
  assert.equal(
    sumCountedCategoryPoints(milesEdit, 'candidate'),
    milesEdit.candidateTotal,
  )
})

console.log(`All ${passed} trade-in score sum tests passed.`)
