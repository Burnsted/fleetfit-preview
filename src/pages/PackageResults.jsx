import { Link, useLocation, useParams } from 'react-router-dom'
import StackCard from '../components/StackCard'
import WorkCompare from '../components/WorkCompare'
import { batteryUnknownCount, getPackage } from '../data/package'
import { factKbbTradeIn, readBudget, spendEnvelope, unitsWithinEnvelope } from '../lib/budget'
import { formatMoney } from '../lib/fit'
import { fleetUnitKey, useFleetPick } from '../lib/fleetPick'
import { currentWorkVehicle, displayWorkSpec } from '../lib/workSpec'

const DAY_NEED = {
  'under-60': 'Under 60 mi',
  '80-120': '80–120 mi',
  '120-180': '120–180 mi',
  '180+': '180+ mi',
  mixed: 'Mixed day',
}

function dayNeedLabel(pkg, intake) {
  if (intake?.dailyMiles && DAY_NEED[intake.dailyMiles]) {
    return DAY_NEED[intake.dailyMiles]
  }
  const fromNote = String(pkg.workDayNote || '').match(/(\d+[–-]\d+\s*mi)/i)
  if (fromNote) return fromNote[1].replace('-', '–')
  if (/trailer/i.test(pkg.workDayNote || '')) return 'Trailer day'
  return null
}

function fleetSizeChip(intake, pkg) {
  if (!intake?.fleetSize || intake.fleetSize === 'not-surveyed') {
    return pkg.unitCount ? `Fleet size ${pkg.unitCount}` : 'Fleet size Not surveyed'
  }
  return `Fleet size ${intake.fleetSize}`
}

export default function PackageResults() {
  const { packageId } = useParams()
  const location = useLocation()
  const intake = location.state?.intake
  const pkg = getPackage(packageId)
  const fleet = useFleetPick()

  if (!pkg) {
    return (
      <div className="locked-page">
        <p>Package not found.</p>
        <Link to="/intake">Back to intake</Link>
      </div>
    )
  }

  const current = currentWorkVehicle(intake, pkg)
  const envelope = spendEnvelope(readBudget().maxSpend, factKbbTradeIn(intake, pkg))
  const visibleUnits = unitsWithinEnvelope(pkg.units, envelope)
  const selectedInPackage = visibleUnits.filter((unit) => fleet.has(fleetUnitKey(pkg.id, unit.id))).length
  const unknownBatt = batteryUnknownCount({ ...pkg, units: visibleUnits })
  const dayNeed = dayNeedLabel(pkg, intake)
  const compareCandidates = visibleUnits.map((unit) => ({
    id: unit.id,
    unit,
    pickId: fleetUnitKey(pkg.id, unit.id),
    kicker: 'Candidate EV',
    heading: `${unit.year} ${unit.model}`,
    role: unit.role,
    spec: displayWorkSpec(unit),
    mileage: unit.mileage,
  }))

  return (
    <div className="locked-page package-page is-stack">
      <nav className="locked-crumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true"> / </span>
        <Link to="/intake">Fleet intake</Link>
        <span aria-hidden="true"> / </span>
        <span>Package</span>
      </nav>

      <header className="match-header">
        <p className="match-kicker">
          {pkg.trade} · {pkg.unitCount} units{dayNeed ? ` · Day ${dayNeed}` : ''} · DEMO
        </p>
        <h1 className="match-title">{pkg.headline}</h1>
        <div className="spec-chips match-header-chips">
          <span className="spec-chip is-known">Trade {pkg.trade}</span>
          <span className="spec-chip is-known">{pkg.unitCount} units</span>
          {dayNeed ? <span className="spec-chip is-known">Day {dayNeed}</span> : null}
        </div>
        <div className="spec-chips">
          <span className="spec-chip is-dash">
            Battery {unknownBatt === pkg.unitCount ? '—' : `${pkg.unitCount - unknownBatt}/${pkg.unitCount}`}
          </span>
          <span className="spec-chip is-dash">Recalls —</span>
          <span className="spec-chip is-known">{fleetSizeChip(intake, pkg)}</span>
          {envelope != null ? (
            <span className="spec-chip is-known">Envelope {formatMoney(envelope)}</span>
          ) : null}
        </div>
      </header>

      <WorkCompare
        current={current}
        candidates={compareCandidates}
        packageId={pkg.id}
        title="Fit next to your current work vehicle."
      />

      <section aria-labelledby="units-title">
        <h2 id="units-title" className="package-units-title">Units</h2>
        {visibleUnits.length === 0 ? (
          <p className="locked-muted">
            No units in this demo fit that spend.{' '}
            <Link to="/budget">Adjust spend</Link>
          </p>
        ) : null}
        <ul className="package-unit-stack">
          {visibleUnits.map((unit) => {
            const spec = displayWorkSpec(unit)
            return (
              <li key={unit.id}>
                <StackCard
                  heading={`${unit.year} ${unit.model}`}
                  role={unit.role}
                  unit={unit}
                  packageId={pkg.id}
                  pickId={fleetUnitKey(pkg.id, unit.id)}
                  spec={spec}
                  mileage={unit.mileage}
                />
              </li>
            )
          })}
        </ul>
      </section>

      <p className="package-fee-quiet">Fee at checkout — amount TBD</p>
      <p className="package-tradein-quiet">Trade-in: {pkg.tradeIn.status}</p>

      <div className="package-cta-bar">
        <p className="package-fleet-count">
          {selectedInPackage} of {visibleUnits.length || pkg.unitCount} in fleet
        </p>
        <Link to="/intake?adjust=1" className="btn btn-sm">
          Adjust mix
        </Link>
      </div>

      <p className="locked-foot-note">
        FleetFit has not seen these trucks · we do not hold vehicle funds
      </p>
    </div>
  )
}
