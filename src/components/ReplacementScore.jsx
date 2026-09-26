import { SCORE_BUILD } from '../lib/replacementScore'

/**
 * Public Replacement Score UI — total + transparent cats + helps / watch-outs.
 * No Worth it · SOH · FACT pills.
 * `full` (dial-tap sheet): all ~10 cats incl. Battery Health grade/Unknown + notes.
 */
export default function ReplacementScore({
  score,
  compact = false,
  full = false,
  rank,
  className = '',
}) {
  if (!score) return null

  const totalLabel = score.incomplete
    ? score.incompleteLabel
    : `${score.total.toFixed(1)} / 10`

  if (compact) {
    return (
      <div
        className={`replacement-score is-compact ${score.sidegrade ? 'is-sidegrade' : ''} ${className}`.trim()}
        data-score-build={SCORE_BUILD}
        data-sidegrade={score.sidegrade ? 'true' : 'false'}
      >
        {rank != null ? (
          <span className="replacement-score-rank">#{rank}</span>
        ) : null}
        <span className="replacement-score-total">
          {score.incomplete ? 'Score incomplete' : totalLabel}
        </span>
        {score.sidegrade ? (
          <span className="replacement-score-side">Similar miles</span>
        ) : null}
      </div>
    )
  }

  const cats = full
    ? score.categories
    : score.categories.filter((c) => c.public)

  const knownCount = score.categories.filter((c) => !c.unknown && c.grade != null).length

  return (
    <section
      className={`replacement-score is-open${full ? ' is-full' : ''} ${score.sidegrade ? 'is-sidegrade' : ''} ${className}`.trim()}
      data-score-build={SCORE_BUILD}
      data-sidegrade={score.sidegrade ? 'true' : 'false'}
      aria-label="Replacement Score"
    >
      <header className="replacement-score-head">
        <div>
          <p className="replacement-score-kicker">Replacement Score</p>
          <p className="replacement-score-total-lg">
            {score.incomplete ? 'Score incomplete' : score.total.toFixed(1)}
            {score.incomplete ? null : (
              <span className="replacement-score-of"> / 10</span>
            )}
          </p>
          {full ? (
            <p className="replacement-score-complete">
              {knownCount} of {score.categories.length} categories complete
            </p>
          ) : null}
        </div>
        {rank != null ? (
          <span className="replacement-score-rank-lg">Rank #{rank}</span>
        ) : null}
      </header>

      {score.incomplete ? (
        <p className="replacement-score-incomplete">{score.incompleteLabel}</p>
      ) : null}

      <p className="replacement-score-voice">
        Vs your current work vehicle — soft rank, not a hide list.
      </p>

      <ul className="replacement-score-cats" aria-label="Score categories">
        {cats.map((c) => (
          <li key={c.key} className={c.unknown ? 'is-unknown' : ''}>
            <div className="replacement-score-cat-main">
              <span className="replacement-score-cat-label">{c.label}</span>
              <span className="replacement-score-cat-grade">
                {c.unknown || c.grade == null ? 'Unknown' : c.grade}
              </span>
            </div>
            {full && c.note ? (
              <p className="replacement-score-cat-why">{c.note}</p>
            ) : null}
          </li>
        ))}
      </ul>

      {score.helps?.length ? (
        <div className="replacement-score-block">
          <p className="replacement-score-block-title">Helps</p>
          <ul>
            {score.helps.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {score.watchOuts?.length ? (
        <div className="replacement-score-block is-watch">
          <p className="replacement-score-block-title">Watch-outs</p>
          <ul>
            {score.watchOuts.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {score.hardFlag ? (
        <p className="replacement-score-flag">Fit or title needs a closer look — still listed.</p>
      ) : null}
      {score.hardReject ? (
        <p className="replacement-score-flag is-reject">
          Held on job fit or title — not framed as a fleet improvement.
        </p>
      ) : null}
    </section>
  )
}
