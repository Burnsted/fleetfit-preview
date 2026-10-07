import { Link, useLocation, useParams } from 'react-router-dom'
import AddToFleetButton from '../components/AddToFleetButton'
import CrumbDivider from '../components/CrumbDivider'
import ReplacementScore from '../components/ReplacementScore'
import UnitPhoto from '../components/UnitPhoto'
import WorkCompare from '../components/WorkCompare'
import { getPackage, getUnit } from '../data/package'
import { fleetUnitKey } from '../lib/fleetPick'
import { formatMoney } from '../lib/fit'
import {
  currentMilesForScore,
  scoreReplacementUnit,
} from '../lib/replacementScore'
import { displayAnnualSavings } from '../lib/savings'
import { currentWorkVehicle, displayWorkSpec, NOT_PUBLISHED } from '../lib/workSpec'

/** CLEARED density remnant · PackageUnit only · 2026-09-26 */
const DENSITY_BUILD = 'package-unit-density-20260926-0923'

function chip(text, known = true) {
  return (
    <span className={`spec-chip ${known ? 'is-known' : 'is-dash'}`}>
      {text}
    </span>
  )
}

export default function PackageUnit() {
  const { packageId, unitId } = useParams()
  const location = useLocation()
  const pkg = getPackage(packageId)
  const unit = getUnit(packageId, unitId)
  const intake = location.state?.intake

  if (!pkg || !unit) {
    return (
      <div className="locked-page">
        <p>Unit not found.</p>
        <Link to="/intake">Back to intake</Link>
      </div>
    )
  }

  const spec = displayWorkSpec(unit)
  const savings = displayAnnualSavings(unit)
  const bodyLabel = unit.bodyType === 'van' ? 'Van' : unit.bodyType === 'truck' ? 'Pickup' : null
  const isVan = unit.bodyType === 'van'
  const current = currentWorkVehicle(intake, pkg)
  const score = scoreReplacementUnit(unit, {
    currentMiles: currentMilesForScore(intake, pkg),
    intake,
    pkg,
  })
  const candidate = {
    id: unit.id,
    unit,
    pickId: fleetUnitKey(pkg.id, unit.id),
    kicker: 'Candidate EV',
    heading: `${unit.year} ${unit.model}`,
    role: unit.role,
    spec,
    mileage: unit.mileage,
    score,
  }

  return (
    <div className="locked-page locked-unit-page is-dense" data-density-build={DENSITY_BUILD}>
      <nav className="locked-crumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <CrumbDivider />
        <Link to="/intake">Fleet intake</Link>
        <CrumbDivider />
        <Link to={`/package/${pkg.id}`} state={location.state}>Package</Link>
        <CrumbDivider />
        <span>{unit.year} {unit.model}</span>
      </nav>

      <UnitPhoto
        unit={unit}
        packageId={pkg.id}
        size="hero"
        showAsk
        score={score}
      />

      <header className="locked-page-header unit-dense-header">
        <p className="locked-eyebrow">{unit.role} · DEMO</p>
        <h1>
          {unit.year} {unit.make} {unit.model}
          {unit.trim ? ` ${unit.trim}` : ''}
        </h1>
        <p className="unit-dense-meta">
          {unit.mileage != null ? `${Number(unit.mileage).toLocaleString()} mi` : NOT_PUBLISHED}
          {unit.location?.city ? ` · ${unit.location.city}, ${unit.location.state}` : ''}
        </p>
        <div className="spec-chips unit-dense-chips" aria-label="Unit facts">
          {unit.role ? chip(unit.role) : null}
          {bodyLabel ? chip(bodyLabel) : null}
          {chip(
            `Payload ${spec.payload?.known ? spec.payload.text : NOT_PUBLISHED}`,
            !!spec.payload?.known,
          )}
          {chip(
            isVan
              ? `Cargo ${spec.cargo?.known ? spec.cargo.text : NOT_PUBLISHED}`
              : `Bed ${spec.bed?.known ? spec.bed.text : NOT_PUBLISHED}`,
            isVan ? !!spec.cargo?.known : !!spec.bed?.known,
          )}
          {chip(
            `Cab ${spec.cab?.known ? spec.cab.text : NOT_PUBLISHED}`,
            !!spec.cab?.known,
          )}
          {chip(
            `Tow ${spec.tow?.known ? spec.tow.text : NOT_PUBLISHED}`,
            !!spec.tow?.known,
          )}
          {chip(
            `Battery ${spec.usableKwh?.known ? spec.usableKwh.text : NOT_PUBLISHED}`,
            !!spec.usableKwh?.known,
          )}
          {chip('Recalls Not published', false)}
          {chip('Charging Not published', false)}
          {savings.known ? chip(`Savings ${savings.text}`, true) : null}
        </div>
      </header>

      <div className="unit-ask-bar unit-dense-ask">
        <div>
          <div className="stat-label">Listing ask</div>
          <div className="unit-ask-price">{formatMoney(unit.askPrice)}</div>
        </div>
        <div className="unit-ask-actions">
          <AddToFleetButton pickId={fleetUnitKey(pkg.id, unit.id)} />
          <Link
            to={`/package/${pkg.id}`}
            state={location.state}
            className="unit-open-quiet"
          >
            Open package
          </Link>
        </div>
      </div>

      <ReplacementScore score={score} />

      <WorkCompare
        current={current}
        candidates={[candidate]}
        packageId={pkg.id}
        title="Current vs this unit"
      />

      <p className="package-fee-quiet">Fee at checkout. Amount TBD</p>
      <p className="locked-foot-note">
        FleetFit has not seen these trucks · we do not hold vehicle funds
      </p>
    </div>
  )
}
