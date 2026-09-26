import CompareControl from './CompareControl'
import ListingPhoto, { PhotoPending } from './ListingPhoto'
import ScoreDialControl from './ScoreDialControl'
import { currentWorkPhoto, listingPhotoRecord, PHOTO_BUILD } from '../lib/vehiclePhoto'
import { formatAsk } from '../lib/workSpec'
import { unitWhisper } from '../lib/compareSet'

export default function UnitPhoto({
  unit,
  packageId,
  size = 'hero',
  showAsk = false,
  showCompare = true,
  whisper = false,
  current = false,
  bodyType,
  kbb,
  headline,
  score = null,
  rank = null,
}) {
  const body = current
    ? (bodyType || 'truck')
    : unit?.bodyType === 'van'
      ? 'van'
      : 'truck'
  const thumbLabel = current
    ? 'YOUR TRUCK'
    : body === 'van'
      ? 'EV VAN'
      : 'EV TRUCK'
  const ask = showAsk && !current ? formatAsk(unit?.askPrice) : null
  const showDial = !current && score
  const showPriceBand = Boolean(ask?.known || showDial)
  const showKbb = current && kbb?.known
  const heading =
    unit?.year && unit?.model
      ? `${unit.year} ${unit.model}`
      : unit?.model || null

  const considered = !current ? listingPhotoRecord(unit) : null

  return (
    <div
      className={`unit-photo is-${size} is-${body} ${considered?.src || current ? 'has-photo' : 'is-pending'} ${current ? 'is-current' : ''}${showPriceBand ? ' has-price-band' : ''}`}
      data-photo-build={PHOTO_BUILD}
      data-photo-kind={current ? 'current-stock' : considered?.src ? 'listing' : 'stub'}
    >
      {current ? (
        <img
          src={currentWorkPhoto({ bodyType: body })}
          alt=""
          className="unit-photo-img"
        />
      ) : considered?.src ? (
        <ListingPhoto vehicle={unit} className="unit-photo-img" />
      ) : (
        <PhotoPending className="unit-photo-img" />
      )}
      {current ? <span className="unit-photo-stock">Stock · not a listing</span> : null}
      <span className="unit-photo-glyph sr-only">{thumbLabel}</span>
      {whisper && unit ? (
        <span className="unit-photo-whisper">{unitWhisper(unit)}</span>
      ) : null}
      {headline ? <span className="unit-photo-headline">{headline}</span> : null}

      {showPriceBand ? (
        <div className="unit-photo-price-band" data-score-chrome="dial">
          {ask?.known ? (
            <span className="unit-photo-ask">{ask.text}</span>
          ) : (
            <span className="unit-photo-ask is-empty" aria-hidden="true" />
          )}
          {showDial ? (
            <ScoreDialControl
              score={score}
              rank={rank}
              size={size === 'hero' ? 'hero' : 'card'}
              heading={heading}
            />
          ) : null}
        </div>
      ) : null}

      {showKbb ? (
        <span className="unit-photo-kbb">KBB trade-in ~{kbb.text}</span>
      ) : null}
      {showCompare && packageId && unit && !current ? (
        <CompareControl packageId={packageId} unitId={unit.id} />
      ) : null}
    </div>
  )
}
