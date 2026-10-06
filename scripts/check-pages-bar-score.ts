import { getPackageAllUnits } from '../src/data/package.js'
import { scoreReplacementV2, rankUnitsByScoreV2 } from '../src/lib/scoreV2'

const pkg = getPackageAllUnits('pkg-tc-electrical-4')
if (!pkg) throw new Error('package missing')

const ranked = rankUnitsByScoreV2(pkg.units, { intake: null, pkg })
console.log('units', ranked.length)
for (const { unit, score } of ranked) {
  console.log('---', unit.id, unit.year, unit.make, unit.model)
  console.log(
    'total',
    score.candidateTotal,
    '/',
    score.pointsPossible,
    'diff',
    score.difference,
    'cur',
    score.currentTotal,
  )
  console.log('dial', score.dialTotal, score.dialDiff, score.dialCurrent)
  console.log(
    'missing',
    score.missingCurrent,
    'banner',
    score.banner,
    'incomplete',
    score.incomplete,
  )
  console.log('currentName', score.currentName)
  for (const c of score.categories) {
    console.log(
      c.label.padEnd(14),
      '|',
      String(c.current.display).padEnd(36),
      '|',
      String(c.candidate.display).padEnd(36),
      '|',
      (c.current.reason || '').slice(0, 90),
      '||',
      (c.candidate.reason || '').slice(0, 90),
    )
  }
}

const noCur = scoreReplacementV2(pkg.units[0], {
  intake: {
    job: {
      dailyMiles: 120,
      loadLb: 543,
      crew: 2,
      tows: false,
      shopCity: 'Vero Beach',
    },
  },
  pkg: { jobDefaults: pkg.jobDefaults },
})
console.log('\nNO CURRENT sample')
console.log('missing', noCur.missingCurrent, 'banner', noCur.banner)
console.log(
  'totals',
  noCur.currentTotal,
  noCur.candidateTotal,
  noCur.pointsPossible,
  noCur.difference,
)
console.log(
  'cats',
  noCur.categories.map((c) => `${c.current.display}/${c.candidate.display}`).join(' · '),
)
const bad = noCur.categories.some((c) =>
  /current vehicle not entered/i.test(
    `${c.current.display}${c.current.reason}${c.candidate.display}${c.candidate.reason}`,
  ),
)
console.log('incomplete strings in cells?', bad)
