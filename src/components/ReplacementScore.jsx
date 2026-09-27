import { SCORE_V2_BUILD } from '../data/scoreV2Rubric'

/**
 * Score v2 readout — Category | Current | Candidate.
 * Numbers only. One-line sourced reason + link per number.
 */
export default function ReplacementScore({
  score,
  compact = false,
  full = false,
  rank,
  className = '',
}) {
  if (!score) return null

  if (compact) {
    return (
      <div
        className={`replacement-score is-compact ${score.sidegrade ? 'is-sidegrade' : ''} ${className}`.trim()}
        data-score-build={SCORE_V2_BUILD}
        data-sidegrade={score.sidegrade ? 'true' : 'false'}
      >
        {rank != null ? (
          <span className="replacement-score-rank">#{rank}</span>
        ) : null}
        <span className="replacement-score-total">
          {score.incomplete
            ? score.incompleteLabel || 'Score incomplete'
            : score.dialTotal || `${Number(score.candidateTotal).toFixed(1)} / ${score.pointsPossible}`}
        </span>
        {score.sidegrade ? (
          <span className="replacement-score-side">Similar miles</span>
        ) : null}
      </div>
    )
  }

  const curName = score.currentName || 'Current'
  const candName = score.candidateName || 'Candidate'

  return (
    <section
      className={`replacement-score is-open is-v2${full ? ' is-full' : ''} ${score.sidegrade ? 'is-sidegrade' : ''} ${className}`.trim()}
      data-score-build={SCORE_V2_BUILD}
      data-score-v2="1"
      data-sidegrade={score.sidegrade ? 'true' : 'false'}
      aria-label="Replacement Score"
    >
      <header className="replacement-score-head">
        <div>
          <p className="replacement-score-kicker">Replacement Score</p>
          {score.incomplete ? (
            <p className="replacement-score-total-lg">{score.incompleteLabel}</p>
          ) : (
            <p className="replacement-score-total-lg">
              {Number(score.candidateTotal).toFixed(1)}
              <span className="replacement-score-of"> / {score.pointsPossible}</span>
            </p>
          )}
          {score.dialDiff && !score.incomplete ? (
            <p className="replacement-score-diff-line">{score.dialDiff}</p>
          ) : null}
        </div>
        {rank != null ? (
          <span className="replacement-score-rank-lg">#{rank}</span>
        ) : null}
      </header>

      <p className="replacement-score-current-name">
        Current: {score.currentName || 'Score incomplete: current vehicle not entered'}
      </p>
      <p className="replacement-score-candidate-name">Candidate: {candName}</p>

      <table className="score-v2-table" aria-label="Score categories">
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Current</th>
            <th scope="col">Candidate</th>
          </tr>
        </thead>
        <tbody>
          {score.categories.map((row) => (
            <tr key={row.key}>
              <th scope="row">{row.label}</th>
              <td>
                <div className="score-v2-cell-num">{row.current.display}</div>
                {full && row.current.reason ? (
                  <p className="score-v2-reason">
                    {row.current.url ? (
                      <a href={row.current.url} target="_blank" rel="noopener noreferrer">
                        {row.current.reason}
                      </a>
                    ) : (
                      row.current.reason
                    )}
                  </p>
                ) : null}
              </td>
              <td>
                <div className="score-v2-cell-num">{row.candidate.display}</div>
                {full && row.candidate.reason ? (
                  <p className="score-v2-reason">
                    {row.candidate.url ? (
                      <a href={row.candidate.url} target="_blank" rel="noopener noreferrer">
                        {row.candidate.reason}
                      </a>
                    ) : (
                      row.candidate.reason
                    )}
                  </p>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="score-v2-totals">
            <th scope="row">Total</th>
            <td>
              {score.incomplete
                ? score.incompleteLabel
                : `${Number(score.currentTotal).toFixed(1)} / ${score.pointsPossible}`}
            </td>
            <td>
              {score.incomplete
                ? score.incompleteLabel
                : `${Number(score.candidateTotal).toFixed(1)} / ${score.pointsPossible}`}
            </td>
          </tr>
          <tr className="score-v2-difference">
            <th scope="row">Difference</th>
            <td colSpan={2}>
              {score.incomplete || score.difference == null
                ? score.incompleteLabel || ''
                : `${score.difference > 0 ? '+' : ''}${Number(score.difference).toFixed(1)}`}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* curName kept for a11y context */}
      <span className="sr-only">{curName}</span>
    </section>
  )
}
