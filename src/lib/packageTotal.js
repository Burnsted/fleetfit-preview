/**
 * Package total math — Total, Trade-in credit, Net.
 *
 * Per-unit trade-in dollars do not exist on live package units.
 * Credit stays "not confirmed" until a real per-vehicle FACT value
 * appears on the unit (unit.tradeInValue). Never invent from
 * pkg.tradeIn.status text.
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
 * @param {Array<{ askPrice?: number, tradeInValue?: number }>} units
 */
export function computePackageTotal(units) {
  const slots = Array.isArray(units) ? units : []
  const slotCount = slots.length

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
    const credit = confirmedTradeInValue(unit)
    if (credit != null) {
      creditSum += credit
      creditCount += 1
    }
  }

  const totalComplete = slotCount > 0 && askCount === slotCount
  const creditComplete = slotCount > 0 && creditCount === slotCount

  const total = askCount === 0 ? null : askSum
  const tradeInCredit = creditCount === 0 ? null : creditSum
  const net = totalComplete && creditComplete ? askSum - creditSum : null

  return {
    slotCount,
    askCount,
    creditCount,
    total,
    tradeInCredit,
    net,
    totalComplete,
    creditComplete,
    totalDisplay: total == null ? NOT_CONFIRMED : formatMoney(total),
    tradeInDisplay: tradeInCredit == null ? NOT_CONFIRMED : formatMoney(tradeInCredit),
    netDisplay: net == null ? NOT_CONFIRMED : formatMoney(net),
    askCountLabel: `${askCount} of ${slotCount} vehicles`,
    creditCountLabel: `${creditCount} of ${slotCount} trade-ins`,
    buyerFeeLine: BUYER_FEE_LINE,
  }
}
