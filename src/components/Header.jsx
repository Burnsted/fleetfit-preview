import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import Wordmark from './Wordmark'

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/intake', label: 'Fleet intake' },
  { to: '/shop', label: 'Shop', title: 'Single trucks' },
]

function linkIsActive(pathname, to) {
  if (to === '/') return pathname === '/' || pathname === ''
  return pathname === to || pathname.startsWith(`${to}/`)
}

export default function Header() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [q, setQ] = useState(params.get('q') || '')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    setQ(params.get('q') || '')
  }, [params])

  useEffect(() => {
    if (!menuOpen) return undefined
    function onDocPointer(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    function onKey(e) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('pointerdown', onDocPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDocPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

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
        <div className="header-menu" ref={menuRef}>
          <button
            type="button"
            className="header-menu-btn"
            aria-label="Menu"
            aria-expanded={menuOpen}
            aria-controls="site-menu-list"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="burger" aria-hidden="true">
              <span /><span /><span />
            </span>
            <span className="menu-label">Menu</span>
          </button>
          {menuOpen ? (
            <nav id="site-menu-list" className="header-menu-panel" aria-label="Site menu">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`header-menu-link${linkIsActive(location.pathname, link.to) ? ' is-active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          ) : null}
        </div>

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
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              className={`header-text-link${linkIsActive(location.pathname, link.to) ? ' is-active' : ''}`}
              to={link.to}
              title={link.title}
            >
              {link.label}
            </Link>
          ))}
          <span className="badge-demo">Demo</span>
        </nav>
      </div>
    </header>
  )
}
