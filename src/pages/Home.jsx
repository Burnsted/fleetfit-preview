import { Link } from 'react-router-dom'
import { DEFAULT_PACKAGE_ID } from '../data/package'
import ListingPhoto from '../components/ListingPhoto'
import PathChrome from '../components/PathChrome'
import Wordmark from '../components/Wordmark'

const EXAMPLE = `/package/${DEFAULT_PACKAGE_ID}`

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
            <Link to="/" className="is-active">Home</Link>
            <Link to="/intake">Fleet intake</Link>
            <Link to="/shop">Shop</Link>
            <span className="badge-demo">Demo</span>
          </div>
        </nav>
        <div className="locked-hero-inner">
          <h1 className="locked-hero-title">
            Used EV fleet packages that fit the work day.
          </h1>
          <p className="locked-hero-lead">
            Same job as your work truck. Money, maintenance, and time.
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

      <div className="locked-section home-dense">
        <PathChrome />
      </div>

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
