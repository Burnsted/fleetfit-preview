/**
 * Fleet size from intake → size picker defaults.
 * Run: node scripts/test-fleet-size.mjs
 */
import assert from 'node:assert/strict'
import { fleetSizeFromIntake } from '../src/lib/fleetSize.js'
import { tradePackageHeader } from '../src/data/tradePackages.js'
import { getPackage } from '../src/data/package.js'
import { TRADE_PACKAGE_IDS } from '../src/data/tradePackages.js'
import { composeTradePackageSet } from '../src/lib/tradePackageSet.js'

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log('ok', passed, name)
}

test('1. Range chips map to picker defaults', () => {
  assert.equal(fleetSizeFromIntake({ fleetSize: '1-2' }), 2)
  assert.equal(fleetSizeFromIntake({ fleetSize: '3-5' }), 4)
  assert.equal(fleetSizeFromIntake({ fleetSize: '6-10' }), 5)
  assert.equal(fleetSizeFromIntake({ fleetSize: '10+' }), 5)
})

test('2. Missing / not-surveyed falls back to package default', () => {
  assert.equal(fleetSizeFromIntake(null, 4), 4)
  assert.equal(fleetSizeFromIntake({}, 3), 3)
  assert.equal(fleetSizeFromIntake({ fleetSize: '' }, 4), 4)
  assert.equal(fleetSizeFromIntake({ fleetSize: 'not-surveyed' }, 4), 4)
})

test('3. Plain integers clamp to 1..5', () => {
  assert.equal(fleetSizeFromIntake({ fleetSize: '1' }), 1)
  assert.equal(fleetSizeFromIntake({ fleetSize: '5' }), 5)
  assert.equal(fleetSizeFromIntake({ fleetSize: '9' }), 5)
})

test('4. Title count still syncs with shown units, not planned size', () => {
  const pkg = getPackage(TRADE_PACKAGE_IDS.electrical)
  const planned = fleetSizeFromIntake({ fleetSize: '3-5' }, pkg.sizeDefault)
  assert.equal(planned, 4)
  const set = composeTradePackageSet(pkg, { pkg, intake: { fleetSize: '3-5' } }, planned)
  const title = tradePackageHeader(pkg.trade, set.active.length)
  assert.match(title, new RegExp(`· ${set.active.length} vehicles?$`))
  if (set.shortfall > 0) {
    assert.notEqual(title, tradePackageHeader(pkg.trade, planned))
  }
})

console.log(`\n${passed} fleet-size tests passed`)
