import { useEffect, useRef } from 'react'
import { TRADE_PACKAGE_COPY } from '../data/tradeNeeds'

/**
 * Toast: "Removed from package." + Undo. ~6 s dismiss; persist while focused.
 */
export default function TradePackageToast({
  open,
  message = TRADE_PACKAGE_COPY.removedToast,
  onUndo,
  onDismiss,
  durationMs = 6000,
}) {
  const rootRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    function clear() {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
    function arm() {
      clear()
      timerRef.current = setTimeout(() => {
        const el = rootRef.current
        if (el && el.contains(document.activeElement)) {
          arm()
          return
        }
        onDismiss?.()
      }, durationMs)
    }
    arm()
    return clear
  }, [open, durationMs, onDismiss])

  if (!open) return null

  return (
    <div
      ref={rootRef}
      className="trade-toast"
      role="status"
      aria-live="polite"
      data-trade-toast="1"
    >
      <span className="trade-toast-msg">{message}</span>
      {onUndo ? (
        <button type="button" className="trade-toast-undo" onClick={onUndo}>
          {TRADE_PACKAGE_COPY.undo}
        </button>
      ) : null}
    </div>
  )
}
