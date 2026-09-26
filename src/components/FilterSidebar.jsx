import { MAKES, UPFT_TAGS, SELLER_TYPES, CAB_BED_OPTIONS } from '../data/listings'

/** Multi-year options — not a thin single-year set (CLEARED search) */
export const YEAR_OPTIONS = [2020, 2021, 2022, 2023, 2024, 2025, 2026]

export const YEAR_RANGES = [
  { id: 'any', label: 'Any years', min: '', max: '' },
  { id: '2020-2026', label: '2020–2026', min: '2020', max: '2026' },
  { id: '2021-2025', label: '2021–2025', min: '2021', max: '2025' },
  { id: '2022-2025', label: '2022–2025', min: '2022', max: '2025' },
  { id: '2023-2025', label: '2023–2025', min: '2023', max: '2025' },
  { id: '2024-2026', label: '2024–2026', min: '2024', max: '2026' },
]

const DEFAULTS = {
  priceMax: '',
  make: '',
  model: '',
  yearMin: '',
  yearMax: '',
  years: [],
  yearRangeId: 'any',
  mileageMax: '',
  rangeMin: '',
  sohMin: '',
  payloadMin: '',
  cabBed: '',
  awdOnly: false,
  upfitTags: [],
  warrantyMonthsMin: '',
  chargerKwMin: '',
  sellerType: '',
  transparentOnly: false,
}

export { DEFAULTS }

export default function FilterSidebar({ filters, setFilters, open, onClose }) {
  function set(key, value) {
    setFilters((f) => ({ ...f, [key]: value }))
  }

  function toggleTag(tag) {
    setFilters((f) => {
      const has = f.upfitTags.includes(tag)
      return {
        ...f,
        upfitTags: has ? f.upfitTags.filter((t) => t !== tag) : [...f.upfitTags, tag],
      }
    })
  }

  function applyYearRange(range) {
    setFilters((f) => ({
      ...f,
      yearRangeId: range.id,
      yearMin: range.min,
      yearMax: range.max,
      years: [],
    }))
  }

  function toggleYear(year) {
    setFilters((f) => {
      const has = f.years.includes(year)
      const years = has ? f.years.filter((y) => y !== year) : [...f.years, year].sort()
      return {
        ...f,
        years,
        yearRangeId: years.length ? 'multi' : 'any',
        yearMin: '',
        yearMax: '',
      }
    })
  }

  function reset() {
    setFilters({ ...DEFAULTS })
  }

  return (
    <aside
      className={`filters-panel ${open ? 'open' : ''}`}
      aria-label="Filters"
      aria-hidden={!open}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 className="filters-title">Filter</h2>
        {onClose && (
          <button type="button" className="btn btn-sm btn-ghost" onClick={onClose} aria-label="Close filters">
            ✕
          </button>
        )}
      </div>

      {/* Work */}
      <div className="filter-section">
        <h3 className="filter-section-title">Work</h3>
        <div className="filter-group">
          <label htmlFor="payloadMin">Payload min (lb)</label>
          <input id="payloadMin" type="number" min="0" step="100" placeholder="e.g. 1800"
            value={filters.payloadMin} onChange={(e) => set('payloadMin', e.target.value)} />
        </div>
        <div className="filter-group">
          <label htmlFor="cabBed">Cab / bed</label>
          <select id="cabBed" value={filters.cabBed} onChange={(e) => set('cabBed', e.target.value)}>
            <option value="">Any</option>
            {CAB_BED_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <label className="filter-check">
          <input type="checkbox" checked={filters.awdOnly}
            onChange={(e) => set('awdOnly', e.target.checked)} />
          AWD only
        </label>
        <div className="filter-group">
          <label>Upfit tags</label>
          <div className="filter-chips">
            {UPFT_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`chip ${filters.upfitTags.includes(tag) ? 'active' : ''}`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <label htmlFor="mileageMax">Mileage max</label>
          <input id="mileageMax" type="number" min="0" step="1000" placeholder="e.g. 40000"
            value={filters.mileageMax} onChange={(e) => set('mileageMax', e.target.value)} />
        </div>
      </div>

      {/* EV */}
      <div className="filter-section">
        <h3 className="filter-section-title">EV</h3>
        <div className="filter-group">
          <label htmlFor="sohMin">Pack report min (%)</label>
          <input id="sohMin" type="number" min="0" max="100" step="1" placeholder="e.g. 90"
            value={filters.sohMin} onChange={(e) => set('sohMin', e.target.value)} />
        </div>
        <div className="filter-group">
          <label htmlFor="rangeMin">Rated range min (mi)</label>
          <input id="rangeMin" type="number" min="0" step="10" placeholder="e.g. 250"
            value={filters.rangeMin} onChange={(e) => set('rangeMin', e.target.value)} />
        </div>
        <div className="filter-group">
          <label htmlFor="chargerKwMin">Onboard charger min (kW)</label>
          <input id="chargerKwMin" type="number" min="0" step="0.1" placeholder="e.g. 11.5"
            value={filters.chargerKwMin} onChange={(e) => set('chargerKwMin', e.target.value)} />
        </div>
        <div className="filter-group">
          <label htmlFor="warrantyMonthsMin">Warranty months left (min)</label>
          <input id="warrantyMonthsMin" type="number" min="0" placeholder="Battery months"
            value={filters.warrantyMonthsMin} onChange={(e) => set('warrantyMonthsMin', e.target.value)} />
        </div>
      </div>

      {/* Trust */}
      <div className="filter-section">
        <h3 className="filter-section-title">Trust</h3>
        <div className="filter-group">
          <label htmlFor="priceMax">Ask max ($)</label>
          <input id="priceMax" type="number" min="0" step="1000" placeholder="e.g. 60000"
            value={filters.priceMax} onChange={(e) => set('priceMax', e.target.value)} />
        </div>
        <div className="filter-group">
          <label htmlFor="sellerType">Seller type</label>
          <select id="sellerType" value={filters.sellerType} onChange={(e) => set('sellerType', e.target.value)}>
            <option value="">Any</option>
            {SELLER_TYPES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
        <label className="filter-check">
          <input type="checkbox" checked={filters.transparentOnly}
            onChange={(e) => set('transparentOnly', e.target.checked)} />
          Transparent pricing only
        </label>
      </div>

      {/* Vehicle */}
      <div className="filter-section">
        <h3 className="filter-section-title">Vehicle</h3>
        <div className="filter-group">
          <label htmlFor="make">Make</label>
          <select id="make" value={filters.make} onChange={(e) => set('make', e.target.value)}>
            <option value="">Any make</option>
            {MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="model">Model contains</label>
          <input id="model" type="text" placeholder="Lightning, Silverado…"
            value={filters.model} onChange={(e) => set('model', e.target.value)} />
        </div>
        <div className="filter-group">
          <label>Year range</label>
          <div className="filter-chips year-range-chips" role="group" aria-label="Year range">
            {YEAR_RANGES.map((range) => (
              <button
                key={range.id}
                type="button"
                className={`chip ${filters.yearRangeId === range.id ? 'active' : ''}`}
                onClick={() => applyYearRange(range)}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <label>Years (multi)</label>
          <div className="filter-chips year-multi-chips" role="group" aria-label="Years multi-select">
            {YEAR_OPTIONS.map((year) => (
              <button
                key={year}
                type="button"
                className={`chip ${filters.years.includes(year) ? 'active' : ''}`}
                aria-pressed={filters.years.includes(year)}
                onClick={() => toggleYear(year)}
              >
                {year}
              </button>
            ))}
          </div>
          <span className="filter-hint">Pick several years, or a range above.</span>
        </div>
      </div>

      <div className="filter-actions">
        <button type="button" className="btn btn-sm btn-block" onClick={reset}>Reset filters</button>
        {onClose && (
          <button type="button" className="btn btn-sm btn-block btn-primary" onClick={onClose}>
            Show results
          </button>
        )}
      </div>
    </aside>
  )
}
