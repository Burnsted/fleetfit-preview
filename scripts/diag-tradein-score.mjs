/**
 * Probe: Example trade-in rows vs electrical package units.
 * Run: npx vite-node scripts/diag-tradein-score.mjs
 */
import { TRADE_PACKAGES } from '../src/data/tradePackages.js'
import { composeTradePackageSet } from '../src/lib/tradePackageSet.js'
import { createExampleTradeInRows } from '../src/lib/tradeInEntry.js'
import { scoreReplacementV2 } from '../src/lib/scoreV2.ts'
import { RANGE_BUFFER, round1 } from '../src/data/scoreV2Rubric.ts'
import {
  FL_COMMERCIAL_ELECTRICITY,
  FL_GAS_REGULAR_AAA,
  FL_DIESEL_AAA,
} from '../src/data/flEnergyPrices.ts'

const pkg = TRADE_PACKAGES.find((p) => p.id === 'pkg-trade-electrical')
const composed = composeTradePackageSet(pkg, { intake: null, pkg }, 2)
const rows = createExampleTradeInRows(2)

console.log('RANGE_BUFFER', RANGE_BUFFER)
console.log('FL gas', FL_GAS_REGULAR_AAA?.value, 'diesel', FL_DIESEL_AAA?.value, 'kWh', FL_COMMERCIAL_ELECTRICITY?.value)
console.log('units', composed.active.map((s) => `${s.unit.year} ${s.unit.make} ${s.unit.model}`))

for (let i = 0; i < rows.length; i += 1) {
  const row = rows[i]
  const unit = composed.active[i]?.unit
  if (!unit) {
    console.log('no unit for row', i)
    continue
  }
  const intake = {
    current: {
      year: Number(row.year),
      make: row.make,
      model: row.model,
      miles: Number(row.mileage),
    },
    dailyMiles: pkg.jobDefaults?.dailyMiles ?? 80,
    loadLb: pkg.jobDefaults?.loadLb ?? 1000,
    crew: pkg.jobDefaults?.crew ?? 1,
    tows: pkg.jobDefaults?.tows ?? false,
    shopCity: pkg.jobDefaults?.shopCity ?? 'Vero Beach',
  }
  const score = scoreReplacementV2(unit, { intake, pkg })
  const curSum = score.categories.reduce(
    (s, c) => s + (c.current.counted ? Number(c.current.points) || 0 : 0),
    0,
  )
  const candSum = score.categories.reduce(
    (s, c) => s + (c.candidate.counted ? Number(c.candidate.points) || 0 : 0),
    0,
  )
  console.log('--- row', i + 1, row.year, row.make, row.model)
  console.log('  currentTotal', score.currentTotal, 'sum cats', round1(curSum), 'match', score.currentTotal === round1(curSum))
  console.log('  candidateTotal', score.candidateTotal, 'sum cats', round1(candSum), 'match', score.candidateTotal === round1(candSum))
  console.log('  pointsPossible', score.pointsPossible, 'incomplete', score.incomplete, 'missingCurrent', score.missingCurrent)
  console.log('  dialCurrent', score.dialCurrent, 'dialTotal', score.dialTotal, 'diff', score.difference)
  for (const c of score.categories) {
    if (!c.current.counted && !c.candidate.counted) continue
    console.log(
      '   ',
      c.key,
      'cur',
      c.current.display,
      'cand',
      c.candidate.display,
    )
  }
}
