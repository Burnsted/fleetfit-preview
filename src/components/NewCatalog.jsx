import NewVehicleCard from './NewVehicleCard'
import GasTwinStrip from './GasTwinStrip'
import GasTwinFleetTotal from './GasTwinFleetTotal'
import { getNewCatalog, NEW_HELPER_LINE } from '../data/newEvCatalog'
import { mapVehicleToPrimaryPair } from '../lib/gasTwin'
import { useGasTwin } from '../lib/gasTwinState'

export default function NewCatalog({ helper = NEW_HELPER_LINE }) {
  const cards = getNewCatalog()
  const { compareOn } = useGasTwin()
  const pairs = cards.map((card) => mapVehicleToPrimaryPair(card))

  return (
    <section className="new-catalog" aria-label="New EV trucks and vans" data-stock-mode="New">
      <p className="new-catalog-helper">{helper}</p>
      <ul className="new-catalog-grid">
        {cards.map((card, i) => (
          <li key={card.id} className={compareOn ? 'new-catalog-item has-gas-twin' : 'new-catalog-item'}>
            <NewVehicleCard card={card} />
            <GasTwinStrip pair={pairs[i]} vehicleLabel={card.title} />
          </li>
        ))}
      </ul>
      <GasTwinFleetTotal pairs={pairs} />
    </section>
  )
}
