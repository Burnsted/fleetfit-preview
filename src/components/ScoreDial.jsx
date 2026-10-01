import { SCORE_V2_BUILD, STATUS } from '../data/scoreV2Rubric'
import { GOOD_SCORE_RATIO } from '../lib/suggestionEligibility'

export const SCORE_UI_BUILD = 'score-ui-dial-v2-g-final-20260927-1635'
export { GOOD_SCORE_RATIO }

/**
 * CLEARED Score UI dial — right of pricing.
 * Complete: NN.N / PP, ±N.N vs current, muted Current NN.N.
 * Incomplete (§1.6): "Score incomplete: key data missing" — no total, no difference.
 */
export default function ScoreDial({
  score,
  rank = null,
  size = 'card',
  className = '',
  onOpen = null,
}) {
  if (!score) return null

  const pp = Number(score.pointsPossible) || 0
  const hasTotal = score.candidateTotal != null && !score.incomplete && pp > 0
  const total = hasTotal ? Number(score.candidateTotal) : null
  const incomplete = Boolean(score.incomplete || !hasTotal)
  const incompleteLabel =
    score.incompleteLabel || STATUS.INCOMPLETE_KEY
  // Never em-dash in score cells (CLEARED OEM / Score v2)
  const displaySafe = hasTotal ? total.toFixed(1) : incomplete ? 'Inc' : ''
  const pct = !hasTotal ? 0 : Math.max(0, Math.min(1, total / pp))

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
    pct <= 0 ? '' : `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${xe} ${ye}`

  const tone = score.sidegrade
    ? 'is-sidegrade'
    : incomplete
      ? 'is-incomplete'
      : pct >= GOOD_SCORE_RATIO
        ? 'is-high'
        : pct >= 0.5
          ? 'is-mid'
          : 'is-low'

  const label = hasTotal
    ? `Open Replacement Score ${displaySafe} of ${pp}${rank != null ? `, rank ${rank}` : ''}`
    : `Open Replacement Score (${incompleteLabel})`

  const interactive = typeof onOpen === 'function'
  const Tag = interactive ? 'button' : 'div'
  const tagProps = interactive
    ? {
        type: 'button',
        onClick: (e) => {
          e.preventDefault()
          e.stopPropagation()
          onOpen()
        },
      }
    : {}

  // Fix C dial lines only when complete
  const diffLine = hasTotal ? score.dialDiff || null : null
  const currentLine = hasTotal ? score.dialCurrent || null : null

  return (
    <Tag
      className={`score-dial is-${size} ${tone}${interactive ? ' is-tappable' : ''} ${className}`.trim()}
      data-score-ui={SCORE_UI_BUILD}
      data-score-build={SCORE_V2_BUILD}
      data-sidegrade={score.sidegrade ? 'true' : 'false'}
      data-dial-tap={interactive ? 'open' : undefined}
      aria-label={label}
      title={incomplete ? incompleteLabel : undefined}
      {...tagProps}
    >
      <svg className="score-dial-svg" viewBox="0 0 44 40" aria-hidden="true">
        <path className="score-dial-track" d={track} fill="none" />
        {fill ? <path className="score-dial-arc" d={fill} fill="none" /> : null}
      </svg>
      {incomplete ? (
        <div className="score-dial-readout is-incomplete-msg">
          <span className="score-dial-incomplete">{incompleteLabel}</span>
        </div>
      ) : (
        <div className="score-dial-readout">
          <span className="score-dial-value">{displaySafe}</span>
          {pp ? <span className="score-dial-max">out of {pp}</span> : null}
        </div>
      )}
      {diffLine ? <span className="score-dial-diff">{diffLine}</span> : null}
      {currentLine ? <span className="score-dial-current">{currentLine}</span> : null}
      {rank != null && hasTotal ? (
        <span className="score-dial-rank">#{rank}</span>
      ) : null}
    </Tag>
  )
}
