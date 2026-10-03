import { COPY, YEAR_OPTIONS } from '../data/gasTwin/constants'
import { useGasTwin } from '../lib/gasTwinState'
import GasTwinToggle from './GasTwinToggle'

/**
 * Years selector + yearly miles field — shown when Compare is On.
 */
export default function GasTwinControls({ showMiles = true }) {
  const { compareOn, setCompareOn, years, setYears, yearlyMiles, setYearlyMiles } =
    useGasTwin()

  return (
    <div className="gas-twin-controls" data-gas-twin-controls={compareOn ? 'on' : 'off'}>
      <GasTwinToggle value={compareOn} onChange={setCompareOn} />
      {compareOn ? (
        <div className="gas-twin-years-block">
          <span className="gas-twin-years-label">{COPY.overYears(years)}</span>
          <div className="gas-twin-years" role="group" aria-label={COPY.overYears(years)}>
            {YEAR_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                className={`gas-twin-year-btn${years === n ? ' is-active' : ''}`}
                aria-pressed={years === n}
                onClick={() => setYears(n)}
              >
                {COPY[`years${n}`] || `${n} years`}
              </button>
            ))}
          </div>
          {showMiles ? (
            <label className="gas-twin-miles">
              <span className="gas-twin-miles-label">{COPY.milesLabel}</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={yearlyMiles}
                onChange={(e) => setYearlyMiles(e.target.value)}
                aria-describedby="gas-twin-miles-help"
              />
              <span id="gas-twin-miles-help" className="gas-twin-miles-help">
                {COPY.milesHelper}
              </span>
            </label>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
