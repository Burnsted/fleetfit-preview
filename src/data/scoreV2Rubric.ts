/**
 * Score v2 anchors — CLEARED-FOR-WOZ-SCORE-V2.md G-final §3
 * Every anchor tagged INFERENCE (Steve thresholds). Do not tune.
 */

export const SCORE_V2_BUILD = 'score-v2-g-final-20260927-1635'
export const SCORE_DATE = '2026-09-27' // scoring date for warranty years-left

export type AnchorPoint = { x: number; y: number; tag: 'INFERENCE' }

export const RANGE_ANCHORS: AnchorPoint[] = [
  { x: 0.6, y: 0, tag: 'INFERENCE' },
  { x: 0.8, y: 4, tag: 'INFERENCE' },
  { x: 1.0, y: 7, tag: 'INFERENCE' },
  { x: 1.5, y: 10, tag: 'INFERENCE' },
]

export const PAYLOAD_ANCHORS: AnchorPoint[] = [
  { x: 0.8, y: 0, tag: 'INFERENCE' },
  { x: 0.9, y: 4, tag: 'INFERENCE' },
  { x: 1.0, y: 7, tag: 'INFERENCE' },
  { x: 1.25, y: 10, tag: 'INFERENCE' },
]

/** Tow: step <1.0 → 0; then linear 1.0→7 … ≥1.5→10 */
export const TOW_ANCHORS: AnchorPoint[] = [
  { x: 1.0, y: 7, tag: 'INFERENCE' },
  { x: 1.5, y: 10, tag: 'INFERENCE' },
]

export const RESALE_ANCHORS: AnchorPoint[] = [
  { x: 35, y: 0, tag: 'INFERENCE' },
  { x: 45, y: 4, tag: 'INFERENCE' },
  { x: 55, y: 7, tag: 'INFERENCE' },
  { x: 70, y: 10, tag: 'INFERENCE' },
]

export const SERVICE_MI_ANCHORS: AnchorPoint[] = [
  { x: 15, y: 10, tag: 'INFERENCE' },
  { x: 30, y: 7, tag: 'INFERENCE' },
  { x: 60, y: 4, tag: 'INFERENCE' },
  { x: 100, y: 0, tag: 'INFERENCE' },
]

export const ENERGY_CPM_ANCHORS: AnchorPoint[] = [
  { x: 5, y: 10, tag: 'INFERENCE' },
  { x: 10, y: 7, tag: 'INFERENCE' },
  { x: 20, y: 4, tag: 'INFERENCE' },
  { x: 30, y: 0, tag: 'INFERENCE' },
]

export const MAINT_CPM_ANCHORS: AnchorPoint[] = [
  { x: 4, y: 10, tag: 'INFERENCE' },
  { x: 8, y: 7, tag: 'INFERENCE' },
  { x: 12, y: 4, tag: 'INFERENCE' },
  { x: 15, y: 0, tag: 'INFERENCE' },
]

export const RANGE_BUFFER = 0.7 // INFERENCE — heat/load/AC; same for EV and gas

/** Max points: cats 1–7,9–10 = 10; cat 8 warranty = 20 → 110. Tow not used → 100. */
export const CAT_MAX = 10
export const WARRANTY_MAX = 20
/** Job-applicable when tow Not used = 100; incomplete threshold = 2/3 → 66.7 */
export const JOB_APPLICABLE_NO_TOW = 100
export const INCOMPLETE_FRACTION = 2 / 3
export const POINTS_FLOOR = JOB_APPLICABLE_NO_TOW * INCOMPLETE_FRACTION // 66.666…

export const CATEGORY_KEYS = [
  'range',
  'payload',
  'cab',
  'tow',
  'resale',
  'reliability',
  'service',
  'longevity',
  'energy',
  'maintenance',
] as const

export type CategoryKey = (typeof CATEGORY_KEYS)[number]

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  range: 'Range fit',
  payload: 'Payload and cargo',
  cab: 'Cab and crew',
  tow: 'Tow fit',
  resale: 'Resale 3-yr',
  reliability: 'Reliability',
  service: 'Service network',
  longevity: 'Longevity',
  energy: 'Energy ¢ per mi',
  maintenance: 'Maintenance ¢ per mi',
}

/** Linear interpolation between anchors; clamp at ends. */
export function lin(x: number, anchors: AnchorPoint[]): number {
  if (!Number.isFinite(x) || !anchors.length) return 0
  const sorted = [...anchors].sort((a, b) => a.x - b.x)
  if (x <= sorted[0].x) return sorted[0].y
  if (x >= sorted[sorted.length - 1].x) return sorted[sorted.length - 1].y
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]
    const b = sorted[i + 1]
    if (x >= a.x && x <= b.x) {
      if (b.x === a.x) return a.y
      return a.y + ((x - a.x) / (b.x - a.x)) * (b.y - a.y)
    }
  }
  return sorted[sorted.length - 1].y
}

export function round1(n: number): number {
  // Guard float noise (e.g. 9.05 → 9.049999999999999) so half-up stays correct.
  return Math.round(n * 10 + 1e-8) / 10
}

export function clampScore(n: number, max = CAT_MAX): number {
  return Math.max(0, Math.min(max, n))
}

/** Status strings — exact text from CLEARED Score v2 §1.6 G-final */
export const STATUS = {
  NOT_USED: 'Not used by this job',
  notScored: (field: string, kind: 'published' | 'entered' = 'published') =>
    `Not scored: ${field} not ${kind}`,
  INCOMPLETE_KEY: 'Score incomplete: key data missing',
  INCOMPLETE_CURRENT: 'Score incomplete: current vehicle not entered',
  NOT_ENTERED: 'Not entered',
  ADD_CURRENT_BANNER: 'Add your current vehicle to compare',
  AT_RISK: 'At risk, not counted',
  WARRANTY_UNCONFIRMED: 'Commercial warranty status not confirmed',
  FL_PRICE: 'Not scored: FL energy price not loaded',
} as const
