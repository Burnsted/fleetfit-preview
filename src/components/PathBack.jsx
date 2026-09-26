import { useLocation, useNavigate } from 'react-router-dom'
import { DEFAULT_PACKAGE_ID } from '../data/package'
import { PATH_STEPS } from '../lib/pathSteps'

export const PATH_BACK_BUILD = 'path-back-20260926-1602'

/** Resolve PATH step name for a pathname. */
export function pathStepName(pathname) {
  return PATH_STEPS.find((s) => s.match(pathname))?.name || null
}

/** First PATH step = Intake — Back is hidden (not disabled). */
export function isPathFirstStep(pathname) {
  const step = pathStepName(pathname)
  return !step || step === 'intake'
}

/** Show Back on later PATH steps only (Add to fleet · Budget · package surfaces). */
export function shouldShowPathBack(pathname, active = null) {
  const step = active || pathStepName(pathname)
  return Boolean(step && step !== 'intake')
}

/** In-flow Back target — never orphan-exit the app. */
export function pathBackTarget(pathname, state) {
  if (isPathFirstStep(pathname)) return null

  const unitOrCompare = pathname.match(
    /^\/package\/([^/]+)\/(unit\/[^/]+|compare)\/?$/,
  )
  if (unitOrCompare) {
    return { to: `/package/${unitOrCompare[1]}`, state }
  }

  if (pathname.startsWith('/package') || pathname.startsWith('/checkout')) {
    return { to: '/intake', state }
  }

  if (pathname.startsWith('/budget')) {
    const pkgId = state?.packageId || DEFAULT_PACKAGE_ID
    return { to: `/package/${pkgId}`, state }
  }

  return null
}

/**
 * CLEARED PATH ← Back — upper right, quiet chrome, hide on Intake.
 * Label exactly: ← Back
 */
export default function PathBack({ className = '', active = null }) {
  const navigate = useNavigate()
  const location = useLocation()

  if (!shouldShowPathBack(location.pathname, active)) return null

  const target = pathBackTarget(location.pathname, location.state)
  if (!target) return null

  return (
    <button
      type="button"
      className={`path-back ${className}`.trim()}
      data-path-back={PATH_BACK_BUILD}
      aria-label="Back"
      onClick={() => navigate(target.to, { state: target.state })}
    >
      <span className="path-back-chevron" aria-hidden="true">
        ←
      </span>
      <span className="path-back-label">Back</span>
    </button>
  )
}
