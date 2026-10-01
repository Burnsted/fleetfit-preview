import { Link } from 'react-router-dom'
import {
  DEFAULT_PACKAGE_ID,
  getPackage,
  TRADE_PACKAGES,
} from '../data/package'
import { TRADE_PACKAGE_COPY } from '../data/tradeNeeds'
import { composeTradePackageSet } from '../lib/tradePackageSet'
import ListingPhoto from '../components/ListingPhoto'
import PathChrome from '../components/PathChrome'
import Wordmark from '../components/Wordmark'

const EXAMPLE = `/package/${DEFAULT_PACKAGE_ID}`

/** Existing model strip — do not add Cybertruck / Rivian van / R1T OEM options. */
const EXAMPLES = [
  { kind: 'lightning', label: 'Lightning', to: '/model/ford-f-150-lightning' },
]

function visibleTradeEntries() {
  return TRADE_PACKAGES.filter((def) => {
    if (!def.hideWhenEmpty) return true
    const pkg = getPackage(def.id)
    if (!pkg) return false
    const set = composeTradePackageSet(pkg, { pkg, intake: null }, 1)
    return set.eligibleCount >= 1
  })
}

export default function Home() {
  const trades = visibleTradeEntries()

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
          <Link to={EXAMPLE} className="home-hero-plate" aria-label="Trade packages">
            <ListingPhoto alias="hero" className="home-hero-plate-art" />
            <span className="home-hero-plate-chip">Trade packages</span>
          </Link>
          <div className="locked-hero-actions">
            <Link to="/intake" className="btn btn-primary">
              Match my fleet
            </Link>
            <a href="#trade-packages" className="btn home-btn-quiet">
              {TRADE_PACKAGE_COPY.entry}
            </a>
          </div>
        </div>
      </header>

      <div className="locked-section home-dense">
        <PathChrome />
      </div>

      <section
        id="trade-packages"
        className="locked-section home-trade-packages"
        aria-label={TRADE_PACKAGE_COPY.entry}
      >
        <p className="home-path-label">{TRADE_PACKAGE_COPY.entry}</p>
        <p className="home-trade-helper">{TRADE_PACKAGE_COPY.helper}</p>
        <ul className="home-trade-strip">
          {trades.map((t) => (
            <li key={t.id}>
              <Link to={`/package/${t.id}`} className="home-trade-card">
                <span className="home-trade-name">{t.trade}</span>
                <span className="home-trade-meta">Fleet size {t.sizeDefault}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="home-trade-own">
          <Link to="/intake">{TRADE_PACKAGE_COPY.buildYourOwn}</Link>
          <span className="home-trade-own-help">
            {' '}
            {TRADE_PACKAGE_COPY.buildYourOwnHelper}
          </span>
        </p>
      </section>

      {EXAMPLES.length > 0 ? (
        <section className="locked-section home-ex" aria-label="Model examples">
          <p className="home-path-label">Model examples</p>
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
      ) : null}

      <p className="home-quiet">Demo · composite examples · not a real shop</p>
    </div>
  )
}
