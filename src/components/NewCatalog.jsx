import NewVehicleCard from './NewVehicleCard'
import { getNewCatalog, NEW_HELPER_LINE } from '../data/newEvCatalog'

export default function NewCatalog({ helper = NEW_HELPER_LINE }) {
  const cards = getNewCatalog()

  return (
    <section className="new-catalog" aria-label="New EV trucks and vans" data-stock-mode="New">
      <p className="new-catalog-helper">{helper}</p>
      <ul className="new-catalog-grid">
        {cards.map((card) => (
          <li key={card.id}>
            <NewVehicleCard card={card} />
          </li>
        ))}
      </ul>
    </section>
  )
}
