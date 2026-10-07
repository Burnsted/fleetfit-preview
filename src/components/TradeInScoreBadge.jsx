import { useMemo, useState } from 'react'
import {
  TRADE_IN_SCORE_BUILD,
  scoreTradeInRow,
  tradeInScoreBadgeCopy,
} from '../lib/tradeInScore'
import TradeInScoreSheet from './TradeInScoreSheet'

/**
 * Tappable trade-in score badge: "NN.N out of PP" vs "Replacement YY.Y · +D.D".
 */
export default function TradeInScoreBadge({
  row,
  unit,
  scoreCtx = null,
  assumptions = null,
  onAssumptionsChange = null,
  job = null,
  heading = null,
}) {
  const [open, setOpen] = useState(false)

  const score = useMemo(
    () =>
      scoreTradeInRow(row, unit, {
        intake: scoreCtx?.intake,
        pkg: scoreCtx?.pkg,
        job: job || scoreCtx?.intake?.job,
        assumptions,
      }),
    [row, unit, scoreCtx, assumptions, job],
  )

  if (!score) return null

  const badge = tradeInScoreBadgeCopy(score)
  if (!badge) return null

  const label = badge.incomplete
    ? `Open trade-in score (${badge.tradeIn})`
    : `Open trade-in score ${badge.tradeIn}`

  return (
    <div
      className="trade-in-score-badge-wrap"
      data-trade-in-score={TRADE_IN_SCORE_BUILD}
    >
      <button
        type="button"
        className="trade-in-score-badge"
        onClick={() => setOpen(true)}
        aria-label={label}
      >
        <span className="trade-in-score-badge-trade">{badge.tradeIn}</span>
        {!badge.incomplete && badge.replacement ? (
          <span className="trade-in-score-badge-repl">
            {badge.replacement}
            {badge.diff ? ` · ${badge.diff}` : ''}
          </span>
        ) : null}
      </button>
      <TradeInScoreSheet
        open={open}
        onClose={() => setOpen(false)}
        score={score}
        heading={heading}
        assumptions={assumptions}
        onAssumptionsChange={onAssumptionsChange}
        job={job}
      />
    </div>
  )
}
