/**
 * Six unit tests for Package total (CLEARED-FOR-WOZ-PACKAGE-TOTAL-AND-HOME).
 * Run: node scripts/test-package-total.mjs
 */
import assert from 'node:assert/strict'
import {
  computePackageTotal,
  confirmedAskPrice,
  confirmedTradeInValue,
  NOT_CONFIRMED,
  NET_NOT_CONFIRMED,
  BUYER_FEE_LINE,
} from '../src/lib/packageTotal.js'

function fixture(partials) {
  return partials.map((p, i) => ({ id: `u${i + 1}`, ...p }))
}

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log('ok', passed, name)
}

// 1. Sum of confirmed askPrice values.
test('1. Sum of confirmed askPrice values', () => {
  const units = fixture([
    { askPrice: 40000 },
    { askPrice: 55000 },
    { askPrice: 42000 },
  ])
  const s = computePackageTotal(units)
  assert.equal(s.total, 137000)
  assert.equal(s.askCount, 3)
  assert.equal(s.slotCount, 3)
  assert.equal(s.totalDisplay, '$137,000')
  assert.equal(s.askCountLabel, '3 of 3 vehicles')
})

// 2. Partial asks: count and sum exclude missing.
test('2. Partial asks: count and sum exclude missing', () => {
  const units = fixture([
    { askPrice: 40000 },
    { askPrice: null },
    { askPrice: 42000 },
    { askPrice: undefined },
    { askPrice: 28000 },
    {},
    { askPrice: 52000 },
  ])
  const s = computePackageTotal(units)
  assert.equal(s.slotCount, 7)
  assert.equal(s.askCount, 4)
  assert.equal(s.total, 162000)
  assert.equal(s.askCountLabel, '4 of 7 vehicles')
  assert.equal(s.net, null)
  assert.equal(s.netDisplay, NET_NOT_CONFIRMED)
  assert.equal(s.netHelper, 'Total covers 4 of 7 vehicles.')
})

// 3. Zero confirmed asks → Total "not confirmed".
test('3. Zero confirmed asks → Total not confirmed', () => {
  const units = fixture([
    { askPrice: null },
    { askPrice: 0 },
    {},
  ])
  const s = computePackageTotal(units)
  assert.equal(s.askCount, 0)
  assert.equal(s.total, null)
  assert.equal(s.totalDisplay, NOT_CONFIRMED)
  assert.equal(s.netDisplay, NET_NOT_CONFIRMED)
  assert.equal(s.netHelper, 'Total covers 0 of 3 vehicles.')
})

// 4. Count match: N and M track active package slots after remove / auto-add / Undo.
test('4. Count match after remove / auto-add / Undo', () => {
  const pool = fixture([
    { askPrice: 40000, tradeInValue: 6000 },
    { askPrice: 55000, tradeInValue: 11000 },
    { askPrice: 35900, tradeInValue: 5000 },
    { askPrice: 41200, tradeInValue: 7000 },
    { askPrice: 54177, tradeInValue: 9000 },
    { askPrice: 27995, tradeInValue: 4000 },
    { askPrice: 53343, tradeInValue: 8000 },
    { askPrice: 30000, tradeInValue: 3500 }, // next-ranked reserve
  ])

  // Start with 7 slots
  let active = pool.slice(0, 7)
  let s = computePackageTotal(active)
  assert.equal(s.slotCount, 7)
  assert.equal(s.askCount, 7)
  assert.equal(s.creditCount, 7)
  assert.equal(s.askCountLabel, '7 of 7 vehicles')
  assert.equal(s.creditCountLabel, 'Entered for 7 of 7 vehicles.')

  // Remove first unit, auto-add next-ranked (slot 8)
  const removed = active[0]
  active = [...active.slice(1), pool[7]]
  s = computePackageTotal(active)
  assert.equal(s.slotCount, 7)
  assert.equal(s.askCount, 7)
  assert.equal(s.total, 30000 + 55000 + 35900 + 41200 + 54177 + 27995 + 53343)
  assert.equal(s.creditCount, 7)
  assert.equal(s.tradeInCredit, 11000 + 5000 + 7000 + 9000 + 4000 + 8000 + 3500)

  // Undo: restore prior set
  active = [removed, ...active.slice(0, 6)]
  s = computePackageTotal(active)
  assert.equal(s.slotCount, 7)
  assert.equal(s.total, 40000 + 55000 + 35900 + 41200 + 54177 + 27995 + 53343)
  assert.equal(s.tradeInCredit, 6000 + 11000 + 5000 + 7000 + 9000 + 4000 + 8000)
  assert.equal(s.net, s.total - s.tradeInCredit)
})

// 5. Net only when both Total and Credit are complete (M of M and M of M).
test('5. Net only when both Total and Credit are M of M', () => {
  const full = fixture([
    { askPrice: 40000, tradeInValue: 6000 },
    { askPrice: 55000, tradeInValue: 11000 },
  ])
  let s = computePackageTotal(full)
  assert.equal(s.totalComplete, true)
  assert.equal(s.creditComplete, true)
  assert.equal(s.net, 78000)
  assert.equal(s.netDisplay, '$78,000')

  const partialAsk = fixture([
    { askPrice: 40000, tradeInValue: 6000 },
    { askPrice: null, tradeInValue: 11000 },
  ])
  s = computePackageTotal(partialAsk)
  assert.equal(s.askCountLabel, '1 of 2 vehicles')
  assert.equal(s.creditCountLabel, 'Entered for 2 of 2 vehicles.')
  assert.equal(s.net, null)
  assert.equal(s.netDisplay, NET_NOT_CONFIRMED)
  assert.equal(s.netHelper, 'Total covers 1 of 2 vehicles.')

  const partialCredit = fixture([
    { askPrice: 40000, tradeInValue: 6000 },
    { askPrice: 55000 },
  ])
  s = computePackageTotal(partialCredit)
  assert.equal(s.askCountLabel, '2 of 2 vehicles')
  assert.equal(s.creditCountLabel, 'Entered for 1 of 2 vehicles.')
  assert.equal(s.tradeInDisplay, NOT_CONFIRMED)
  assert.equal(s.tradeInCredit, null)
  assert.equal(s.net, null)
  assert.equal(s.netDisplay, NET_NOT_CONFIRMED)
  assert.equal(s.netHelper, null)
})

// 6. No invented trade-in dollars when per-unit field is absent.
test('6. No invented trade-in dollars when per-unit field is absent', () => {
  const liveLike = fixture([
    { askPrice: 38900 },
    { askPrice: 54900 },
    { askPrice: 35900 },
    { askPrice: 41200 },
    { askPrice: 54177 },
    { askPrice: 27995 },
    { askPrice: 53343 },
  ])
  // Package-level status must not invent credit
  const pkgTradeIn = { status: 'Pending dealer appraisal', detail: 'Count stated' }

  for (const unit of liveLike) {
    assert.equal(confirmedTradeInValue(unit), null)
    assert.equal(Object.prototype.hasOwnProperty.call(unit, 'tradeInValue'), false)
  }

  const s = computePackageTotal(liveLike)
  assert.equal(s.creditCount, 0)
  assert.equal(s.tradeInCredit, null)
  assert.equal(s.tradeInDisplay, NOT_CONFIRMED)
  assert.equal(s.netDisplay, NET_NOT_CONFIRMED)
  assert.equal(s.total, 38900 + 54900 + 35900 + 41200 + 54177 + 27995 + 53343)
  assert.equal(s.askCountLabel, '7 of 7 vehicles')
  assert.equal(s.buyerFeeLine, BUYER_FEE_LINE)

  // Status text must not leak into math
  assert.equal(pkgTradeIn.status.includes('Pending'), true)
  assert.equal(confirmedAskPrice({ askPrice: 'not a number' }), null)
  assert.equal(confirmedTradeInValue({ tradeInValue: 'Pending' }), null)
  assert.equal(confirmedTradeInValue({ tradeInValue: 0 }), null)
})

console.log(`\nAll ${passed} package-total tests passed.`)
