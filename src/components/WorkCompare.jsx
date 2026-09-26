import StackCard from './StackCard'

/**
 * Stacked full-width cards vs the shop's current non-EV work vehicle.
 * Default collapsed. Energy is one row. Ask lives on the EV photo.
 */
export default function WorkCompare({ current, candidates, title, packageId }) {
  return (
    <section className="work-compare is-stack" aria-labelledby="work-compare-title">
      <h2 id="work-compare-title" className="work-compare-title">
        {title}
      </h2>
      <div className="work-compare-stack" role="list">
        <div role="listitem">
          <StackCard
            kicker={current.kind}
            heading={current.heading}
            role={current.role}
            spec={current.spec}
            current
            bodyType={current.bodyType}
            showCompare={false}
          />
        </div>
        {candidates.map((col) => (
          <div key={col.id} role="listitem">
            <StackCard
              kicker={col.kicker}
              heading={col.heading}
              role={col.role}
              spec={col.spec}
              unit={col.unit}
              packageId={packageId || col.packageId}
              pickId={col.pickId}
              mileage={col.mileage ?? col.unit?.mileage}
              showCompare={Boolean(packageId || col.packageId)}
            />
          </div>
        ))}
      </div>
      <p className="work-compare-note">Dash = not on file.</p>
    </section>
  )
}
