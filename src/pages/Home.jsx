import { Link } from 'react-router-dom'
import { TRADE_PACKAGE_IDS } from '../data/tradePackages'
import PathChrome from '../components/PathChrome'
import Wordmark from '../components/Wordmark'

import landscapingPhoto from '../assets/home-trades/fleetfit-wrap-card-landscaping.png'
import hvacPhoto from '../assets/home-trades/fleetfit-wrap-card-hvac.png'
import electricPhoto from '../assets/home-trades/fleetfit-wrap-card-electric.png'
import plumbingPhoto from '../assets/home-trades/plumbing-rivian-commercial-van.png'

/**
 * Home trade cards — photo + trade name only.
 * Electric card uses the Electrical package (pkg-trade-electrical).
 * Four Ted-approved generated plates (16:10); wrap names on vehicles are invented.
 */
const HOME_TRADE_CARDS = [
  {
    trade: 'Landscaping',
    packageId: TRADE_PACKAGE_IDS.landscaping,
    photo: landscapingPhoto,
    alt: 'Landscaping trade vehicle: white electric pickup with a green stripe wrap, towing a trailer with a riding mower',
  },
  {
    trade: 'HVAC',
    packageId: TRADE_PACKAGE_IDS.hvac,
    photo: hvacPhoto,
    alt: 'HVAC trade vehicle: angular silver electric pickup with a red-to-blue gradient wrap',
  },
  {
    trade: 'Electric',
    packageId: TRADE_PACKAGE_IDS.electrical,
    photo: electricPhoto,
    alt: 'Electric trade vehicle: dark carbon-fiber-look pickup with a yellow lightning logo stripe',
  },
  {
    trade: 'Plumbing',
    packageId: TRADE_PACKAGE_IDS.plumbing,
    photo: plumbingPhoto,
    alt: 'Plumbing trade vehicle',
  },
]

export default function Home() {
  return (
    <div className="locked-home is-mood is-trade-home">
      <header className="locked-hero trade-home-hero" aria-label="FleetFit">
        <nav className="locked-topnav" aria-label="Preview">
          <Link to="/" className="locked-topnav-brand" aria-label="FleetFit">
            <Wordmark size="nav" tone="light" decorative />
          </Link>
          <div className="locked-topnav-links">
            <Link to="/intake">Intake</Link>
            <Link to="/shop">Shop</Link>
          </div>
        </nav>
        <div className="locked-hero-inner trade-home-hero-inner">
          <h1 className="locked-hero-title">
            Used EV fleet packages that fit the work day.
          </h1>
          <p className="locked-hero-lead">
            Same job as your work truck: money, maintenance, and time.
          </p>
        </div>
      </header>

      <section
        id="trade-packages"
        className="locked-section home-trade-photo-section"
        aria-label="Trade packages"
      >
        <ul className="home-trade-photo-grid">
          {HOME_TRADE_CARDS.map((card) => (
            <li key={card.packageId}>
              <Link
                to={`/package/${card.packageId}`}
                state={{ intake: { trade: card.trade, stockMode: 'Used' } }}
                className="home-trade-photo-card"
                data-trade={card.trade}
              >
                <div className="home-trade-photo-frame">
                  <img
                    src={card.photo}
                    alt={card.alt}
                    className="home-trade-photo"
                    draggable={false}
                  />
                </div>
                <span className="home-trade-photo-caption">{card.trade}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="trade-home-cta">
          <Link to="/intake" className="btn btn-primary trade-home-match">
            Match my fleet
          </Link>
        </div>
      </section>

      <div className="locked-section home-dense trade-home-path">
        <PathChrome />
      </div>
    </div>
  )
}
