/**
 * Gas twin money math — Estimate only. Never invent defaults beyond caller inputs.
 * Any "not confirmed" input makes that figure not confirmed (no partial sums).
 */
import {
  AFDC_MAINT_EV_USD_PER_MI,
  AFDC_MAINT_GAS_USD_PER_MI,
  COPY,
  NOT_CONFIRMED,
} from '../data/gasTwin/constants'

export const GAS_TWIN_MONEY_BUILD = 'gas-twin-money-20261003'

export function parseYearlyMiles(raw) {
  if (raw == null) return { ok: false, value: null, reason: 'empty' }
  const s = String(raw).trim()
  if (s === '') return { ok: false, value: null, reason: 'empty' }
  if (!/^\d+$/.test(s)) return { ok: false, value: null, reason: 'invalid' }
  const n = Number(s)
  if (!Number.isFinite(n) || Number.isNaN(n)) {
    return { ok: false, value: null, reason: 'invalid' }
  }
  if (n <= 0) return { ok: false, value: null, reason: 'nonpositive' }
  if (!Number.isInteger(n)) return { ok: false, value: null, reason: 'invalid' }
  return { ok: true, value: n, reason: null }
}

function moneyPlain(n) {
  const abs = Math.abs(Math.round(n))
  return `$${abs.toLocaleString('en-US')}`
}

/** Format a signed cost delta as "$X more" or "$X less" (never red or green). */
export function formatMoreOrLess(amount) {
  if (amount == null || !Number.isFinite(amount)) return NOT_CONFIRMED
  const rounded = Math.round(amount)
  if (rounded === 0) return '$0'
  if (rounded > 0) return `${moneyPlain(rounded)} more`
  return `${moneyPlain(rounded)} less`
}

/**
 * Upfront = EV base MSRP minus gas twin base MSRP.
 * Positive → EV costs more → "$X more". Negative → "$X less".
 */
export function computeUpfront(evMsrp, gasMsrp) {
  if (evMsrp == null || gasMsrp == null) {
    return { amount: null, display: NOT_CONFIRMED, confirmed: false }
  }
  if (!Number.isFinite(evMsrp) || !Number.isFinite(gasMsrp)) {
    return { amount: null, display: NOT_CONFIRMED, confirmed: false }
  }
  const amount = evMsrp - gasMsrp
  return { amount, display: formatMoreOrLess(amount), confirmed: true }
}

/**
 * Per year operating delta (gas cost minus EV cost) × miles.
 * Positive = EV costs less to run that year (gas twin costs more).
 * Display uses more/less relative to choosing the EV vs the gas twin's yearly spend.
 */
export function computePerYear({
  yearlyMiles,
  evEnergyUsdPerMi,
  gasEnergyUsdPerMi,
  evMaintUsdPerMi = AFDC_MAINT_EV_USD_PER_MI,
  gasMaintUsdPerMi = AFDC_MAINT_GAS_USD_PER_MI,
}) {
  const miles = parseYearlyMiles(yearlyMiles)
  if (!miles.ok) {
    return {
      amount: null,
      display: COPY.addMiles,
      confirmed: false,
      needsMiles: miles.reason === 'empty',
      invalidMiles: miles.reason === 'invalid' || miles.reason === 'nonpositive',
    }
  }
  if (
    evEnergyUsdPerMi == null ||
    gasEnergyUsdPerMi == null ||
    evMaintUsdPerMi == null ||
    gasMaintUsdPerMi == null ||
    !Number.isFinite(evEnergyUsdPerMi) ||
    !Number.isFinite(gasEnergyUsdPerMi) ||
    !Number.isFinite(evMaintUsdPerMi) ||
    !Number.isFinite(gasMaintUsdPerMi)
  ) {
    return {
      amount: null,
      display: NOT_CONFIRMED,
      confirmed: false,
      needsMiles: false,
      invalidMiles: false,
    }
  }
  const gasPerMi = gasEnergyUsdPerMi + gasMaintUsdPerMi
  const evPerMi = evEnergyUsdPerMi + evMaintUsdPerMi
  // Positive: EV saves this much per year vs gas.
  const amount = miles.value * (gasPerMi - evPerMi)
  return {
    amount,
    display: formatOperating(amount),
    confirmed: true,
    needsMiles: false,
    invalidMiles: false,
  }
}

/** Operating figures: positive savings → "$X less" (you spend less); negative → "$X more". */
function formatOperating(amount) {
  if (amount == null || !Number.isFinite(amount)) return NOT_CONFIRMED
  const rounded = Math.round(amount)
  if (rounded === 0) return '$0'
  // amount > 0 means EV is cheaper to run → "$X less"
  if (rounded > 0) return `${moneyPlain(rounded)} less`
  return `${moneyPlain(rounded)} more`
}

/**
 * Over N years = N × Per year − Upfront difference.
 * Net of the upfront price gap. Negative shown as "$X more".
 */
export function computeOverYears({ years, perYearAmount, upfrontAmount }) {
  const n = Number(years)
  if (![3, 5, 7].includes(n)) {
    return { amount: null, display: NOT_CONFIRMED, confirmed: false }
  }
  if (perYearAmount == null || upfrontAmount == null) {
    return { amount: null, display: NOT_CONFIRMED, confirmed: false }
  }
  if (!Number.isFinite(perYearAmount) || !Number.isFinite(upfrontAmount)) {
    return { amount: null, display: NOT_CONFIRMED, confirmed: false }
  }
  // Per-year amount is EV savings (gas−EV). Upfront is EV−gas (EV premium).
  // Net benefit of choosing EV over N years:
  const amount = n * perYearAmount - upfrontAmount
  return {
    amount,
    display: formatNetOverYears(amount),
    confirmed: true,
  }
}

function formatNetOverYears(amount) {
  if (amount == null || !Number.isFinite(amount)) return NOT_CONFIRMED
  const rounded = Math.round(amount)
  if (rounded === 0) return '$0'
  // positive net → EV costs less overall → "$X less"
  if (rounded > 0) return `${moneyPlain(rounded)} less`
  return `${moneyPlain(rounded)} more`
}

/**
 * Full estimate for one primary twin pair + user inputs.
 */
export function computeGasTwinEstimate(pair, { years = 5, yearlyMiles } = {}) {
  if (!pair) {
    return {
      upfront: { amount: null, display: NOT_CONFIRMED, confirmed: false },
      perYear: {
        amount: null,
        display: COPY.addMiles,
        confirmed: false,
        needsMiles: true,
      },
      overYears: { amount: null, display: NOT_CONFIRMED, confirmed: false },
    }
  }

  const upfront = computeUpfront(pair.evBaseMsrpUsd, pair.gasTwinBaseMsrpUsd)
  const perYear = computePerYear({
    yearlyMiles,
    evEnergyUsdPerMi: pair.evEnergyUsdPerMi,
    gasEnergyUsdPerMi: pair.gasEnergyUsdPerMi,
    evMaintUsdPerMi: AFDC_MAINT_EV_USD_PER_MI,
    gasMaintUsdPerMi: AFDC_MAINT_GAS_USD_PER_MI,
  })

  let overYears
  if (!upfront.confirmed || !perYear.confirmed) {
    // Miles prompt takes precedence for per-year; over-years follows confirmed rule.
    if (perYear.needsMiles || perYear.invalidMiles) {
      overYears = {
        amount: null,
        display: COPY.addMiles,
        confirmed: false,
      }
    } else {
      overYears = { amount: null, display: NOT_CONFIRMED, confirmed: false }
    }
  } else {
    overYears = computeOverYears({
      years,
      perYearAmount: perYear.amount,
      upfrontAmount: upfront.amount,
    })
  }

  return { upfront, perYear, overYears }
}

/**
 * Sum fleet strips. Any unconfirmed card → fleet figure not confirmed.
 */
export function computeFleetGasTwinTotal(estimates, { years = 5 } = {}) {
  if (!estimates?.length) {
    return {
      upfront: NOT_CONFIRMED,
      perYear: NOT_CONFIRMED,
      overYears: NOT_CONFIRMED,
      confirmed: false,
    }
  }
  let up = 0
  let py = 0
  let oy = 0
  for (const est of estimates) {
    if (!est?.upfront?.confirmed || !est?.perYear?.confirmed || !est?.overYears?.confirmed) {
      return {
        upfront: NOT_CONFIRMED,
        perYear: est?.perYear?.needsMiles ? COPY.addMiles : NOT_CONFIRMED,
        overYears: est?.perYear?.needsMiles ? COPY.addMiles : NOT_CONFIRMED,
        confirmed: false,
      }
    }
    up += est.upfront.amount
    py += est.perYear.amount
    oy += est.overYears.amount
  }
  return {
    upfront: formatMoreOrLess(up),
    perYear: formatOperating(py),
    overYears: formatNetOverYears(oy),
    years,
    confirmed: true,
  }
}

export function formatOverallScore(total, pointsPossible) {
  if (pointsPossible == null || !Number.isFinite(pointsPossible)) {
    return { display: NOT_CONFIRMED, showTotal: false }
  }
  if (pointsPossible < 60) {
    return { display: COPY.notEnoughData, showTotal: false }
  }
  if (total == null || !Number.isFinite(total)) {
    return { display: NOT_CONFIRMED, showTotal: false }
  }
  const n = Number(total)
  const display = Number.isInteger(n) ? String(n) : n.toFixed(1)
  return {
    display: `${display} out of ${pointsPossible}`,
    showTotal: true,
    total: n,
    pointsPossible,
  }
}
