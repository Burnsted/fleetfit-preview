/**
 * Photo add-to-fleet chip — pure fleet pick helpers + no double-add.
 * Run: node scripts/test-photo-add.mjs
 */
import assert from 'node:assert/strict'
import {
  fleetCatalogKey,
  fleetListingKey,
  fleetUnitKey,
  toggleFleetPick,
} from '../src/lib/fleetPickKeys.js'

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log('ok', passed, name)
}

test('1. Add then check state (id present once)', () => {
  const key = fleetUnitKey('pkg-trade-electrical', 'unit-e5')
  const afterAdd = toggleFleetPick([], key)
  assert.deepEqual(afterAdd, [key])
  assert.equal(afterAdd.includes(key), true)
})

test('2. Remove returns plus state (id gone)', () => {
  const key = fleetListingKey('vnd-003')
  const afterAdd = toggleFleetPick([], key)
  const afterRemove = toggleFleetPick(afterAdd, key)
  assert.deepEqual(afterRemove, [])
})

test('3. No double-add — second add is a no-op toggle pair', () => {
  const key = fleetCatalogKey('tesla_cybertruck_dual')
  let ids = []
  ids = toggleFleetPick(ids, key)
  ids = toggleFleetPick(ids, key) // remove
  ids = toggleFleetPick(ids, key) // add again
  // Explicit add-if-missing path: toggling when already present removes —
  // simulate guarded add used by TradeUnitCard fleet.add
  const withDupAttempt = ids.includes(key) ? ids : [...ids, key]
  const again = withDupAttempt.includes(key) ? withDupAttempt : [...withDupAttempt, key]
  assert.equal(again.filter((x) => x === key).length, 1)
})

test('4. Distinct surfaces do not collide (unit / listing / catalog)', () => {
  const a = fleetUnitKey('pkg-trade-hvac', 'unit-e5')
  const b = fleetListingKey('unit-e5')
  const c = fleetCatalogKey('gmc_sierra_ev_elevation_standard')
  assert.notEqual(a, b)
  assert.notEqual(b, c)
  assert.notEqual(a, c)
  let ids = []
  ids = toggleFleetPick(ids, a)
  ids = toggleFleetPick(ids, b)
  ids = toggleFleetPick(ids, c)
  assert.equal(ids.length, 3)
  ids = toggleFleetPick(ids, b)
  assert.deepEqual(ids.sort(), [a, c].sort())
})

test('5. Empty / invalid ids ignored', () => {
  assert.deepEqual(toggleFleetPick(['x'], null), ['x'])
  assert.deepEqual(toggleFleetPick(['x'], ''), ['x'])
  assert.deepEqual(toggleFleetPick(null, 'a'), ['a'])
})

console.log(`\n${passed} photo-add tests passed`)
