import { SCORE_BUILD } from '../lib/replacementScore'

export const SCORE_UI_BUILD = 'score-ui-dial-20260926-1451'

/**
 * CLEARED Score UI dial — glanceable speed-dial RIGHT of pricing.
 * Arc gauge + large score; rank optional near dial (not the only signal).
 */
export default function ScoreDial({
  score,
  rank = null,
  size = 'card',
  className = '',
}) {
  if (!score) return null

  const incomplete = Boolean(score.incomplete || score.total == null)
  const value = incomplete ? null : Number(score.total)
  const display = incomplete ? '—' : value.toFixed(1)
  const pct = incomplete ? 0 : Math.max(0, Math.min(1, value / 10))

  // Arc from 225° to -45° (270° sweep) — classic speedometer
  const r = 18
  const cx = 22
  const cy = 22
  const start = (-225 * Math.PI) / 180
  const sweep = (270 * Math.PI) / 180
  const end = start + sweep * pct

  function polar(a) {
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
  }
  const [x0, y0] = polar(start)
  const [x1, y1] = polar(start + sweep)
  const [xe, ye] = polar(end)
  const track = `M ${x0} ${y0} A ${r} ${r} 0 1 1 ${x1} ${y1}`
  const large = sweep * pct > Math.PI ? 1 : 0
  const fill =
    pct <= 0
      ? ''
      : `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${xe} ${ye}`

  const tone = score.sidegrade
    ? 'is-sidegrade'
    : incomplete
      ? 'is-incomplete'
      : value >= 7
        ? 'is-strong'
        : value >= 5
          ? 'is-mid'
          : 'is-low'

  return (
    <div
      className={`score-dial is-${size} ${tone} ${className}`.trim()}
      data-score-ui={SCORE_UI_BUILD}
      data-score-build={SCORE_BUILD}
      data-sidegrade={score.sidegrade ? 'true' : 'false'}
      aria-label={
        incomplete
          ? 'Replacement Score incomplete'
          : `Replacement Score ${display} of 10${rank != null ? `, rank ${rank}` : ''}`
      }
    >
      <svg className="score-dial-svg" viewBox="0 0 44 40" aria-hidden="true">
        <path className="score-dial-track" d={track} fill="none" />
        {fill ? <path className="score-dial-arc" d={fill} fill="none" /> : null}
      </svg>
      <div className="score-dial-readout">
        <span className="score-dial-value">{display}</span>
        {!incomplete ? <span className="score-dial-max">/10</span> : null}
      </div>
      {rank != null ? (
        <span className="score-dial-rank">#{rank}</span>
      ) : null}
    </div>
  )
}
