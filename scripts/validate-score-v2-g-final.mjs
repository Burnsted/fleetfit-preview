/**
 * §6.1 G-final — 7 live-demo candidates vs 2018 Transit-250
 * Run: npx vite-node scripts/validate-score-v2-g-final.mjs
 */
import { getPackage } from '../src/data/package.js'
import { rankUnitsByScoreV2 } from '../src/lib/scoreV2.ts'
import { currentWorkVehicle } from '../src/lib/workSpec.js'

const EXPECTED = [
  { match: /Sierra EV/i, total: 64.8, pp: 80, diff: 24.8 },
  { match: /BrightDrop/i, total: 59.6, pp: 80, diff: 19.6 },
  { match: /ProMaster/i, total: 63.0, pp: 80, diff: 23.0 },
  { match: /Silverado EV/i, total: 66.9, pp: 90, diff: 21.4 },
  { match: /E-Transit/i, total: 54.6, pp: 90, diff: 9.1 },
  { match: /Lightning/i, total: 61.8, pp: 90, diff: 16.3 },
  { match: /R1T/i, total: 46.1, pp: 90, diff: 0.6 },
]

const pkg = getPackage('pkg-tc-electrical-4')
const ranked = rankUnitsByScoreV2(pkg.units, { pkg, intake: null })

console.log('BUILD', ranked[0]?.score?.build)
console.log('CURRENT', ranked[0]?.score?.currentName)
console.log('UNIT COUNT', ranked.length)

const current = currentWorkVehicle(null, pkg)
console.log(
  'CHIP payload:',
  current.spec.payload.text,
  'known=',
  current.spec.payload.known,
)

function dump(label, score) {
  console.log('\n====', label, '====')
  console.log(
    'TOTAL',
    score.candidateTotal,
    '/',
    score.pointsPossible,
    'diff',
    score.difference,
    'incomplete',
    score.incomplete,
  )
  console.log('dial', score.dialTotal, '|', score.dialDiff, '|', score.dialCurrent)
  for (const row of score.categories) {
    console.log(
      row.key.padEnd(12),
      '|',
      String(row.current.display).padEnd(40),
      '|',
      String(row.candidate.display).padEnd(48),
      '|',
      row.current.counted ? 'in' : 'out',
    )
    if (row.candidate.reason) console.log('  cand:', row.candidate.reason.slice(0, 180))
    if (row.current.reason) console.log('  cur :', row.current.reason.slice(0, 180))
  }
}

let ok = true
const table = []
for (const exp of EXPECTED) {
  const hit = ranked.find((r) =>
    exp.match.test(`${r.unit.year} ${r.unit.make} ${r.unit.model}`),
  )
  if (!hit) {
    console.error('MISSING UNIT', exp.match)
    ok = false
    continue
  }
  const s = hit.score
  dump(`${hit.unit.year} ${hit.unit.make} ${hit.unit.model}`, s)
  const match =
    s.candidateTotal === exp.total &&
    s.pointsPossible === exp.pp &&
    s.difference === exp.diff &&
    !s.incomplete
  table.push({
    unit: `${hit.unit.year} ${hit.unit.model}`,
    got: `${s.candidateTotal}/${s.pointsPossible} ${s.difference > 0 ? '+' : ''}${s.difference}`,
    exp: `${exp.total}/${exp.pp} +${exp.diff}`,
    ok: match,
    mi: hit.unit.scoreMileage ?? hit.unit.mileage,
    wt: hit.unit.warrantyType,
  })
  if (!match) {
    ok = false
    console.error(
      'MISMATCH',
      hit.unit.model,
      'got',
      s.candidateTotal,
      '/',
      s.pointsPossible,
      s.difference,
      'expected',
      exp.total,
      '/',
      exp.pp,
      exp.diff,
    )
  }
}

console.log('\n==== SUMMARY TABLE ====')
for (const row of table) {
  console.log(
    (row.ok ? 'OK ' : 'FAIL'),
    row.unit.padEnd(22),
    'got',
    row.got.padEnd(18),
    'exp',
    row.exp,
    'mi',
    row.mi,
    'wt',
    row.wt,
  )
}

// Ranking by total/PP
const order = [...ranked].sort((a, b) => b.score.sortKey - a.score.sortKey)
console.log('\nRANK (total/PP):')
order.forEach((r, i) => {
  const s = r.score
  console.log(
    i + 1,
    r.unit.model,
    s.candidateTotal,
    '/',
    s.pointsPossible,
    '=',
    s.sortKey?.toFixed(4),
  )
})

if (!ok) {
  console.error('\nSTOP — §6.1 totals not reproduced. Do not tune.')
  process.exit(1)
}
console.log('\nOK §6.1 G-final 7 demo candidates reproduced.')
