import { Link, useLocation, useParams } from 'react-router-dom'
import AddToFleetButton from '../components/AddToFleetButton'
import SavingsLine from '../components/SavingsLine'
import UnitPhoto from '../components/UnitPhoto'
import WorkCompare from '../components/WorkCompare'
import WorkSpecRows from '../components/WorkSpecRows'
import { getPackage, getUnit } from '../data/package'
import { batteryConfidenceFromUnit } from '../lib/battery'
import { fleetUnitKey } from '../lib/fleetPick'
import { formatMoney } from '../lib/fit'
import { currentWorkVehicle, displayWorkSpec } from '../lib/workSpec'

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
  const current = currentWorkVehicle(intake, pkg)
  const candidate = {
    id: unit.id,
    unit,
    pickId: fleetUnitKey(pkg.id, unit.id),
    kicker: 'Candidate EV',
    heading: `${unit.year} ${unit.model}`,
    role: unit.role,
    spec,
    mileage: unit.mileage,
  }

  return (
    <div className="locked-page locked-unit-page">
      <nav className="locked-crumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true"> / </span>
        <Link to="/intake">Fleet intake</Link>
        <span aria-hidden="true"> / </span>
        <Link to={`/package/${pkg.id}`} state={location.state}>Package</Link>
        <span aria-hidden="true"> / </span>
        <span>{unit.stockId}</span>
      </nav>

      <UnitPhoto unit={unit} packageId={pkg.id} size="hero" showAsk />

      <header className="locked-page-header">
        <p className="locked-eyebrow">
          {unit.stockId} · {unit.role} · placeholder stock · DEMO
        </p>
        <h1>
          {unit.year} {unit.make} {unit.model} {unit.trim}
        </h1>
        <p className="locked-page-lead">
          {unit.mileage.toLocaleString()} mi · {unit.location.city}, {unit.location.state}
          {' · '}{unit.sellerLabel}
        </p>
        <div className="unit-inspect-banner" role="status">
          We have not seen this truck in person.
        </div>
      </header>

      <div className="unit-ask-bar">
        <div>
          <div className="stat-label">Listing ask</div>
          <div className="unit-ask-price">{formatMoney(unit.askPrice)}</div>
          <p className="package-fee-note">Buyer’s fee appears only at checkout — amount TBD</p>
        </div>
        <div className="unit-ask-actions">
          <AddToFleetButton pickId={fleetUnitKey(pkg.id, unit.id)} />
        </div>
      </div>

      <section className="module work-spec-module" aria-labelledby="work-specs">
        <h2 id="work-specs" className="module-title">Work specs</h2>
        <p className="work-spec-lead">
          Payload, bed / cab, and tow from listing data already in this preview.
          A dash means that figure is not on file.
        </p>
        <WorkSpecRows spec={spec} className="work-spec-rows-unit" />
        <SavingsLine source={unit} className="savings-line-unit" />
      </section>

      <WorkCompare
        current={current}
        candidates={[candidate]}
        packageId={pkg.id}
        title="Fit next to your current work vehicle."
      />

      <section className="module" aria-labelledby="ev-layer">
        <h2 id="ev-layer" className="module-title">Free EV layer</h2>
        <dl className="ev-layer-grid">
          <div className="ev-layer-item">
            <dt>Battery</dt>
            <dd>
              <strong>{batteryConfidenceFromUnit(unit).label}</strong>
              <p>{unit.battery.note}</p>
            </dd>
          </div>
          <div className="ev-layer-item">
            <dt>VIN recall</dt>
            <dd>
              <strong>{unit.recall.status}</strong>
              <p>{unit.recall.detail}</p>
            </dd>
          </div>
          <div className="ev-layer-item">
            <dt>Charging fit</dt>
            <dd>
              <strong>{unit.chargingFit.label}</strong>
              <p>{unit.chargingFit.detail}</p>
            </dd>
          </div>
          <div className="ev-layer-item">
            <dt>Trade fit</dt>
            <dd>
              <strong>{unit.tradeFit.label}</strong>
              <p>{unit.tradeFit.detail}</p>
            </dd>
          </div>
        </dl>
      </section>

      <section className="module" aria-labelledby="open-items">
        <h2 id="open-items" className="module-title">Open items</h2>
        <ul className="issues-list">
          {unit.openItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="module" aria-labelledby="unit-about">
        <h2 id="unit-about" className="module-title">About this unit</h2>
        <p>{unit.description}</p>
        {unit.replaceNote ? <p className="locked-muted">{unit.replaceNote}</p> : null}
        <p className="locked-muted">Upfit: {unit.upfitNote}</p>
        <p className="locked-muted">Title: {unit.titleStatus} · Seller type: {unit.sellerType}</p>
        <p className="locked-muted">
          No VIN string from production concepts — stock ID only in this public preview.
        </p>
      </section>

      <p className="locked-foot-note">
        FleetFit does not hold vehicle funds. Buyer pays the seller / dealer.
        Package screens never show fee amounts.
      </p>
    </div>
  )
}
