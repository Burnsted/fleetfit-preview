/**
 * Baseline / gas payload — SOURCES-V2 F · f_baseline_payload.csv
 * Low-end rule (Ted lock): listing → config_trim low → oem_engine_range min.
 * oem_engine_max-only rows are never scored.
 */
import { parseCsv, numOrNull } from '../lib/csvParse'
import raw from './v2/f_baseline_payload.csv?raw'

export const BASELINE_PAYLOAD_BUILD = 'score-v2-payload-f-20260927'

export type PayloadHit = {
  payloadLb: number
  reasonLabel: string
  url: string | null
  rowType: string
  label: string
}

type PayloadRow = Record<string, string>

const ROWS: PayloadRow[] = parseCsv(raw)

function norm(s: string): string {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function engineMatch(rowEngine: string, qEngine: string | null | undefined): boolean {
  if (!qEngine) return true
  const a = norm(rowEngine)
  const b = norm(qEngine)
  if (!a || !b) return true
  if (a.includes(b) || b.includes(a)) return true
  // EcoBoost 3.5 ↔ EcoBoost 3.5L V6 twin-turbo
  if (/35/.test(a) && /ecoboost|twin/.test(a) && /35/.test(b) && /ecoboost|35/.test(b)) {
    return true
  }
  if (/50/.test(a) && /50/.test(b) && /v8/.test(a) === /v8/.test(b)) return true
  if (/57/.test(a) && /hemi|57/.test(b)) return true
  if (/53/.test(a) && /53/.test(b)) return true
  if (/36/.test(a) && /36/.test(b)) return true
  return false
}

function driveMatch(rowDrive: string, qDrive: string | null | undefined): boolean {
  const rd = String(rowDrive || '').toLowerCase()
  if (!qDrive || rd === 'all') return true
  const d = String(qDrive).toLowerCase().replace(/\s+/g, '')
  const r = rd.replace(/\s+/g, '')
  if (d.includes('4x4') || d.includes('4wd') || d.includes('awd')) {
    return r.includes('4x4') || r.includes('4wd') || r.includes('awd')
  }
  if (d.includes('4x2') || d.includes('2wd') || d.includes('rwd')) {
    return r.includes('4x2') || r.includes('2wd') || r.includes('rwd')
  }
  return r.includes(d) || d.includes(r)
}

function cabMatch(rowCab: string, qCab: string | null | undefined): boolean {
  const rc = String(rowCab || '').toLowerCase()
  if (!qCab || rc === 'all') return true
  const c = String(qCab).toLowerCase()
  if (c.includes('supercrew') || c.includes('crew')) {
    return rc.includes('supercrew') || rc.includes('crew')
  }
  if (c.includes('supercab') || c.includes('extended') || c.includes('quad') || c.includes('double')) {
    return (
      rc.includes('supercab') ||
      rc.includes('extended') ||
      rc.includes('quad') ||
      rc.includes('double') ||
      rc.includes('access')
    )
  }
  if (c.includes('regular')) return rc.includes('regular')
  return rc.includes(c) || c.includes(rc)
}

function modelMatch(rowModel: string, qModel: string): boolean {
  const a = norm(rowModel)
  const b = norm(qModel)
  return a === b || a.includes(b) || b.includes(a)
}

function yearMakeModel(
  r: PayloadRow,
  year: number,
  make: string,
  model: string,
): boolean {
  return (
    Number(r.year) === year &&
    norm(r.make) === norm(make) &&
    modelMatch(r.model, model)
  )
}

/**
 * Resolve payload for a gas baseline (or any f_baseline_payload subject).
 * Never returns oem_engine_max-only values.
 */
export function lookupBaselinePayload(opts: {
  year: number
  make: string
  model: string
  engine?: string | null
  drivetrain?: string | null
  cab?: string | null
}): PayloadHit | null {
  const { year, make, model, engine, drivetrain, cab } = opts
  const pool = ROWS.filter((r) => yearMakeModel(r, year, make, model))
  if (!pool.length) return null

  const typed = pool.filter(
    (r) => engineMatch(r.engine, engine) && driveMatch(r.drivetrain, drivetrain),
  )
  const candidates = typed.length ? typed : pool.filter((r) => engineMatch(r.engine, engine))

  // 1) config_trim_range / oem_config / oem_config_max_any_engine with a min
  const configRows = candidates.filter((r) => {
    const t = r.row_type
    if (t === 'oem_engine_max') return false
    if (t === 'not_offered' || t === 'unknown') return false
    if (cab) return cabMatch(r.cab, cab)
    return true
  })

  const trimLike = configRows.filter((r) =>
    /config_trim_range|oem_config($|_)/i.test(r.row_type),
  )
  const withMin = (trimLike.length ? trimLike : configRows)
    .map((r) => {
      const min = numOrNull(r.payload_min_lb)
      // Some oem_config_max_any_engine rows only have payload_max_lb — treat as ceiling, skip
      if (min == null) return null
      return { r, min }
    })
    .filter(Boolean) as { r: PayloadRow; min: number }[]

  if (withMin.length) {
    // Low end across matching configs (cab not entered → all cabs)
    let best = withMin[0]
    for (const hit of withMin) {
      if (hit.min < best.min) best = hit
    }
    const cabNote = cab
      ? String(cab)
      : 'cab not entered'
    const isProxy = /proxy|inference/i.test(best.r.row_type + best.r.label)
    const reasonLabel = isProxy
      ? `${best.min.toLocaleString()} lb (proxy, INFERENCE, ${year} ${make} ${model}; ${cabNote})`
      : `${best.min.toLocaleString()} lb (lowest per-trim value, ${year} ${make} ${model} ${engine || ''}${drivetrain ? ` ${drivetrain}` : ''}, ${cabNote}; cars.com base-equipped trim)`.replace(
          /\s+/g,
          ' ',
        )
    return {
      payloadLb: best.min,
      reasonLabel,
      url: best.r.source_url || null,
      rowType: best.r.row_type,
      label: best.r.label,
    }
  }

  // 2) oem_engine_range minimum
  const ranges = candidates.filter((r) => r.row_type === 'oem_engine_range')
  const rangeMins = ranges
    .map((r) => ({ r, min: numOrNull(r.payload_min_lb) }))
    .filter((x) => x.min != null) as { r: PayloadRow; min: number }[]
  if (rangeMins.length) {
    let best = rangeMins[0]
    for (const hit of rangeMins) {
      if (hit.min < best.min) best = hit
    }
    return {
      payloadLb: best.min,
      reasonLabel: `${best.min.toLocaleString()} lb (OEM engine-range minimum, ${year} ${make} ${model})`,
      url: best.r.source_url || null,
      rowType: best.r.row_type,
      label: best.r.label,
    }
  }

  // 3) inference_same_generation / thirdparty_range mins
  const inf = candidates.filter((r) =>
    /inference_same_generation|thirdparty_range|proxy/i.test(r.row_type),
  )
  const infMins = inf
    .map((r) => ({ r, min: numOrNull(r.payload_min_lb) }))
    .filter((x) => x.min != null) as { r: PayloadRow; min: number }[]
  if (infMins.length) {
    let best = infMins[0]
    for (const hit of infMins) {
      if (hit.min < best.min) best = hit
    }
    return {
      payloadLb: best.min,
      reasonLabel: `${best.min.toLocaleString()} lb (INFERENCE, proxy range min, ${year} ${make} ${model})`,
      url: best.r.source_url || null,
      rowType: best.r.row_type,
      label: best.r.label,
    }
  }

  // oem_engine_max-only → never score
  return null
}
