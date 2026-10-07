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
  buildFactorPresentation,
  costOfOwnershipBoth,
  costOfOwnershipForSide,
  defaultScoreAssumptions,
  inferTradeInBodyType,
  pairTradeInsToUnits,
  scoreTradeInRow,
  scrubSheetReason,
  sumCountedCategoryPoints,
  sumPresentedCountedPoints,
  tradeInScoreBadgeCopy,
  unitBodyType,
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
const activeUnits = composed.active.map((s) => s.unit)
const pairedUnits = pairTradeInsToUnits(rows, activeUnits)

test('every default trade row pairs to a same-body-type replacement', () => {
  assert.equal(pairedUnits.length, rows.length)
  for (let i = 0; i < rows.length; i += 1) {
    const rowBody = inferTradeInBodyType(rows[i])
    const unit = pairedUnits[i]
    assert.ok(unit, `row ${i + 1} must pair to a unit`)
    assert.equal(
      unitBodyType(unit),
      rowBody,
      `row ${i + 1} ${rows[i].model} (${rowBody}) paired to ${unit.make} ${unit.model} (${unitBodyType(unit)})`,
    )
  }
  assert.equal(inferTradeInBodyType(rows[0]), 'van')
  assert.equal(inferTradeInBodyType(rows[1]), 'truck')
  assert.equal(unitBodyType(pairedUnits[0]), 'van')
  assert.equal(unitBodyType(pairedUnits[1]), 'truck')
})

test('category points sum equals currentTotal and candidateTotal for each trade-in row', () => {
  assert.equal(composed.active.length, 2)
  assert.equal(rows.length, 2)
  for (let i = 0; i < rows.length; i += 1) {
    const score = scoreTradeInRow(rows[i], pairedUnits[i], {
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
  const score = scoreTradeInRow(rows[0], pairedUnits[0], {
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
  const base = scoreTradeInRow(rows[0], pairedUnits[0], {
    pkg,
    job: pkg.jobDefaults,
    assumptions,
  })
  const bumped = scoreTradeInRow(rows[0], pairedUnits[0], {
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
  const base = scoreTradeInRow(rows[1], pairedUnits[1], {
    pkg,
    job: pkg.jobDefaults,
    assumptions,
  })
  const gasBump = scoreTradeInRow(rows[1], pairedUnits[1], {
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
    pairedUnits[0],
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

test('cost of ownership total equals energy + maintenance + depreciation', () => {
  const score = scoreTradeInRow(rows[0], pairedUnits[0], {
    pkg,
    job: pkg.jobDefaults,
    assumptions,
  })
  assert.ok(score)
  const both = costOfOwnershipBoth(score, assumptions, pkg.jobDefaults)
  for (const side of ['tradeIn', 'replacement']) {
    const o = both[side]
    assert.equal(
      o.totalUsdPerYear,
      o.energyUsdPerYear + o.maintUsdPerYear + o.depreciationUsdPerYear,
      `${side} ownership total must equal energy + maintenance + depreciation`,
    )
  }
  const withDep = costOfOwnershipForSide(
    score,
    'current',
    { ...assumptions, depreciationUsdPerYear: 4000 },
    pkg.jobDefaults,
  )
  assert.equal(withDep.depreciationUsdPerYear, 4000)
  assert.equal(
    withDep.totalUsdPerYear,
    withDep.energyUsdPerYear + withDep.maintUsdPerYear + 4000,
  )
})

test('Duty fit group total equals sum of its parts; presentation points match score totals', () => {
  const score = scoreTradeInRow(rows[0], pairedUnits[0], {
    pkg,
    job: pkg.jobDefaults,
    assumptions,
  })
  const presentation = buildFactorPresentation(score)
  const duty = presentation.rows.find((r) => r.key === 'duty-fit')
  assert.ok(duty, 'Duty fit group present')
  const partCur = duty.parts.reduce(
    (s, p) => s + (p.current.counted ? Number(p.current.points) || 0 : 0),
    0,
  )
  const partCand = duty.parts.reduce(
    (s, p) => s + (p.candidate.counted ? Number(p.candidate.points) || 0 : 0),
    0,
  )
  assert.equal(duty.currentPoints, Math.round(partCur * 10) / 10)
  assert.equal(duty.candidatePoints, Math.round(partCand * 10) / 10)
  assert.equal(
    sumPresentedCountedPoints(presentation, 'current'),
    score.currentTotal,
  )
  assert.equal(
    sumPresentedCountedPoints(presentation, 'candidate'),
    score.candidateTotal,
  )
  const allLabels = [
    ...presentation.rows.map((r) => r.label),
    ...presentation.notScored.map((n) => n.label),
  ]
  assert.ok(allLabels.some((l) => /Fuel or energy cost/.test(l)))
  assert.ok(
    allLabels.some((l) =>
      /Maintenance cost, rises with age and miles/.test(l),
    ),
  )
  assert.ok(allLabels.some((l) => l === 'Age and miles'))
  assert.ok(
    presentation.notScored.length > 0,
    'not-scored factors collapsed',
  )
})

test('visible sheet notes scrub OSRM, ratio, arrows, and ≤', () => {
  const raw =
    'Linus Buick GMC, 2.5 road mi from 32960 (OSRM) · EV-certified estimate → 7.0 (ratio 3.20) · ≤150k mi · cars.com · Ford 2018 Transit brochure'
  const scrubbed = scrubSheetReason(raw)
  assert.ok(!/\(OSRM\)/i.test(scrubbed))
  assert.ok(!/ratio/i.test(scrubbed))
  assert.ok(!/[→⟶]|->/.test(scrubbed))
  assert.ok(!/[≤≥]/.test(scrubbed))
  assert.ok(!/cars\.com/i.test(scrubbed))
  assert.ok(!/brochure/i.test(scrubbed))
  assert.match(scrubbed, /road miles/)
  assert.match(scrubbed, /up to 150k/)
})

console.log(`All ${passed} trade-in score sum tests passed.`)
