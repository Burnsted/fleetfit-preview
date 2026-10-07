import { displayWorkSpec, NOT_PUBLISHED } from '../lib/workSpec'

/**
 * Quiet OEM Specs block for dial-tap readout (and other dense surfaces).
 * Null → plain "Not published". Never em dash.
 */
export default function UnitSpecsBlock({ unit, className = '' }) {
  if (!unit) return null
  const spec = displayWorkSpec(unit)
  const isVan = unit.bodyType === 'van'
  const bedCargo = isVan
    ? { label: 'Cargo', field: spec.cargo }
    : { label: 'Bed', field: spec.bed }

  const rows = [
    { label: 'Range (EPA)', field: spec.range },
    { label: 'Battery', field: spec.usableKwh },
    { label: 'Payload', field: spec.payload },
    { label: 'Towing', field: spec.tow },
    { label: bedCargo.label, field: bedCargo.field },
    { label: 'GVWR', field: spec.gvwr },
    { label: 'Curb', field: spec.curb },
    { label: 'Cab', field: spec.cab },
    { label: 'Drivetrain', field: spec.drivetrain },
    { label: 'AC charge', field: spec.onboardAcKw },
    { label: 'DC fast', field: spec.dcFastMaxKw },
  ]

  return (
    <div className={`unit-specs-block ${className}`.trim()} aria-label="OEM specs">
      <p className="unit-specs-block-title">Specs</p>
      <dl className="unit-specs-block-list">
        {rows.map((row) => (
          <div key={row.label} className="unit-specs-block-row">
            <dt>{row.label}</dt>
            <dd className={row.field?.known ? 'is-known' : 'is-dash'}>
              {row.field?.known ? row.field.text : NOT_PUBLISHED}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
