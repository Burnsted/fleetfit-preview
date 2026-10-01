import AddToFleetButton from './AddToFleetButton'
import OutboundListingLink, { OutboundListingLabel } from './OutboundListingLink'
import ListingPhoto from './ListingPhoto'
import { distanceFromHome } from '../data/listings'
import { fleetListingKey } from '../lib/fleetPick'
import { displayWorkSpec, NOT_PUBLISHED } from '../lib/workSpec'

/** Listing-card chrome · outbound seller · Ted 2026-09-26 */
const CARD_BUILD = 'listing-card-20260926-1905'

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
  if (band === 'At comps') return 'pill pill-value-at'
  if (band === 'Near comps') return 'pill pill-value-near'
  if (band === 'Above comps') return 'pill pill-value-above'
  return 'pill pill-incomplete'
}

export default function ListingCard({ listing }) {
  const price = formatPrice(listing)
  const miles = distanceFromHome(listing)
  const spec = displayWorkSpec(listing)
  const ymm = `${listing.year} ${listing.make} ${listing.model}${listing.trim ? ` ${listing.trim}` : ''}`
  const isVan = /van/i.test(String(listing.bodyType || listing.model || ''))

  return (
    <article className="listing-card" data-card-build={CARD_BUILD} data-listing-live={String(listing.listingLive === true)}>
      <OutboundListingLink
        vehicle={listing}
        className="card-media"
        ariaLabel={`View seller listing for ${ymm}`}
      >
        <div className="card-badges">
          <span className={valuePillClass(listing.workValue)}>{listing.workValue}</span>
          {listing.titleStatus && (
            <span className="pill" style={{ background: '#fff', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              {listing.titleStatus} title
            </span>
          )}
        </div>
        <ListingPhoto listing={listing} vehicle={listing} className="card-media-photo" />
      </OutboundListingLink>

      <div className="card-body">
        <h3 className="card-ymm">
          <OutboundListingLink
            vehicle={listing}
            className="card-ymm-link"
            ariaLabel={`View seller listing for ${ymm}`}
          >
            {ymm}
          </OutboundListingLink>
        </h3>
        <p className="card-condition">
          Used
          {listing.mileage != null ? ` · ${listing.mileage.toLocaleString()} mi` : ''}
        </p>

        <div className="card-chip-row">
          <span className="meta-chip ev-chip">
            Battery<span className="meta-chip-em">{spec.usableKwh?.known ? spec.usableKwh.text : NOT_PUBLISHED}</span>
          </span>
          <span className="meta-chip ev-chip">
            Range<span className="meta-chip-em">{spec.range?.known ? spec.range.text : NOT_PUBLISHED}</span>
          </span>
          <span className="meta-chip">
            Payload<span className="meta-chip-em">{spec.payload?.known ? spec.payload.text : NOT_PUBLISHED}</span>
          </span>
          <span className="meta-chip">
            Tow<span className="meta-chip-em">{spec.tow?.known ? spec.tow.text : NOT_PUBLISHED}</span>
          </span>
          <span className="meta-chip">
            {isVan ? 'Cargo' : 'Bed'}
            <span className="meta-chip-em">
              {isVan
                ? (spec.cargo?.known ? spec.cargo.text : NOT_PUBLISHED)
                : (spec.bed?.known ? spec.bed.text : NOT_PUBLISHED)}
            </span>
          </span>
        </div>

        <div className="card-price-block">
          <div className={`card-price ${price.unknown ? 'unknown' : ''}`}>{price.text}</div>
          <span className="card-price-note">asking · fee at checkout TBD</span>
        </div>

        <div className="card-actions">
          <AddToFleetButton pickId={fleetListingKey(listing.id)} />
          <OutboundListingLabel vehicle={listing} className="btn outbound-listing-btn" />
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
