#!/usr/bin/env node
/**
 * Gas twin Option 1 unit tests: money math, mapping, scores, generator FACT gate.
 */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, readFileSync, rmSync, copyFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const {
  computeUpfront,
  computePerYear,
  computeOverYears,
  computeGasTwinEstimate,
  parseYearlyMiles,
  formatOverallScore,
  formatMoreOrLess,
} = await import('../src/lib/gasTwinMoney.js')

const {
  mapVehicleToPrimaryPair,
  getPrimaryPair,
  buildComparisonRows,
  buildOverallScores,
  stripSpecLine,
  NEW_CATALOG_EV_MAP,
  GAS_TWIN_PAIRS_COUNT,
  GAS_TWIN_FACTORS_COUNT,
} = await import('../src/lib/gasTwin.js')

const { GAS_TWIN_FACTORS } = await import('../src/data/gasTwin/generated.ts')

let passed = 0
function test(name, fn) {
  try {
    fn()
    passed += 1
    console.log(`ok - ${name}`)
  } catch (err) {
    console.error(`FAIL - ${name}`)
    console.error(err)
    process.exitCode = 1
  }
}

test('counts match Steve CSVs', () => {
  assert.equal(GAS_TWIN_PAIRS_COUNT, 84)
  assert.equal(GAS_TWIN_FACTORS_COUNT, 3096)
})

test('parseYearlyMiles rejects empty, zero, negative, NaN, text', () => {
  assert.equal(parseYearlyMiles('').ok, false)
  assert.equal(parseYearlyMiles(null).ok, false)
  assert.equal(parseYearlyMiles('0').ok, false)
  assert.equal(parseYearlyMiles('-3').ok, false)
  assert.equal(parseYearlyMiles('abc').ok, false)
  assert.equal(parseYearlyMiles('12.5').ok, false)
  assert.equal(parseYearlyMiles('20000').ok, true)
  assert.equal(parseYearlyMiles('20000').value, 20000)
})

test('upfront not confirmed propagates', () => {
  assert.equal(computeUpfront(null, 50000).display, 'not confirmed')
  assert.equal(computeUpfront(70000, null).display, 'not confirmed')
  const ok = computeUpfront(71700, 54450)
  assert.equal(ok.confirmed, true)
  assert.match(ok.display, /more$/)
})

test('per year needs miles when blank', () => {
  const r = computePerYear({
    yearlyMiles: '',
    evEnergyUsdPerMi: 0.05,
    gasEnergyUsdPerMi: 0.2,
  })
  assert.equal(r.needsMiles, true)
  assert.equal(r.display, 'Add your yearly miles to see this.')
})

test('per year not confirmed when energy missing', () => {
  const r = computePerYear({
    yearlyMiles: '20000',
    evEnergyUsdPerMi: null,
    gasEnergyUsdPerMi: 0.2,
  })
  assert.equal(r.display, 'not confirmed')
})

test('per year and over years math with 20000 miles', () => {
  // Lightning Pro: ev 0.0601, gas 0.2078; maint 0.061 / 0.101
  const per = computePerYear({
    yearlyMiles: '20000',
    evEnergyUsdPerMi: 0.0601,
    gasEnergyUsdPerMi: 0.2078,
  })
  assert.equal(per.confirmed, true)
  const expectedPer = 20000 * ((0.2078 + 0.101) - (0.0601 + 0.061))
  assert.ok(Math.abs(per.amount - expectedPer) < 0.01)

  const up = computeUpfront(56975, 51915)
  const over5 = computeOverYears({
    years: 5,
    perYearAmount: per.amount,
    upfrontAmount: up.amount,
  })
  const expectedOver = 5 * expectedPer - (56975 - 51915)
  assert.ok(Math.abs(over5.amount - expectedOver) < 1)
})

test('years 3 and 7 change over-years', () => {
  const per = 1000
  const up = 2000
  const y3 = computeOverYears({ years: 3, perYearAmount: per, upfrontAmount: up })
  const y7 = computeOverYears({ years: 7, perYearAmount: per, upfrontAmount: up })
  assert.equal(y3.amount, 1000)
  assert.equal(y7.amount, 5000)
})

test('estimate bundle uses not confirmed without partial sums', () => {
  const pair = {
    evBaseMsrpUsd: null,
    gasTwinBaseMsrpUsd: 50000,
    evEnergyUsdPerMi: 0.05,
    gasEnergyUsdPerMi: 0.2,
  }
  const est = computeGasTwinEstimate(pair, { years: 5, yearlyMiles: '20000' })
  assert.equal(est.upfront.display, 'not confirmed')
  assert.equal(est.overYears.display, 'not confirmed')
})

test('formatMoreOrLess has no slash or em dash', () => {
  const s = formatMoreOrLess(1200)
  assert.ok(!s.includes('/'))
  assert.ok(!s.includes('\u2014'))
  assert.match(s, /more$/)
})

test('overall score hidden under 60 points possible', () => {
  const low = formatOverallScore(40, 50)
  assert.equal(low.display, 'not enough confirmed data')
  assert.equal(low.showTotal, false)
  const ok = formatOverallScore(66.7, 70)
  assert.match(ok.display, /out of 70/)
})

test('R1T maps to Tacoma Limited primary from data', () => {
  const pair = getPrimaryPair('Rivian', 'R1T', 'Dual Motor Standard')
  assert.ok(pair)
  assert.equal(pair.gasMake, 'Toyota')
  assert.match(pair.gasVariant, /Limited/)
  assert.equal(pair.primaryTwin, true)
})

test('New catalog maps RCV and R1T; Elevation and E-Transit Low Roof missing', () => {
  const rcv = mapVehicleToPrimaryPair({ id: 'rivian_rcv_500' })
  assert.ok(rcv)
  assert.match(rcv.gasModel, /Express/)
  const r1t = mapVehicleToPrimaryPair({ id: 'rivian_r1t_premium' })
  assert.ok(r1t)
  assert.match(r1t.gasModel, /Tacoma/)
  assert.equal(mapVehicleToPrimaryPair({ id: 'gmc_sierra_ev_elevation_standard' }), null)
  assert.equal(mapVehicleToPrimaryPair({ id: 'ford_etransit_cargo_van_low_roof_148_wb' }), null)
  assert.equal(NEW_CATALOG_EV_MAP.gmc_sierra_ev_elevation_standard, null)
})

test('weak or fair match quality present for Rough match cases', () => {
  const bd = getPrimaryPair('Chevrolet', 'BrightDrop', '600 Base FWD')
  assert.ok(bd)
  assert.equal(bd.matchQuality, 'weak')
})

test('comparison rows never invent scores; not confirmed both sides', () => {
  const pair = getPrimaryPair('Rivian', 'R1T', 'Dual Motor Standard')
  const rows = buildComparisonRows(pair)
  assert.ok(rows.length >= 6)
  const range = rows.find((r) => r.key === 'range')
  // gas range not confirmed → both values not confirmed
  assert.equal(range.evValue, 'not confirmed')
  assert.equal(range.gasValue, 'not confirmed')
  const banned = JSON.stringify(rows)
  assert.ok(!banned.includes('Best'))
  assert.ok(!banned.includes('Worst'))
  assert.ok(!/\u2014/.test(banned))
})

test('overall scores from data points possible', () => {
  const pair = getPrimaryPair('Ford', 'F-150 Lightning', 'Pro Standard Range (4WD SR)')
  const o = buildOverallScores(pair)
  assert.match(o.ev.display, /out of 70/)
})

test('ProMaster payload 4680 and tow note; Transit 250 price 55095', () => {
  const pair = getPrimaryPair(
    'Mercedes-Benz',
    'eSprinter',
    '2500 170 WB HR 113kWh',
  )
  assert.ok(pair)
  assert.equal(String(pair.gasPayloadLb), '4680')
  assert.equal(String(pair.gasTowLb), '6700')
  const rows = buildComparisonRows(pair)
  const tow = rows.find((r) => r.key === 'tow')
  assert.ok(tow.gasSourceNote)
  assert.match(tow.gasSourceNote, /Canadian dealer PDF/)
  assert.ok(!tow.gasSourceNote.includes('\u2014'))

  // Transit Long-EL as secondary candidate price in factors for some EVs
  const transitMsrp = GAS_TWIN_FACTORS.find(
    (f) =>
      f.vehicle.includes('Transit Cargo Long-EL high roof T-250') &&
      f.factor === 'msrp' &&
      f.vehicleRole === 'gas_candidate',
  )
  assert.ok(transitMsrp)
  assert.equal(String(transitMsrp.value), '55095')
  assert.match(transitMsrp.sourceUrl, /kbb\.com\/ford\/transit-250/)
})

test('stripSpecLine uses vs and not confirmed', () => {
  const pair = getPrimaryPair('Rivian', 'Commercial Van RCV/EDV', 'Delivery 500')
  const line = stripSpecLine(pair)
  assert.match(line, /Payload/)
  assert.match(line, / vs /)
  assert.ok(!line.includes('/'))
})

test('generator fails on FACT row missing source_url', () => {
  const dir = mkdtempSync(join(tmpdir(), 'gas-twin-gen-'))
  try {
    const dataDir = join(dir, 'src/data/gasTwin')
    mkdirSync(dataDir, { recursive: true })
    mkdirSync(join(dir, 'scripts'), { recursive: true })
    copyFileSync(
      join(root, 'src/data/gasTwin/gas_twin_pairs.csv'),
      join(dataDir, 'gas_twin_pairs.csv'),
    )
    const factors = readFileSync(join(root, 'src/data/gasTwin/gas_twin_factors.csv'), 'utf8')
    const lines = factors.split('\n')
    // Blank source_url on first FACT data row
    const hdr = lines[0]
    const bad = lines.find((l, i) => i > 0 && l.includes(',FACT,'))
    assert.ok(bad)
    const cols = bad.split(',')
    // crude: rewrite a tiny factors file with one bad FACT row
    // score empty, source_url empty, source_date present, status FACT
    writeFileSync(
      join(dataDir, 'gas_twin_factors.csv'),
      `${hdr}\nev,Test Vehicle,Test Vehicle,payload,100,lb,,,2026-10-03,FACT,yes\n`,
    )
    copyFileSync(
      join(root, 'scripts/generate-gas-twin.mjs'),
      join(dir, 'scripts/generate-gas-twin.mjs'),
    )
    const res = spawnSync('node', ['scripts/generate-gas-twin.mjs'], {
      cwd: dir,
      encoding: 'utf8',
    })
    assert.notEqual(res.status, 0)
    assert.match(res.stderr + res.stdout, /missing source_url or source_date/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

console.log(`\ngas-twin tests: ${passed} passed`)
if (process.exitCode) process.exit(process.exitCode)
