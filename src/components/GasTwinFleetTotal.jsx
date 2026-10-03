import { COPY } from '../data/gasTwin/constants'
import { computeFleetGasTwinTotal, computeGasTwinEstimate } from '../lib/gasTwinMoney'
import { useGasTwin } from '../lib/gasTwinState'

/**
 * Fleet-level gas twin estimate strip at the end of card strips.
 */
export default function GasTwinFleetTotal({ pairs }) {
  const { compareOn, years, yearlyMiles } = useGasTwin()
  if (!compareOn) return null

  const estimates = (pairs || []).map((pair) =>
    pair ? computeGasTwinEstimate(pair, { years, yearlyMiles }) : null,
  )
  const total = computeFleetGasTwinTotal(estimates, { years })

  return (
    <section className="gas-twin-fleet-total" data-gas-twin-fleet="1" aria-label={COPY.fleetTotal}>
      <h3 className="gas-twin-fleet-title">{COPY.fleetTotal}</h3>
      <div className="gas-twin-money" role="group">
        <div className="gas-twin-money-cell">
          <span className="gas-twin-money-label">{COPY.upfront}</span>
          <span className="gas-twin-money-value">{total.upfront}</span>
        </div>
        <div className="gas-twin-money-cell">
          <span className="gas-twin-money-label">{COPY.perYear}</span>
          <span className="gas-twin-money-value">{total.perYear}</span>
        </div>
        <div className="gas-twin-money-cell">
          <span className="gas-twin-money-label">{COPY.overNYearsAfter(years)}</span>
          <span className="gas-twin-money-value">{total.overYears}</span>
        </div>
      </div>
      <p className="gas-twin-estimate-footer">{COPY.estimateFooter}</p>
      <p className="gas-twin-insurance-note">{COPY.insuranceNote}</p>
    </section>
  )
}
