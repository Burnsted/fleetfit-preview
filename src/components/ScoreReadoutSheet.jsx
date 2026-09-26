import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import ReplacementScore from './ReplacementScore'

export const SCORE_DIAL_TAP_BUILD = 'score-dial-tap-20260926-1551'

/**
 * CLEARED dial-tap surface — full Replacement Score readout for one unit.
 * Portaled sheet/panel; Escape / backdrop / Close dismiss.
 */
export default function ScoreReadoutSheet({
  open,
  onClose,
  score,
  rank = null,
  heading = null,
}) {
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

  if (!open || !score || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="score-readout-sheet"
      data-score-dial-tap={SCORE_DIAL_TAP_BUILD}
      role="dialog"
      aria-modal="true"
      aria-label="Replacement Score readout"
    >
      <button
        type="button"
        className="score-readout-backdrop"
        aria-label="Close score readout"
        onClick={onClose}
      />
      <div className="score-readout-panel">
        <header className="score-readout-panel-head">
          <div>
            <p className="score-readout-panel-kicker">Open score</p>
            {heading ? <p className="score-readout-panel-title">{heading}</p> : null}
          </div>
          <button
            type="button"
            className="score-readout-close"
            onClick={onClose}
            aria-label="Close"
          >
            Close
          </button>
        </header>
        <ReplacementScore
          score={score}
          rank={rank}
          full
          className="score-readout-body"
        />
      </div>
    </div>,
    document.body,
  )
}
