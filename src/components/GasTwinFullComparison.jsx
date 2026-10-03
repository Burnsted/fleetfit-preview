import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { COPY } from '../data/gasTwin/constants'
import {
  buildComparisonRows,
  buildOtherCandidates,
  buildOverallScores,
  disclosureCopy,
  evDisplayName,
  gasTwinDisplayName,
  getPairById,
  whyThisTwinText,
} from '../lib/gasTwin'
import { useGasTwin } from '../lib/gasTwinState'

function getFocusable(root) {
  if (!root) return []
  return Array.from(
    root.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null)
}

/**
 * Full comparison — right panel on desktop, full-screen sheet on mobile.
 * Focus trap, Escape, Close, focus return.
 */
export default function GasTwinFullComparison() {
  const { panelOpen, panelPairId, closeFullComparison } = useGasTwin()
  const titleId = useId()
  const panelRef = useRef(null)
  const closeRef = useRef(null)
  const returnFocusRef = useRef(null)

  const pair = panelPairId != null ? getPairById(panelPairId) : null

  useEffect(() => {
    if (!panelOpen) return undefined
    returnFocusRef.current = document.activeElement
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeFullComparison()
        return
      }
      if (e.key !== 'Tab') return
      const nodes = getFocusable(panelRef.current)
      if (!nodes.length) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    // Focus close after paint
    requestAnimationFrame(() => closeRef.current?.focus())

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      const prev = returnFocusRef.current
      if (prev && typeof prev.focus === 'function') {
        try {
          prev.focus()
        } catch {
          /* ignore */
        }
      }
    }
  }, [panelOpen, closeFullComparison])

  if (!panelOpen || typeof document === 'undefined') return null

  const rows = buildComparisonRows(pair)
  const others = buildOtherCandidates(pair)
  const overall = buildOverallScores(pair)
  const disclosure = disclosureCopy()
  const hasInference = rows.some((r) => r.inference)

  return createPortal(
    <div
      className="gas-twin-sheet"
      data-gas-twin-panel="1"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="gas-twin-sheet-backdrop"
        aria-label={COPY.close}
        onClick={closeFullComparison}
      />
      <div className="gas-twin-sheet-panel" ref={panelRef}>
        <header className="gas-twin-sheet-head">
          <h2 id={titleId} className="gas-twin-sheet-title">
            {COPY.fullComparison}
          </h2>
          <button
            type="button"
            className="gas-twin-sheet-close"
            ref={closeRef}
            onClick={closeFullComparison}
          >
            {COPY.close}
          </button>
        </header>

        {!pair ? (
          <p className="gas-twin-sheet-missing">{COPY.gasTwinMissing}</p>
        ) : (
          <>
            <div className="gas-twin-sheet-cols" aria-hidden="false">
              <div>
                <p className="gas-twin-col-kicker">{COPY.suggestedEv}</p>
                <p className="gas-twin-col-name">{evDisplayName(pair)}</p>
              </div>
              <div>
                <p className="gas-twin-col-kicker">{COPY.gasTwin}</p>
                <p className="gas-twin-col-name">{gasTwinDisplayName(pair)}</p>
              </div>
            </div>

            <p className="gas-twin-sheet-why">{whyThisTwinText(pair)}</p>

            {others.length ? (
              <section className="gas-twin-others" aria-label={COPY.otherCandidates}>
                <h3 className="gas-twin-others-title">{COPY.otherCandidates}</h3>
                <ul className="gas-twin-others-list">
                  {others.map((c) => (
                    <li key={c.name}>
                      <span>{c.name}</span>
                      <span className="gas-twin-others-metric">
                        Closeness {c.rankMetric}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <div className="gas-twin-factor-table">
              {rows.map((row) => (
                <div className="gas-twin-factor-row" key={row.key} data-factor={row.key}>
                  <p className="gas-twin-factor-label">{row.label}</p>
                  <div className="gas-twin-factor-cells">
                    <div>
                      <p className="gas-twin-factor-value">{row.evValue}</p>
                      <p className="gas-twin-factor-score">{row.evScore}</p>
                    </div>
                    <div>
                      <p className="gas-twin-factor-value">{row.gasValue}</p>
                      <p className="gas-twin-factor-score">{row.gasScore}</p>
                      {row.key === 'tow' && row.gasSourceNote ? (
                        <p className="gas-twin-source-note">
                          {row.gasSourceNote}
                          {row.gasSourceUrl ? (
                            <>
                              {' '}
                              <a
                                href={row.gasSourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Source
                              </a>
                            </>
                          ) : null}
                        </p>
                      ) : null}
                      {row.key === 'msrp' && row.gasSourceUrl ? (
                        <p className="gas-twin-source-note">
                          <a
                            href={row.gasSourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Source
                          </a>
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="gas-twin-overall">
              <p className="gas-twin-factor-label">Overall score</p>
              <div className="gas-twin-factor-cells">
                <div>
                  <p className="gas-twin-factor-value">{overall.ev.display}</p>
                </div>
                <div>
                  <p className="gas-twin-factor-value">{overall.gas.display}</p>
                </div>
              </div>
            </div>

            <p className="gas-twin-score-caption">{COPY.scoreCaption}</p>
            {hasInference ? (
              <p className="gas-twin-inference-note">{COPY.inferenceFootnote}</p>
            ) : null}

            <details className="gas-twin-disclosure">
              <summary>{disclosure.title}</summary>
              <ul>
                {disclosure.formulas.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              {disclosure.notes.map((line) => (
                <p key={line} className="gas-twin-disclosure-note">
                  {line}
                </p>
              ))}
            </details>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
