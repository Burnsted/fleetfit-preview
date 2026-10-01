import { useFleetPick } from '../lib/fleetPick'

export default function AddToFleetButton({ pickId, size = '' }) {
  const fleet = useFleetPick()
  const inFleet = fleet.has(pickId)

  return (
    <button
      type="button"
      className={`btn ${size} ${inFleet ? 'btn-in-fleet' : 'btn-primary'}`.trim()}
      aria-pressed={inFleet}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        fleet.toggle(pickId)
      }}
    >
      {inFleet ? (
        <>
          <span className="in-fleet-check" aria-hidden="true">✓</span>
          In fleet
        </>
      ) : (
        'Add to fleet'
      )}
    </button>
  )
}
