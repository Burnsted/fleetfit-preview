import { useMemo, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getModelBySlug } from '../data/models'
import ListingCard from '../components/ListingCard'
import Wordmark from '../components/Wordmark'

function formatFrom(price) {
  if (price == null) return null
  return `From $${price.toLocaleString()}`
}

function StatBlock({ value, unit, caption, incomplete }) {
  if (incomplete) {
    return (
      <div className="model-stat incomplete">
        <div className="model-stat-num">—</div>
        <div className="model-stat-cap">Incomplete Data · {caption}</div>
      </div>
    )
  }
  if (value == null) return null
  return (
    <div className="model-stat">
      <div className="model-stat-num">
        {typeof value === 'number' ? value.toLocaleString() : value}
        {unit ? <span className="model-stat-unit">{unit}</span> : null}
      </div>
      <div className="model-stat-cap">{caption}</div>
    </div>
  )
}

export default function Model() {
  const { slug } = useParams()
  const model = useMemo(() => getModelBySlug(slug), [slug])
  const inventoryRef = useRef(null)

  if (!model) {
    return (
      <div className="model-page light">
        <div className="model-inner">
          <p>Model not found.</p>
          <Link to="/">Back home</Link>
        </div>
      </div>
    )
  }

  const s = model.stats
  const from = formatFrom(model.fromPrice)

  function scrollToInventory() {
    inventoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="model-page">
      <header className="overlay-header on-light-later">
        <Link to="/" className="overlay-icon-btn" aria-label="Back home">
          <span className="burger light" aria-hidden="true"><span /><span /><span /></span>
        </Link>
        <Link to="/" className="overlay-wordmark" aria-label="FleetFit">
          <Wordmark size="nav" tone="dark" decorative />
        </Link>
        <button type="button" className="overlay-icon-btn" aria-label="Account (stub)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5 19c0-3.5 3-6 7-6s7 2.5 7 6" />
          </svg>
        </button>
      </header>

      <section className="model-hero">
        <div className="model-hero-img ken-burns-slow" style={{ backgroundImage: `url(${model.heroImage})` }} />
        <div className="model-hero-grad" aria-hidden="true" />
        <h1 className="model-hero-script">{model.model}</h1>
      </section>

      <div className="model-body">
        <div className="model-crumbs">
          <span className="crumb-pill">{model.bodyType}</span>
          <span className="crumb-pill is-active">{model.model}</span>
        </div>

        <h2 className="model-title">{model.fullName}</h2>
        <span className="pill-gray">{model.tag}</span>

        {from && (
          <p className="model-from-price">
            {from}
            <span className="model-from-star">*</span>
          </p>
        )}
        {/* Monthly estimate omitted — no transparent lease computation in seed data. */}

        <div className="model-cta-stack">
          <button type="button" className="btn-model-primary" onClick={scrollToInventory}>
            See trucks for sale ({model.count})
          </button>
          <button type="button" className="btn-model-secondary" onClick={() => alert('Demo: PPI booking stubbed.')}>
            Book a pre-purchase inspection
          </button>
          <a className="btn-model-secondary" href="#range-battery">
            Range &amp; battery details
          </a>
          <button type="button" className="btn-model-secondary" onClick={() => alert('Demo: Ask a question stubbed.')}>
            Ask a question
          </button>
        </div>

        <p className="model-price-note">
          *Lowest all-in price among demo listings for this model. Fees vary; not real inventory.
        </p>

        <section id="range-battery" className="model-stats" aria-label="Key figures">
          <StatBlock
            value={s.rangeMi.value}
            unit=" mi"
            caption={s.rangeMi.caption}
            incomplete={s.rangeMi.value == null}
          />
          <StatBlock
            value={s.payloadLb.value}
            unit=" lb"
            caption={s.payloadLb.caption}
            incomplete={s.payloadLb.value == null}
          />
          <StatBlock
            value={s.sohPct.value}
            unit="%"
            caption={
              s.sohPct.best != null
                ? `${s.sohPct.caption} (best ${s.sohPct.best}%)`
                : s.sohPct.caption
            }
            incomplete={s.sohPct.value == null}
          />
          <StatBlock
            value={s.gvwrLb.value}
            unit=" lb"
            caption={s.gvwrLb.caption}
            incomplete={s.gvwrLb.value == null}
          />
          {s.dcFastKw.value != null && (
            <StatBlock value={s.dcFastKw.value} unit=" kW" caption={s.dcFastKw.caption} />
          )}
          {s.onboardKw.value != null && (
            <StatBlock value={s.onboardKw.value} unit=" kW" caption={s.onboardKw.caption} />
          )}
          <p className="model-stats-footnote">
            Figures use only values already on demo listings (range, payload, battery health, GVWR, charge rates).
            Tow ratings are omitted — not present in seed data. Measuring notes: rated range is seller sticker/displayed class; battery health methods vary by listing.
          </p>
        </section>

        <section className="model-lifestyle">
          <div className="model-lifestyle-img" style={{ backgroundImage: `url(${model.lifestyleImage})` }} />
          <div className="model-lifestyle-copy">
            <h3>Built for the work week.</h3>
            <p>{model.blurb}</p>
          </div>
        </section>

        <section className="model-inventory" ref={inventoryRef} aria-label={`${model.fullName} inventory`}>
          <h3 className="model-inventory-title">{model.count} truck{model.count === 1 ? '' : 's'} for sale</h3>
          <div className="listing-grid">
            {model.listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
          <p className="model-inventory-foot">
            <Link to="/shop">Shop all trucks</Link> · Each listing keeps modules 1–11 and all EV/work fields.
          </p>
        </section>
      </div>
    </div>
  )
}
