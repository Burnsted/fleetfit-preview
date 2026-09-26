import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LISTINGS, distanceFromHome } from '../data/listings'
import FilterSidebar, { DEFAULTS } from '../components/FilterSidebar'
import ListingCard from '../components/ListingCard'

const SORTS = [
  { id: 'newest', label: 'Recommended' },
  { id: 'price-asc', label: 'Price: low → high' },
  { id: 'price-desc', label: 'Price: high → low' },
  { id: 'mileage', label: 'Mileage: low → high' },
  { id: 'range', label: 'Range: high → low' },
  { id: 'soh', label: 'Battery health: high → low' },
  { id: 'closest', label: 'Closest (WPB, FL)' },
]

function num(v) {
  if (v === '' || v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function applyFilters(listings, filters, q) {
  const query = (q || '').trim().toLowerCase()
  return listings.filter((l) => {
    if (query) {
      const hay = [
        l.year, l.make, l.model, l.trim, l.location.city, l.location.state,
        l.upfitDescription, ...(l.upfitTags || []), l.sellerType, l.vin,
      ].join(' ').toLowerCase()
      if (!hay.includes(query)) return false
    }

    const priceMax = num(filters.priceMax)
    if (priceMax != null) {
      if (l.allInPrice == null) return false
      if (l.allInPrice > priceMax) return false
    }

    if (filters.make && l.make !== filters.make) return false
    if (filters.model) {
      const m = filters.model.toLowerCase()
      if (!`${l.model} ${l.trim}`.toLowerCase().includes(m)) return false
    }

    const yearMin = num(filters.yearMin)
    const yearMax = num(filters.yearMax)
    if (yearMin != null && l.year < yearMin) return false
    if (yearMax != null && l.year > yearMax) return false

    const mileageMax = num(filters.mileageMax)
    if (mileageMax != null && l.mileage > mileageMax) return false

    const rangeMin = num(filters.rangeMin)
    if (rangeMin != null && l.ratedRange < rangeMin) return false

    const sohMin = num(filters.sohMin)
    if (sohMin != null) {
      if (l.soh == null) return false
      if (l.soh < sohMin) return false
    }

    const payloadMin = num(filters.payloadMin)
    if (payloadMin != null && l.payload < payloadMin) return false

    if (filters.cabBed) {
      const key = `${l.cab} / ${l.bed}`
      if (key !== filters.cabBed) return false
    }

    if (filters.awdOnly && !l.awd) return false

    if (filters.upfitTags.length) {
      if (!filters.upfitTags.every((t) => l.upfitTags.includes(t))) return false
    }

    const wMin = num(filters.warrantyMonthsMin)
    if (wMin != null && l.warrantyBatteryMonths < wMin) return false

    const chMin = num(filters.chargerKwMin)
    if (chMin != null && l.onboardChargerKw < chMin) return false

    if (filters.sellerType && l.sellerType !== filters.sellerType) return false

    if (filters.transparentOnly) {
      if (!l.feesKnown || l.allInPrice == null) return false
    }

    return true
  })
}

function sortListings(listings, sort) {
  const arr = [...listings]
  switch (sort) {
    case 'newest':
      return arr.sort((a, b) => a.listedDaysAgo - b.listedDaysAgo)
    case 'price-asc':
      return arr.sort((a, b) => (a.allInPrice ?? 1e12) - (b.allInPrice ?? 1e12))
    case 'price-desc':
      return arr.sort((a, b) => (b.allInPrice ?? -1) - (a.allInPrice ?? -1))
    case 'mileage':
      return arr.sort((a, b) => a.mileage - b.mileage)
    case 'range':
      return arr.sort((a, b) => b.ratedRange - a.ratedRange)
    case 'soh':
      return arr.sort((a, b) => (b.soh ?? -1) - (a.soh ?? -1))
    case 'closest':
      return arr.sort((a, b) => distanceFromHome(a) - distanceFromHome(b))
    default:
      return arr
  }
}

export default function Browse() {
  const [params] = useSearchParams()
  const q = params.get('q') || ''
  const [filters, setFilters] = useState({ ...DEFAULTS })
  const [sort, setSort] = useState('newest')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  useEffect(() => {
    if (!filtersOpen) return
    const onKey = (e) => { if (e.key === 'Escape') setFiltersOpen(false) }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [filtersOpen])

  const results = useMemo(() => {
    const filtered = applyFilters(LISTINGS, filters, q)
    return sortListings(filtered, sort)
  }, [filters, q, sort])

  const sortLabel = SORTS.find((s) => s.id === sort)?.label || 'Recommended'

  return (
    <div className="browse-layout">
      <div className="browse-hero">
        <h1>Used EV fleet packages.</h1>
        <p className="browse-sub">Used EV fleet packages that fit the work day · asking · fee at checkout TBD. <a href="#/" style={{color:'var(--cyan)'}}>Home</a></p>
      </div>

      <div className="browse-chrome">
        <button
          type="button"
          className="btn btn-pill"
          onClick={() => { setFiltersOpen(true); setSortOpen(false) }}
          aria-expanded={filtersOpen}
        >
          <span className="pill-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M4 6h16M7 12h10M10 18h4" />
            </svg>
          </span>
          Filter
        </button>
        <button
          type="button"
          className="btn btn-pill"
          onClick={() => setSortOpen((o) => !o)}
          aria-expanded={sortOpen}
        >
          <span className="pill-icon" aria-hidden="true">
            <svg width="14" height="16" viewBox="0 0 14 18" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M7 1v16M3 5l4-4 4 4M3 13l4 4 4-4" />
            </svg>
          </span>
          {sortLabel}
        </button>
      </div>

      {sortOpen && (
        <div className="sort-panel" role="listbox" aria-label="Sort options">
          {SORTS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={sort === s.id ? 'active' : ''}
              onClick={() => { setSort(s.id); setSortOpen(false) }}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      <div
        className={`filters-backdrop ${filtersOpen ? 'open' : ''}`}
        onClick={() => setFiltersOpen(false)}
        aria-hidden="true"
      />
      <FilterSidebar
        filters={filters}
        setFilters={setFilters}
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
      />

      <section>
        <div className="results-toolbar">
          <div className="results-count">
            <strong>{results.length}</strong> of {LISTINGS.length} trucks
            {q ? <> matching “{q}”</> : null}
          </div>
        </div>

        {results.length === 0 ? (
          <div className="empty-state">
            <p>No trucks match these filters.</p>
            <p style={{ fontSize: '0.85rem' }}>Try lowering battery health min, payload, or clearing transparent pricing.</p>
          </div>
        ) : (
          <div className="listing-grid">
            {results.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
