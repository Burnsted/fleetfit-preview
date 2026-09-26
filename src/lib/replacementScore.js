/**
 * CLEARED Replacement Score — Exact Ted pick · 2026-09-26 ~10:39
 * Transparent ~10 category grades → weighted total.
 * HF-2 mid-life similar-mile: soft Life Delta taper only — never hard hide.
 * No Worth it / SOH / FACT pills in public copy.
 */

export const SCORE_BUILD = 'replacement-score-20260926-1439'

/** Soft category weights (INFERENCE v1). Cap any ≤20. Sum = 100. */
export const SOFT_WEIGHTS = {
  jobFit: 15,
  lifeDelta: 15,
  warranty: 12,
  batteryHealth: 10, // internal only — never surface SOH in UI
  range: 12,
  charging: 8,
  serviceability: 10,
  energy: 8,
  maintenance: 5,
  residual: 5,
}

export const SOFT_LABELS = {
  jobFit: 'Job Fit',
  lifeDelta: 'Life Delta',
  warranty: 'Warranty',
  batteryHealth: 'Battery (internal)',
  range: 'Range',
  charging: 'Charging',
  serviceability: 'Serviceability',
  energy: 'Energy',
  maintenance: 'Maintenance',
  residual: 'Residual risk',
}

const TOTAL_WEIGHT = Object.values(SOFT_WEIGHTS).reduce((a, b) => a + b, 0)

function num(value) {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function clampGrade(g) {
  if (g == null || !Number.isFinite(g)) return null
  return Math.max(0, Math.min(10, Math.round(g)))
}

function interp(x, x0, x1, y0, y1) {
  if (x1 === x0) return y0
  const t = (x - x0) / (x1 - x0)
  return y0 + t * (y1 - y0)
}

/**
 * Life Delta soft taper (CLEARED table).
 * ΔM = M_c − M_e (positive = EV fewer miles).
 * Similar-mile (0–14k) → grade 2–4 — low rank, still shown. Never hard reject.
 */
export function gradeLifeDelta(currentMiles, evMiles) {
  const mc = num(currentMiles)
  const me = num(evMiles)
  if (mc == null || me == null) {
    return {
      grade: null,
      unknown: true,
      deltaM: null,
      sidegrade: false,
      note: 'Miles not verified',
    }
  }
  const deltaM = mc - me
  let grade
  if (me <= 15000) grade = 10
  else if (me <= 20000 || deltaM >= 40000) grade = deltaM >= 50000 ? 10 : 9
  else if (deltaM >= 20000) grade = clampGrade(interp(deltaM, 20000, 39999, 7, 8.5))
  else if (deltaM >= 15000) grade = clampGrade(interp(deltaM, 15000, 19999, 5, 6.5))
  else if (deltaM >= 0) grade = clampGrade(interp(deltaM, 0, 14999, 2, 4.5))
  else grade = deltaM <= -20000 ? 0 : 1

  const sidegrade = deltaM >= 0 && deltaM < 15000
  let note
  if (deltaM < 0) {
    note = 'More miles than your current work vehicle'
  } else if (sidegrade) {
    note = 'Similar miles vs your current work vehicle — ranks lower, still listed'
  } else if (deltaM >= 40000 || me <= 20000) {
    note = 'Clear mile step-down vs your current work vehicle'
  } else {
    note = 'Fewer miles than your current work vehicle'
  }

  return { grade, unknown: false, deltaM, sidegrade, note }
}

function gradeJobFitSoft(unit, intake) {
  const specUnknown =
    unit?.payload == null &&
    unit?.tow == null &&
    !unit?.cab &&
    !unit?.bed
  // HF-1: no clear FACT shortfall in demo data → FLAG when critical fit unknown
  const hf1 = {
    status: specUnknown ? 'flag' : 'pass',
    label: specUnknown ? 'Job fit unverified' : 'Job fit open',
  }
  if (hf1.status === 'reject') {
    return { grade: 0, unknown: false, hf1, note: 'Does not meet stated job need' }
  }
  // Soft detail after pass/flag — never invent lb cutoffs
  const body = intake?.body
  let grade = 6
  if (body && body !== 'Either' && unit?.bodyType) {
    const wantVan = /van/i.test(body)
    const isVan = unit.bodyType === 'van'
    grade = wantVan === isVan ? 8 : 5
  }
  if (unit?.tradeFit?.label) grade = Math.min(10, grade + 1)
  if (specUnknown) grade = Math.min(grade, 5)
  return {
    grade: clampGrade(grade),
    unknown: false,
    hf1,
    note: 'Payload / bed / cab / tow vs your current work vehicle',
  }
}

function gradeWarranty(unit) {
  const months = num(
    unit?.battery?.warrantyBatteryMonths ?? unit?.warrantyBatteryMonths,
  )
  if (months == null) {
    return { grade: null, unknown: true, note: 'Warranty remaining not on file' }
  }
  // Plain-language internal grade — no $ invented
  if (months >= 60) return { grade: 9, unknown: false, note: 'Strong warranty time left' }
  if (months >= 36) return { grade: 7, unknown: false, note: 'Warranty time remaining' }
  if (months >= 12) return { grade: 5, unknown: false, note: 'Limited warranty time left' }
  return { grade: 2, unknown: false, note: 'Little warranty time left' }
}

/** Internal only — grade may use SOH; public UI must not show SOH pills. */
function gradeBatteryInternal(unit) {
  const soh = num(unit?.battery?.soh ?? unit?.soh)
  if (soh == null) {
    return { grade: null, unknown: true, note: 'Pack health not on file' }
  }
  if (soh >= 95) return { grade: 9, unknown: false, note: 'Pack health on file' }
  if (soh >= 90) return { grade: 7, unknown: false, note: 'Pack health on file' }
  if (soh >= 80) return { grade: 5, unknown: false, note: 'Pack health on file' }
  return { grade: 2, unknown: false, note: 'Pack health on file — review before close' }
}

function gradeRange(unit, intake) {
  const day = String(intake?.dailyMiles || '').trim()
  const dayN = num(day)
  const label = String(unit?.chargingFit?.label || '')
  if (!label && dayN == null) {
    return { grade: null, unknown: true, note: 'Day range not scored' }
  }
  let grade = 6
  if (/strong|long/i.test(label)) grade = 8
  else if (/fits|covers/i.test(label)) grade = 7
  else if (/shorter|lighter/i.test(label)) grade = 5
  if (dayN != null && dayN > 150 && !/strong|long/i.test(label)) grade = Math.min(grade, 5)
  return { grade: clampGrade(grade), unknown: false, note: 'Duty-cycle range vs the work day' }
}

function gradeCharging(unit, intake) {
  const overnight = intake?.overnightCharge
  const label = String(unit?.chargingFit?.label || '')
  if (!overnight && !label) {
    return { grade: null, unknown: true, note: 'Charging path not scored' }
  }
  let grade = 6
  if (overnight === 'shop-l2' || overnight === 'home-l2') grade = 8
  else if (overnight === 'l1-only') grade = 4
  else if (overnight === 'unknown') grade = 5
  if (/fits shop|overnight/i.test(label)) grade = Math.max(grade, 7)
  return { grade: clampGrade(grade), unknown: false, note: 'Charging readiness for the shop' }
}

function gradeServiceability(unit) {
  const make = String(unit?.make || '')
  if (!make) return { grade: null, unknown: true, note: 'Service network not scored' }
  // Scaffold: common work-EV makes score mid-high; no invented dealer density
  let grade = 6
  if (/Ford|Chevrolet|RAM|GMC/i.test(make)) grade = 7
  if (/Rivian|Tesla/i.test(make)) grade = 5
  if (unit?.sellerType === 'dealer') grade = Math.min(10, grade + 1)
  return { grade: clampGrade(grade), unknown: false, note: 'Serviceability & network' }
}

function gradeEnergy() {
  // Tank vs kWh FACT rarely both present in preview — exclude rather than invent
  return { grade: null, unknown: true, note: 'Energy counter not verified' }
}

function gradeMaintenance(unit, life) {
  if (life.unknown) {
    return { grade: null, unknown: true, note: 'Maintenance outlook needs miles' }
  }
  let grade = 6
  if (life.grade >= 8) grade = 8
  else if (life.sidegrade) grade = 4
  else if (life.grade <= 1) grade = 3
  if (unit?.cpo) grade = Math.min(10, grade + 1)
  return { grade: clampGrade(grade), unknown: false, note: 'Maintenance & downtime outlook' }
}

function gradeResidual(unit, life) {
  const year = num(unit?.year)
  if (year == null && life.unknown) {
    return { grade: null, unknown: true, note: 'Residual risk not scored' }
  }
  let grade = 5
  if (year != null) {
    const age = Math.max(0, 2026 - year)
    if (age <= 1) grade = 7
    else if (age <= 3) grade = 6
    else if (age <= 5) grade = 5
    else grade = 4
  }
  if (life.sidegrade) grade = Math.min(grade, 4)
  if (!life.unknown && life.grade >= 8) grade = Math.min(10, grade + 1)
  return {
    grade: clampGrade(grade),
    unknown: false,
    note: 'Residual risk — no dollar forecast',
  }
}

function hf3Title(unit) {
  const title = String(unit?.titleStatus || '')
  if (/salvage|flood|lemon|void/i.test(title)) {
    return { status: 'reject', label: 'Title / salvage issue on listing' }
  }
  if (/rebuilt|branded/i.test(title)) {
    return { status: 'flag', label: 'Branded title — review before close' }
  }
  if (/clean/i.test(title)) {
    return { status: 'pass', label: 'Title clean on listing' }
  }
  return { status: 'flag', label: 'Title not verified' }
}

/**
 * Score one candidate EV vs current work vehicle miles.
 * Sidegrades always remain scorable/visible — Life Delta soft-tapers only.
 */
export function scoreReplacementUnit(unit, { currentMiles, intake } = {}) {
  const life = gradeLifeDelta(currentMiles, unit?.mileage)
  const job = gradeJobFitSoft(unit, intake)
  const cats = {
    jobFit: job,
    lifeDelta: life,
    warranty: gradeWarranty(unit),
    batteryHealth: gradeBatteryInternal(unit),
    range: gradeRange(unit, intake),
    charging: gradeCharging(unit, intake),
    serviceability: gradeServiceability(unit),
    energy: gradeEnergy(),
    maintenance: gradeMaintenance(unit, life),
    residual: gradeResidual(unit, life),
  }

  const hf3 = hf3Title(unit)
  const hardReject = job.hf1?.status === 'reject' || hf3.status === 'reject'
  const hardFlag =
    !hardReject && (job.hf1?.status === 'flag' || hf3.status === 'flag')

  let knownWeight = 0
  let weighted = 0
  const categories = Object.keys(SOFT_WEIGHTS).map((key) => {
    const rawW = SOFT_WEIGHTS[key]
    const weight = Math.min(rawW, TOTAL_WEIGHT * 0.2) // cap ≤20%
    const c = cats[key]
    const unknown = !c || c.unknown || c.grade == null
    if (!unknown) {
      knownWeight += weight
      weighted += c.grade * weight
    }
    return {
      key,
      label: SOFT_LABELS[key],
      weight,
      grade: unknown ? null : c.grade,
      unknown,
      note: c?.note || '',
      sidegrade: Boolean(c?.sidegrade),
      // Battery never exposes SOH in public payload
      public: key !== 'batteryHealth',
    }
  })

  const unknownShare = TOTAL_WEIGHT === 0 ? 1 : (TOTAL_WEIGHT - knownWeight) / TOTAL_WEIGHT
  const incomplete = unknownShare > 0.4 || knownWeight === 0
  const total = incomplete ? null : Math.round((weighted / knownWeight) * 10) / 10

  const publicCats = categories.filter((c) => c.public)
  const helps = publicCats
    .filter((c) => !c.unknown && c.grade != null && c.grade >= 7)
    .sort((a, b) => b.grade - a.grade)
    .slice(0, 2)
    .map((c) => c.note || c.label)
  const watchOuts = []
  if (life.sidegrade) watchOuts.push(life.note)
  if (life.unknown) watchOuts.push('Miles not verified')
  publicCats
    .filter((c) => !c.unknown && c.grade != null && c.grade <= 4 && c.key !== 'lifeDelta')
    .sort((a, b) => a.grade - b.grade)
    .slice(0, 2)
    .forEach((c) => watchOuts.push(c.note || c.label))
  if (hardFlag && job.hf1?.status === 'flag') watchOuts.push(job.hf1.label)
  if (hf3.status === 'flag') watchOuts.push(hf3.label)

  return {
    build: SCORE_BUILD,
    total,
    incomplete,
    incompleteLabel: 'Score incomplete — key data missing',
    categories,
    helps: helps.slice(0, 2),
    watchOuts: [...new Set(watchOuts)].slice(0, 3),
    lifeDelta: life,
    sidegrade: Boolean(life.sidegrade),
    hardReject,
    hardFlag,
    hf1: job.hf1,
    hf3,
    sortKey: hardReject
      ? -1
      : incomplete
        ? 0
        : total,
  }
}

/** Best → worst. Sidegrades stay in the list at the bottom of the soft rank. */
export function rankUnitsByReplacementScore(units, ctx) {
  return [...units]
    .map((unit) => ({
      unit,
      score: scoreReplacementUnit(unit, ctx),
    }))
    .sort((a, b) => {
      if (a.score.hardReject !== b.score.hardReject) {
        return a.score.hardReject ? 1 : -1
      }
      const ta = a.score.sortKey
      const tb = b.score.sortKey
      if (tb !== ta) return tb - ta
      const jobA = a.score.categories.find((c) => c.key === 'jobFit')?.grade ?? -1
      const jobB = b.score.categories.find((c) => c.key === 'jobFit')?.grade ?? -1
      if (jobB !== jobA) return jobB - jobA
      const miA = num(a.unit.mileage) ?? Number.POSITIVE_INFINITY
      const miB = num(b.unit.mileage) ?? Number.POSITIVE_INFINITY
      return miA - miB
    })
}

export function currentMilesForScore(intake, pkg) {
  return (
    num(intake?.currentMileage) ??
    num(intake?.currentMiles) ??
    num(pkg?.currentMileage) ??
    null
  )
}
