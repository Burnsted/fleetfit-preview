/**
 * §6 validation — section F re-run
 * F-150 56.9/90 · consumer R1T 51.0/90 (−5.9) · fleet R1T 55.1/90 (−1.8)
 * Run: npx vite-node scripts/validate-score-v2.mjs
 */
import { scoreV2ValidationExample } from '../src/lib/scoreV2.ts'

function dump(label, score) {
  console.log('\n====', label, '====')
  console.log('BUILD', score.build)
  console.log('CURRENT', score.currentName)
  console.log('CANDIDATE', score.candidateName)
  console.log('PP', score.pointsPossible)
  console.log('TOTALS', score.currentTotal, score.candidateTotal, score.difference)
  for (const row of score.categories) {
    console.log(
      row.key.padEnd(12),
      '|',
      String(row.current.display).padEnd(36),
      '|',
      String(row.candidate.display).padEnd(36),
      '|',
      row.current.counted ? 'in' : 'out',
    )
    console.log('  cur:', row.current.reason.slice(0, 160))
    console.log('  cand:', row.candidate.reason.slice(0, 160))
  }
}

const consumer = scoreV2ValidationExample('consumer', 'none')
const fleet = scoreV2ValidationExample('commercial_fleet', 'none')
dump('A consumer R1T', consumer)
dump('B fleet-sold R1T', fleet)

const okA =
  consumer.currentTotal === 56.9 &&
  consumer.candidateTotal === 51.0 &&
  consumer.difference === -5.9 &&
  consumer.pointsPossible === 90

const okB =
  fleet.currentTotal === 56.9 &&
  fleet.candidateTotal === 55.1 &&
  fleet.difference === -1.8 &&
  fleet.pointsPossible === 90

if (!okA) {
  console.error('\nMISMATCH A vs §6 expected 56.9/90 vs 51.0/90 (−5.9)')
  console.error(
    'Got',
    consumer.currentTotal,
    '/',
    consumer.pointsPossible,
    'vs',
    consumer.candidateTotal,
    '/',
    consumer.pointsPossible,
    consumer.difference,
  )
}
if (!okB) {
  console.error('\nMISMATCH B vs §6 expected 56.9/90 vs 55.1/90 (−1.8)')
  console.error(
    'Got',
    fleet.currentTotal,
    '/',
    fleet.pointsPossible,
    'vs',
    fleet.candidateTotal,
    '/',
    fleet.pointsPossible,
    fleet.difference,
  )
}
if (!okA || !okB) process.exit(1)
console.log('\nOK §6 reproduced:')
console.log('  F-150', consumer.currentTotal, '/', consumer.pointsPossible)
console.log('  consumer R1T', consumer.candidateTotal, '/', consumer.pointsPossible, consumer.difference)
console.log('  fleet R1T', fleet.candidateTotal, '/', fleet.pointsPossible, fleet.difference)
