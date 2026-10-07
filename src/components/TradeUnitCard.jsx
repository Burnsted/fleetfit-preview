import OutboundListingLink, { OutboundListingLabel } from './OutboundListingLink'
import UnitPhoto from './UnitPhoto'
import ScoreDialControl from './ScoreDialControl'
import { TRADE_PACKAGE_COPY } from '../data/tradeNeeds'
import { formatMoney } from '../lib/fit'
import { NOT_PUBLISHED } from '../lib/workSpec'
import { SELLER_LISTING_UNAVAILABLE } from '../lib/outboundListing'

/**
 * REV2 trade-package unit card: photo, rank, YMM, spec line, price,
 * score badge, remove X (44×44), listing link or dead state.
 */
export default function TradeUnitCard({
  unit,
  score,
  rank,
  spec,
  onRemove,
  newlyAdded = false,
  dead = false,
  noReplacement = false,
  onUndoReplace = null,
}) {
  const ymm = `${unit.year} ${unit.make} ${unit.model}`
  const cab = spec?.cab?.known ? spec.cab.text : null
  const bed = spec?.bed?.known ? spec.bed.text : null
  const cargo = spec?.cargo?.known ? spec.cargo.text : null
  const bodyBits = [cab, bed || cargo].filter(Boolean)
  const specLine =
    bodyBits.length > 0
      ? `${bodyBits.join(' · ')} · example unit`
      : `${NOT_PUBLISHED} · example unit`

  const ask = Number(unit.askPrice)
  const priceText = Number.isFinite(ask) && ask > 0 ? formatMoney(ask) : NOT_PUBLISHED

  return (
    <article
      className="trade-unit-card"
      data-unit-id={unit.id}
      data-rank={rank}
      data-newly-added={newlyAdded ? 'true' : undefined}
      data-listing-live={String(unit.listingLive === true)}
    >
      <div className="trade-unit-card-media">
        <UnitPhoto
          unit={unit}
          size="stack"
          showAsk={false}
          showCompare={false}
          outboundPhoto
        />
        {rank != null ? (
          <span className="trade-unit-rank" aria-label={`Rank ${rank}`}>
            #{rank}
          </span>
        ) : null}
      </div>

      <div className="trade-unit-card-body">
        <div className="trade-unit-card-main">
          <h3 className="trade-unit-heading">
            <OutboundListingLink vehicle={unit}>{ymm}</OutboundListingLink>
          </h3>
          <p className="trade-unit-spec">{specLine}</p>
          <p className="trade-unit-price">
            <span className="trade-unit-ask">{priceText}</span>
            <span className="trade-unit-ask-note"> example price</span>
          </p>
          {newlyAdded ? (
            <p className="trade-unit-note is-added">{TRADE_PACKAGE_COPY.nextRankedAdded}</p>
          ) : null}
          {dead || unit.listingLive !== true ? (
            <p className="trade-unit-listing is-dead">
              <span aria-hidden="true">⊘ </span>
              {SELLER_LISTING_UNAVAILABLE}
            </p>
          ) : (
            <p className="trade-unit-listing">
              <OutboundListingLabel vehicle={unit} />
            </p>
          )}
          {noReplacement ? (
            <p className="trade-unit-note">{TRADE_PACKAGE_COPY.noOtherListing}</p>
          ) : null}
          {onUndoReplace ? (
            <button type="button" className="trade-undo-link" onClick={onUndoReplace}>
              Undo replace
            </button>
          ) : null}
          {onRemove ? (
            <button
              type="button"
              className="trade-unit-remove-below"
              aria-label={TRADE_PACKAGE_COPY.removeAria}
              onClick={() => onRemove(unit.id)}
            >
              Remove
            </button>
          ) : null}
        </div>
        <div className="trade-unit-score">
          <ScoreDialControl
            score={score}
            rank={rank}
            size="card"
            heading={ymm}
            unit={unit}
            className="is-on-light"
          />
        </div>
      </div>
    </article>
  )
}
