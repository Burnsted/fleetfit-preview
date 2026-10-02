/**
 * Package total math — Total, Trade-in credit, Net.
 *
 * Trade-in credit comes from typed-in per-vehicle values
 * (unit.tradeInValue). Never invent from pkg.tradeIn.status text,
 * and never fetch or show a KBB figure.
 *
 * Credit shows as money only when every vehicle row has a value;
 * otherwise "not confirmed" with "Entered for N of M vehicles."
 * Net only when both Total and Credit are complete (M of M).
 *
 * M = units currently in the package slots (active set).
 * Recompute after remove / auto-add / Undo by passing the new active set.
 */

export const NOT_CONFIRMED = 'not confirmed'
export const BUYER_FEE_LINE = 'Buyer fee TBD'

function formatMoney(price) {
  return `$${Number(price).toLocaleString('en-US')}`
}

/** Confirmed ask: finite positive number on unit.askPrice. */
export function confirmedAskPrice(unit) {
  const n = Number(unit?.askPrice)
  return Number.isFinite(n) && n > 0 ? n : null
}

/**
 * Confirmed per-unit trade-in dollar.
 * Reads only unit.tradeInValue when present as a positive number.
 * Does not invent a field or read package-level status text.
 */
export function confirmedTradeInValue(unit) {
  if (unit == null || !Object.prototype.hasOwnProperty.call(unit, 'tradeInValue')) {
    return null
  }
  const n = Number(unit.tradeInValue)
  return Number.isFinite(n) && n > 0 ? n : null
}

/**
 * Compute package total from the active slot units.
 * Optional tradeInRows: typed-in current-vehicle values (fleet size 1 to 5).
 * When provided, credit uses those rows (not unit.tradeInValue).
 * @param {Array<{ askPrice?: number, tradeInValue?: number }>} units
 * @param {{ tradeInRows?: Array<{ value?: string|number }> }} [options]
 */
export function computePackageTotal(units, options = {}) {
  const slots = Array.isArray(units) ? units : []
  const slotCount = slots.length
  const tradeInRows = Array.isArray(options.tradeInRows) ? options.tradeInRows : null

  let askSum = 0
  let askCount = 0
  let creditSum = 0
  let creditCount = 0

  for (const unit of slots) {
    const ask = confirmedAskPrice(unit)
    if (ask != null) {
      askSum += ask
      askCount += 1
    }
    if (!tradeInRows) {
      const credit = confirmedTradeInValue(unit)
      if (credit != null) {
        creditSum += credit
        creditCount += 1
      }
    }
  }

  let creditSlotCount = slotCount
  if (tradeInRows) {
    creditSlotCount = tradeInRows.length
    creditSum = 0
    creditCount = 0
    for (const row of tradeInRows) {
      const raw = row?.value
      if (raw == null || String(raw).trim() === '') continue
      // Mirror confirmedTradeInValue: positive finite only.
      const n = Number(String(raw).replace(/[$,\s]/g, ''))
      if (Number.isFinite(n) && n > 0) {
        creditSum += n
        creditCount += 1
      }
    }
  }

  const totalComplete = slotCount > 0 && askCount === slotCount
  const creditComplete = creditSlotCount > 0 && creditCount === creditSlotCount

  const total = askCount === 0 ? null : askSum
  // Money only when every trade-in row has a value; partial stays not confirmed.
  const tradeInCredit = creditComplete ? creditSum : null
  const net = totalComplete && creditComplete ? askSum - creditSum : null

  return {
    slotCount,
    askCount,
    creditCount,
    creditSlotCount,
    total,
    tradeInCredit,
    net,
    totalComplete,
    creditComplete,
    totalDisplay: total == null ? NOT_CONFIRMED : formatMoney(total),
    tradeInDisplay: tradeInCredit == null ? NOT_CONFIRMED : formatMoney(tradeInCredit),
    netDisplay: net == null ? NOT_CONFIRMED : formatMoney(net),
    askCountLabel: `${askCount} of ${slotCount} vehicles`,
    creditCountLabel: `Entered for ${creditCount} of ${creditSlotCount} vehicles.`,
    buyerFeeLine: BUYER_FEE_LINE,
  }
}
