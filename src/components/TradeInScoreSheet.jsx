import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { measureConsentClearance } from '../lib/consentClearance'
import {
  TRADE_IN_SCORE_BUILD,
  assumptionFieldMeta,
  buildFactorPresentation,
  costOfOwnershipBoth,
  formatUsd,
  tradeInScoreBadgeCopy,
} from '../lib/tradeInScore'

const FAB_SELECTORS = '.fbw-fab, [data-feedback-fab], .feedback-fab, .fleet-plan-reopen'

/**
 * Trade-in vs replacement score breakdown (same sheet pattern as EV score detail).
 * Formula + editable Example defaults; rows sum to each total.
 * Cost of ownership is a headline OUT of the points table.
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
  const [showOwnershipFormula, setShowOwnershipFormula] = useState(false)
  const [showNotScored, setShowNotScored] = useState(false)
  const [bottomPad, setBottomPad] = useState(120)

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Hide FAB while sheet is open; restore on close
    const fabs = [...document.querySelectorAll(FAB_SELECTORS)]
    const prevDisplay = fabs.map((el) => el.style.display)
    fabs.forEach((el) => {
      el.style.display = 'none'
      el.setAttribute('data-trade-in-score-hidden', '1')
    })

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      fabs.forEach((el, i) => {
        el.style.display = prevDisplay[i] || ''
        el.removeAttribute('data-trade-in-score-hidden')
      })
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open) {
      setShowFormula(false)
      setShowOwnershipFormula(false)
      setShowNotScored(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    function updatePad() {
      const { clearance } = measureConsentClearance(document)
      // Clear consent when shown; keep a floor when dismissed for safe area.
      const pad = Math.max(96, clearance + 24)
      setBottomPad(pad)
      document.documentElement.style.setProperty(
        '--trade-in-score-sheet-pad',
        `${pad}px`,
      )
    }
    updatePad()
    const obs = new MutationObserver(updatePad)
    obs.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['style', 'class', 'hidden', 'data-consent-bar'],
    })
    window.addEventListener('resize', updatePad)
    return () => {
      obs.disconnect()
      window.removeEventListener('resize', updatePad)
    }
  }, [open])

  const presentation = useMemo(
    () => (score ? buildFactorPresentation(score) : null),
    [score],
  )
  const ownership = useMemo(
    () => (score ? costOfOwnershipBoth(score, assumptions, job) : null),
    [score, assumptions, job],
  )

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
      <div
        className="trade-in-score-panel"
        style={{ paddingBottom: bottomPad }}
        data-sheet-bottom-pad={bottomPad}
      >
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
          )}
        </div>

        <p className="trade-in-score-names">
          Trade-in: {curName}
          <br />
          Replacement: {candName}
        </p>

        {ownership ? (
          <section
            className="trade-in-score-ownership"
            aria-label="Cost of ownership per year"
          >
            <p className="trade-in-score-ownership-title">
              Cost of ownership per year, Example
            </p>
            <div className="trade-in-score-ownership-cols">
              <p className="trade-in-score-ownership-side">
                <span className="trade-in-score-ownership-side-label">
                  Trade-in
                </span>
                <span className="trade-in-score-ownership-amount">
                  {formatUsd(ownership.tradeIn.totalUsdPerYear)}{' '}
                  <span className="trade-in-score-assumption-example">
                    Example
                  </span>
                </span>
              </p>
              <p className="trade-in-score-ownership-side">
                <span className="trade-in-score-ownership-side-label">
                  Replacement
                </span>
                <span className="trade-in-score-ownership-amount">
                  {formatUsd(ownership.replacement.totalUsdPerYear)}{' '}
                  <span className="trade-in-score-assumption-example">
                    Example
                  </span>
                </span>
              </p>
            </div>
            <button
              type="button"
              className="trade-in-score-formula-toggle is-inline"
              aria-expanded={showOwnershipFormula}
              onClick={() => setShowOwnershipFormula((v) => !v)}
            >
              {showOwnershipFormula
                ? 'Hide ownership formula'
                : 'Show ownership formula'}
            </button>
            {showOwnershipFormula ? (
              <div
                className="trade-in-score-ownership-formula"
                data-ownership-formula="1"
              >
                <p className="trade-in-score-assumption-formula">
                  {ownership.tradeIn.formula}
                </p>
                <ul className="trade-in-score-ownership-breakdown">
                  <li>
                    Trade-in fuel or energy{' '}
                    <span>
                      {formatUsd(ownership.tradeIn.energyUsdPerYear)} Example
                    </span>
                    {!ownership.tradeIn.energyFromEngine
                      ? ' (Example default; energy not scored)'
                      : ''}
                  </li>
                  <li>
                    Trade-in maintenance{' '}
                    <span>
                      {formatUsd(ownership.tradeIn.maintUsdPerYear)} Example
                    </span>
                    {!ownership.tradeIn.maintFromEngine
                      ? ' (Example default; maintenance not scored)'
                      : ''}
                  </li>
                  <li>
                    Trade-in depreciation{' '}
                    <span>
                      {formatUsd(ownership.tradeIn.depreciationUsdPerYear)}{' '}
                      Example
                    </span>
                  </li>
                  <li>
                    Replacement fuel or energy{' '}
                    <span>
                      {formatUsd(ownership.replacement.energyUsdPerYear)}{' '}
                      Example
                    </span>
                    {!ownership.replacement.energyFromEngine
                      ? ' (Example default; energy not scored)'
                      : ''}
                  </li>
                  <li>
                    Replacement maintenance{' '}
                    <span>
                      {formatUsd(ownership.replacement.maintUsdPerYear)}{' '}
                      Example
                    </span>
                    {!ownership.replacement.maintFromEngine
                      ? ' (Example default; maintenance not scored)'
                      : ''}
                  </li>
                  <li>
                    Replacement depreciation{' '}
                    <span>
                      {formatUsd(ownership.replacement.depreciationUsdPerYear)}{' '}
                      Example
                    </span>
                  </li>
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

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
                      {f.label}
                    </span>
                    <span className="trade-in-score-assumption-note">
                      {f.sourceNote}
                    </span>
                    <span className="trade-in-score-assumption-formula">
                      {f.formula}
                    </span>
                    <span className="trade-in-score-assumption-input-row">
                      {f.isDollar ? (
                        <span className="trade-in-score-dollar-wrap">
                          <span className="trade-in-score-dollar">$</span>
                          <span className="trade-in-score-assumption-example">
                            Example
                          </span>
                        </span>
                      ) : (
                        <span className="trade-in-score-assumption-example">
                          Example default
                        </span>
                      )}
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
            {(presentation?.rows || []).map((row) =>
              row.kind === 'group' ? (
                <FragmentGroup key={row.key} row={row} />
              ) : (
                <tr key={row.key} data-factor={row.key}>
                  <th scope="row">{row.label}</th>
                  <td>
                    <div className="trade-in-score-cell-num">
                      {row.current.display}
                    </div>
                    {row.current.reason ? (
                      <p className="trade-in-score-reason">
                        {row.current.reason}
                      </p>
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
              ),
            )}
            {presentation?.notScored?.length ? (
              <tr className="trade-in-score-not-scored" data-not-scored="1">
                <th scope="row" colSpan={1}>
                  <button
                    type="button"
                    className="trade-in-score-not-scored-btn"
                    aria-expanded={showNotScored}
                    onClick={() => setShowNotScored((v) => !v)}
                  >
                    Not scored for this trade
                  </button>
                </th>
                <td colSpan={2}>
                  <span className="trade-in-score-not-scored-muted">
                    {presentation.notScored.length} factor
                    {presentation.notScored.length === 1 ? '' : 's'} not used
                  </span>
                  {showNotScored ? (
                    <ul className="trade-in-score-not-scored-list">
                      {presentation.notScored.map((n) => (
                        <li key={n.key}>
                          {n.label}: {n.current.display}
                          {' · '}
                          {n.candidate.display}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </td>
              </tr>
            ) : null}
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

function FragmentGroup({ row }) {
  return (
    <>
      <tr className="trade-in-score-group" data-factor={row.key}>
        <th scope="row">{row.label}</th>
        <td>
          <div className="trade-in-score-cell-num">
            {Number(row.currentPoints).toFixed(1)}
          </div>
        </td>
        <td>
          <div className="trade-in-score-cell-num">
            {Number(row.candidatePoints).toFixed(1)}
          </div>
        </td>
      </tr>
      {row.parts.map((part) => (
        <tr
          key={part.key}
          className="trade-in-score-subrow"
          data-factor={part.key}
          data-duty-part="1"
        >
          <th scope="row">{part.label}</th>
          <td>
            <div className="trade-in-score-cell-num">
              {part.current.display}
            </div>
            {part.current.reason ? (
              <p className="trade-in-score-reason">{part.current.reason}</p>
            ) : null}
          </td>
          <td>
            <div className="trade-in-score-cell-num">
              {part.candidate.display}
            </div>
            {part.candidate.reason ? (
              <p className="trade-in-score-reason">{part.candidate.reason}</p>
            ) : null}
          </td>
        </tr>
      ))}
    </>
  )
}
