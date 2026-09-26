import { Link } from 'react-router-dom'
import { DEFAULT_PACKAGE_ID } from '../data/package'
import ListingPhoto from '../components/ListingPhoto'
import Wordmark from '../components/Wordmark'

const EXAMPLE = `/package/${DEFAULT_PACKAGE_ID}`
const AMBER = '#F5A623'

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

/* CLEARED PATH: Intake · Add to fleet · Budget (Package chip retired) */
const PATH = [
  { name: 'intake', label: 'Intake', to: '/intake' },
  { name: 'add', label: 'Add to fleet', to: EXAMPLE },
  { name: 'budget', label: 'Budget', to: '/budget' },
]

const EXAMPLES = [
  { kind: 'lightning', label: 'Lightning', to: '/model/ford-f-150-lightning' },
  { kind: 'cyber', label: 'Cybertruck', to: '/model/tesla-cybertruck' },
  { kind: 'r1t', label: 'R1T', to: '/model/rivian-r1t' },
]

export default function Home() {
  return (
    <div className="locked-home is-mood">
      <header className="locked-hero" aria-label="FleetFit">
        <nav className="locked-topnav" aria-label="Preview">
          <Link to="/" className="locked-topnav-brand" aria-label="FleetFit">
            <Wordmark size="nav" tone="light" decorative />
          </Link>
          <div className="locked-topnav-links">
            <Link to="/intake">Intake</Link>
            <Link to="/shop">Shop</Link>
            <span className="badge-demo">Demo</span>
          </div>
        </nav>
        <div className="locked-hero-inner">
          <h1 className="locked-hero-title">
            Used EV fleet packages that fit the work day.
          </h1>
          <p className="locked-hero-lead">
            Same job as your work truck — money, maintenance, and time.
          </p>
          <Link to={EXAMPLE} className="home-hero-plate" aria-label="Demo package">
            <ListingPhoto alias="hero" className="home-hero-plate-art" />
            <span className="home-hero-plate-chip">Demo package</span>
          </Link>
          <div className="locked-hero-actions">
            <Link to="/intake" className="btn btn-primary">
              Match my fleet
            </Link>
            <Link to={EXAMPLE} className="btn home-btn-quiet">
              View example package
            </Link>
          </div>
        </div>
      </header>

      <section className="locked-section home-dense" aria-label="Path">
        <p className="home-path-label">Path</p>
        <ul className="home-path-icons">
          {PATH.map((step) => (
            <li key={step.name}>
              <Link to={step.to} className="home-path-card">
                <PathIcon name={step.name} />
                <span>{step.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="locked-section home-ex" aria-label="Example packages">
        <p className="home-path-label">Example packages</p>
        <ul className="home-ex-strip">
          {EXAMPLES.map((ex) => (
            <li key={ex.kind}>
              <Link to={ex.to} className="home-ex-card">
                <ListingPhoto alias={`strip-${ex.kind}`} className="home-ex-art" />
                <span>{ex.label}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="home-ex-fact">Demo · composite · not shop inventory</p>
      </section>

      <p className="home-quiet">Demo · composite examples · not a real shop</p>
    </div>
  )
}
