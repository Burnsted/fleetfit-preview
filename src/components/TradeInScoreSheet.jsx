import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { measureConsentClearance } from '../lib/consentClearance'
import {
  TRADE_IN_SCORE_BUILD,
  assumptionFieldMeta,
  buildFactorPresentation,
  costOfOwnershipBoth,
  formatUsd,
  formulaSourceLines,
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
    let barRo = null
    let observedEl = null
    function bindBarObserver(el) {
      if (!el || typeof ResizeObserver === 'undefined') return
      if (observedEl === el && barRo) return
      barRo?.disconnect()
      observedEl = el
      barRo = new ResizeObserver(() => updatePad())
      barRo.observe(el)
    }
    function updatePad() {
      const { clearance, barHeight, el } = measureConsentClearance(document)
      // Live bar height: Total + Close must clear the consent bar when shown.
      const liveH =
        el && typeof el.offsetHeight === 'number' && el.offsetHeight > 0
          ? el.offsetHeight
          : barHeight || 0
      const pad =
        liveH > 0
          ? Math.max(128, liveH + 64)
          : Math.max(96, clearance + 48)
      setBottomPad(pad)
      document.documentElement.style.setProperty(
        '--trade-in-score-sheet-pad',
        `${pad}px`,
      )
      document.documentElement.style.setProperty(
        '--consent-clearance',
        liveH > 0 ? `${liveH + 8}px` : '0px',
      )
      if (el) bindBarObserver(el)
      else {
        barRo?.disconnect()
        barRo = null
        observedEl = null
      }
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
      barRo?.disconnect()
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
  const sourceLines = useMemo(
    () => (score ? formulaSourceLines(score) : []),
    [score],
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
                <table
                  className="trade-in-score-ownership-table"
                  data-ownership-table="1"
                  aria-label="Cost of ownership breakdown"
                >
                  <thead>
                    <tr>
                      <th scope="col">Item</th>
                      <th scope="col">Trade-in</th>
                      <th scope="col">Replacement</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr data-ownership-row="energy">
                      <th scope="row">Fuel or energy</th>
                      <td>
                        <span className="trade-in-score-ownership-cell">
                          {formatUsd(ownership.tradeIn.energyUsdPerYear)}{' '}
                          <span className="trade-in-score-assumption-example">
                            Example
                          </span>
                        </span>
                        <span className="trade-in-score-ownership-sub">
                          Fuel
                          {!ownership.tradeIn.energyFromEngine
                            ? ' · Example default'
                            : ''}
                        </span>
                      </td>
                      <td>
                        <span className="trade-in-score-ownership-cell">
                          {formatUsd(ownership.replacement.energyUsdPerYear)}{' '}
                          <span className="trade-in-score-assumption-example">
                            Example
                          </span>
                        </span>
                        <span className="trade-in-score-ownership-sub">
                          Energy
                          {!ownership.replacement.energyFromEngine
                            ? ' · Example default'
                            : ''}
                        </span>
                      </td>
                    </tr>
                    <tr data-ownership-row="maintenance">
                      <th scope="row">Maintenance</th>
                      <td>
                        <span className="trade-in-score-ownership-cell">
                          {formatUsd(ownership.tradeIn.maintUsdPerYear)}{' '}
                          <span className="trade-in-score-assumption-example">
                            Example
                          </span>
                        </span>
                        {!ownership.tradeIn.maintFromEngine ? (
                          <span className="trade-in-score-ownership-sub">
                            Example default
                          </span>
                        ) : null}
                      </td>
                      <td>
                        <span className="trade-in-score-ownership-cell">
                          {formatUsd(ownership.replacement.maintUsdPerYear)}{' '}
                          <span className="trade-in-score-assumption-example">
                            Example
                          </span>
                        </span>
                        {!ownership.replacement.maintFromEngine ? (
                          <span className="trade-in-score-ownership-sub">
                            Example default
                          </span>
                        ) : null}
                      </td>
                    </tr>
                    <tr data-ownership-row="depreciation">
                      <th scope="row">Depreciation</th>
                      <td>
                        <span className="trade-in-score-ownership-cell">
                          {formatUsd(
                            ownership.tradeIn.depreciationUsdPerYear,
                          )}{' '}
                          <span className="trade-in-score-assumption-example">
                            Example
                          </span>
                        </span>
                      </td>
                      <td>
                        <span className="trade-in-score-ownership-cell">
                          {formatUsd(
                            ownership.replacement.depreciationUsdPerYear,
                          )}{' '}
                          <span className="trade-in-score-assumption-example">
                            Example
                          </span>
                        </span>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr
                      className="trade-in-score-ownership-total"
                      data-ownership-row="total"
                    >
                      <th scope="row">Total per year</th>
                      <td data-ownership-total="trade-in">
                        <span className="trade-in-score-ownership-cell">
                          {formatUsd(ownership.tradeIn.totalUsdPerYear)}{' '}
                          <span className="trade-in-score-assumption-example">
                            Example
                          </span>
                        </span>
                      </td>
                      <td data-ownership-total="replacement">
                        <span className="trade-in-score-ownership-cell">
                          {formatUsd(ownership.replacement.totalUsdPerYear)}{' '}
                          <span className="trade-in-score-assumption-example">
                            Example
                          </span>
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
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
            {sourceLines.length ? (
              <div
                className="trade-in-score-formula-sources"
                data-formula-sources="1"
              >
                <p className="trade-in-score-formula-sources-title">
                  Factor detail and sources
                </p>
                <table
                  className="trade-in-score-formula-sources-table"
                  aria-label="Factor detail by side"
                >
                  <thead>
                    <tr>
                      <th scope="col">Factor</th>
                      <th scope="col">Trade-in</th>
                      <th scope="col">Replacement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupFormulaSources(sourceLines).map((row) => (
                      <tr key={row.key} data-formula-factor={row.key}>
                        <th scope="row">{row.label}</th>
                        <td>
                          <p className="trade-in-score-formula-sources-text">
                            {row.tradeIn || '—'}
                          </p>
                        </td>
                        <td>
                          <p className="trade-in-score-formula-sources-text">
                            {row.replacement || '—'}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
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

function groupFormulaSources(lines) {
  const order = []
  const byLabel = new Map()
  for (const line of lines || []) {
    const key = line.label || line.key
    if (!byLabel.has(key)) {
      byLabel.set(key, {
        key: String(line.key || key).replace(/-(current|candidate)$/, ''),
        label: line.label,
        tradeIn: '',
        replacement: '',
      })
      order.push(key)
    }
    const row = byLabel.get(key)
    if (line.side === 'Trade-in') row.tradeIn = line.text
    else if (line.side === 'Replacement') row.replacement = line.text
  }
  return order.map((k) => byLabel.get(k))
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
