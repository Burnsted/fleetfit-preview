import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Wordmark from './Wordmark'

export default function Header() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
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

  const onBrowse = location.pathname === '/shop'

  return (
    <header className="site-header">
      <div className="header-inner">
        <button
          type="button"
          className="header-menu-btn"
          aria-label="Menu"
          onClick={() => navigate('/intake')}
        >
          <span className="burger" aria-hidden="true">
            <span /><span /><span />
          </span>
          <span className="menu-label">Menu</span>
        </button>

        {onBrowse && (
          <form className="header-search" onSubmit={onSubmit} role="search">
            <div className="search-input-wrap">
              <span aria-hidden="true" style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>⌕</span>
              <input
                type="search"
                placeholder="Search make, model, upfit…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Search inventory"
              />
            </div>
          </form>
        )}

        <Link to="/" className="logo" aria-label="FleetFit">
          <Wordmark size="nav" tone="light" decorative />
        </Link>

        <nav className="header-nav" aria-label="Primary">
          <Link className="header-text-link" to="/intake">
            Fleet intake
          </Link>
          <Link className="header-text-link" to="/shop" title="Single trucks">
            Shop
          </Link>
          <span className="badge-demo">Demo</span>
        </nav>
      </div>
    </header>
  )
}
