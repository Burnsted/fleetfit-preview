import { Link, useLocation } from 'react-router-dom'
import { PATH_STEPS } from '../lib/pathSteps'
import PathBack, { isPathFirstStep } from './PathBack'

const AMBER = '#F5A623'

export { PATH_STEPS }

function PathIcon({ name }) {
  if (name === 'intake') {
    return (
      <svg className="home-path-icon" viewBox="0 0 48 48" aria-hidden="true">
        <rect x="12" y="8" width="24" height="32" rx="3" fill="none" stroke={AMBER} strokeWidth="2.4" />
        <path d="M18 16h12M18 23h12M18 30h8" fill="none" stroke={AMBER} strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    )
  }
  if (name === 'add') {
    return (
      <svg className="home-path-icon" viewBox="0 0 48 48" aria-hidden="true">
        <path d="M24 12 V36 M12 24 H36" fill="none" stroke={AMBER} strokeWidth="2.8" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg className="home-path-icon" viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="14" fill="none" stroke={AMBER} strokeWidth="2.4" />
      <path d="M24 16 V25 L30 28" fill="none" stroke={AMBER} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

/**
 * Oversized PATH tile strip — same mood/home pattern.
 * Active step follows the current route unless `active` is passed.
 * CLEARED ← Back sits upper-right of this band (hidden on Intake).
 */
export default function PathChrome({ active, className = '' }) {
  const { pathname } = useLocation()
  const current =
    active ||
    PATH_STEPS.find((step) => step.match(pathname))?.name ||
    null
  const showBack = !isPathFirstStep(pathname) && current !== 'intake'

  return (
    <section className={`path-chrome ${className}`.trim()} aria-label="Path">
      <div className="path-chrome-band">
        <p className="home-path-label">Path</p>
        {showBack ? <PathBack /> : null}
      </div>
      <ul className="home-path-icons path-chrome-icons">
        {PATH_STEPS.map((step) => {
          const isActive = current === step.name
          return (
            <li key={step.name}>
              <Link
                to={step.to}
                className={`home-path-card${isActive ? ' is-active' : ''}`}
                aria-current={isActive ? 'step' : undefined}
              >
                <PathIcon name={step.name} />
                <span>{step.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
