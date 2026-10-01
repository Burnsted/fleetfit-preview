/**
 * New catalog tests — CSV figures, no used fields on New cards, stockMode carry.
 * Run: npx vite-node scripts/test-new-catalog.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  assertNoUsedFieldsOnNewCard,
  getNewCatalog,
  loadNewLinkRows,
  loadNewTrimRows,
  NEW_CATALOG_IDS,
  NOT_CONFIRMED,
  resolveMakerLink,
  USED_HELPER_LINE,
} from '../src/data/newEvCatalog.js'
import { matchPackageIdFromIntake } from '../src/data/package.js'
import { TRADE_PACKAGE_IDS } from '../src/data/tradePackages.js'
import { computePackageTotal } from '../src/lib/packageTotal.js'
import { NO_VANS_REAL_GOOD } from '../src/lib/suggestionEligibility.js'
import { parseCsv, numOrNull } from '../src/lib/csvParse.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log('ok', passed, name)
}

test('1. Catalog has exactly the seven CLEARED orderable ids', () => {
  const cards = getNewCatalog()
  assert.equal(cards.length, 7)
  assert.deepEqual(
    cards.map((c) => c.id),
    NEW_CATALOG_IDS,
  )
  assert.ok(!cards.some((c) => /lightning|brightdrop/i.test(c.id)))
})

test('2. Every New figure matches CSV row (msrp, range, payload, fleet_only)', () => {
  const trims = loadNewTrimRows()
  const byId = new Map(trims.map((r) => [r.vehicle_id, r]))
  const cards = getNewCatalog()
  for (const card of cards) {
    const row = byId.get(card.id)
    assert.ok(row, `CSV row missing for ${card.id}`)
    const msrp = numOrNull(row.msrp_usd)
    if (card.msrpConfirmed) {
      assert.equal(card.msrpUsd, msrp, `${card.id} msrp`)
    }
    if (card.fleetOnly) {
      assert.match(card.priceLabel, /Fleet orders only/)
    }
    if (card.rangeMi != null) {
      const csvRange = numOrNull(String(row.range_mi).split('/')[0])
      assert.equal(card.rangeMi, csvRange, `${card.id} range`)
    }
    if (card.payloadLb != null) {
      const csvPayload = numOrNull(String(row.payload_lb).split('/')[0])
      assert.equal(card.payloadLb, csvPayload, `${card.id} payload`)
    }
  }
})

test('3. Expected CLEARED headline figures from CSV', () => {
  const byId = Object.fromEntries(getNewCatalog().map((c) => [c.id, c]))
  assert.equal(byId.tesla_cybertruck_dual.msrpUsd, 74990)
  assert.equal(byId.tesla_cybertruck_dual.rangeMi, 325)
  assert.equal(byId.rivian_rcv_500.msrpUsd, 79900)
  assert.equal(byId.rivian_rcv_500.rangeMi, 161)
  assert.equal(byId.rivian_rcv_500.payloadLb, 2663)
  assert.equal(byId.rivian_rcv_500.fleetOnly, true)
  assert.equal(byId.rivian_r1t_premium.msrpUsd, 79990)
  assert.equal(byId.rivian_r1t_premium.rangeMi, 300)
  assert.equal(byId.ford_etransit_cargo_van_low_roof_148_wb.msrpUsd, 53260)
  assert.equal(byId.ford_etransit_cargo_van_low_roof_148_wb.rangeMi, 159)
  assert.equal(byId.ford_etransit_cargo_van_low_roof_148_wb.payloadLb, 3320)
  assert.equal(byId.chevy_silverado_ev_wt_4wt.msrpUsd, 52800)
  assert.equal(byId.chevy_silverado_ev_wt_4wt.rangeMi, 286)
  assert.equal(byId.chevy_silverado_ev_wt_4wt.payloadLb, 2350)
  assert.equal(byId.chevy_silverado_ev_wt_4wt.fleetOnly, true)
  assert.equal(byId.gmc_sierra_ev_elevation_standard.msrpUsd, 62400)
  assert.equal(byId.gmc_sierra_ev_elevation_standard.rangeMi, 283)
  assert.equal(byId.gmc_sierra_ev_elevation_standard.payloadLb, 2250)
  assert.equal(byId.mb_esprinter_81.msrpUsd, 52700)
  assert.equal(byId.mb_esprinter_81.msrpConfirmed, true)
  assert.match(byId.mb_esprinter_81.priceLabel, /52,700/)
  assert.equal(byId.mb_esprinter_81.rangeMi, 150)
  assert.equal(byId.mb_esprinter_81.payloadLb, null)
  assert.match(byId.mb_esprinter_81.specsLabel, /max est/)
  assert.match(byId.rivian_rcv_500.specsLabel, /est/)
  assert.doesNotMatch(byId.rivian_rcv_500.specsLabel, /\bEPA\b/)
})

test('4. No New card carries seller link, mileage, or used price', () => {
  for (const card of getNewCatalog()) {
    assert.equal(assertNoUsedFieldsOnNewCard(card), true, card.id)
    assert.equal(card.sellerUrl, null)
    assert.equal(card.mileage, null)
    assert.equal(card.usedPrice, null)
    assert.equal(card.askPrice, null)
    assert.equal(card.listingLive, false)
  }
})

test('5. INFERENCE build URLs get no Build link; FACT Rivian fleet does', () => {
  const links = loadNewLinkRows()
  const rivianVan = links.find((r) => /commercial van/i.test(r.model))
  const tesla = links.find((r) => /cybertruck/i.test(r.model))
  const ford = links.find((r) => r.model === 'E-Transit')
  assert.ok(rivianVan)
  const rivLink = resolveMakerLink(rivianVan)
  assert.ok(rivLink)
  assert.equal(rivLink.text, 'Build on the maker site')
  assert.match(rivLink.href, /rivian\.com\/fleet/)
  assert.equal(resolveMakerLink(tesla), null)
  assert.equal(resolveMakerLink(ford), null)
})

test('6. Photo-not-confirmed vans have no photo; trucks have draft plates', () => {
  const byId = Object.fromEntries(getNewCatalog().map((c) => [c.id, c]))
  assert.equal(byId.rivian_rcv_500.photoPending, true)
  assert.equal(byId.mb_esprinter_81.photoPending, true)
  assert.equal(byId.ford_etransit_cargo_van_low_roof_148_wb.photoPending, true)
  assert.equal(byId.tesla_cybertruck_dual.photoPending, false)
  assert.equal(byId.rivian_r1t_premium.photoPending, false)
})

test('7. Intake stockMode + trade map to trade package ids', () => {
  assert.equal(
    matchPackageIdFromIntake({ trade: 'Electrical', stockMode: 'New' }),
    TRADE_PACKAGE_IDS.electrical,
  )
  assert.equal(
    matchPackageIdFromIntake({ trade: 'Landscaping', stockMode: 'Used' }),
    TRADE_PACKAGE_IDS.landscaping,
  )
  assert.equal(
    matchPackageIdFromIntake({ trade: 'Plumbing', stockMode: 'New' }),
    TRADE_PACKAGE_IDS.plumbing,
  )
  assert.equal(USED_HELPER_LINE, 'Used EVs with seller price (default)')
})

test('8. Package total still safe on empty Used set (New mode)', () => {
  const empty = computePackageTotal([])
  assert.equal(empty.slotCount, 0)
  assert.equal(empty.total, null)
  assert.ok(!Number.isNaN(empty.askCount))
})

test('9. Used empty-line copy intact', () => {
  assert.equal(
    NO_VANS_REAL_GOOD,
    'No vans with a real listing and a good score right now.',
  )
})

test('10. On-disk CSV files match bundled catalog ids', () => {
  const trimPath = join(
    root,
    'fleetfit/product/trade-cards-new-tab/data/new_ev_trims.csv',
  )
  const text = readFileSync(trimPath, 'utf8')
  const rows = parseCsv(text)
  for (const id of NEW_CATALOG_IDS) {
    assert.ok(
      rows.some((r) => r.vehicle_id === id),
      `disk CSV missing ${id}`,
    )
  }
  assert.ok(NOT_CONFIRMED === 'not confirmed')
})

console.log(`\n${passed} new-catalog tests passed`)
