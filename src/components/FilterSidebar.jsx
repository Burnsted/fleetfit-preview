import { MAKES, UPFT_TAGS, SELLER_TYPES, CAB_BED_OPTIONS } from '../data/listings'

const DEFAULTS = {
  priceMax: '',
  make: '',
  model: '',
  yearMin: '',
  yearMax: '',
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
          <label htmlFor="sohMin">Battery health min (%)</label>
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
          <label>Year</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input type="number" placeholder="Min" value={filters.yearMin}
              onChange={(e) => set('yearMin', e.target.value)} aria-label="Year min" />
            <input type="number" placeholder="Max" value={filters.yearMax}
              onChange={(e) => set('yearMax', e.target.value)} aria-label="Year max" />
          </div>
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
