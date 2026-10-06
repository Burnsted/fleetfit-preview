/**
 * Plus / check line icon on a high-contrast circular chip for listing photos.
 * No text label, no emoji. Tap area ≥ 44×44. Stops propagation so outbound
 * seller links on the photo do not fire.
 */
export default function PhotoAddChip({
  active = false,
  onToggle,
  className = '',
  corner = 'top-right',
}) {
  if (typeof onToggle !== 'function') return null

  return (
    <button
      type="button"
      className={`photo-add-chip is-${corner}${active ? ' is-active' : ''} ${className}`.trim()}
      aria-label={active ? 'Remove from fleet' : 'Add to fleet'}
      aria-pressed={active}
      data-photo-add={active ? 'in-fleet' : 'add'}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onToggle()
      }}
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <span className="photo-add-chip-face" aria-hidden="true">
        {active ? (
          <svg className="photo-add-chip-icon" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12.5l5 5L19 7"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg className="photo-add-chip-icon" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
            />
          </svg>
        )}
      </span>
    </button>
  )
}
