import { useEffect } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import AddToFleetButton from '../components/AddToFleetButton'
import CrumbDivider from '../components/CrumbDivider'
import { OutboundListingLabel } from '../components/OutboundListingLink'
import UnitPhoto from '../components/UnitPhoto'
import ScoreDialControl from '../components/ScoreDialControl'
import { getPackage, getUnit } from '../data/package'
import { useCompareSet } from '../lib/compareSet'
import { fleetUnitKey } from '../lib/fleetPick'
import {
  currentMilesForScore,
  rankUnitsByReplacementScore,
} from '../lib/replacementScore'
import { currentWorkVehicle, displayWorkSpec } from '../lib/workSpec'

const ROWS = [
  { key: 'score', label: 'Replacement Score' },
  { key: 'ymm', label: 'Year and model' },
  { key: 'role', label: 'Package role' },
  { key: 'payload', label: 'Payload' },
  { key: 'bed', label: 'Bed and cargo' },
  { key: 'cab', label: 'Cab' },
  { key: 'tow', label: 'Tow and pull' },
  { key: 'energy', label: 'Energy' },
  { key: 'listing', label: 'Seller listing' },
  { key: 'select', label: 'Select' },
  { key: 'remove', label: 'Remove' },
]

function cellText(field) {
  return field?.text || 'Not published'
}

export default function FullCompare() {
  const { packageId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const compare = useCompareSet()
  const pkg = getPackage(packageId)
  const intake = location.state?.intake
  const ids = compare.idsFor(packageId)
  const units = ids.map((id) => getUnit(packageId, id)).filter(Boolean)

  useEffect(() => {
    if (pkg && ids.length < 2) {
      navigate(`/package/${packageId}`, { state: location.state, replace: true })
    }
  }, [pkg, ids.length, navigate, packageId, location.state])

  if (!pkg) {
    return (
      <div className="locked-page">
        <p>Package not found.</p>
        <Link to="/intake">Back to intake</Link>
      </div>
    )
  }

  if (ids.length < 2) {
    return (
      <div className="locked-page">
        <p>Add another unit to open full compare.</p>
        <Link to={`/package/${packageId}`} state={location.state}>Back to package</Link>
      </div>
    )
  }

  const current = currentWorkVehicle(intake, pkg)
  const ranked = rankUnitsByReplacementScore(units, {
    currentMiles: currentMilesForScore(intake, pkg),
    intake,
    pkg,
  })
  const candidates = ranked.map(({ unit, score }, index) => ({
    unit,
    score,
    rank: index + 1,
    spec: displayWorkSpec(unit),
    pickId: fleetUnitKey(pkg.id, unit.id),
    listing: unit,
    ymm: `${unit.year} ${unit.make} ${unit.model}`,
    role: unit.role,
  }))
  const columns = 1 + candidates.length

  function renderCurrent(row) {
    if (row.key === 'score') return 'Not scored'
    if (row.key === 'ymm') return current.heading
    if (row.key === 'role') return current.role
    if (row.key === 'payload') return cellText(current.spec.payload)
    if (row.key === 'bed') {
      return current.bodyType === 'van'
        ? cellText(current.spec.cargo)
        : cellText(current.spec.bed)
    }
    if (row.key === 'cab') return cellText(current.spec.cab)
    if (row.key === 'tow') return cellText(current.spec.tow)
    if (row.key === 'energy') return cellText(current.spec.energy)
    if (row.key === 'listing') return 'Not a listing'
    if (row.key === 'select') return 'Your truck'
    if (row.key === 'remove') return ''
    return 'Not published'
  }

  function renderCandidate(col, row) {
    if (row.key === 'score') {
      return (
        <ScoreDialControl
          score={col.score}
          rank={col.rank}
          size="compare"
          heading={col.ymm}
          unit={col.unit}
        />
      )
    }
    if (row.key === 'ymm') return col.ymm
    if (row.key === 'role') return col.role
    if (row.key === 'payload') return cellText(col.spec.payload)
    if (row.key === 'bed') {
      return col.unit?.bodyType === 'van'
        ? cellText(col.spec.cargo)
        : cellText(col.spec.bed)
    }
    if (row.key === 'cab') return cellText(col.spec.cab)
    if (row.key === 'tow') return cellText(col.spec.tow)
    if (row.key === 'energy') return cellText(col.spec.energy)
    if (row.key === 'listing') {
      return <OutboundListingLabel vehicle={col.unit} />
    }
    if (row.key === 'select') {
      return <AddToFleetButton pickId={col.pickId} size="btn-sm" />
    }
    if (row.key === 'remove') {
      return (
        <button type="button" className="btn btn-sm" onClick={() => compare.remove(col.unit.id)}>
          Remove
        </button>
      )
    }
    return 'Not published'
  }

  return (
    <div className="locked-page full-compare-page">
      <nav className="locked-crumbs" aria-label="Breadcrumb">
        <Link to={`/package/${pkg.id}`} state={location.state}>Package</Link>
        <CrumbDivider />
        <span>Compare</span>
      </nav>

      <header className="locked-page-header">
        <p className="locked-eyebrow">Compare · vs your current work vehicle</p>
        <h1>Compare {candidates.length === 1 ? 'this EV' : `${candidates.length} candidates`}</h1>
        <p className="locked-page-lead">
          Payload, bed, cab, and tow first. Energy is one row. Tank miles (MPG) on your
          current work vehicle, range (kWh) on the EV. A dash means that figure is not on file.
        </p>
      </header>

      <div className="full-compare-scroll">
        <div
          className="full-compare-grid"
          style={{ '--compare-cols': columns }}
          role="table"
          aria-label="Unit compare"
        >
          <div className="full-compare-row is-photo" role="row">
            <div className="full-compare-label" role="rowheader">Photo</div>
            <div className="full-compare-cell is-current" role="cell">
              <UnitPhoto
                current
                bodyType={current.bodyType}
                kbb={current.spec.kbbTradeIn}
                size="compare"
                showCompare={false}
              />
              <p className="full-compare-kicker">Now</p>
            </div>
            {candidates.map((col) => (
              <div key={col.unit.id} className="full-compare-cell" role="cell">
                <UnitPhoto
                  unit={col.unit}
                  packageId={pkg.id}
                  size="compare"
                  showAsk
                  showCompare={false}
                  score={col.score}
                  rank={col.rank}
                  outboundPhoto
                  pickId={col.pickId}
                />
                <p className="full-compare-kicker">EV</p>
              </div>
            ))}
          </div>

          {ROWS.map((row) => (
            <div key={row.key} className={`full-compare-row is-${row.key}`} role="row">
              <div className="full-compare-label" role="rowheader">{row.label}</div>
              <div className={`full-compare-cell is-current is-${row.key}`} role="cell">
                {renderCurrent(row)}
              </div>
              {candidates.map((col) => (
                <div key={`${col.unit.id}-${row.key}`} className={`full-compare-cell is-${row.key}`} role="cell">
                  {renderCandidate(col, row)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <p className="work-compare-note">
        Energy is one row: range (pack size) on the EV, tank range (MPG) on
        your current work vehicle. We do not invent range, tank gallons, MPG, or KBB.
      </p>

      <div className="full-compare-footer">
        <button
          type="button"
          className="btn"
          onClick={() => navigate(`/package/${pkg.id}`, { state: location.state })}
        >
          Back to package
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            compare.clear()
            navigate(`/package/${pkg.id}`, { state: location.state })
          }}
        >
          Clear compare
        </button>
      </div>
    </div>
  )
}
