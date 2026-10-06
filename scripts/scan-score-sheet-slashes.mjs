/**
 * Scan Replacement Score readout copy for visible '/' across every unit type
 * in the electrical + landscape fixture pools (includes dead listings / gas current).
 * Run: npx vite-node scripts/scan-score-sheet-slashes.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPackageAllUnits } from '../src/data/package.js'
import { rankUnitsByScoreV2 } from '../src/lib/scoreV2.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '../artifacts/voice-feedback')
fs.mkdirSync(outDir, { recursive: true })

const BANNED =
  /\b(best|worst|worth it|soh|battery health)\b/i

function classify(unit, isCurrent = false) {
  const tags = new Set()
  if (isCurrent) tags.add('gas')
  const body = String(unit?.bodyType || '').toLowerCase()
  if (body === 'van') tags.add('van')
  if (body === 'truck' || body === 'pickup') tags.add('pickup')
  if (body === 'suv') tags.add('suv')
  const fuel = `${unit?.make || ''} ${unit?.fuel || ''} ${unit?.powertrain || ''} ${unit?.model || ''}`
  if (
    /ev|electric|lightning|brightdrop|e-?transit|promaster\s*ev|rivian|silverado\s*ev|sierra\s*ev|r1t|cybertruck|hummer\s*ev/i.test(
      fuel,
    )
  ) {
    tags.add('ev')
  } else if (isCurrent || /gas|diesel|gasoline|transit-?250|f-?150(?!\s*lightning)/i.test(fuel)) {
    tags.add('gas')
  }
  if (!tags.size) tags.add('other')
  return [...tags]
}

/** Strip URLs so http(s) paths do not count as visible slash copy. */
function stripUrls(text) {
  return String(text || '')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/\bwww\.\S+/gi, ' ')
}

function slashHits(text) {
  const cleaned = stripUrls(text)
  const hits = []
  // Catch both "a/b" and "a / b" style visible slashes.
  const re = /.{0,32}\/.{0,32}/g
  let m
  while ((m = re.exec(cleaned))) {
    const frag = m[0].replace(/\s+/g, ' ').trim()
    if (!frag || frag === '/') continue
    hits.push(frag)
  }
  return hits
}

function collectVisible(score) {
  const bits = []
  if (!score) return bits
  for (const key of ['dialTotal', 'dialDiff', 'dialCurrent', 'incompleteLabel', 'missingCurrentBanner']) {
    if (score[key]) bits.push(String(score[key]))
  }
  for (const row of score.categories || []) {
    bits.push(row.label || '', row.key || '')
    for (const side of ['current', 'candidate']) {
      const cell = row[side]
      if (!cell) continue
      bits.push(cell.display || '', cell.reason || '', cell.status || '')
    }
  }
  return bits
}

const pkgs = ['pkg-tc-electrical-4', 'pkg-tc-landscape-2']
const byType = {
  van: [],
  pickup: [],
  suv: [],
  ev: [],
  gas: [],
  other: [],
}
const allHits = []
const bannedHits = []
const dashHits = []

for (const id of pkgs) {
  const pkg = getPackageAllUnits(id)
  const ranked = rankUnitsByScoreV2(pkg.units, { pkg, intake: null })
  for (const row of ranked) {
    const unit = row.unit
    const score = row.score
    const types = classify(unit, false)
    const texts = collectVisible(score)
    // Current column (gas Transit / gas baseline) is part of the same sheet
    const curTypes = classify(pkg.currentVehicle || { bodyType: 'van', model: 'Transit-250' }, true)

    for (const t of new Set([...types, ...curTypes])) {
      if (!byType[t]) byType[t] = []
    }

    const joined = texts.join('\n')
    const hits = slashHits(joined)
    const entry = {
      packageId: id,
      unit: `${unit.year} ${unit.make} ${unit.model}`,
      bodyType: unit.bodyType,
      types,
      slashHits: hits,
    }
    for (const t of types) byType[t].push(entry)
    // Always attach gas current scan once per package on first unit
    if (ranked.indexOf(row) === 0) {
      byType.gas.push({
        packageId: id,
        unit: 'CURRENT column',
        bodyType: 'gas-current',
        types: ['gas'],
        slashHits: slashHits(
          (score.categories || [])
            .map((c) => `${c.current?.display || ''} ${c.current?.reason || ''}`)
            .join('\n'),
        ),
      })
    }

    if (hits.length) allHits.push(entry)
    if (BANNED.test(joined)) bannedHits.push({ unit: entry.unit, match: joined.match(BANNED)?.[0] })
    if (/[–—]/.test(stripUrls(joined))) dashHits.push(entry.unit)
  }
}

// Ensure empty types report 0
for (const t of ['van', 'pickup', 'suv', 'ev', 'gas', 'other']) {
  if (!byType[t]) byType[t] = []
}

const summary = {}
for (const [t, rows] of Object.entries(byType)) {
  const hits = rows.flatMap((r) => r.slashHits || [])
  summary[t] = {
    unitsScanned: rows.length,
    slashHitCount: hits.length,
    slashHits: [...new Set(hits)],
  }
}

const report = {
  summary,
  bannedHits,
  dashHits,
  failingUnits: allHits.filter((e) => e.slashHits.length),
}

fs.writeFileSync(path.join(outDir, 'score-slash-scan.json'), JSON.stringify(report, null, 2))

console.log(JSON.stringify(summary, null, 2))
if (bannedHits.length) {
  console.error('BANNED WORD HITS', bannedHits)
  process.exit(1)
}
if (dashHits.length) {
  console.error('EN/EM DASH HITS', dashHits)
  process.exit(1)
}
const total = Object.values(summary).reduce((n, s) => n + s.slashHitCount, 0)
if (total > 0) {
  console.error('SLASH HITS REMAIN', report.failingUnits)
  process.exit(1)
}
console.log('OK: 0 visible slash hits across scanned score sheets; 0 banned; 0 en/em dashes')
