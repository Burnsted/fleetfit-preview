import { COPY } from '../data/gasTwin/constants'

/**
 * Compare with gas twin Off | On — same visual style as StockModeToggle (4px rectangles).
 */
export default function GasTwinToggle({
  value = false,
  onChange,
  id = 'gas-twin-compare',
}) {
  const on = value === true || value === 'On'

  return (
    <div className="gas-twin-toggle-block" data-gas-twin={on ? 'On' : 'Off'}>
      <span className="gas-twin-toggle-label" id={`${id}-label`}>
        {COPY.controlLabel}
      </span>
      <div
        className="gas-twin-toggle"
        role="group"
        aria-labelledby={`${id}-label`}
        id={id}
      >
        <button
          type="button"
          className={`gas-twin-btn${!on ? ' is-active' : ''}`}
          aria-pressed={!on}
          onClick={() => onChange?.(false)}
        >
          {COPY.off}
        </button>
        <button
          type="button"
          className={`gas-twin-btn${on ? ' is-active' : ''}`}
          aria-pressed={on}
          onClick={() => onChange?.(true)}
        >
          {COPY.on}
        </button>
      </div>
    </div>
  )
}
