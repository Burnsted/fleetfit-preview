/**
 * Fleet plan panel — first add, append, remove, photo-check sync, no double-add.
 * Run: node scripts/test-fleet-panel.mjs
 */
import assert from 'node:assert/strict'
import {
  appendPlanItem,
  collectPlanPickIds,
  createPackagePlanItem,
  createVehiclePlanItem,
  dropPickIds,
  mergePickIds,
  planExampleTotal,
  planUnitCount,
  removePickFromPlan,
  removePlanItemById,
} from '../src/lib/fleetPlanModel.js'
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

test('1. First add creates the fleet plan', () => {
  const pickId = fleetUnitKey('pkg-trade-electrical', 'unit-e5')
  const item = createVehiclePlanItem({
    pickId,
    label: '2022 GMC Hummer EV',
    examplePrice: 68900,
  })
  const plan = appendPlanItem([], item)
  assert.equal(plan.length, 1)
  assert.equal(plan[0].kind, 'vehicle')
  assert.equal(planUnitCount(plan), 1)
  assert.equal(planExampleTotal(plan), 68900)
})

test('2. Later adds append (package + photo vehicle)', () => {
  const pkgPicks = [
    fleetUnitKey('pkg-trade-landscaping', 'unit-e5'),
  ]
  const pkg = createPackagePlanItem({
    packageId: 'pkg-trade-landscaping',
    label: 'Landscaping',
    examplePrice: 42000,
    pickIds: pkgPicks,
  })
  const photo = createVehiclePlanItem({
    pickId: fleetCatalogKey('tesla_cybertruck_dual'),
    label: '2026 Tesla Cybertruck',
    examplePrice: 79990,
  })
  let plan = appendPlanItem([], pkg)
  plan = appendPlanItem(plan, photo)
  assert.equal(plan.length, 2)
  assert.equal(planUnitCount(plan), 2)
  assert.equal(planExampleTotal(plan), 42000 + 79990)
  assert.deepEqual(
    collectPlanPickIds(plan).sort(),
    [...pkgPicks, fleetCatalogKey('tesla_cybertruck_dual')].sort(),
  )
})

test('3. Remove drops plan row and its pick ids', () => {
  const a = createVehiclePlanItem({
    pickId: fleetListingKey('vnd-003'),
    label: 'Listing A',
    examplePrice: 30000,
  })
  const b = createVehiclePlanItem({
    pickId: fleetListingKey('vnd-004'),
    label: 'Listing B',
    examplePrice: 40000,
  })
  let plan = appendPlanItem([], a)
  plan = appendPlanItem(plan, b)
  let picks = collectPlanPickIds(plan)
  plan = removePlanItemById(plan, a.id)
  picks = dropPickIds(picks, a.pickIds)
  assert.equal(plan.length, 1)
  assert.equal(plan[0].id, b.id)
  assert.deepEqual(picks, [fleetListingKey('vnd-004')])
  assert.equal(planExampleTotal(plan), 40000)
})

test('4. Photo check sync — remove pick clears plan row', () => {
  const pickId = fleetCatalogKey('gmc_sierra_ev_elevation_standard')
  const item = createVehiclePlanItem({
    pickId,
    label: '2026 GMC Sierra EV',
    examplePrice: 87000,
  })
  let plan = appendPlanItem([], item)
  let picks = mergePickIds([], [pickId])
  assert.equal(picks.includes(pickId), true)
  // Photo chip toggle off
  picks = toggleFleetPick(picks, pickId)
  plan = removePickFromPlan(plan, pickId)
  assert.deepEqual(picks, [])
  assert.deepEqual(plan, [])
})

test('5. No double-add for same vehicle or package', () => {
  const pickId = fleetUnitKey('pkg-trade-hvac', 'unit-e1')
  const item = createVehiclePlanItem({
    pickId,
    label: 'Unit',
    examplePrice: 50000,
  })
  let plan = appendPlanItem([], item)
  plan = appendPlanItem(plan, item)
  assert.equal(plan.length, 1)

  const pkg = createPackagePlanItem({
    packageId: 'pkg-trade-hvac',
    label: 'HVAC',
    examplePrice: 100000,
    pickIds: [pickId, fleetUnitKey('pkg-trade-hvac', 'unit-e3')],
  })
  // Vehicle already covers pickId — package still allowed as its own row id
  // but re-adding same package id is a no-op via append after replace pattern:
  let withPkg = appendPlanItem([], pkg)
  withPkg = appendPlanItem(withPkg, pkg)
  assert.equal(withPkg.length, 1)

  // Refresh path used by addPackageToPlan: replace then append
  const refreshed = createPackagePlanItem({
    packageId: 'pkg-trade-hvac',
    label: 'HVAC',
    examplePrice: 110000,
    pickIds: pkg.pickIds,
  })
  withPkg = appendPlanItem(removePlanItemById(withPkg, pkg.id), refreshed)
  assert.equal(withPkg.length, 1)
  assert.equal(withPkg[0].examplePrice, 110000)
})

test('6. mergePickIds never duplicates', () => {
  const a = fleetListingKey('vnd-001')
  const b = fleetListingKey('vnd-002')
  const merged = mergePickIds([a], [a, b, a])
  assert.deepEqual(merged, [a, b])
})

console.log(`\n${passed} fleet-panel tests passed`)
