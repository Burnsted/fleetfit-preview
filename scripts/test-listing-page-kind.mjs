/**
 * Unit tests: inventory-index / search redirect is DEAD for real-listing rule.
 * Run via npm test (bundled) or: npx vite-node scripts/test-listing-page-kind.mjs
 */
import assert from 'node:assert/strict'
import {
  classifyListingFetch,
  isInventoryIndexOrSearchUrl,
  bodyLooksLikeVehicleDetail,
} from '../src/lib/listingPageKind.js'

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log('ok', passed, name)
}

const L1_ORIG =
  'https://www.socalchevy.com/inventory/Used-2026-Chevrolet-Silverado_EV-Extended_Range_Trail_Boss-1GC403ED1TU400628/'
const L1_FINAL = 'https://www.socalchevy.com/inventory/used-chevrolet-silverado_ev/'
const L1_VIN = '1GC403ED1TU400628'

test('1. Culver City final URL is inventory index', () => {
  assert.equal(isInventoryIndexOrSearchUrl(L1_FINAL, L1_ORIG), true)
  assert.equal(isInventoryIndexOrSearchUrl(L1_ORIG, L1_ORIG), false)
})

test('2. VIN stripped by redirect → index', () => {
  assert.equal(
    isInventoryIndexOrSearchUrl(
      'https://www.socalchevy.com/inventory/used/',
      L1_ORIG,
    ),
    true,
  )
})

test('3. Real VDP URLs stay non-index', () => {
  assert.equal(
    isInventoryIndexOrSearchUrl(
      'https://www.jimmybrittchevrolet.com/vehicle/1GT1ESEH3TU406433/Used--2026--GMC--Sierra_EV--Greensboro--Georgia/',
    ),
    false,
  )
  assert.equal(
    isInventoryIndexOrSearchUrl(
      'https://www.zeiglerford.com/used-Plainwell-2023-Ford-E+Transit+350-Base+Navigation+system+Connected+Navigation-1FTBW9CK9PKA27642',
    ),
    false,
  )
})

test('4. classifyListingFetch marks Culver City redirect DEAD', () => {
  const c = classifyListingFetch({
    status: 200,
    finalUrl: L1_FINAL,
    originalUrl: L1_ORIG,
    text: '<title>Explore Used Chevrolet Silverado EVs for Sale in Southern California</title><h1>Explore Used Chevrolet Silverado EV Trucks for Sale</h1>',
    vin: L1_VIN,
  })
  assert.equal(c.kind, 'DEAD')
  assert.equal(c.reason, 'redirect-to-index')
})

test('5. classifyListingFetch keeps Jimmy Britt VDP LIVE', () => {
  const url =
    'https://www.jimmybrittchevrolet.com/vehicle/1GT1ESEH3TU406433/Used--2026--GMC--Sierra_EV--Greensboro--Georgia/'
  const c = classifyListingFetch({
    status: 200,
    finalUrl: url,
    originalUrl: url,
    text: '<title>Used 2026 GMC Sierra EV Standard Range Elevation in Greensboro, Georgia 1GT1ESEH3TU406433</title>',
    vin: '1GT1ESEH3TU406433',
  })
  assert.equal(c.kind, 'LIVE')
})

test('6. Marketplace search path is DEAD', () => {
  assert.equal(
    isInventoryIndexOrSearchUrl('https://www.cars.com/shopping/results/?stock=used'),
    true,
  )
})

test('7. Explore-for-sale title fails bodyLooksLikeVehicleDetail', () => {
  assert.equal(
    bodyLooksLikeVehicleDetail({
      title: 'Explore Used Chevrolet Silverado EVs for Sale in Southern California',
      text: 'inventory cards',
      finalUrl: L1_FINAL,
      vin: L1_VIN,
    }),
    false,
  )
})

console.log(`\n${passed} listing-page-kind tests passed`)
