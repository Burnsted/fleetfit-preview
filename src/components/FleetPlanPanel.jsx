import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useFleetPick } from '../lib/fleetPick'
import { formatMoney } from '../lib/fit'
import { measureConsentClearance } from '../lib/consentClearance'

function unitsLabel(n) {
  const count = Number(n) || 0
  return count === 1 ? '1 unit' : `${count} units`
}

const CONSENT_CSS_VAR = '--consent-clearance'

function applyConsentClearance() {
  const { clearance } = measureConsentClearance(document)
  document.documentElement.style.setProperty(CONSENT_CSS_VAR, `${clearance}px`)
  return clearance
}

/**
 * Session-only fleet plan slide-out. Opens on every add.
 * At 390: full-height, own scroll. Foot and reopen lift above a consent bar
 * via --consent-clearance (same bottom-spacer idea as card safe padding).
 */
export default function FleetPlanPanel() {
  const fleet = useFleetPick()
  const open = fleet.planOpen && fleet.planItems.length > 0
  const showReopen = !fleet.planOpen && fleet.planItems.length > 0

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') fleet.closePlan()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, fleet])

  // Watch consent bar presence / size; clear when dismissed.
  useEffect(() => {
    applyConsentClearance()
    const root = document.documentElement
    const mo = new MutationObserver(() => applyConsentClearance())
    mo.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'hidden', 'aria-hidden'],
    })
    const onResize = () => applyConsentClearance()
    window.addEventListener('resize', onResize)
    const interval = window.setInterval(applyConsentClearance, 500)
    return () => {
      mo.disconnect()
      window.removeEventListener('resize', onResize)
      window.clearInterval(interval)
      root.style.setProperty(CONSENT_CSS_VAR, '0px')
    }
  }, [])

  const panel =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="fleet-plan-sheet"
            data-fleet-plan="1"
            role="dialog"
            aria-modal="true"
            aria-label="Fleet plan"
          >
            <button
              type="button"
              className="fleet-plan-backdrop"
              aria-label="Close fleet plan"
              onClick={() => fleet.closePlan()}
            />
            <aside className="fleet-plan-panel" data-fleet-plan-panel="1">
              <header className="fleet-plan-head">
                <div>
                  <p className="fleet-plan-kicker">Fleet plan</p>
                  <p className="fleet-plan-sub">
                    {unitsLabel(fleet.planUnits)} · session only
                  </p>
                </div>
                <button
                  type="button"
                  className="fleet-plan-close"
                  aria-label="Close fleet plan"
                  onClick={() => fleet.closePlan()}
                >
                  Close
                </button>
              </header>

              <ul className="fleet-plan-list">
                {fleet.planItems.map((item) => {
                  const price =
                    item.examplePrice != null && Number.isFinite(item.examplePrice)
                      ? formatMoney(item.examplePrice)
                      : 'Price TBD'
                  return (
                    <li key={item.id} className="fleet-plan-item" data-plan-id={item.id}>
                      <div className="fleet-plan-item-main">
                        <p className="fleet-plan-item-label">{item.label}</p>
                        <p className="fleet-plan-item-meta">
                          {unitsLabel(item.units)} · {price}
                          <span className="fleet-plan-example"> example</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        className="fleet-plan-item-remove"
                        aria-label={`Remove ${item.label} from fleet plan`}
                        onClick={() => fleet.removePlanItem(item.id)}
                      >
                        Remove
                      </button>
                    </li>
                  )
                })}
              </ul>

              <footer className="fleet-plan-foot" data-fleet-plan-foot="1">
                <div className="fleet-plan-total-row">
                  <span className="fleet-plan-total-label">Running total</span>
                  <span className="fleet-plan-total-value">
                    {fleet.planTotal != null ? formatMoney(fleet.planTotal) : 'TBD'}
                    <span className="fleet-plan-example"> example</span>
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-block fleet-plan-keep"
                  onClick={() => fleet.closePlan()}
                >
                  Keep adding
                </button>
              </footer>
            </aside>
          </div>,
          document.body,
        )
      : null

  const reopen =
    showReopen && typeof document !== 'undefined'
      ? createPortal(
          <button
            type="button"
            className="fleet-plan-reopen"
            data-fleet-plan-reopen="1"
            aria-label={`Open fleet plan, ${fleet.planCount} ${fleet.planCount === 1 ? 'item' : 'items'}`}
            onClick={() => fleet.openPlan()}
          >
            <svg className="fleet-plan-reopen-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 7h16M4 12h16M4 17h10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span className="fleet-plan-reopen-count">{fleet.planCount}</span>
          </button>,
          document.body,
        )
      : null

  return (
    <>
      {panel}
      {reopen}
    </>
  )
}
