import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PathChrome from '../components/PathChrome'
import StockModeToggle from '../components/StockModeToggle'
import Wordmark from '../components/Wordmark'
import { matchPackageIdFromIntake } from '../data/package'
import {
  NEW_RESULTS_HELPER,
  USED_HELPER_LINE,
} from '../data/newEvCatalog'

/** CLEARED Score v2 intake fields + Supervisor preset + stockMode */
const INTAKE_BUILD = 'intake-trade-stock-20261001'

/** Trade preset rectangles (mock / CLEARED). Landscaping maps to Landscaping / lawn seed. */
const TRADE_PRESETS = ['Electrical', 'HVAC', 'Plumbing', 'Landscaping']

const TRADES = [
  'Electrical',
  'HVAC',
  'Plumbing',
  'Landscaping / lawn',
  'General contracting',
  'Other',
]

function tradeToFormValue(preset) {
  if (preset === 'Landscaping') return 'Landscaping / lawn'
  return preset
}

function formTradeToPreset(trade) {
  if (/landscap|lawn/i.test(trade || '')) return 'Landscaping'
  if (TRADE_PRESETS.includes(trade)) return trade
  return null
}

const FLEET_SIZE_OPTIONS = [
  { value: '', label: 'Not surveyed yet' },
  { value: '1-2', label: '1–2 vehicles' },
  { value: '3-5', label: '3–5 vehicles (typical package)' },
  { value: '6-10', label: '6–10 vehicles' },
  { value: '10+', label: 'More than 10' },
]

const BODY_OPTS = ['Van', 'Pickup', 'Either']
const PAYLOAD_OPTS = ['Light', 'Medium', 'Heavy', 'Not sure']
const CAB_OPTS = ['Double', 'Crew']
const HAUL_OPTS = [
  'None',
  'Open trailer',
  'Enclosed trailer',
  'Gooseneck',
  'Not sure',
]
const UPFIT_OPTS = ['Ladder rack', 'Toolbox', 'Cargo rails', 'Other']
const TRADE_IN_OPTS = [
  { value: '', label: 'Not entered' },
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
  { value: 'Not sure', label: 'Not sure' },
]
const SHOP_CITIES = ['Vero Beach', 'Fort Pierce', 'West Palm Beach']
const ROLE_PRESETS = [
  { value: '', label: 'No preset' },
  { value: 'Supervisor / team lead', label: 'Supervisor / team lead' },
]

const ABRP_URL = 'https://abetterrouteplanner.com/'

const INITIAL = {
  trade: 'Electrical',
  tradeOther: '',
  stockMode: 'Used',
  fleetSize: '',
  address: '',
  shopCity: '',
  dailyMiles: '',
  loadLb: '',
  cargoCuFt: '',
  crew: '',
  tows: '',
  trailerLb: '',
  wdh: '',
  overnightCharge: 'shop-l2',
  body: '',
  payload: '',
  cab: '',
  haul: '',
  upfits: [],
  units: [],
  tradeIn: '',
  tradeInModel: '',
  currentYear: '',
  currentMake: '',
  currentModel: '',
  currentEngine: '',
  currentDrivetrain: '',
  currentMiles: '',
  rolePreset: '',
  notes: '',
  mapSketched: false,
}

let unitSeq = 0
function nextUnitId() {
  unitSeq += 1
  return `unit-${Date.now()}-${unitSeq}`
}

function ChipRow({ label, options, value, onChange, multi = false, helper }) {
  return (
    <div className="intake-field">
      <span className="intake-label">{label}</span>
      <div className="filter-chips intake-chips" role="group" aria-label={label}>
        {options.map((opt) => {
          const active = multi ? value.includes(opt) : value === opt
          return (
            <button
              key={opt}
              type="button"
              className={`chip${active ? ' active' : ''}`}
              aria-pressed={active}
              onClick={() => {
                if (multi) {
                  onChange(
                    active ? value.filter((v) => v !== opt) : [...value, opt],
                  )
                } else {
                  onChange(active ? '' : opt)
                }
              }}
            >
              {opt}
            </button>
          )
        })}
      </div>
      {helper ? <span className="intake-hint">{helper}</span> : null}
    </div>
  )
}

export default function FleetIntake() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const adjusting = params.get('adjust') === '1'
  const [form, setForm] = useState(INITIAL)
  const showTradeOther = form.trade === 'Other'
  const showTradeInModel = form.tradeIn === 'Yes'
  const showTowFields = form.tows === 'yes' || (form.tows === '' && form.haul && form.haul !== 'None')

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function onTradeChange(value) {
    setForm((prev) => ({
      ...prev,
      trade: value,
      tradeOther: value === 'Other' ? prev.tradeOther : '',
    }))
  }

  function onTradePreset(preset) {
    setForm((prev) => ({
      ...prev,
      trade: tradeToFormValue(preset),
      tradeOther: '',
    }))
  }

  function onStockMode(mode) {
    setField('stockMode', mode === 'New' ? 'New' : 'Used')
  }

  function onTradeInChange(value) {
    setForm((prev) => ({
      ...prev,
      tradeIn: value,
      tradeInModel: value === 'Yes' ? prev.tradeInModel : '',
    }))
  }

  function applySupervisorPreset() {
    setForm((prev) => ({
      ...prev,
      rolePreset: 'Supervisor / team lead',
      crew: '2',
      tows: 'no',
      haul: 'None',
      trailerLb: '',
      wdh: '',
      // Daily miles and load still come from intake; preset never invents them
    }))
  }

  function onRolePreset(value) {
    if (value === 'Supervisor / team lead') {
      applySupervisorPreset()
    } else {
      setField('rolePreset', value)
    }
  }

  function addUnit() {
    setForm((prev) => ({
      ...prev,
      units: [...prev.units, { id: nextUnitId() }],
    }))
  }

  function removeUnit(id) {
    setForm((prev) => ({
      ...prev,
      units: prev.units.filter((u) => u.id !== id),
    }))
  }

  function onMapMyDay() {
    setField('mapSketched', true)
  }

  function onClear() {
    setForm(INITIAL)
  }

  function onSubmit(e) {
    e.preventDefault()
    const tradeValue =
      form.trade === 'Other'
        ? form.tradeOther.trim() || 'Other'
        : form.trade

    const tows =
      form.tows === 'yes'
        ? true
        : form.tows === 'no'
          ? false
          : form.haul === 'None' || form.haul === ''
            ? false
            : form.haul === 'Not sure'
              ? null
              : true

    const loadFromBand =
      form.loadLb.trim() ||
      (form.payload === 'Light'
        ? '500'
        : form.payload === 'Medium'
          ? '1000'
          : form.payload === 'Heavy'
            ? '1500'
            : '')

    const stockMode = form.stockMode === 'New' ? 'New' : 'Used'
    const intake = {
      trade: tradeValue,
      tradeOther: form.trade === 'Other' ? form.tradeOther.trim() : '',
      stockMode,
      fleetSize: form.fleetSize || 'not-surveyed',
      address: form.address.trim(),
      shopCity: form.shopCity || undefined,
      dailyMiles: form.dailyMiles.trim(),
      overnightCharge: form.overnightCharge,
      body: form.body,
      payload: form.payload,
      cab: form.cab,
      haul: form.haul,
      upfits: form.upfits,
      units: form.units.map((u) => u.id),
      tradeIn: form.tradeIn,
      tradeInModel: form.tradeIn === 'Yes' ? form.tradeInModel : '',
      notes: form.notes,
      mapSketched: form.mapSketched,
      rolePreset: form.rolePreset || undefined,
      job: {
        dailyMiles: form.dailyMiles.trim() ? Number(form.dailyMiles.trim()) : null,
        loadLb: loadFromBand ? Number(loadFromBand) : null,
        cargoCuFt: form.cargoCuFt.trim() ? Number(form.cargoCuFt.trim()) : null,
        crew: form.crew.trim() ? Number(form.crew.trim()) : null,
        tows,
        trailerLb: form.trailerLb.trim() ? Number(form.trailerLb.trim()) : null,
        wdh: form.wdh === 'yes' ? true : form.wdh === 'no' ? false : null,
        shopCity: form.shopCity || null,
      },
      current: {
        year: form.currentYear.trim() ? Number(form.currentYear.trim()) : null,
        make: form.currentMake.trim() || null,
        model: form.currentModel.trim() || null,
        engine: form.currentEngine.trim() || null,
        drivetrain: form.currentDrivetrain.trim() || null,
        miles: form.currentMiles.trim() ? Number(form.currentMiles.trim()) : null,
      },
      currentYear: form.currentYear.trim() || undefined,
      currentMake: form.currentMake.trim() || undefined,
      currentModel: form.currentModel.trim() || undefined,
      currentEngine: form.currentEngine.trim() || undefined,
      currentDrivetrain: form.currentDrivetrain.trim() || undefined,
      currentMiles: form.currentMiles.trim() || undefined,
      loadLb: loadFromBand || undefined,
      crew: form.crew.trim() || undefined,
      tows,
      trailerLb: form.trailerLb.trim() || undefined,
      wdh: form.wdh === 'yes' ? true : form.wdh === 'no' ? false : undefined,
    }
    navigate(`/package/${matchPackageIdFromIntake(intake)}`, { state: { intake } })
  }

  const activePreset = formTradeToPreset(form.trade)
  const stockMode = form.stockMode === 'New' ? 'New' : 'Used'

  return (
    <div className="locked-page" data-cleared={INTAKE_BUILD} data-stock-mode={stockMode}>
      <PathChrome active="intake" className="path-chrome-intake" />

      <header className="locked-page-header">
        <p className="locked-eyebrow locked-eyebrow-mark">
          <Wordmark size="eyebrow" tone="light" decorative />
          <span>Fleet swap</span>
        </p>
        <h1>{adjusting ? 'Adjust the mix' : 'Fleet intake'}</h1>
        <p className="locked-page-lead">
          Choose a trade preset and Used or New stock.
        </p>
      </header>

      <form className="intake-form" onSubmit={onSubmit}>
        <div className="intake-field intake-trade-preset" data-trade-preset="1">
          <span className="intake-label">Trade preset</span>
          <div className="intake-preset-row" role="group" aria-label="Trade preset">
            {TRADE_PRESETS.map((preset) => {
              const active = activePreset === preset
              return (
                <button
                  key={preset}
                  type="button"
                  className={`intake-preset-btn${active ? ' is-active' : ''}`}
                  aria-pressed={active}
                  onClick={() => onTradePreset(preset)}
                >
                  {preset}
                </button>
              )
            })}
          </div>
        </div>

        <div className="intake-field intake-stock-field">
          <span className="intake-label">Stock</span>
          <StockModeToggle
            value={stockMode}
            onChange={onStockMode}
            usedHelper={USED_HELPER_LINE}
            newHelper={NEW_RESULTS_HELPER}
          />
        </div>

        <label className="intake-field">
          <span className="intake-label">Role preset</span>
          <select
            value={form.rolePreset}
            onChange={(e) => onRolePreset(e.target.value)}
          >
            {ROLE_PRESETS.map((o) => (
              <option key={o.label} value={o.value}>{o.label}</option>
            ))}
          </select>
          <span className="intake-hint">
            Supervisor / team lead: crew 2, no tow. Daily miles and load stay yours.
          </span>
        </label>

        <label className="intake-field">
          <span className="intake-label">Trade</span>
          <select
            value={form.trade}
            onChange={(e) => onTradeChange(e.target.value)}
            required
          >
            {TRADES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>

        {showTradeOther && (
          <label className="intake-field">
            <span className="intake-label">Your trade</span>
            <input
              type="text"
              value={form.tradeOther}
              onChange={(e) => setField('tradeOther', e.target.value)}
              placeholder="Type your trade…"
              autoComplete="off"
            />
          </label>
        )}

        <label className="intake-field">
          <span className="intake-label">Fleet size</span>
          <select
            value={form.fleetSize}
            onChange={(e) => setField('fleetSize', e.target.value)}
          >
            {FLEET_SIZE_OPTIONS.map((o) => (
              <option key={o.label} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>

        <label className="intake-field">
          <span className="intake-label">Shop / home-base city</span>
          <select
            value={form.shopCity}
            onChange={(e) => setField('shopCity', e.target.value)}
          >
            <option value="">Not entered</option>
            {SHOP_CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        <label className="intake-field">
          <span className="intake-label">Address</span>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setField('address', e.target.value)}
            placeholder="Shop or depot address…"
            autoComplete="street-address"
          />
        </label>

        <div className="intake-field">
          <label className="intake-miles-label" htmlFor="intake-daily-miles">
            <span className="intake-label">Typical day miles</span>
          </label>
          <input
            id="intake-daily-miles"
            type="text"
            inputMode="numeric"
            value={form.dailyMiles}
            onChange={(e) => setField('dailyMiles', e.target.value)}
            placeholder="e.g. 120"
            autoComplete="off"
          />
          <div className="intake-map-actions">
            <button
              type="button"
              className="btn btn-primary intake-map-primary"
              onClick={onMapMyDay}
            >
              Map my day
            </button>
            <a
              className="intake-map-alt"
              href={ABRP_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Map in ABRP
            </a>
          </div>
          {form.mapSketched ? (
            <span className="intake-hint intake-map-echo" role="status">
              Day sketch noted for this preview.
            </span>
          ) : null}
        </div>

        <label className="intake-field">
          <span className="intake-label">Load (lb)</span>
          <input
            type="text"
            inputMode="numeric"
            value={form.loadLb}
            onChange={(e) => setField('loadLb', e.target.value)}
            placeholder="Top of payload bracket, e.g. 1000"
            autoComplete="off"
          />
        </label>

        <label className="intake-field">
          <span className="intake-label">Crew size</span>
          <input
            type="text"
            inputMode="numeric"
            value={form.crew}
            onChange={(e) => setField('crew', e.target.value)}
            placeholder="People riding"
            autoComplete="off"
          />
        </label>

        <label className="intake-field">
          <span className="intake-label">Current vehicle tows?</span>
          <select
            value={form.tows}
            onChange={(e) => setField('tows', e.target.value)}
          >
            <option value="">Not entered</option>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </label>

        {showTowFields ? (
          <>
            <label className="intake-field">
              <span className="intake-label">Trailer weight (lb)</span>
              <input
                type="text"
                inputMode="numeric"
                value={form.trailerLb}
                onChange={(e) => setField('trailerLb', e.target.value)}
                placeholder="Stated trailer weight"
                autoComplete="off"
              />
            </label>
            <label className="intake-field">
              <span className="intake-label">Weight-distributing hitch?</span>
              <select
                value={form.wdh}
                onChange={(e) => setField('wdh', e.target.value)}
              >
                <option value="">Not entered</option>
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </label>
          </>
        ) : null}

        <label className="intake-field">
          <span className="intake-label">Cargo volume need (cu ft, vans)</span>
          <input
            type="text"
            inputMode="numeric"
            value={form.cargoCuFt}
            onChange={(e) => setField('cargoCuFt', e.target.value)}
            placeholder="Optional"
            autoComplete="off"
          />
        </label>

        <label className="intake-field">
          <span className="intake-label">Overnight charging</span>
          <select
            value={form.overnightCharge}
            onChange={(e) => setField('overnightCharge', e.target.value)}
          >
            <option value="shop-l2">Shop Level 2 available</option>
            <option value="home-l2">Home / depot L2 mixed</option>
            <option value="l1-only">Level 1 only today</option>
            <option value="unknown">Not surveyed yet</option>
          </select>
        </label>

        <ChipRow
          label="Body"
          options={BODY_OPTS}
          value={form.body}
          onChange={(v) => setField('body', v)}
        />

        <div className="intake-field intake-add-unit">
          <button
            type="button"
            className="btn intake-add-unit-btn"
            onClick={addUnit}
          >
            <span className="intake-add-unit-plus" aria-hidden="true">+</span>
            Add unit
          </button>
          {form.units.length > 0 ? (
            <ul className="intake-unit-list" aria-label="Added units">
              {form.units.map((unit, index) => (
                <li key={unit.id} className="intake-unit-chip">
                  <span>Unit {index + 1}</span>
                  <button
                    type="button"
                    className="intake-unit-remove"
                    onClick={() => removeUnit(unit.id)}
                    aria-label={`Remove unit ${index + 1}`}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <ChipRow
          label="Payload band"
          options={PAYLOAD_OPTS}
          value={form.payload}
          onChange={(v) => setField('payload', v)}
          helper="Used when Load (lb) is blank: Light 500 / Medium 1000 / Heavy 1500."
        />

        <ChipRow
          label="Cab"
          options={CAB_OPTS}
          value={form.cab}
          onChange={(v) => setField('cab', v)}
        />

        <label className="intake-field">
          <span className="intake-label">Haul</span>
          <select
            value={form.haul}
            onChange={(e) => setField('haul', e.target.value)}
          >
            <option value="">Not entered</option>
            {HAUL_OPTS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </label>

        <ChipRow
          label="Upfits"
          options={UPFIT_OPTS}
          value={form.upfits}
          onChange={(v) => setField('upfits', v)}
          multi
        />

        <fieldset className="intake-field intake-current-vehicle">
          <legend className="intake-label">Current vehicle (replaced)</legend>
          <div className="intake-current-grid">
            <label>
              <span className="intake-label">Year</span>
              <input
                type="text"
                inputMode="numeric"
                value={form.currentYear}
                onChange={(e) => setField('currentYear', e.target.value)}
                placeholder="2018"
              />
            </label>
            <label>
              <span className="intake-label">Make</span>
              <input
                type="text"
                value={form.currentMake}
                onChange={(e) => setField('currentMake', e.target.value)}
                placeholder="Ford"
              />
            </label>
            <label>
              <span className="intake-label">Model</span>
              <input
                type="text"
                value={form.currentModel}
                onChange={(e) => setField('currentModel', e.target.value)}
                placeholder="F-150"
              />
            </label>
            <label>
              <span className="intake-label">Engine</span>
              <input
                type="text"
                value={form.currentEngine}
                onChange={(e) => setField('currentEngine', e.target.value)}
                placeholder="3.5 EcoBoost"
              />
            </label>
            <label>
              <span className="intake-label">Drivetrain</span>
              <input
                type="text"
                value={form.currentDrivetrain}
                onChange={(e) => setField('currentDrivetrain', e.target.value)}
                placeholder="4x4"
              />
            </label>
            <label>
              <span className="intake-label">Odometer (mi)</span>
              <input
                type="text"
                inputMode="numeric"
                value={form.currentMiles}
                onChange={(e) => setField('currentMiles', e.target.value)}
                placeholder="120000"
              />
            </label>
          </div>
        </fieldset>

        <label className="intake-field">
          <span className="intake-label">Trade-in</span>
          <select
            value={form.tradeIn}
            onChange={(e) => onTradeInChange(e.target.value)}
          >
            {TRADE_IN_OPTS.map((o) => (
              <option key={o.label} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>

        {showTradeInModel && (
          <label className="intake-field">
            <span className="intake-label">Trade-in model (free text)</span>
            <input
              type="text"
              value={form.tradeInModel}
              onChange={(e) => setField('tradeInModel', e.target.value)}
              placeholder="2018 Ford F-150 3.5 EcoBoost 4x4"
              autoComplete="off"
            />
          </label>
        )}

        <label className="intake-field">
          <span className="intake-label">Notes (optional)</span>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => setField('notes', e.target.value)}
            placeholder="Anything else about the routes or crew…"
          />
        </label>

        <div className="intake-actions">
          <button type="submit" className="btn btn-primary">
            Match a package
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClear}>
            Clear
          </button>
        </div>
      </form>
    </div>
  )
}
