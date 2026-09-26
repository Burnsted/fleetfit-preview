import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DEFAULT_PACKAGE_ID, getPackage } from '../data/package'
import {
  factKbbTradeIn,
  parseSpend,
  readBudget,
  writeBudget,
} from '../lib/budget'
import { formatMoney } from '../lib/fit'

export default function Budget() {
  const navigate = useNavigate()
  const saved = readBudget()
  const kbbFact = factKbbTradeIn(null, getPackage(DEFAULT_PACKAGE_ID))
  const [raw, setRaw] = useState(
    saved.maxSpend != null ? String(saved.maxSpend) : '',
  )
  const [error, setError] = useState('')

  function onSubmit(e) {
    e.preventDefault()
    const trimmed = String(raw).trim()
    if (!trimmed) {
      writeBudget({ maxSpend: null })
      navigate(`/package/${DEFAULT_PACKAGE_ID}`)
      return
    }
    const maxSpend = parseSpend(raw)
    if (maxSpend == null) {
      setError('Enter a max spend — 200k is fine. Blank is OK.')
      return
    }
    writeBudget({ maxSpend })
    navigate(`/package/${DEFAULT_PACKAGE_ID}`)
  }

  return (
    <div className="locked-page">
      <nav className="locked-crumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true"> / </span>
        <span>Budget</span>
      </nav>

      <header className="locked-page-header">
        <h1>Budget</h1>
        <p className="locked-page-lead">Type a max spend for the package. Blank is OK.</p>
      </header>

      <form className="intake-form" onSubmit={onSubmit}>
        <label className="intake-field">
          <span className="intake-label">Max spend</span>
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="200k"
            value={raw}
            onChange={(e) => {
              setRaw(e.target.value)
              setError('')
            }}
          />
          {kbbFact != null ? (
            <span className="intake-hint">
              KBB trade-in {formatMoney(kbbFact)} · counted in the envelope
            </span>
          ) : (
            <span className="intake-hint">Blank is OK — no KBB on file, none invented.</span>
          )}
        </label>

        {error ? <p className="intake-hint">{error}</p> : null}

        <div className="intake-actions">
          <button type="submit" className="btn btn-primary">
            See what fits
          </button>
        </div>
      </form>

      <p className="locked-foot-note">
        Demo · composite examples · not a real shop
      </p>
    </div>
  )
}
