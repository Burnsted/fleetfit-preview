import { TRADE_PACKAGES } from '../src/data/tradePackages.js'
import { composeTradePackageSet } from '../src/lib/tradePackageSet.js'
import { createExampleTradeInRows } from '../src/lib/tradeInEntry.js'
import {
  defaultScoreAssumptions,
  scoreTradeInRow,
  buildFactorPresentation,
} from '../src/lib/tradeInScore.js'

const pkg = TRADE_PACKAGES.find((p) => p.id === 'pkg-trade-electrical')
const composed = composeTradePackageSet(pkg, { intake: null, pkg }, 2)
const rows = createExampleTradeInRows(2)
const assumptions = defaultScoreAssumptions(pkg.jobDefaults)
const score = scoreTradeInRow(rows[0], composed.active[0].unit, {
  pkg,
  job: pkg.jobDefaults,
  assumptions,
})
for (const c of score.categories) {
  console.log(
    c.key,
    'curCounted',
    c.current.counted,
    c.current.display,
    'candCounted',
    c.candidate.counted,
    c.candidate.display,
  )
}
const p = buildFactorPresentation(score)
console.log(
  'rows',
  p.rows.map((r) => r.label + '/' + r.key),
)
console.log(
  'notScored',
  p.notScored.map((n) => n.label),
)
