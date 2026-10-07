import { useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import CrumbDivider from '../components/CrumbDivider'
import NewCatalog from '../components/NewCatalog'
import PackageTotal from '../components/PackageTotal'
import StackCard from '../components/StackCard'
import StockModeToggle from '../components/StockModeToggle'
import WorkCompare from '../components/WorkCompare'
import {
  NEW_CATALOG_BUILD,
  NEW_HELPER_LINE,
  USED_RESULTS_HELPER,
} from '../data/newEvCatalog'
import { getPackage, resolvePackageId } from '../data/package'
import TradePackageResults from './TradePackageResults'
import { factKbbTradeIn, readBudget, spendEnvelope, unitsWithinEnvelope } from '../lib/budget'
import { formatMoney } from '../lib/fit'
import { fleetUnitKey, useFleetPick } from '../lib/fleetPick'
import { OEM_SPECS_BUILD } from '../data/oemSpecs'
import { SCORE_V2_BUILD } from '../data/scoreV2Rubric'
import { OUTBOUND_LISTING_BUILD } from '../lib/outboundListing'
import {
  BODY_MIX_BUILD,
  CLEARED_SHIP,
  composeRecommendationSet,
} from '../lib/recommendationSet'
import { currentMilesForScore } from '../lib/replacementScore'
import { NO_SUGGESTIONS, NO_VANS_REAL_GOOD } from '../lib/suggestionEligibility'
import {
  currentWorkVehicle,
  displayWorkSpec,
  NOT_PUBLISHED,
  packageBatteryKwhFact,
} from '../lib/workSpec'

/** Stamp for Package total + Home link CLEARED build. */
export const PACKAGE_TOTAL_BUILD = 'package-total-home-20261001'

const DAY_NEED = {
  'under-60': 'Under 60 mi',
  '80-120': '80 to 120 mi',
  '120-180': '120 to 180 mi',
  '180+': '180+ mi',
  mixed: 'Mixed day',
}

function dayNeedLabel(pkg, intake) {
  const miles = String(intake?.dailyMiles || '').trim()
  if (miles) {
    if (DAY_NEED[miles]) return DAY_NEED[miles]
    if (/^\d+(\.\d+)?$/.test(miles)) return `${miles} mi`
    return miles
  }
  const fromNote = String(pkg.workDayNote || '').match(/(\d+)[–-](\d+)\s*mi/i)
  if (fromNote) return `${fromNote[1]} to ${fromNote[2]} mi`
  if (/trailer/i.test(pkg.workDayNote || '')) return 'Trailer day'
  return null
}

function fleetSizeChip(intake, shownCount) {
  if (!intake?.fleetSize || intake.fleetSize === 'not-surveyed') {
    return shownCount > 0 ? `Fleet size ${shownCount}` : 'Fleet size Not surveyed'
  }
  return `Fleet size ${intake.fleetSize}`
}

export default function PackageResults() {
  const { packageId } = useParams()
  const location = useLocation()
  const intake = location.state?.intake
  const fleet = useFleetPick()
  const [stockMode, setStockMode] = useState(
    intake?.stockMode === 'New' ? 'New' : 'Used',
  )
  const resolvedId = resolvePackageId(packageId)
  const pkg = getPackage(resolvedId || packageId)

  // Decision 11: alias demo ids → trade packages (UI redirect).
  if (resolvedId && resolvedId !== packageId) {
    return (
      <Navigate
        to={`/package/${resolvedId}`}
        replace
        state={location.state}
      />
    )
  }

  if (!pkg) {
    return (
      <div className="locked-page">
        <p>Package not found.</p>
        <Link to="/intake">Back to intake</Link>
      </div>
    )
  }

  if (pkg.isTradePackage) {
    return (
      <TradePackageResults
        key={`${pkg.id}:${intake?.stockMode || 'Used'}`}
        pkg={pkg}
      />
    )
  }

  const isNew = stockMode === 'New'

  const current = currentWorkVehicle(intake, pkg)
  const envelope = spendEnvelope(readBudget().maxSpend, factKbbTradeIn(intake, pkg))
  const visibleUnits = unitsWithinEnvelope(pkg.units, envelope)
  const scoreCtx = {
    currentMiles: currentMilesForScore(intake, pkg),
    intake,
    pkg,
  }
  const reco = composeRecommendationSet(visibleUnits, scoreCtx, {
    maxSlots: Math.max(visibleUnits.length, pkg.unitCount || 0),
  })
  const ranked = reco.items
  // Counts and totals follow what is actually shown (suggestible set), not the seed pool.
  const shownUnits = ranked.map((r) => r.unit)
  const selectedInPackage = shownUnits.filter((unit) =>
    fleet.has(fleetUnitKey(pkg.id, unit.id)),
  ).length
  const batteryKwhFact = packageBatteryKwhFact(shownUnits)
  const dayNeed = dayNeedLabel(pkg, intake)
  const truckCount = ranked.filter((r) => r.bodyClass === 'truck').length
  const vanCount = ranked.filter((r) => r.bodyClass === 'van').length
  const compareCandidates = ranked.map((row) => ({
    id: row.unit.id,
    unit: row.unit,
    pickId: fleetUnitKey(pkg.id, row.unit.id),
    kicker: 'Candidate EV',
    heading: `${row.unit.year} ${row.unit.model}`,
    role: row.unit.role,
    spec: displayWorkSpec(row.unit),
    mileage: row.unit.mileage,
    score: row.score,
    rank: row.rank,
    bodyClass: row.bodyClass,
  }))

  return (
    <div
      className="locked-page package-page is-stack"
      data-body-mix-build={BODY_MIX_BUILD}
      data-cleared-ship={CLEARED_SHIP}
      data-oem-specs={OEM_SPECS_BUILD}
      data-outbound-listing={OUTBOUND_LISTING_BUILD}
      data-package-total={PACKAGE_TOTAL_BUILD}
      data-score-v2={SCORE_V2_BUILD}
      data-stock-mode={stockMode}
      data-new-catalog={NEW_CATALOG_BUILD}
    >
      <nav className="locked-crumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <CrumbDivider />
        <Link to="/intake">Fleet intake</Link>
        <CrumbDivider />
        <span>Package</span>
      </nav>

      <header className="match-header is-dense" data-density-build="package-density-20260926-0923">
        <p className="match-kicker">DEMO</p>
        <h1 className="match-title">{isNew ? 'Your fleet' : pkg.headline}</h1>
        <div className="trade-stock-bar">
          <StockModeToggle
            value={stockMode}
            onChange={setStockMode}
            usedHelper={USED_RESULTS_HELPER}
            newHelper={null}
          />
        </div>
        {!isNew ? (
          <div className="spec-chips match-header-chips" aria-label="Match facts">
            <span className="spec-chip is-known">Trade {pkg.trade}</span>
            <span className="spec-chip is-known">
              {shownUnits.length === 1 ? '1 unit' : `${shownUnits.length} units`}
            </span>
            {dayNeed ? <span className="spec-chip is-known">Day {dayNeed}</span> : null}
            <span className={`spec-chip ${pkg.tradeIn?.status ? 'is-known' : 'is-dash'}`}>
              Trade-in {pkg.tradeIn?.status || NOT_PUBLISHED}
            </span>
            <span className={`spec-chip ${batteryKwhFact.known ? 'is-known' : 'is-dash'}`}>
              Battery {batteryKwhFact.text}
            </span>
            <span className="spec-chip is-dash">Recalls Not checked</span>
            <span className="spec-chip is-known">{fleetSizeChip(intake, shownUnits.length)}</span>
            {envelope != null ? (
              <span className="spec-chip is-known">Envelope {formatMoney(envelope)}</span>
            ) : null}
          </div>
        ) : null}
      </header>

      {isNew ? <NewCatalog helper={NEW_HELPER_LINE} /> : null}

      <section
        className="recommendation-mix"
        hidden={isNew}
        aria-labelledby="reco-mix-title"
        data-body-mix-build={BODY_MIX_BUILD}
        data-has-truck={reco.hasTruck ? 'true' : 'false'}
        data-has-van={reco.hasVan ? 'true' : 'false'}
        data-has-fresh-my={reco.hasFreshMy ? 'true' : 'false'}
      >
        <h2 id="reco-mix-title" className="recommendation-mix-title">
          Recommendation set
        </h2>
        <p className="recommendation-mix-lead">
          Truck and van options in this pool, ordered by Replacement Score high → low. Newer used years stay in the look.
        </p>
        <div className="recommendation-mix-chips" aria-label="Body coverage">
          {reco.hasTruck ? (
            <span className="recommendation-mix-chip is-truck" data-body-class="truck">
              Truck · {truckCount}
            </span>
          ) : (
            <span className="recommendation-mix-chip is-missing">Truck not in this set</span>
          )}
          {reco.hasVan ? (
            <span className="recommendation-mix-chip is-van" data-body-class="van">
              Van · {vanCount}
            </span>
          ) : (
            <span className="recommendation-mix-chip is-missing" data-body-class="van-none">
              Van · 0
            </span>
          )}
          {reco.hasFreshMy ? (
            <span className="recommendation-mix-chip is-fresh" data-fresh-my="true">
              Includes 2025 to 2026
            </span>
          ) : null}
        </div>
        {!reco.hasVan ? (
          <p className="recommendation-mix-missing" data-vans-line="true">
            {reco.missingBodyNote || NO_VANS_REAL_GOOD}
          </p>
        ) : reco.missingBodyNote ? (
          <p className="recommendation-mix-missing">{reco.missingBodyNote}</p>
        ) : null}
      </section>

      <div hidden={isNew}>
        <WorkCompare
          current={current}
          candidates={compareCandidates}
          packageId={pkg.id}
          title="Current vs package"
        />

        <section aria-labelledby="units-title">
          <h2 id="units-title" className="package-units-title">Units</h2>
          {ranked.length === 0 ? (
            <p className="locked-muted">
              {visibleUnits.length === 0 && envelope != null ? (
                <>
                  No units in this demo fit that spend.{' '}
                  <Link to="/budget">Adjust spend</Link>
                </>
              ) : (
                <>
                  {NO_SUGGESTIONS}{' '}
                  <Link to="/intake">Intake</Link>
                  {' · '}
                  <Link to="/budget">Budget</Link>
                </>
              )}
            </p>
          ) : null}
          <ul className="package-unit-stack">
            {ranked.map((row) => {
              const spec = displayWorkSpec(row.unit)
              return (
                <li key={row.unit.id}>
                  <StackCard
                    heading={`${row.unit.year} ${row.unit.model}`}
                    role={row.unit.role}
                    unit={row.unit}
                    packageId={pkg.id}
                    pickId={fleetUnitKey(pkg.id, row.unit.id)}
                    spec={spec}
                    mileage={row.unit.mileage}
                    score={row.score}
                    rank={row.rank}
                    bodyClass={row.bodyClass}
                  />
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      {/* Totals follow fleet picks (photo chip / Add to fleet); empty is safe */}
      <PackageTotal
        units={ranked
          .map((row) => row.unit)
          .filter((unit) => fleet.has(fleetUnitKey(pkg.id, unit.id)))}
      />

      <div className="package-cta-bar" hidden={isNew}>
        <p className="package-fleet-count">
          {selectedInPackage} of {shownUnits.length} in fleet
        </p>
        <Link
          to="/intake?adjust=1"
          state={{ intake: { ...intake, stockMode } }}
          className="btn btn-sm package-cta-adjust"
        >
          Adjust mix
        </Link>
      </div>

      <p className="locked-foot-note">
        FleetFit has not seen these trucks · we do not hold vehicle funds
      </p>
    </div>
  )
}
