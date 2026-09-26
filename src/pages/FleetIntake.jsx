import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PathChrome from '../components/PathChrome'
import Wordmark from '../components/Wordmark'
import { matchPackageIdFromIntake } from '../data/package'

/** CLEARED-FOR-WOZ-R3 · Exact Ted pick · 2026-09-26 ~10:22 */
const R3_BUILD = 'intake-r3-20260926-1422'

const TRADES = [
  'Electrical',
  'HVAC',
  'Plumbing',
  'Landscaping / lawn',
  'General contracting',
  'Other',
]

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
  { value: '', label: '—' },
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
  { value: 'Not sure', label: 'Not sure' },
]

const ABRP_URL = 'https://abetterrouteplanner.com/'

const INITIAL = {
  trade: 'Electrical',
  tradeOther: '',
  fleetSize: '',
  address: '',
  dailyMiles: '',
  overnightCharge: 'shop-l2',
  body: '',
  payload: '',
  cab: '',
  haul: '',
  upfits: [],
  units: [],
  tradeIn: '',
  tradeInModel: '',
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

  function onTradeInChange(value) {
    setForm((prev) => ({
      ...prev,
      tradeIn: value,
      tradeInModel: value === 'Yes' ? prev.tradeInModel : '',
    }))
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
    const intake = {
      trade: tradeValue,
      tradeOther: form.trade === 'Other' ? form.tradeOther.trim() : '',
      fleetSize: form.fleetSize || 'not-surveyed',
      address: form.address.trim(),
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
    }
    navigate(`/package/${matchPackageIdFromIntake(intake)}`, { state: { intake } })
  }

  return (
    <div className="locked-page" data-cleared={R3_BUILD}>
      <PathChrome active="intake" className="path-chrome-intake" />

      <header className="locked-page-header">
        <p className="locked-eyebrow locked-eyebrow-mark">
          <Wordmark size="eyebrow" tone="light" decorative />
          <span>Fleet swap</span>
        </p>
        <h1>{adjusting ? 'Adjust the mix' : 'Tell us about the work day'}</h1>
        <p className="locked-page-lead">
          We’ll match a used EV package to the work day.
        </p>
      </header>

      <form className="intake-form" onSubmit={onSubmit}>
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
          <span className="intake-hint">Blank is fine.</span>
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
            placeholder="Miles per unit…"
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
          <span className="intake-hint">
            Sketch the day so range isn’t a guess.
          </span>
          {form.mapSketched ? (
            <span className="intake-hint intake-map-echo" role="status">
              Day sketch noted for this preview.
            </span>
          ) : null}
        </div>

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
          <span className="intake-hint">Add each unit you want to replace.</span>
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
          label="Payload"
          options={PAYLOAD_OPTS}
          value={form.payload}
          onChange={(v) => setField('payload', v)}
          helper="Weight band — not a typed number alone."
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
            <option value="">—</option>
            {HAUL_OPTS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <span className="intake-hint">Trailer type only — not a full build.</span>
        </label>

        <ChipRow
          label="Upfits"
          options={UPFIT_OPTS}
          value={form.upfits}
          onChange={(v) => setField('upfits', v)}
          multi
        />

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
            <span className="intake-label">Trade-in model</span>
            <input
              type="text"
              value={form.tradeInModel}
              onChange={(e) => setField('tradeInModel', e.target.value)}
              placeholder="Year make model…"
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
          <p className="intake-hint">
            We’ll build from what you set above. Blanks stay open.
          </p>
          <button type="button" className="btn btn-ghost" onClick={onClear}>
            Clear
          </button>
        </div>
      </form>
    </div>
  )
}
