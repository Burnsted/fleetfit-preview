/**
 * Fleet size labels + consent clearance helpers.
 * Run: node scripts/test-steve-polish.mjs
 */
import assert from 'node:assert/strict'
import { fleetSizeFromIntake } from '../src/lib/fleetSize.js'
import {
  consentClearancePx,
  CONSENT_CLEARANCE_MIN_GAP,
} from '../src/lib/consentClearance.js'

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log('ok', passed, name)
}

test('1. Intake range values still map after "to" labels', () => {
  // Labels are "1 to 2" etc.; stored values remain 1-2 / 3-5 / 6-10
  assert.equal(fleetSizeFromIntake({ fleetSize: '1-2' }), 2)
  assert.equal(fleetSizeFromIntake({ fleetSize: '3-5' }), 4)
  assert.equal(fleetSizeFromIntake({ fleetSize: '6-10' }), 5)
  assert.equal(fleetSizeFromIntake({ fleetSize: '10+' }), 5)
})

test('2. Consent clearance adds ≥8px gap while bar shows', () => {
  assert.equal(consentClearancePx(0), 0)
  assert.equal(consentClearancePx(96), 96 + CONSENT_CLEARANCE_MIN_GAP)
  assert.equal(consentClearancePx(96, 8), 104)
  assert.ok(consentClearancePx(96) - 96 >= 8)
})

test('3. Dismissed bar returns zero clearance', () => {
  assert.equal(consentClearancePx(null), 0)
  assert.equal(consentClearancePx(undefined), 0)
  assert.equal(consentClearancePx(-1), 0)
})

console.log(`\n${passed} steve-polish tests passed`)
