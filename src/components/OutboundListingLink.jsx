import {
  OUTBOUND_LISTING_BUILD,
  resolveOutboundListing,
  SELLER_LISTING_UNAVAILABLE,
} from '../lib/outboundListing'

/** Text / photo / title → seller site. Dead → plain unavailable text. */
export default function OutboundListingLink({
  vehicle,
  children,
  className = '',
  ariaLabel = null,
  fallbackClassName = '',
}) {
  const out = resolveOutboundListing(vehicle)
  if (!out.live || !out.href) {
    if (children == null) {
      return (
        <span
          className={`outbound-listing-unavailable ${fallbackClassName}`.trim()}
          data-outbound-listing={OUTBOUND_LISTING_BUILD}
          data-outbound-live="false"
        >
          {SELLER_LISTING_UNAVAILABLE}
        </span>
      )
    }
    return (
      <span
        className={`outbound-listing-shell is-unavailable ${className}`.trim()}
        data-outbound-listing={OUTBOUND_LISTING_BUILD}
        data-outbound-live="false"
      >
        {children}
      </span>
    )
  }

  return (
    <a
      href={out.href}
      target="_blank"
      rel="noopener noreferrer"
      className={`outbound-listing-link ${className}`.trim()}
      aria-label={ariaLabel || out.label}
      data-outbound-listing={OUTBOUND_LISTING_BUILD}
      data-outbound-live="true"
      data-outbound-site={out.site || undefined}
    >
      {children != null ? children : out.label}
    </a>
  )
}

export function OutboundListingLabel({ vehicle, className = '' }) {
  const out = resolveOutboundListing(vehicle)
  if (!out.live || !out.href) {
    return (
      <span
        className={`outbound-listing-unavailable ${className}`.trim()}
        data-outbound-listing={OUTBOUND_LISTING_BUILD}
        data-outbound-live="false"
      >
        {SELLER_LISTING_UNAVAILABLE}
      </span>
    )
  }
  return (
    <a
      href={out.href}
      target="_blank"
      rel="noopener noreferrer"
      className={`outbound-listing-cta ${className}`.trim()}
      data-outbound-listing={OUTBOUND_LISTING_BUILD}
      data-outbound-live="true"
      data-outbound-site={out.site || undefined}
    >
      {out.label}
    </a>
  )
}
