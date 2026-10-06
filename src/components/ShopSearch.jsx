import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

/** CLEARED search slice — typable search pill + button on shop */
const SEARCH_BUILD = 'search-20260926-0914'

export default function ShopSearch() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [q, setQ] = useState(params.get('q') || '')

  useEffect(() => {
    setQ(params.get('q') || '')
  }, [params])

  function onSubmit(e) {
    e.preventDefault()
    const next = new URLSearchParams(params)
    if (q.trim()) next.set('q', q.trim())
    else next.delete('q')
    navigate({ pathname: '/shop', search: next.toString() ? `?${next}` : '' })
  }

  return (
    <form
      className="shop-search-pill"
      onSubmit={onSubmit}
      role="search"
      data-search-build={SEARCH_BUILD}
      aria-label="Search inventory"
    >
      <span className="shop-search-icon" aria-hidden="true">⌕</span>
      <input
        type="search"
        className="shop-search-input"
        placeholder="Search make, model, year…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search make, model, or year"
      />
      <button type="submit" className="btn btn-sm btn-primary shop-search-btn">
        Search
      </button>
    </form>
  )
}
