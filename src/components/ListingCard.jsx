import { Link } from 'react-router-dom'
import AddToFleetButton from './AddToFleetButton'
import { distanceFromHome } from '../data/listings'
import { batteryConfidenceFromListing } from '../lib/battery'
import { fleetListingKey } from '../lib/fleetPick'
import ListingPhoto from './ListingPhoto'

function formatPrice(listing) {
  if (listing.allInPrice == null) {
    return { text: 'Ask unknown', unknown: true }
  }
  return {
    text: `$${listing.allInPrice.toLocaleString()}`,
    unknown: false,
  }
}

function valuePillClass(band) {
  if (band === 'Incomplete Data') return 'pill pill-incomplete'
  return `pill pill-value-${band}`
}

export default function ListingCard({ listing }) {
  const price = formatPrice(listing)
  const miles = distanceFromHome(listing)
  const battery = batteryConfidenceFromListing(listing)
  const sellerLabel = listing.sellerType.charAt(0).toUpperCase() + listing.sellerType.slice(1)

  return (
    <article className="listing-card">
      <Link to={`/listing/${listing.id}`} className="card-media" aria-label={`View ${listing.year} ${listing.make} ${listing.model}`}>
        <div className="card-badges">
          <span className={valuePillClass(listing.workValue)}>{listing.workValue}</span>
          {listing.titleStatus && (
            <span className="pill" style={{ background: '#fff', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              {listing.titleStatus} title
            </span>
          )}
        </div>
        <ListingPhoto listing={listing} vehicle={listing} className="card-media-photo" />
      </Link>

      <div className="card-body">
        <h3 className="card-ymm">
          {listing.year} {listing.make} {listing.model}
          {listing.trim ? ` ${listing.trim}` : ''}
        </h3>
        <p className="card-condition">
          Used · {sellerLabel} seller
          {listing.mileage != null ? ` · ${listing.mileage.toLocaleString()} mi` : ''}
        </p>

        <div className="card-chip-row">
          <span className="meta-chip ev-chip">
            {battery.label}
          </span>
          <span className="meta-chip ev-chip">
            Range<strong>{listing.ratedRange != null ? `${listing.ratedRange} mi` : '—'}</strong>
          </span>
          <span className="meta-chip">
            Payload<strong>{listing.payload != null ? `${listing.payload.toLocaleString()} lb` : '—'}</strong>
          </span>
          <span className="meta-chip">
            Seller<strong>{sellerLabel}</strong>
          </span>
        </div>

        <div className="card-price-block">
          <div className={`card-price ${price.unknown ? 'unknown' : ''}`}>{price.text}</div>
          <span className="card-price-note">asking · fee at checkout TBD</span>
        </div>

        {listing.upfitTags.length > 0 && (
          <div className="card-upfits">
            {listing.upfitTags.slice(0, 4).map((t) => (
              <span key={t} className="tag">{t}</span>
            ))}
          </div>
        )}

        <div className="card-actions">
          <AddToFleetButton pickId={fleetListingKey(listing.id)} />
          <Link to={`/listing/${listing.id}`} className="btn">
            Show details
          </Link>
          <button
            type="button"
            className="btn btn-save"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); alert('Demo: Save is stubbed.') }}
            aria-label="Save listing"
          >
            <svg width="12" height="14" viewBox="0 0 16 20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
              <path d="M3 1.5h10a1 1 0 011 1v15.2l-6-3.4-6 3.4V2.5a1 1 0 011-1z" />
            </svg>
            Save
          </button>
        </div>

        <p className="card-footer-meta">
          {listing.sellerName}
          <span className="sep">·</span>
          <span className="muted">
            {listing.location.city}, {listing.location.state}
            {miles != null ? ` · ${miles} mi away` : ''}
          </span>
        </p>
      </div>
    </article>
  )
}
