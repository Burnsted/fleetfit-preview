import { Link } from 'react-router-dom'
import AddToFleetButton from './AddToFleetButton'
import UnitPhoto from './UnitPhoto'
import { batteryConfidenceFromUnit } from '../lib/battery'
import { NOT_PUBLISHED } from '../lib/workSpec'

function faceChip(label, known = true) {
  return (
    <span className={`spec-chip ${known ? 'is-known' : 'is-dash'}`}>
      {label}
    </span>
  )
}

export default function StackCard({
  kicker,
  heading,
  unit,
  packageId,
  pickId,
  spec,
  role,
  mileage,
  current = false,
  bodyType,
  showCompare = true,
  score = null,
  rank = null,
  bodyClass = null,
}) {
  const battery = unit ? batteryConfidenceFromUnit(unit) : null
  const body = bodyType || unit?.bodyType
  const bodyLabel = body === 'van' ? 'Van' : body === 'truck' ? 'Pickup' : null
  const openTo = !current && packageId && unit?.id
    ? `/package/${packageId}/unit/${unit.id}`
    : null
  const mixClass = bodyClass || (body === 'van' ? 'van' : body === 'truck' ? 'truck' : null)

  return (
    <article
      className={`stack-card ${current ? 'is-current' : 'is-candidate'} is-dense${score?.sidegrade ? ' is-sidegrade' : ''}`}
      data-sidegrade={score?.sidegrade ? 'true' : undefined}
      data-body-class={mixClass || undefined}
      data-model-year={unit?.year != null ? String(unit.year) : undefined}
    >
      <UnitPhoto
        unit={unit}
        packageId={packageId}
        size="stack"
        showAsk={!current}
        showCompare={showCompare && !current}
        current={current}
        bodyType={body}
        kbb={spec?.kbbTradeIn}
        headline={spec?.payload?.known ? `Payload ${spec.payload.text}` : null}
        score={!current ? score : null}
        rank={!current ? rank : null}
      />
      <div className="stack-card-body">
        {kicker ? <p className="stack-card-kicker">{kicker}</p> : null}
        <h3 className="stack-card-heading">{heading}</h3>
        <p className="stack-card-stats">
          {mileage != null ? <span>{Number(mileage).toLocaleString()} mi</span> : null}
          {bodyLabel ? (
            <span className="stack-card-body-tag"> · {bodyLabel}</span>
          ) : null}
        </p>
        {!current && score?.sidegrade ? (
          <p className="stack-card-side-quiet">Similar miles</p>
        ) : null}
        <div className="stack-card-chips" aria-label="Unit chips">
          {role ? faceChip(role) : null}
          {bodyLabel ? faceChip(bodyLabel) : null}
          {faceChip(
            `Payload ${spec?.payload?.known ? spec.payload.text : NOT_PUBLISHED}`,
            !!spec?.payload?.known,
          )}
          {faceChip(
            `Bed ${spec?.bed?.known ? spec.bed.text : NOT_PUBLISHED}`,
            !!spec?.bed?.known,
          )}
          {faceChip(
            `Cab ${spec?.cab?.known ? spec.cab.text : NOT_PUBLISHED}`,
            !!spec?.cab?.known,
          )}
          {faceChip(
            `Tow ${spec?.tow?.known ? spec.tow.text : NOT_PUBLISHED}`,
            !!spec?.tow?.known,
          )}
          {battery
            ? faceChip(
                battery.known ? battery.label : `Battery ${NOT_PUBLISHED}`,
                battery.known,
              )
            : null}
        </div>
        {current || !pickId ? null : (
          <AddToFleetButton pickId={pickId} size="btn-block" />
        )}
        {openTo ? (
          <Link to={openTo} className="stack-card-open-quiet">
            Open
          </Link>
        ) : null}
      </div>
    </article>
  )
}
