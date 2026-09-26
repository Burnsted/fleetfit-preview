import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PathChrome from '../components/PathChrome'
import Wordmark from '../components/Wordmark'
import { matchPackageIdFromIntake } from '../data/package'

const TRADES = [
  'Electrical',
  'HVAC',
  'Plumbing',
  'Landscaping / lawn',
  'General contracting',
  'Other trade',
]

const REGIONS = [
  'Treasure Coast, FL',
  'South Florida',
  'Central Florida',
  'Gulf Coast, FL',
  'Other / multi-region',
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
const CAB_OPTS = ['Regular', 'Extended', 'Crew', 'Either']
const TOW_OPTS = ['None', 'Light', 'Hauls trailer', 'Not sure']
const UPFIT_OPTS = ['Ladder rack', 'Toolbox', 'Cargo rails', 'Spray liner', 'Other']
const UNITS_OPTS = [
  { value: '', label: '—' },
  { value: '1-2', label: '1–2' },
  { value: '3-5', label: '3–5' },
  { value: '6-10', label: '6–10' },
  { value: 'not-sure', label: 'Not sure' },
]
const TRADE_IN_OPTS = ['Yes', 'No', 'Not sure']

const INITIAL = {
  trade: 'Electrical',
  fleetSize: '',
  region: 'Treasure Coast, FL',
  dailyMiles: '80-120',
  overnightCharge: 'shop-l2',
  body: '',
  payload: '',
  cab: '',
  tow: '',
  upfits: [],
  unitsToReplace: '',
  tradeIn: '',
  notes: '',
}

function ChipRow({ label, options, value, onChange, multi = false }) {
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
    </div>
  )
}

export default function FleetIntake() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const adjusting = params.get('adjust') === '1'
  const [form, setForm] = useState(INITIAL)

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function onClear() {
    setForm(INITIAL)
  }

  function onSubmit(e) {
    e.preventDefault()
    const intake = {
      trade: form.trade,
      fleetSize: form.fleetSize || 'not-surveyed',
      region: form.region,
      dailyMiles: form.dailyMiles,
      overnightCharge: form.overnightCharge,
      body: form.body,
      payload: form.payload,
      cab: form.cab,
      tow: form.tow,
      upfits: form.upfits,
      unitsToReplace: form.unitsToReplace,
      tradeIn: form.tradeIn,
      notes: form.notes,
    }
    navigate(`/package/${matchPackageIdFromIntake(intake)}`, { state: { intake } })
  }

  return (
    <div className="locked-page">
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
            onChange={(e) => setField('trade', e.target.value)}
            required
          >
            {TRADES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>

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
          <span className="intake-label">Region</span>
          <select
            value={form.region}
            onChange={(e) => setField('region', e.target.value)}
            required
          >
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>

        <fieldset className="intake-fieldset">
          <legend>Work-day constraints</legend>
          <label className="intake-field">
            <span className="intake-label">Typical daily miles</span>
            <select
              value={form.dailyMiles}
              onChange={(e) => setField('dailyMiles', e.target.value)}
            >
              <option value="under-60">Under 60 mi</option>
              <option value="80-120">80–120 mi</option>
              <option value="120-180">120–180 mi</option>
              <option value="180+">180+ mi</option>
              <option value="mixed">Mixed / not sure</option>
            </select>
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
        </fieldset>

        <fieldset className="intake-fieldset intake-customize">
          <legend>What the trucks need to do</legend>
          <ChipRow
            label="Body"
            options={BODY_OPTS}
            value={form.body}
            onChange={(v) => setField('body', v)}
          />
          <ChipRow
            label="Payload"
            options={PAYLOAD_OPTS}
            value={form.payload}
            onChange={(v) => setField('payload', v)}
          />
          <ChipRow
            label="Cab"
            options={CAB_OPTS}
            value={form.cab}
            onChange={(v) => setField('cab', v)}
          />
          <ChipRow
            label="Tow"
            options={TOW_OPTS}
            value={form.tow}
            onChange={(v) => setField('tow', v)}
          />
          <ChipRow
            label="Upfits"
            options={UPFIT_OPTS}
            value={form.upfits}
            onChange={(v) => setField('upfits', v)}
            multi
          />
          <label className="intake-field">
            <span className="intake-label">Units to replace</span>
            <select
              value={form.unitsToReplace}
              onChange={(e) => setField('unitsToReplace', e.target.value)}
            >
              {UNITS_OPTS.map((o) => (
                <option key={o.label} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <ChipRow
            label="Trade-in"
            options={TRADE_IN_OPTS}
            value={form.tradeIn}
            onChange={(v) => setField('tradeIn', v)}
          />
        </fieldset>

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
