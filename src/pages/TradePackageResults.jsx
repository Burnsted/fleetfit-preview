import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import CrumbDivider from '../components/CrumbDivider'
import NewCatalog from '../components/NewCatalog'
import PackageTotal from '../components/PackageTotal'
import StockModeToggle from '../components/StockModeToggle'
import TradeInEntryList from '../components/TradeInEntryList'
import TradePackageToast from '../components/TradePackageToast'
import TradeUnitCard from '../components/TradeUnitCard'
import {
  NEW_CATALOG_BUILD,
  NEW_HELPER_LINE,
  USED_RESULTS_HELPER,
} from '../data/newEvCatalog'
import { TRADE_PACKAGE_COPY, JOB_STORAGE_KEY } from '../data/tradeNeeds'
import {
  TRADE_PACKAGE_BUILD,
  tradePackageHeader,
} from '../data/tradePackages'
import { OEM_SPECS_BUILD } from '../data/oemSpecs'
import { SCORE_V2_BUILD } from '../data/scoreV2Rubric'
import { formatMoney } from '../lib/fit'
import { fleetUnitKey, useFleetPick } from '../lib/fleetPick'
import { OUTBOUND_LISTING_BUILD } from '../lib/outboundListing'
import { currentMilesForScore } from '../lib/replacementScore'
import {
  createTradeInRowsFromIntake,
  readStoredTradeInRows,
  resizeTradeInRows,
  writeStoredTradeInRows,
} from '../lib/tradeInEntry'
import {
  defaultScoreAssumptions,
  pairTradeInsToUnits,
  scoreTradeInRow,
} from '../lib/tradeInScore'
import { round1 } from '../data/scoreV2Rubric'

/**
 * Overlay trade-in current onto the package card dial so Current / gap match
 * the trade-in sheet (sample frames: Sierra Current 46.9 not package baseline).
 */
function cardScoreWithTradeInCurrent(cardScore, tradeScore) {
  if (!cardScore || !tradeScore || tradeScore.currentTotal == null) {
    return cardScore
  }
  if (cardScore.incomplete || cardScore.candidateTotal == null) return cardScore
  const cur = Number(tradeScore.currentTotal)
  const cand = Number(cardScore.candidateTotal)
  const diff = round1(cand - cur)
  return {
    ...cardScore,
    currentTotal: cur,
    difference: diff,
    dialCurrent: `Current ${cur.toFixed(1)}`,
    dialDiff: `${diff > 0 ? '+' : ''}${diff.toFixed(1)} vs current`,
  }
}
import {
  addUnitToPackage,
  composeTradePackageSet,
  removeAndAutoReplace,
  TRADE_PACKAGE_SET_BUILD,
  undoRemove,
  undoReplace,
} from '../lib/tradePackageSet'
import { displayWorkSpec } from '../lib/workSpec'
import { fleetSizeFromIntake } from '../lib/fleetSize'

const SIZE_OPTIONS = [1, 2, 3, 4, 5]

function readStoredJob(packageId) {
  try {
    const raw = sessionStorage.getItem(JOB_STORAGE_KEY)
    if (!raw) return null
    const all = JSON.parse(raw)
    return all?.[packageId] || null
  } catch {
    return null
  }
}

function writeStoredJob(packageId, job) {
  try {
    const raw = sessionStorage.getItem(JOB_STORAGE_KEY)
    const all = raw ? JSON.parse(raw) : {}
    all[packageId] = job
    sessionStorage.setItem(JOB_STORAGE_KEY, JSON.stringify(all))
  } catch {
    /* ignore quota */
  }
}

function mergeJob(pkg, intake, stored) {
  const defaults = pkg.jobDefaults || {}
  return {
    trade: pkg.trade,
    dailyMiles:
      stored?.dailyMiles ?? intake?.dailyMiles ?? intake?.job?.dailyMiles ?? defaults.dailyMiles,
    loadLb: stored?.loadLb ?? intake?.loadLb ?? intake?.job?.loadLb ?? defaults.loadLb,
    crew: stored?.crew ?? intake?.crew ?? intake?.job?.crew ?? defaults.crew,
    tows: stored?.tows ?? intake?.tows ?? intake?.job?.tows ?? defaults.tows,
    trailerLb:
      stored?.trailerLb ?? intake?.trailerLb ?? intake?.job?.trailerLb ?? defaults.trailerLb,
    tongueLb:
      stored?.tongueLb ?? intake?.tongueLb ?? intake?.job?.tongueLb ?? defaults.tongueLb,
    wdh: stored?.wdh ?? intake?.wdh ?? intake?.job?.wdh ?? defaults.wdh ?? null,
    shopCity:
      stored?.shopCity ?? intake?.shopCity ?? intake?.job?.shopCity ?? defaults.shopCity,
    cargoCuFt:
      stored?.cargoCuFt ?? intake?.cargoCuFt ?? intake?.job?.cargoCuFt ?? defaults.cargoCuFt,
  }
}

/**
 * Preset Trade Packages package surface (CLEARED REV 2).
 */
export default function TradePackageResults({ pkg }) {
  const location = useLocation()
  const intake = location.state?.intake
  const fleet = useFleetPick()

  const [stockMode, setStockMode] = useState(
    intake?.stockMode === 'New' || pkg.stockMode === 'New' ? 'New' : 'Used',
  )

  const storedJob = useMemo(() => readStoredJob(pkg.id), [pkg.id])
  const [job, setJob] = useState(() => mergeJob(pkg, intake, storedJob))
  const initialSize = fleetSizeFromIntake(intake, pkg.sizeDefault || 2)
  const [size, setSize] = useState(initialSize)
  const [active, setActive] = useState([])
  const [eligible, setEligible] = useState([])
  const [eligibleCount, setEligibleCount] = useState(0)
  const [shortfall, setShortfall] = useState(0)
  const [bodyShortfallNote, setBodyShortfallNote] = useState(null)
  const [removedRow, setRemovedRow] = useState(null)
  const [lastAddedId, setLastAddedId] = useState(null)
  const [banner, setBanner] = useState(null)
  const [toastOpen, setToastOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [addBlockedMsg, setAddBlockedMsg] = useState(null)
  const [replaceUndo, setReplaceUndo] = useState(null)
  const defaultFleetSeeded = useRef(false)
  const [tradeInRows, setTradeInRows] = useState(() => {
    const fromIntake = intake?.tradeInEntries
    if (Array.isArray(fromIntake) && fromIntake.length) {
      return resizeTradeInRows(fromIntake, fromIntake.length)
    }
    const seeded = createTradeInRowsFromIntake(initialSize, intake)
    const stored = readStoredTradeInRows(pkg.id)
    if (stored?.length) {
      // Prefer intake/Example seed when stored rows are blank shells (prior empty visit).
      const storedHasVehicle = stored.some(
        (r) =>
          String(r?.year || '').trim() ||
          String(r?.make || '').trim() ||
          String(r?.model || '').trim() ||
          String(r?.mileage || '').trim() ||
          String(r?.value || '').trim(),
      )
      const seedHasVehicle = Boolean(
        seeded[0] &&
          (seeded[0].year || seeded[0].make || seeded[0].model || seeded[0].mileage),
      )
      if (storedHasVehicle || !seedHasVehicle) {
        return resizeTradeInRows(stored, Math.max(stored.length, initialSize))
      }
    }
    return seeded
  })
  const [tradeInAssumptions, setTradeInAssumptions] = useState(() => {
    const base = defaultScoreAssumptions(
      mergeJob(pkg, intake, readStoredJob(pkg.id)),
    )
    return Array.from({ length: initialSize }, () => ({ ...base }))
  })

  const scoreCtx = useMemo(
    () => ({
      currentMiles: currentMilesForScore(
        { ...intake, job },
        pkg,
      ),
      intake: {
        ...intake,
        job,
        dailyMiles: job.dailyMiles,
        loadLb: job.loadLb,
        crew: job.crew,
        tows: job.tows,
        trailerLb: job.trailerLb,
        tongueLb: job.tongueLb,
        wdh: job.wdh,
        shopCity: job.shopCity,
        cargoCuFt: job.cargoCuFt,
      },
      pkg,
    }),
    [intake, job, pkg],
  )

  const rebuild = useCallback(
    (nextSize) => {
      const composed = composeTradePackageSet(pkg, scoreCtx, nextSize)
      setActive(composed.active)
      setEligible(composed.eligible)
      setEligibleCount(composed.eligibleCount)
      setShortfall(composed.shortfall)
      setBodyShortfallNote(composed.bodyShortfallNote || null)
      setSize(composed.size)
      if (composed.replacements?.length) {
        const last = composed.replacements[composed.replacements.length - 1]
        setReplaceUndo({
          priorUnit: last.deadUnit,
          priorScore: null,
          replacementId: last.replacementId,
        })
        setBanner(TRADE_PACKAGE_COPY.combinedDeadReplace)
      }
      return composed
    },
    [pkg, scoreCtx],
  )

  useEffect(() => {
    rebuild(size)
    // Rebuild when package or job inputs change — not on every pkg object identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pkg.id, job.dailyMiles, job.loadLb, job.crew, job.tows, job.trailerLb, job.tongueLb, job.wdh, job.shopCity, job.cargoCuFt])

  useEffect(() => {
    writeStoredJob(pkg.id, job)
  }, [pkg.id, job])

  useEffect(() => {
    setTradeInRows((prev) => resizeTradeInRows(prev, size))
    setTradeInAssumptions((prev) => {
      const base = defaultScoreAssumptions(job)
      return Array.from({ length: size }, (_, i) =>
        prev[i] ? { ...prev[i] } : { ...base },
      )
    })
    // Resize only; keep edited assumptions for existing rows.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size])

  useEffect(() => {
    writeStoredTradeInRows(pkg.id, tradeInRows)
  }, [pkg.id, tradeInRows])

  const onTradeInAssumptionsChange = useCallback((index, nextAssumptions) => {
    setTradeInAssumptions((prev) => {
      const copy = [...prev]
      copy[index] = { ...nextAssumptions }
      return copy
    })
  }, [])

  // Default starting state: select the shown package units into the fleet so
  // "N of N in fleet" matches fleet size / trade-in rows. Once per package visit.
  useEffect(() => {
    if (defaultFleetSeeded.current || active.length === 0) return
    const pickIds = active.map((slot) => fleetUnitKey(pkg.id, slot.unit.id))
    const seedFlag = `fleetfit-default-fleet-seed:${pkg.id}`
    try {
      if (sessionStorage.getItem(seedFlag) === '1') {
        defaultFleetSeeded.current = true
        return
      }
      sessionStorage.setItem(seedFlag, '1')
    } catch {
      /* ignore quota */
    }
    fleet.seedPicks(pickIds)
    defaultFleetSeeded.current = true
  }, [active, pkg.id, fleet])

  // Title count must match the vehicles rendered below (active), not the
  // planned fleet-size chip — pool shortfall can leave size > active.length.
  const headerTitle = tradePackageHeader(pkg.trade, active.length)
  const activeUnits = active.map((s) => s.unit)
  const selectedInPackage = activeUnits.filter((unit) =>
    fleet.has(fleetUnitKey(pkg.id, unit.id)),
  ).length

  // Pair trade-ins → units; overlay trade-in Current on matching card dials.
  const tradePairedScoresByUnitId = useMemo(() => {
    const paired = pairTradeInsToUnits(tradeInRows, activeUnits)
    const map = new Map()
    const scoreCtx = {
      intake: {
        ...(intake || {}),
        job: { ...(intake?.job || {}), ...job },
      },
      pkg,
    }
    for (let i = 0; i < tradeInRows.length; i += 1) {
      const unit = paired[i]
      if (!unit) continue
      const tradeScore = scoreTradeInRow(tradeInRows[i], unit, {
        intake: scoreCtx.intake,
        pkg,
        job,
        assumptions: tradeInAssumptions?.[i] || defaultScoreAssumptions(job),
      })
      if (tradeScore) map.set(unit.id, tradeScore)
    }
    return map
  }, [tradeInRows, activeUnits, tradeInAssumptions, job, pkg, intake])

  function onSizeChange(n) {
    setRemovedRow(null)
    setLastAddedId(null)
    setBanner(null)
    setAddBlockedMsg(null)
    rebuild(n)
  }

  function onRemove(unitId) {
    const result = removeAndAutoReplace(active, eligible, unitId)
    setActive(result.active)
    setRemovedRow(result.removed)
    setLastAddedId(result.added?.unitId || null)
    setBanner(result.notice)
    setToastOpen(true)
    if (result.sizeSync != null) setSize(result.sizeSync)
  }

  function onUndoRemove() {
    if (!removedRow) return
    const result = undoRemove(active, removedRow, lastAddedId)
    setActive(result.active)
    if (result.sizeSync != null) setSize(result.sizeSync)
    setRemovedRow(null)
    setLastAddedId(null)
    setBanner(null)
    setToastOpen(false)
  }

  function onUndoReplace() {
    if (!replaceUndo) return
    const result = undoReplace(
      active,
      replaceUndo.priorUnit,
      replaceUndo.priorScore,
      replaceUndo.replacementId,
    )
    setActive(result.active)
    setReplaceUndo(null)
    setBanner(null)
  }

  function onAddUnit(unitId) {
    const result = addUnitToPackage(active, eligible, unitId, pkg.sizeMax || 5)
    if (result.blocked) {
      setAddBlockedMsg(result.message)
      return
    }
    if (!result.ok) {
      setAddBlockedMsg(result.message)
      return
    }
    setActive(result.active)
    if (result.sizeSync != null) setSize(result.sizeSync)
    setPickerOpen(false)
    setAddBlockedMsg(null)
  }

  function onAddPackageToFleet() {
    const pickIds = active.map((slot) => fleetUnitKey(pkg.id, slot.unit.id))
    const units = active.map((slot) => slot.unit)
    // Opens the fleet plan panel — previously this only wrote session picks
    // with no visible feedback, so the button looked dead on live / seven-fixes.
    fleet.addPackageToPlan({
      packageId: pkg.id,
      pickIds,
      units,
    })
  }

  function onJobField(field, raw) {
    const next = { ...job }
    if (raw === '' || raw == null) {
      next[field] = null
    } else if (field === 'tows' || field === 'wdh') {
      next[field] = raw === true || raw === 'true'
    } else {
      const n = Number(raw)
      next[field] = Number.isFinite(n) ? n : null
    }
    setJob(next)
  }

  const missingCurrent = !pkg.currentVehicle && !intake?.tradeInModel && !intake?.currentYear
  const pickerCandidates = eligible.filter(
    (r) => !active.some((a) => a.unit.id === r.unit.id),
  )

  const isNew = stockMode === 'New'

  return (
    <div
      className="locked-page package-page is-stack is-trade-package"
      data-trade-package={TRADE_PACKAGE_BUILD}
      data-trade-set={TRADE_PACKAGE_SET_BUILD}
      data-stock-mode={stockMode}
      data-new-catalog={NEW_CATALOG_BUILD}
      data-oem-specs={OEM_SPECS_BUILD}
      data-outbound-listing={OUTBOUND_LISTING_BUILD}
      data-score-v2={SCORE_V2_BUILD}
      data-eligible-count={eligibleCount}
    >
      <nav className="locked-crumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <CrumbDivider />
        <Link to="/#trade-packages">Trade packages</Link>
        <CrumbDivider />
        <span>{pkg.trade}</span>
      </nav>

      <header className="match-header is-dense trade-package-header">
        <p className="match-kicker trade-package-kicker">
          {TRADE_PACKAGE_COPY.tradePackageKicker}
        </p>
        <h1 className="match-title">{isNew ? 'Your fleet' : headerTitle}</h1>
        {!isNew ? (
          <p className="trade-work-day">{pkg.workDayCopy || pkg.workDayNote}</p>
        ) : null}
        <div className="trade-stock-bar">
          <StockModeToggle
            value={stockMode}
            onChange={setStockMode}
            usedHelper={USED_RESULTS_HELPER}
            newHelper={null}
          />
        </div>
        {!isNew ? (
          <div className="spec-chips match-header-chips" aria-label="Package facts">
            <span className="spec-chip is-known">Trade {pkg.trade}</span>
            <span className="spec-chip is-known">
              {active.length === 1 ? '1 unit' : `${active.length} units`}
            </span>
            <span className="spec-chip is-known">{TRADE_PACKAGE_COPY.orderedByScore}</span>
            <span className="spec-chip is-known">{TRADE_PACKAGE_COPY.exampleDataTag}</span>
          </div>
        ) : null}
        {!isNew && missingCurrent ? (
          <p className="trade-current-banner" role="status">
            {TRADE_PACKAGE_COPY.addCurrentBanner}
          </p>
        ) : null}
      </header>

      {isNew ? <NewCatalog helper={NEW_HELPER_LINE} /> : null}

      {!isNew ? (
      <div className="trade-package-layout">
        <div className="trade-package-main">
          <section className="trade-job-strip" aria-label="Job numbers">
            <p className="trade-job-help">{TRADE_PACKAGE_COPY.editJobNumbers}</p>
            <div className="trade-job-fields">
              <label>
                Daily miles
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder={TRADE_PACKAGE_COPY.addYours}
                  value={job.dailyMiles ?? ''}
                  onChange={(e) => onJobField('dailyMiles', e.target.value)}
                />
              </label>
              <label>
                Load lb
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder={TRADE_PACKAGE_COPY.addYours}
                  value={job.loadLb ?? ''}
                  onChange={(e) => onJobField('loadLb', e.target.value)}
                />
              </label>
              <label>
                Crew
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder={TRADE_PACKAGE_COPY.addYours}
                  value={job.crew ?? ''}
                  onChange={(e) => onJobField('crew', e.target.value)}
                />
              </label>
              {job.tows === true ? (
                <>
                  <label>
                    Trailer lb
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder={TRADE_PACKAGE_COPY.addYours}
                      value={job.trailerLb ?? ''}
                      onChange={(e) => onJobField('trailerLb', e.target.value)}
                    />
                  </label>
                  <label>
                    Tongue lb
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder={TRADE_PACKAGE_COPY.addYours}
                      value={job.tongueLb ?? ''}
                      onChange={(e) => onJobField('tongueLb', e.target.value)}
                    />
                  </label>
                </>
              ) : null}
            </div>
          </section>

          <section aria-labelledby="units-title" className="trade-units-section">
            <div className="trade-units-head">
              <h2 id="units-title" className="package-units-title">
                {TRADE_PACKAGE_COPY.unitsTitle}
              </h2>
              <p className="trade-units-sub">{TRADE_PACKAGE_COPY.unitsSubcaption}</p>
            </div>

            {active.length === 0 ? (
              <p className="trade-empty" data-empty="true">
                {bodyShortfallNote || TRADE_PACKAGE_COPY.emptyPackage}{' '}
                {!bodyShortfallNote ? (
                  <Link to="/intake">{TRADE_PACKAGE_COPY.buildYourOwn}</Link>
                ) : null}
              </p>
            ) : null}

            {shortfall > 0 && active.length > 0 ? (
              <p className="trade-shortfall" data-shortfall={shortfall}>
                {bodyShortfallNote || TRADE_PACKAGE_COPY.noOtherListing}{' '}
                Showing {active.length} real{' '}
                {active.length === 1 ? 'unit' : 'units'} of fleet size {size}.
              </p>
            ) : null}

            <ul className="package-unit-stack trade-unit-stack">
              {removedRow ? (
                <li className="trade-removed-row" data-removed="true">
                  <span className="trade-removed-ymm">
                    {removedRow.ymm} · removed
                  </span>
                  <button
                    type="button"
                    className="trade-undo-link"
                    onClick={onUndoRemove}
                  >
                    {TRADE_PACKAGE_COPY.undo}
                  </button>
                </li>
              ) : null}
              {active.map((slot) => {
                const spec = displayWorkSpec(slot.unit)
                const tradeScore = tradePairedScoresByUnitId.get(slot.unit.id)
                const dialScore = cardScoreWithTradeInCurrent(
                  slot.score,
                  tradeScore,
                )
                return (
                  <li key={slot.unit.id}>
                    <TradeUnitCard
                      unit={slot.unit}
                      packageId={pkg.id}
                      score={dialScore}
                      rank={slot.rank}
                      spec={spec}
                      newlyAdded={Boolean(slot.newlyAdded)}
                      dead={Boolean(slot.dead)}
                      noReplacement={Boolean(slot.noReplacement)}
                      inPackage
                      onRemove={onRemove}
                      onAdd={onAddUnit}
                      onUndoReplace={
                        slot.replacedFromId && replaceUndo?.replacementId === slot.unit.id
                          ? onUndoReplace
                          : null
                      }
                    />
                  </li>
                )
              })}
            </ul>

            <div className="trade-add-unit-row">
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => {
                  setPickerOpen((o) => !o)
                  setAddBlockedMsg(null)
                }}
              >
                + {TRADE_PACKAGE_COPY.addUnit}
              </button>
              {addBlockedMsg ? (
                <p className="trade-add-blocked" role="status">
                  {addBlockedMsg}
                </p>
              ) : null}
            </div>

            {pickerOpen ? (
              <div className="trade-unit-picker" data-picker="1">
                <p className="trade-unit-picker-lead">
                  Ranked real listings for this job
                </p>
                {pickerCandidates.length === 0 ? (
                  <p className="locked-muted">{TRADE_PACKAGE_COPY.noOtherListing}</p>
                ) : (
                  <ul className="trade-unit-picker-list">
                    {pickerCandidates.map((row, i) => (
                      <li key={row.unit.id}>
                        <button
                          type="button"
                          className="trade-unit-picker-item"
                          onClick={() => onAddUnit(row.unit.id)}
                        >
                          <span>
                            #{i + 1} {row.unit.year} {row.unit.make} {row.unit.model}
                          </span>
                          <span>
                            {formatMoney(row.unit.askPrice)}
                            {row.score?.dialTotal ? ` · ${row.score.dialTotal}` : ''}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </section>
        </div>

        <aside className="trade-package-summary" aria-label="Package summary">
          <div className="trade-summary-card">
            <div className="trade-summary-top">
              <span>{TRADE_PACKAGE_COPY.packageTotalExample}</span>
              <span>
                Units {active.length}
              </span>
            </div>
            <p className="trade-summary-total">
              {active.length === 0
                ? 'not confirmed'
                : formatMoney(
                    active.reduce(
                      (s, a) => s + (Number(a.unit.askPrice) || 0),
                      0,
                    ),
                  )}
            </p>

            <div className="trade-size-control" data-fleet-size={size}>
              <p className="trade-size-label">{TRADE_PACKAGE_COPY.fleetSize}</p>
              <div className="trade-size-chips" role="group" aria-label={TRADE_PACKAGE_COPY.fleetSize}>
                {SIZE_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`trade-size-chip${size === n ? ' is-active' : ''}`}
                    aria-pressed={size === n}
                    onClick={() => onSizeChange(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {banner ? (
              <p className="trade-summary-banner" role="status">
                {banner}
              </p>
            ) : null}

            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={onAddPackageToFleet}
              disabled={active.length === 0}
            >
              {TRADE_PACKAGE_COPY.addPackageToFleet}
            </button>
            <p className="trade-build-own">
              <Link
                to="/intake"
                state={{ trade: pkg.trade, fromPackage: pkg.id }}
                onClick={() => {
                  /* build your own */
                }}
              >
                {TRADE_PACKAGE_COPY.buildYourOwn}
              </Link>
            </p>
            <p className="trade-build-own-help">{TRADE_PACKAGE_COPY.buildYourOwnHelper}</p>
          </div>
        </aside>
      </div>
      ) : null}

      <TradeInEntryList
        rows={tradeInRows}
        onChange={setTradeInRows}
        units={activeUnits}
        scoreCtx={scoreCtx}
        job={job}
        assumptionsByRow={tradeInAssumptions}
        onAssumptionsChange={onTradeInAssumptionsChange}
      />

      {/* Package total always from Used units — never mix New MSRP into Used total */}
      <PackageTotal units={activeUnits} tradeInRows={tradeInRows} />

      {!isNew ? (
      <div className="package-cta-bar">
        <p className="package-fleet-count">
          {selectedInPackage} of {active.length} in fleet
        </p>
        <Link
          to="/intake?adjust=1"
          state={{
            intake: {
              ...intake,
              job,
              trade: pkg.trade,
              stockMode,
              tradeInEntries: tradeInRows,
            },
          }}
          className="btn btn-sm"
        >
          Adjust mix
        </Link>
      </div>
      ) : null}

      <p className="locked-foot-note">
        {TRADE_PACKAGE_COPY.scoreFoot}
        <br />
        {TRADE_PACKAGE_COPY.conceptFoot}
      </p>

      <TradePackageToast
        open={toastOpen}
        onUndo={onUndoRemove}
        onDismiss={() => setToastOpen(false)}
      />
    </div>
  )
}
