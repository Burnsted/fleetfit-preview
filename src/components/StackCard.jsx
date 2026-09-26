import { useState } from 'react'
import AddToFleetButton from './AddToFleetButton'
import UnitPhoto from './UnitPhoto'
import { batteryConfidenceFromUnit } from '../lib/battery'
import { DASH, EXPAND_SPEC_ROWS } from '../lib/workSpec'

function recallField(unit) {
  const status = String(unit?.recall?.status || '')
  if (!status || /unchecked|placeholder|not run|not reported/i.test(status)) {
    return { text: DASH, known: false }
  }
  return { text: status, known: true }
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
}) {
  const [open, setOpen] = useState(false)
  const battery = unit ? batteryConfidenceFromUnit(unit) : null
  const recall = unit ? recallField(unit) : null
  const range = spec?.energy?.known ? spec.energy.text : null
  const payloadChip = spec?.payload?.known ? `Payload ${spec.payload.text}` : null

  function toggle(event) {
    if (event.target.closest('button, a')) return
    setOpen((value) => !value)
  }

  return (
    <article
      className={`stack-card ${current ? 'is-current' : 'is-candidate'} ${open ? 'is-open' : ''}`}
      onClick={toggle}
    >
      <UnitPhoto
        unit={unit}
        packageId={packageId}
        size="stack"
        showAsk={!current}
        showCompare={showCompare && !current}
        current={current}
        bodyType={bodyType || unit?.bodyType}
        kbb={spec?.kbbTradeIn}
        headline={payloadChip}
      />
      <div className="stack-card-body">
        {kicker ? <p className="stack-card-kicker">{kicker}</p> : null}
        <h3 className="stack-card-heading">
          {heading}
          {role && !current ? <span className="stack-card-role"> · {role}</span> : null}
        </h3>
        <p className="stack-card-stats">
          {range ? <span>{range}</span> : null}
          {mileage != null ? <span>{Number(mileage).toLocaleString()} mi</span> : null}
        </p>
        {current && role ? (
          <div className="stack-card-chips">
            <span className="spec-chip is-known">{role}</span>
          </div>
        ) : null}
        {current || !pickId ? null : (
          <AddToFleetButton pickId={pickId} size="btn-block" />
        )}
        <button
          type="button"
          className="stack-card-details"
          aria-expanded={open}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            setOpen((value) => !value)
          }}
        >
          {open ? 'Hide details' : 'Details'}
          <span aria-hidden="true">{open ? ' ▲' : ' ▼'}</span>
        </button>
      </div>
      {open ? (
        <dl className="stack-card-expand work-spec-rows">
          {EXPAND_SPEC_ROWS.map((row) => {
            const field = spec?.[row.key] || { text: DASH, known: false }
            return (
              <div key={row.key} className="work-spec-row">
                <dt>{row.label}</dt>
                <dd>
                  <span className={field.known ? 'work-spec-value is-known' : 'work-spec-value is-dash'}>
                    {field.text}
                  </span>
                </dd>
              </div>
            )
          })}
          {battery ? (
            <div className="work-spec-row">
              <dt>Battery</dt>
              <dd>
                <span className={battery.known ? 'work-spec-value is-known' : 'work-spec-value is-dash'}>
                  {battery.known ? battery.label : DASH}
                </span>
              </dd>
            </div>
          ) : null}
          {recall ? (
            <div className="work-spec-row">
              <dt>Recalls</dt>
              <dd>
                <span className={recall.known ? 'work-spec-value is-known' : 'work-spec-value is-dash'}>
                  {recall.text}
                </span>
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </article>
  )
}
