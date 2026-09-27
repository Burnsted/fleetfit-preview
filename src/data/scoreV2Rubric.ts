/**
 * Score v2 anchors — CLEARED-FOR-WOZ-SCORE-V2.md §3
 * Every anchor tagged INFERENCE (Steve thresholds). Do not tune.
 */

export const SCORE_V2_BUILD = 'score-v2-f-pages-20260927-1515'
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
export const POINTS_FLOOR = 60 // incomplete if PP < 60
export const CAT_MAX = 10

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
  payload: 'Payload / cargo',
  cab: 'Cab / crew',
  tow: 'Tow fit',
  resale: 'Resale 3-yr',
  reliability: 'Reliability',
  service: 'Service network',
  longevity: 'Longevity',
  energy: 'Energy ¢/mi',
  maintenance: 'Maintenance ¢/mi',
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
  return Math.round(n * 10) / 10
}

export function clampScore(n: number): number {
  return Math.max(0, Math.min(CAT_MAX, n))
}

/** Status strings — exact text from CLEARED Score v2 §1.6 */
export const STATUS = {
  NOT_USED: 'Not used by this job',
  notScored: (field: string, kind: 'published' | 'entered' = 'published') =>
    `Not scored: ${field} not ${kind}`,
  INCOMPLETE_KEY: 'Score incomplete: key data missing',
  INCOMPLETE_CURRENT: 'Score incomplete: current vehicle not entered',
  NOT_ENTERED: 'Not entered',
  ADD_CURRENT_BANNER: 'Add your current vehicle to compare',
  AT_RISK: 'At risk, not counted',
  FL_PRICE: 'Not scored: FL energy price not loaded',
} as const
