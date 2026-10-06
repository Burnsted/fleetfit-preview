import { useCompareSet } from '../lib/compareSet'

function CompareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <rect x="3.5" y="6" width="11" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="9.5" y="10" width="11" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

export default function CompareControl({ packageId, unitId, className = '' }) {
  const compare = useCompareSet()
  const selected = compare.has(packageId, unitId)

  return (
    <button
      type="button"
      className={`compare-control ${selected ? 'is-selected' : ''} ${className}`.trim()}
      aria-label="Compare"
      aria-pressed={selected}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        compare.add(packageId, unitId)
      }}
    >
      <CompareIcon />
      <span className="compare-control-label">Compare</span>
    </button>
  )
}
