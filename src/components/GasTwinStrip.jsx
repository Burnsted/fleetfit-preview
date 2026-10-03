import { useState } from 'react'
import { COPY } from '../data/gasTwin/constants'
import {
  gasTwinDisplayName,
  isRoughMatch,
  stripSpecLine,
  whyThisTwinText,
} from '../lib/gasTwin'
import { computeGasTwinEstimate } from '../lib/gasTwinMoney'
import { useGasTwin } from '../lib/gasTwinState'

/**
 * Thin strip under a vehicle card when Compare is On.
 */
export default function GasTwinStrip({ pair, vehicleLabel }) {
  const { compareOn, years, yearlyMiles, openFullComparison } = useGasTwin()
  const [whyOpen, setWhyOpen] = useState(false)

  if (!compareOn) return null

  if (!pair) {
    return (
      <aside className="gas-twin-strip is-missing" data-gas-twin-strip="missing">
        <p className="gas-twin-strip-title">{COPY.gasTwinMissing}</p>
        {vehicleLabel ? (
          <p className="gas-twin-strip-sub">{vehicleLabel}</p>
        ) : null}
      </aside>
    )
  }

  const estimate = computeGasTwinEstimate(pair, { years, yearlyMiles })
  const twinName = gasTwinDisplayName(pair)

  return (
    <aside
      className="gas-twin-strip"
      data-gas-twin-strip="ready"
      data-pair-id={pair.id}
      data-match-quality={pair.matchQuality}
    >
      <p className="gas-twin-strip-title">vs {twinName}</p>
      <div className="gas-twin-money" role="group" aria-label="Estimate">
        <div className="gas-twin-money-cell">
          <span className="gas-twin-money-label">{COPY.upfront}</span>
          <span className="gas-twin-money-value">{estimate.upfront.display}</span>
        </div>
        <div className="gas-twin-money-cell">
          <span className="gas-twin-money-label">{COPY.perYear}</span>
          <span className="gas-twin-money-value">{estimate.perYear.display}</span>
        </div>
        <div className="gas-twin-money-cell">
          <span className="gas-twin-money-label">{COPY.overNYears(years)}</span>
          <span className="gas-twin-money-value">{estimate.overYears.display}</span>
        </div>
      </div>
      {estimate.perYear.needsMiles || estimate.overYears.display === COPY.addMiles ? (
        <p className="gas-twin-miles-prompt">{COPY.addMiles}</p>
      ) : null}
      <p className="gas-twin-spec-line">{stripSpecLine(pair)}</p>
      <div className="gas-twin-strip-actions">
        <button
          type="button"
          className="gas-twin-text-link"
          aria-expanded={whyOpen}
          onClick={() => setWhyOpen((v) => !v)}
        >
          {COPY.whyThisTwin}
        </button>
        <button
          type="button"
          className="gas-twin-text-link"
          onClick={() => openFullComparison(pair.id)}
        >
          {COPY.fullComparison}
        </button>
      </div>
      {whyOpen ? (
        <div className="gas-twin-why" data-rough={isRoughMatch(pair) ? '1' : '0'}>
          <p>{whyThisTwinText(pair)}</p>
        </div>
      ) : null}
    </aside>
  )
}
