const STORAGE_KEY = 'fleetfit-budget'

function finitePositive(value) {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Shop-typed spend: 200000, $200,000, 200k. */
export function parseSpend(raw) {
  const s = String(raw ?? '').trim().replace(/[$,\s]/g, '')
  if (!s) return null
  const asK = /^([\d.]+)k$/i.exec(s)
  if (asK) return finitePositive(Math.round(Number(asK[1]) * 1000))
  return finitePositive(s)
}

/** KBB trade only when a numeric FACT is already in data. Never invent. */
export function factKbbTradeIn(intake, pkg) {
  return finitePositive(intake?.kbbTradeIn ?? pkg?.currentKbbTradeIn)
}

export function readBudget() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (!parsed || typeof parsed !== 'object') return { maxSpend: null }
    return { maxSpend: finitePositive(parsed.maxSpend) }
  } catch {
    return { maxSpend: null }
  }
}

export function writeBudget({ maxSpend } = {}) {
  const next = { maxSpend: finitePositive(maxSpend) }
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* ignore quota */
  }
  return next
}

/** Envelope is max spend, plus FACT trade when we have one. */
export function spendEnvelope(maxSpend, kbbTradeIn) {
  if (maxSpend == null) return null
  if (kbbTradeIn == null) return maxSpend
  return maxSpend + kbbTradeIn
}

export function unitsWithinEnvelope(units, envelope) {
  if (envelope == null || !Array.isArray(units)) return units || []
  const kept = []
  let sum = 0
  for (const unit of units) {
    const ask = Number(unit.askPrice)
    if (!Number.isFinite(ask) || ask <= 0) continue
    if (sum + ask <= envelope) {
      kept.push(unit)
      sum += ask
    }
  }
  return kept
}
