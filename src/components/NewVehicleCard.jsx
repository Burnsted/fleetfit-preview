/**
 * New OEM catalog card — CSV figures only. No seller link, mileage, used price, dial, or score.
 * Photo chip uses the same fleet-pick toggle as used listings (no duplicate ids).
 */
import PhotoAddChip from './PhotoAddChip'
import { fleetCatalogKey, useFleetPick } from '../lib/fleetPick'

export default function NewVehicleCard({ card }) {
  const fleet = useFleetPick()
  if (!card) return null

  const pickId = fleetCatalogKey(card.id)
  const inFleet = fleet.has(pickId)

  return (
    <article
      className="new-vehicle-card"
      data-stock-mode="New"
      data-vehicle-id={card.id}
      data-listing-live="false"
      data-in-fleet={inFleet ? 'true' : 'false'}
    >
      <div className="new-vehicle-media">
        <span className="new-vehicle-tag">New</span>
        {card.photoPending || !card.photo ? (
          <div className="new-vehicle-photo-pending" role="img" aria-label={card.photoPendingLabel}>
            {card.photoPendingLabel}
          </div>
        ) : (
          <img
            className="new-vehicle-photo"
            src={card.photo}
            alt=""
            draggable={false}
          />
        )}
        <PhotoAddChip
          active={inFleet}
          onToggle={() => fleet.toggle(pickId)}
          corner="top-right"
        />
      </div>
      {card.photo && card.photoCredit ? (
        <p className="new-vehicle-photo-credit">{card.photoCredit}</p>
      ) : null}
      {card.photo && card.photoNote ? (
        <p className="new-vehicle-photo-note">{card.photoNote}</p>
      ) : null}
      <div className="new-vehicle-body">
        <h3 className="new-vehicle-title">{card.title}</h3>
        {card.trimLabel ? (
          <p className="new-vehicle-trim">{card.trimLabel}</p>
        ) : null}
        <p className="new-vehicle-specs">{card.specsLabel}</p>
        <p className="new-vehicle-price">{card.priceLabel}</p>
        {card.makerLink?.href ? (
          <a
            className="new-vehicle-link"
            href={card.makerLink.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {card.makerLink.text}
          </a>
        ) : null}
      </div>
    </article>
  )
}
