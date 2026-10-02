/**
 * Typed trade-in entry tests (CLEARED-FOR-WOZ trade-in entry).
 * Run: node scripts/test-trade-in-entry.mjs
 */
import assert from 'node:assert/strict'
import {
  computePackageTotal,
  NOT_CONFIRMED,
} from '../src/lib/packageTotal.js'
import {
  ADD_SOURCE_AND_DATE,
  DOLLAR_AMOUNT_ERROR,
  ENTERED_FOR_LABEL,
  KBB_LOOKUP_HREF,
  KBB_LOOKUP_LABEL,
  KBB_LOOKUP_REL,
  KBB_LOOKUP_TARGET,
  confirmedTradeInDollar,
  createTradeInRows,
  kbbLookupLinkProps,
  missingSourceDateNote,
  parseTradeInDollar,
  resizeTradeInRows,
  rowNeedsSourceDate,
  sumTradeInEntries,
  unitsWithTradeInValues,
} from '../src/lib/tradeInEntry.js'
import { factKbbTradeIn } from '../src/lib/budget.js'

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log('ok', passed, name)
}

test('1. Sum with all rows filled shows Trade-in credit money and Net', () => {
  const units = [
    { id: 'a', askPrice: 40000 },
    { id: 'b', askPrice: 55000 },
    { id: 'c', askPrice: 42000 },
  ]
  const rows = [
    { value: '6000', source: 'KBB trade-in range, Good', date: '2026-10-01' },
    { value: '11000', source: 'Dealer offer', date: '2026-10-01' },
    { value: '5000', source: 'Owner estimate', date: '2026-10-02' },
  ]
  const s = computePackageTotal(units, { tradeInRows: rows })
  assert.equal(s.creditComplete, true)
  assert.equal(s.tradeInCredit, 22000)
  assert.equal(s.tradeInDisplay, '$22,000')
  assert.equal(s.total, 137000)
  assert.equal(s.net, 115000)
  assert.equal(s.netDisplay, '$115,000')
  assert.equal(s.creditCountLabel, 'Entered for 3 of 3 vehicles.')
  assert.equal(sumTradeInEntries(rows), 22000)
})

test('2. Partial rows: not confirmed and Entered for N of M', () => {
  const units = [
    { id: 'a', askPrice: 40000 },
    { id: 'b', askPrice: 55000 },
    { id: 'c', askPrice: 42000 },
  ]
  const rows = [
    { value: '6000', source: 'typed', date: '2026-10-01' },
    { value: '', source: '', date: '' },
    { value: '5000', source: 'typed', date: '2026-10-01' },
  ]
  const s = computePackageTotal(units, { tradeInRows: rows })
  assert.equal(s.creditComplete, false)
  assert.equal(s.tradeInCredit, null)
  assert.equal(s.tradeInDisplay, NOT_CONFIRMED)
  assert.equal(s.creditCount, 2)
  assert.equal(s.creditCountLabel, ENTERED_FOR_LABEL(2, 3))
  assert.equal(s.creditCountLabel, 'Entered for 2 of 3 vehicles.')
  assert.equal(s.net, null)
  assert.equal(s.netDisplay, NOT_CONFIRMED)
  assert.equal(sumTradeInEntries(rows), null)
})

test('3. Net hidden until both sides confirmed', () => {
  const units = [
    { id: 'a', askPrice: 40000 },
    { id: 'b', askPrice: null },
  ]
  const rowsFull = [
    { value: '6000' },
    { value: '11000' },
  ]
  let s = computePackageTotal(units, { tradeInRows: rowsFull })
  assert.equal(s.creditComplete, true)
  assert.equal(s.totalComplete, false)
  assert.equal(s.net, null)
  assert.equal(s.netDisplay, NOT_CONFIRMED)

  const unitsFull = [
    { id: 'a', askPrice: 40000 },
    { id: 'b', askPrice: 55000 },
  ]
  const rowsPartial = [{ value: '6000' }, { value: '' }]
  s = computePackageTotal(unitsFull, { tradeInRows: rowsPartial })
  assert.equal(s.totalComplete, true)
  assert.equal(s.creditComplete, false)
  assert.equal(s.net, null)
  assert.equal(s.netDisplay, NOT_CONFIRMED)

  s = computePackageTotal(unitsFull, { tradeInRows: rowsFull })
  assert.equal(s.net, 78000)
  assert.equal(s.netDisplay, '$78,000')
})

test('4. Negative and text input rejected', () => {
  assert.deepEqual(parseTradeInDollar('-100'), {
    ok: false,
    error: DOLLAR_AMOUNT_ERROR,
    value: null,
  })
  assert.deepEqual(parseTradeInDollar('abc'), {
    ok: false,
    error: DOLLAR_AMOUNT_ERROR,
    value: null,
  })
  assert.deepEqual(parseTradeInDollar('12.5.5'), {
    ok: false,
    error: DOLLAR_AMOUNT_ERROR,
    value: null,
  })
  assert.equal(DOLLAR_AMOUNT_ERROR, 'Enter a dollar amount.')
  assert.equal(confirmedTradeInDollar('-5'), null)
  assert.equal(confirmedTradeInDollar('nope'), null)
  assert.equal(confirmedTradeInDollar('8500'), 8500)
  assert.equal(confirmedTradeInDollar('$8,500'), 8500)
  assert.equal(confirmedTradeInDollar(''), null)
})

test('5. Look up on KBB link attributes', () => {
  const props = kbbLookupLinkProps()
  assert.equal(KBB_LOOKUP_LABEL, 'Look up on KBB')
  assert.equal(props.href, 'https://www.kbb.com/whats-my-car-worth/')
  assert.equal(props.href, KBB_LOOKUP_HREF)
  assert.equal(props.target, '_blank')
  assert.equal(props.target, KBB_LOOKUP_TARGET)
  assert.equal(props.rel, 'noopener noreferrer')
  assert.equal(props.rel, KBB_LOOKUP_REL)
  assert.equal(props.href.includes('?'), false)
})

test('6. Source and date helper; value still counts', () => {
  const row = { value: '7000', source: '', date: '' }
  assert.equal(rowNeedsSourceDate(row), true)
  assert.equal(ADD_SOURCE_AND_DATE, 'Add source and date')
  const rows = [
    { value: '7000', source: '', date: '' },
    { value: '8000', source: 'typed', date: '2026-10-01' },
  ]
  assert.equal(
    missingSourceDateNote(rows),
    'Source and date missing on vehicle 1.',
  )
  const units = [
    { id: 'a', askPrice: 40000 },
    { id: 'b', askPrice: 55000 },
  ]
  const s = computePackageTotal(units, { tradeInRows: rows })
  assert.equal(s.tradeInCredit, 15000)
  assert.equal(s.net, 80000)
})

test('7. factKbbTradeIn reads sum of typed values; rows resize blank', () => {
  const rows = createTradeInRows(4)
  assert.equal(rows.length, 4)
  for (const r of rows) {
    assert.equal(r.year, '')
    assert.equal(r.make, '')
    assert.equal(r.model, '')
    assert.equal(r.mileage, '')
    assert.equal(r.condition, '')
    assert.equal(r.value, '')
    assert.equal(r.source, '')
    assert.equal(r.date, '')
  }
  rows[0].value = '1000'
  rows[1].value = '2000'
  rows[2].value = '3000'
  rows[3].value = '4000'
  assert.equal(factKbbTradeIn({ tradeInEntries: rows }, null), 10000)
  assert.equal(
    factKbbTradeIn(
      { tradeInEntries: [{ value: '1000' }, { value: '' }, { value: '3000' }] },
      null,
    ),
    null,
  )
  assert.equal(factKbbTradeIn({ kbbTradeIn: 5000 }, null), 5000)

  const grown = resizeTradeInRows(rows.slice(0, 2), 3)
  assert.equal(grown.length, 3)
  assert.equal(grown[0].value, '1000')
  assert.equal(grown[2].value, '')

  const merged = unitsWithTradeInValues(
    [{ id: 'a', askPrice: 1 }, { id: 'b', askPrice: 2 }],
    [{ value: '9' }, { value: '' }],
  )
  assert.equal(merged[0].tradeInValue, 9)
  assert.equal(Object.prototype.hasOwnProperty.call(merged[1], 'tradeInValue'), false)
})

console.log(`\nAll ${passed} trade-in entry tests passed.`)
