import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  TRADE_IN_SCORE_BUILD,
  assumptionFieldMeta,
  tradeInScoreBadgeCopy,
} from '../lib/tradeInScore'

/**
 * Trade-in vs replacement score breakdown (same sheet pattern as EV score detail).
 * Formula + editable Example defaults; rows sum to each total.
 */
export default function TradeInScoreSheet({
  open,
  onClose,
  score,
  heading = null,
  assumptions = null,
  onAssumptionsChange = null,
  job = null,
}) {
  const [showFormula, setShowFormula] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open) setShowFormula(false)
  }, [open])

  if (!open || !score || typeof document === 'undefined') return null

  const badge = tradeInScoreBadgeCopy(score)
  const fields = assumptionFieldMeta(assumptions, job)
  const curName = score.missingCurrent
    ? 'Not entered'
    : score.currentName || 'Trade-in'
  const candName = score.candidateName || 'Replacement'

  function setField(key, raw) {
    if (!onAssumptionsChange) return
    const n = Number(raw)
    if (!Number.isFinite(n)) return
    onAssumptionsChange({ ...(assumptions || {}), [key]: n })
  }

  return createPortal(
    <div
      className="trade-in-score-sheet"
      data-trade-in-score={TRADE_IN_SCORE_BUILD}
      role="dialog"
      aria-modal="true"
      aria-label="Trade-in score breakdown"
    >
      <button
        type="button"
        className="trade-in-score-backdrop"
        aria-label="Close trade-in score"
        onClick={onClose}
      />
      <div className="trade-in-score-panel">
        <header className="trade-in-score-panel-head">
          <div>
            <p className="trade-in-score-panel-kicker">Trade-in score</p>
            {heading ? (
              <p className="trade-in-score-panel-title">{heading}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="trade-in-score-close"
            onClick={onClose}
            aria-label="Close"
          >
            Close
          </button>
        </header>

        <div className="trade-in-score-totals">
          {badge?.incomplete ? (
            <p className="trade-in-score-total-lg">{badge.tradeIn}</p>
          ) : (
            <>
              <p className="trade-in-score-total-lg">
                {badge?.tradeIn}
                {badge?.replacement ? (
                  <span className="trade-in-score-vs">
                    {' '}
                    vs {badge.replacement}
                    {badge.diff ? ` · ${badge.diff}` : ''}
                  </span>
                ) : null}
              </p>
            </>
          )}
        </div>

        <p className="trade-in-score-names">
          Trade-in: {curName}
          <br />
          Replacement: {candName}
        </p>

        <button
          type="button"
          className="trade-in-score-formula-toggle"
          aria-expanded={showFormula}
          onClick={() => setShowFormula((v) => !v)}
        >
          {showFormula ? 'Hide formula' : 'Show formula'}
        </button>

        {showFormula ? (
          <section
            className="trade-in-score-formula"
            aria-label="Score formula assumptions"
          >
            <p className="trade-in-score-formula-lead">
              Every assumption is an editable Example default from the same
              scoring engine as the unit card. Edit a value to update this
              trade-in score live.
            </p>
            <ul className="trade-in-score-assumption-list">
              {fields.map((f) => (
                <li key={f.key} className="trade-in-score-assumption">
                  <label>
                    <span className="trade-in-score-assumption-label">
                      {f.label} · Example default
                    </span>
                    <span className="trade-in-score-assumption-note">
                      {f.sourceNote}
                    </span>
                    <span className="trade-in-score-assumption-formula">
                      {f.formula}
                    </span>
                    <span className="trade-in-score-assumption-input-row">
                      {f.isDollar ? <span className="trade-in-score-dollar">$</span> : null}
                      <input
                        type="number"
                        inputMode="decimal"
                        step={f.step}
                        value={f.value ?? ''}
                        onChange={(e) => setField(f.key, e.target.value)}
                        aria-label={`${f.label} Example default`}
                      />
                      <span className="trade-in-score-assumption-unit">
                        {f.unit}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <table className="trade-in-score-table" aria-label="Score factors">
          <thead>
            <tr>
              <th scope="col">Factor</th>
              <th scope="col">Trade-in</th>
              <th scope="col">Replacement</th>
            </tr>
          </thead>
          <tbody>
            {score.categories.map((row) => (
              <tr key={row.key} data-factor={row.key}>
                <th scope="row">{row.label}</th>
                <td>
                  <div className="trade-in-score-cell-num">
                    {row.current.display}
                  </div>
                  {row.current.reason ? (
                    <p className="trade-in-score-reason">{row.current.reason}</p>
                  ) : null}
                </td>
                <td>
                  <div className="trade-in-score-cell-num">
                    {row.candidate.display}
                  </div>
                  {row.candidate.reason ? (
                    <p className="trade-in-score-reason">
                      {row.candidate.reason}
                    </p>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="trade-in-score-table-totals">
              <th scope="row">Total</th>
              <td>
                {score.missingCurrent || score.currentTotal == null
                  ? 'Not entered'
                  : `${Number(score.currentTotal).toFixed(1)} out of ${score.pointsPossible}`}
              </td>
              <td>
                {score.candidateTotal == null
                  ? score.incompleteLabel || 'Score incomplete'
                  : `${Number(score.candidateTotal).toFixed(1)} out of ${score.pointsPossible}`}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>,
    document.body,
  )
}
