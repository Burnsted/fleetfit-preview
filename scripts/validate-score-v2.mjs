/**
 * §6 validation — Supervisor + 2022 R1T vs 2018 F-150 3.5EB 4x4
 * Run: npx vite-node scripts/validate-score-v2.mjs
 */
import { scoreV2ValidationExample } from '../src/lib/scoreV2.ts'

const score = scoreV2ValidationExample()
console.log('BUILD', score.build)
console.log('CURRENT', score.currentName)
console.log('CANDIDATE', score.candidateName)
console.log('PP', score.pointsPossible)
console.log('TOTALS', score.currentTotal, score.candidateTotal, score.difference)
for (const row of score.categories) {
  console.log(
    row.key.padEnd(12),
    '|',
    String(row.current.display).padEnd(42),
    '|',
    String(row.candidate.display).padEnd(42),
    '|',
    row.current.counted ? 'in' : 'out',
  )
  console.log('  cur:', row.current.reason.slice(0, 120))
  console.log('  cand:', row.candidate.reason.slice(0, 120))
}

const expectCur = 26.9
const expectCand = 29.0
const expectDiff = 2.1
const ok =
  score.currentTotal === expectCur &&
  score.candidateTotal === expectCand &&
  score.difference === expectDiff &&
  score.pointsPossible === 60

if (!ok) {
  console.error('\nMISMATCH vs §6 expected 26.9/60 vs 29.0/60 (+2.1)')
  console.error('Got', score.currentTotal, '/', score.pointsPossible, 'vs', score.candidateTotal, '/', score.pointsPossible, score.difference)
  process.exit(1)
}
console.log('\nOK §6 reproduced:', score.currentTotal, '/', score.pointsPossible, 'vs', score.candidateTotal, '/', score.pointsPossible, '+', score.difference)
