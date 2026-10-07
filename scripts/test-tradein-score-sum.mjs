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
  formatFormulaSourceText,
  formulaSourceLines,
  hasBrokenSheetPunctuation,
  hasExcessMoneyDecimals,
  hasNestedOrChainedParens,
  hasVisibleNoteArithmetic,
  inferTradeInBodyType,
  pairTradeInsToUnits,
  scoreTradeInRow,
  scoreUnitCard,
  scrubSheetReason,
  sumCountedCategoryPoints,
  sumPresentedCountedPoints,
  tradeInScoreBadgeCopy,
  unitBodyType,
  parseCentsPerMile,
  exampleMaintCpm,
  maintExampleKindForSide,
  VISIBLE_NOTE_MAX,
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
  assert.ok(!/[()]/.test(scrubbed))
  assert.match(scrubbed, /road miles/)
  assert.ok(scrubbed.length <= VISIBLE_NOTE_MAX)
  const longevity = scrubSheetReason('powertrain 5 yr · 60k expired; ≤150k mi, no modifier')
  assert.match(longevity, /up to 150k|150k/)
  assert.ok(!/\bno modifier\b/i.test(longevity), longevity)
})

const SOURCE_IN_VISIBLE =
  /cars\.com|Car and Driver|Edmunds|EV Pulse|Fuelly|OEM estimate|not EPA|brochure|NHTSA|listing/i

test('source names leave visible notes; formula uses and not slash', () => {
  const samples = [
    '2 seats (Car and Driver / Edmunds) vs crew 2',
    '2 seats (Car and Driver and Edmunds) vs crew 2',
    '2 seats (Ford 2018 Transit brochure) vs crew 2',
    '5 seats (cars.com; Crew Cab) vs crew 2',
    'Fuelly crowd-sourced mpg (not EPA-rated: GVWR over 8,500): 13.6 mpg · $4.37 per gal',
    '71.4 kWh per 100 mi (1.4 mi/kWh; EV Pulse highway) · OEM estimate, not EPA',
    '1 seat (cars.com) · Car and Driver / Edmunds 2; lower used for candidate',
  ]
  for (const raw of samples) {
    const scrubbed = scrubSheetReason(raw)
    assert.ok(
      !SOURCE_IN_VISIBLE.test(scrubbed),
      `source left in visible note: ${JSON.stringify(scrubbed)} from ${raw}`,
    )
    assert.ok(
      !hasBrokenSheetPunctuation(scrubbed),
      `broken punctuation in ${JSON.stringify(scrubbed)}`,
    )
    const form = formatFormulaSourceText(raw)
    assert.ok(!/\bCar and Driver\s*\/\s*Edmunds\b/i.test(form), form)
    if (/Car and Driver/i.test(form) && /Edmunds/i.test(form)) {
      assert.match(form, /Car and Driver and Edmunds/i)
    }
  }
})

test('visible notes have no broken punctuation from scrubbing', () => {
  const brokenSamples = [
    '5 seats (: Crew Cab) vs crew 2',
    '2 seats (: lowest across cabs)',
    'note ( leftover',
    'note leftover )',
    '()',
    ': leading',
    'trailing,',
  ]
  for (const s of brokenSamples) {
    assert.ok(
      hasBrokenSheetPunctuation(s),
      `detector missed broken punctuation: ${s}`,
    )
  }
  for (let i = 0; i < rows.length; i += 1) {
    const score = scoreTradeInRow(rows[i], pairedUnits[i], {
      pkg,
      job: pkg.jobDefaults,
      assumptions,
    })
    const presentation = buildFactorPresentation(score)
    const notes = []
    for (const row of presentation.rows || []) {
      if (row.kind === 'group') {
        for (const part of row.parts || []) {
          if (part.current?.reason) notes.push(part.current.reason)
          if (part.candidate?.reason) notes.push(part.candidate.reason)
        }
      } else {
        if (row.current?.reason) notes.push(row.current.reason)
        if (row.candidate?.reason) notes.push(row.candidate.reason)
      }
    }
    for (const note of notes) {
      assert.ok(
        !hasBrokenSheetPunctuation(note),
        `broken punctuation in rendered note: ${JSON.stringify(note)}`,
      )
      assert.ok(
        !SOURCE_IN_VISIBLE.test(note),
        `source tag in rendered note: ${JSON.stringify(note)}`,
      )
      assert.ok(
        !/\s\/\s|\bCar and Driver\s*\/\s*Edmunds\b/.test(note),
        `slash in visible note: ${JSON.stringify(note)}`,
      )
      assert.ok(!/[→⟶]|->|[≤≥]/.test(note), `arrow or ≤/≥ in note: ${note}`)
    }
  }
})

test('E-Transit cab scores 2 seats vs crew 2 (not cars.com 1)', () => {
  const score = scoreTradeInRow(rows[0], pairedUnits[0], {
    pkg,
    job: pkg.jobDefaults,
    assumptions,
    intake: { job: pkg.jobDefaults },
  })
  assert.match(pairedUnits[0].model, /E-Transit/i)
  const cab = score.categories.find((c) => c.key === 'cab')
  assert.ok(cab)
  assert.match(cab.candidate.reason, /2 seats/)
  assert.ok(!/1 seat\b/.test(cab.candidate.reason))
  assert.equal(cab.candidate.points, 10)
  assert.equal(
    sumCountedCategoryPoints(score, 'candidate'),
    score.candidateTotal,
  )
  assert.equal(sumCountedCategoryPoints(score, 'current'), score.currentTotal)
  console.log(
    'E-TRANSIT_PAIR',
    score.currentTotal,
    score.candidateTotal,
    score.pointsPossible,
  )
})

test('visible notes stay short, no paren chains, money at most 2 decimals', () => {
  for (let i = 0; i < rows.length; i += 1) {
    const score = scoreTradeInRow(rows[i], pairedUnits[i], {
      pkg,
      job: pkg.jobDefaults,
      assumptions,
      intake: { job: pkg.jobDefaults },
    })
    const presentation = buildFactorPresentation(score)
    const notes = []
    for (const row of presentation.rows || []) {
      if (row.kind === 'group') {
        for (const part of row.parts || []) {
          if (part.current?.reason) notes.push(part.current.reason)
          if (part.candidate?.reason) notes.push(part.candidate.reason)
        }
      } else {
        if (row.current?.reason) notes.push(row.current.reason)
        if (row.candidate?.reason) notes.push(row.candidate.reason)
      }
    }
    assert.ok(
      presentation.rows.some(
        (r) => r.key === 'maintenance' || r.label === 'Maintenance cost, rises with age and miles',
      ),
      'Maintenance cost row must be visible',
    )
    for (const note of notes) {
      assert.ok(
        note.length <= VISIBLE_NOTE_MAX,
        `note longer than ${VISIBLE_NOTE_MAX}: ${JSON.stringify(note)}`,
      )
      assert.ok(
        !hasNestedOrChainedParens(note),
        `parens in visible note: ${JSON.stringify(note)}`,
      )
      assert.ok(
        !hasExcessMoneyDecimals(note),
        `money >2 decimals: ${JSON.stringify(note)}`,
      )
      assert.ok(
        !hasBrokenSheetPunctuation(note),
        `broken punctuation: ${JSON.stringify(note)}`,
      )
      if (/\$/.test(note)) {
        assert.match(note, /Example/, `Example missing beside $ in ${note}`)
      }
    }
  }
  const moneySamples = [
    scrubSheetReason('$4.3679 per gal FL regular = 32.1¢ per mi'),
    scrubSheetReason(
      '3-yr retained: KBB 50% (last-3-yr private-party −50% ($35,079 → $17,500))',
    ),
  ]
  for (const s of moneySamples) {
    assert.ok(!hasExcessMoneyDecimals(s), s)
    assert.ok(!hasNestedOrChainedParens(s), s)
    assert.ok(!hasVisibleNoteArithmetic(s), s)
    assert.ok(s.length <= VISIBLE_NOTE_MAX, s)
  }
})

test('visible notes ban engine arithmetic (× ÷ = and bare 0.7); formula keeps math', () => {
  const arithmeticSamples = [
    '13.6 mpg × 25 gal = 340 mi × 0.7 = 238 mi usable',
    '108 mi × 0.7 = 75.6 mi usable vs 62 miles a day',
    '13.6 mpg · $4.37 Example per gal = 32.1¢ per mi',
    '71.4 kWh per 100 mi × 11.37¢ per kWh = 8.1¢ per mi',
    '494 mi tank × 0.7 = 345.8 mi usable vs 62 miles a day',
    '283 mi × 0.7 = 198.1 mi usable vs 62 miles a day',
    '$4.37 Example per gal ÷ 19 mpg = 23.0¢ per mi',
    '50.3 kWh per 100 mi × 11.37¢ per kWh = 5.7¢ per mi',
  ]
  for (const raw of arithmeticSamples) {
    assert.ok(
      hasVisibleNoteArithmetic(raw),
      `detector missed arithmetic: ${raw}`,
    )
    const scrubbed = scrubSheetReason(raw)
    assert.ok(
      !hasVisibleNoteArithmetic(scrubbed),
      `arithmetic left in visible note: ${JSON.stringify(scrubbed)} from ${raw}`,
    )
    assert.ok(
      scrubbed.length <= VISIBLE_NOTE_MAX,
      `scrubbed note too long: ${JSON.stringify(scrubbed)}`,
    )
    assert.match(scrubbed, /^About /)
    const formula = formatFormulaSourceText(raw)
    assert.ok(
      hasVisibleNoteArithmetic(formula) || /[×÷=]/.test(formula),
      `formula must keep math from ${raw}: ${formula}`,
    )
  }

  // Both sheets, both pairs, and default presentation state
  for (let i = 0; i < rows.length; i += 1) {
    const score = scoreTradeInRow(rows[i], pairedUnits[i], {
      pkg,
      job: pkg.jobDefaults,
      assumptions,
      intake: { job: pkg.jobDefaults },
    })
    const presentation = buildFactorPresentation(score)
    const notes = []
    for (const row of presentation.rows || []) {
      if (row.kind === 'group') {
        for (const part of row.parts || []) {
          if (part.current?.reason) notes.push(part.current.reason)
          if (part.candidate?.reason) notes.push(part.candidate.reason)
        }
      } else {
        if (row.current?.reason) notes.push(row.current.reason)
        if (row.candidate?.reason) notes.push(row.candidate.reason)
      }
    }
    assert.ok(notes.length > 0, `expected visible notes for pair ${i}`)
    for (const note of notes) {
      assert.ok(
        !hasVisibleNoteArithmetic(note),
        `pair ${i} visible note has arithmetic: ${JSON.stringify(note)}`,
      )
    }
    // Formula view still carries the engine calc for range/energy
    const formula = formulaSourceLines(score)
    const mathLines = formula.filter((l) => /[×÷=]|\b0\.7\b/.test(l.text))
    assert.ok(
      mathLines.length > 0,
      `pair ${i} formula view must keep calculation lines`,
    )
  }
})

test('maintenance Example ¢/mi differ by powertrain; ownership uses those rates', () => {
  // Steve FAIL (1): gas vs EV Example rates (Argonne 10.1 vs 6.1), both pairs.
  assert.equal(exampleMaintCpm('ice'), 10.1)
  assert.equal(exampleMaintCpm('ev'), 6.1)
  assert.notEqual(exampleMaintCpm('ice'), exampleMaintCpm('ev'))

  for (let i = 0; i < rows.length; i += 1) {
    const score = scoreTradeInRow(rows[i], pairedUnits[i], {
      pkg,
      job: pkg.jobDefaults,
      assumptions,
      intake: { job: pkg.jobDefaults },
    })
    const presentation = buildFactorPresentation(score)
    const maint = presentation.rows.find(
      (r) =>
        r.key === 'maintenance' ||
        r.label === 'Maintenance cost, rises with age and miles',
    )
    assert.ok(maint, `pair ${i} must show Maintenance row`)
    const curCpm = parseCentsPerMile(maint.current?.reason)
    const candCpm = parseCentsPerMile(maint.candidate?.reason)
    assert.ok(curCpm != null, `pair ${i} trade-in maint ¢/mi`)
    assert.ok(candCpm != null, `pair ${i} replacement maint ¢/mi`)
    assert.notEqual(
      curCpm,
      candCpm,
      `pair ${i} ${rows[i].model} vs ${pairedUnits[i].model}: maint ¢/mi must differ by powertrain (got ${curCpm} and ${candCpm})`,
    )
    assert.equal(
      maintExampleKindForSide(score, 'current'),
      'ice',
      `pair ${i} trade-in should be ice Example`,
    )
    assert.equal(
      maintExampleKindForSide(score, 'candidate'),
      'ev',
      `pair ${i} replacement should be ev Example`,
    )
    assert.equal(curCpm, exampleMaintCpm('ice'))
    assert.equal(candCpm, exampleMaintCpm('ev'))

    const both = costOfOwnershipBoth(score, assumptions, pkg.jobDefaults)
    for (const [side, o, cpm] of [
      ['tradeIn', both.tradeIn, curCpm],
      ['replacement', both.replacement, candCpm],
    ]) {
      assert.equal(
        o.totalUsdPerYear,
        o.energyUsdPerYear + o.maintUsdPerYear + o.depreciationUsdPerYear,
        `pair ${i} ${side} ownership total = energy + maintenance + depreciation`,
      )
      const expectedMaint = Math.round((cpm / 100) * o.annualMiles)
      assert.equal(
        o.maintUsdPerYear,
        expectedMaint,
        `pair ${i} ${side} maint $ must follow ${cpm}¢/mi × ${o.annualMiles} mi`,
      )
    }
    console.log(
      'MAINT_RATES',
      rows[i].model,
      'vs',
      pairedUnits[i].model,
      '¢/mi',
      curCpm,
      candCpm,
      'own',
      both.tradeIn.totalUsdPerYear,
      both.replacement.totalUsdPerYear,
    )
  }
})

test('visible notes: recall campaign wording, model year not MY, no "no modifier"', () => {
  // Steve FAIL (2)
  const samples = [
    ['1 NHTSA campaigns MY', '1 recall campaign'],
    ['1 campaigns MY', '1 recall campaign'],
    ['14 campaigns MY', '14 recall campaigns'],
    ['10 campaigns MY', '10 recall campaigns'],
    ['4 campaigns MY', '4 recall campaigns'],
    ['powertrain 5 yr · 60k expired; ≤150k mi, no modifier', null],
  ]
  for (const [raw, expectSub] of samples) {
    const scrubbed = scrubSheetReason(raw)
    assert.ok(
      !/\bMY\b/.test(scrubbed),
      `MY left in note: ${JSON.stringify(scrubbed)}`,
    )
    assert.ok(
      !/\bno modifier\b/i.test(scrubbed),
      `no modifier left: ${JSON.stringify(scrubbed)}`,
    )
    assert.ok(
      !/\b1 campaigns\b/i.test(scrubbed),
      `1 campaigns left: ${JSON.stringify(scrubbed)}`,
    )
    if (expectSub) {
      assert.match(
        scrubbed,
        new RegExp(expectSub.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
        `expected ${expectSub} in ${JSON.stringify(scrubbed)} from ${raw}`,
      )
    }
    if (/\bmodel year\b/i.test(scrubbed) || /\bcampaign/.test(raw)) {
      // "MY" alone becomes "model year"; campaign lines drop the orphan MY after rewrite
      assert.ok(!/\bMY\b/.test(scrubbed))
    }
  }

  for (let i = 0; i < rows.length; i += 1) {
    const score = scoreTradeInRow(rows[i], pairedUnits[i], {
      pkg,
      job: pkg.jobDefaults,
      assumptions,
      intake: { job: pkg.jobDefaults },
    })
    const presentation = buildFactorPresentation(score)
    const notes = []
    for (const row of presentation.rows || []) {
      if (row.kind === 'group') {
        for (const part of row.parts || []) {
          if (part.current?.reason) notes.push(part.current.reason)
          if (part.candidate?.reason) notes.push(part.candidate.reason)
        }
      } else {
        if (row.current?.reason) notes.push(row.current.reason)
        if (row.candidate?.reason) notes.push(row.candidate.reason)
      }
    }
    for (const note of notes) {
      assert.ok(!/\sMY\b|\bMY\b/.test(note), `MY in pair ${i}: ${note}`)
      assert.ok(!/\bno modifier\b/i.test(note), `no modifier in pair ${i}: ${note}`)
      assert.ok(!/\b1 campaigns\b/i.test(note), `1 campaigns in pair ${i}: ${note}`)
    }
  }
})

test('visible About <number> has no decimal', () => {
  // Steve FAIL (3): "About 76 mi", "About 346 mi", "About 198 mi"
  const samples = [
    ['108 mi × 0.7 = 75.6 mi usable vs 62 miles a day', /About 76 mi/],
    ['494 mi tank × 0.7 = 345.8 mi usable vs 62 miles a day', /About 346 mi/],
    ['283 mi × 0.7 = 198.1 mi usable vs 62 miles a day', /About 198 mi/],
    ['13.6 mpg × 25 gal = 340 mi × 0.7 = 238 mi usable', /About 238 mi/],
  ]
  for (const [raw, expect] of samples) {
    const scrubbed = scrubSheetReason(raw)
    assert.match(scrubbed, expect, `${raw} → ${scrubbed}`)
    assert.ok(
      !/\bAbout\s+\d+\.\d+/.test(scrubbed),
      `decimal after About: ${JSON.stringify(scrubbed)}`,
    )
  }

  for (let i = 0; i < rows.length; i += 1) {
    const score = scoreTradeInRow(rows[i], pairedUnits[i], {
      pkg,
      job: pkg.jobDefaults,
      assumptions,
      intake: { job: pkg.jobDefaults },
    })
    const presentation = buildFactorPresentation(score)
    const notes = []
    for (const row of presentation.rows || []) {
      if (row.kind === 'group') {
        for (const part of row.parts || []) {
          if (part.current?.reason) notes.push(part.current.reason)
          if (part.candidate?.reason) notes.push(part.candidate.reason)
        }
      } else {
        if (row.current?.reason) notes.push(row.current.reason)
        if (row.candidate?.reason) notes.push(row.candidate.reason)
      }
    }
    for (const note of notes) {
      assert.ok(
        !/\bAbout\s+\d+\.\d+/.test(note),
        `pair ${i} About has decimal: ${JSON.stringify(note)}`,
      )
    }
  }
})

test('sheet replacement total and PP equal that unit card for every default trade row', () => {
  const scoreCtx = { intake: { job: pkg.jobDefaults }, pkg }
  for (let i = 0; i < rows.length; i += 1) {
    const unit = pairedUnits[i]
    const card = scoreUnitCard(unit, {
      intake: scoreCtx.intake,
      pkg,
      assumptions,
    })
    const sheet = scoreTradeInRow(rows[i], unit, {
      intake: scoreCtx.intake,
      pkg,
      job: pkg.jobDefaults,
      assumptions,
    })
    assert.ok(card && sheet, `card and sheet for row ${i + 1}`)
    assert.equal(
      sheet.candidateTotal,
      card.candidateTotal,
      `row ${i + 1} ${unit.model}: sheet cand ${sheet.candidateTotal} != card ${card.candidateTotal}`,
    )
    assert.equal(
      sheet.pointsPossible,
      card.pointsPossible,
      `row ${i + 1} ${unit.model}: sheet PP ${sheet.pointsPossible} != card ${card.pointsPossible}`,
    )
    assert.equal(
      sumCountedCategoryPoints(sheet, 'candidate'),
      sheet.candidateTotal,
      `row ${i + 1} candidate sum equals total`,
    )
    assert.equal(
      sumCountedCategoryPoints(sheet, 'current'),
      sheet.currentTotal,
      `row ${i + 1} current sum equals total`,
    )
    const badge = tradeInScoreBadgeCopy(sheet)
    assert.equal(
      badge.candidateTotal,
      card.candidateTotal,
      `badge replacement must match card for ${unit.model}`,
    )
    assert.equal(badge.pointsPossible, card.pointsPossible)
    assert.match(
      badge.tradeIn,
      new RegExp(
        `${Number(sheet.currentTotal).toFixed(1)} out of ${card.pointsPossible}`,
      ),
    )
    assert.match(
      badge.replacement,
      new RegExp(`Replacement ${Number(card.candidateTotal).toFixed(1)}`),
    )
    console.log(
      'CARD_EQ_SHEET',
      rows[i].model,
      'vs',
      unit.model,
      'card',
      card.candidateTotal,
      '/',
      card.pointsPossible,
      'sheet',
      sheet.currentTotal,
      '/',
      sheet.candidateTotal,
      '/',
      sheet.pointsPossible,
    )
  }
})

console.log(`All ${passed} trade-in score sum tests passed.`)
