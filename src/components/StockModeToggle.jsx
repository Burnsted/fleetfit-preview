/**
 * Used | New stock toggle — 4px-corner rectangles (no pills).
 */
export default function StockModeToggle({
  value = 'Used',
  onChange,
  usedHelper,
  newHelper,
  id = 'stock-mode',
}) {
  const mode = value === 'New' ? 'New' : 'Used'
  const helper = mode === 'New' ? newHelper : usedHelper

  return (
    <div className="stock-mode-block" data-stock-mode={mode}>
      <div
        className="stock-mode-toggle"
        role="group"
        aria-label="Stock"
        id={id}
      >
        <button
          type="button"
          className={`stock-mode-btn${mode === 'Used' ? ' is-active' : ''}`}
          aria-pressed={mode === 'Used'}
          onClick={() => onChange?.('Used')}
        >
          Used
        </button>
        <button
          type="button"
          className={`stock-mode-btn${mode === 'New' ? ' is-active' : ''}`}
          aria-pressed={mode === 'New'}
          onClick={() => onChange?.('New')}
        >
          New
        </button>
      </div>
      {helper ? <p className="stock-mode-helper">{helper}</p> : null}
    </div>
  )
}
