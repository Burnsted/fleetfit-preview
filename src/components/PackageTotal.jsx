import { computePackageTotal, NOT_CONFIRMED } from '../lib/packageTotal'

/**
 * Package total block — Total, Trade-in credit, Net, Buyer fee TBD.
 * Pass the active package slot units (M). Math recomputes when the set changes.
 */
export default function PackageTotal({ units }) {
  const summary = computePackageTotal(units)

  return (
    <section
      className="package-total"
      aria-labelledby="package-total-title"
      data-package-total="1"
      data-slot-count={summary.slotCount}
      data-ask-count={summary.askCount}
      data-credit-count={summary.creditCount}
    >
      <h2 id="package-total-title" className="package-total-title">
        Package total
      </h2>

      <div className="package-total-rows">
        <div className="package-total-row">
          <span className="package-total-label">Total</span>
          <div className="package-total-value-wrap">
            <span
              className={`package-total-value${summary.total == null ? ' is-pending' : ''}`}
            >
              {summary.totalDisplay}
            </span>
            {summary.total != null ? (
              <span className="package-total-count">{summary.askCountLabel}</span>
            ) : null}
          </div>
        </div>

        <div className="package-total-row">
          <span className="package-total-label">Trade-in credit</span>
          <div className="package-total-value-wrap">
            <span
              className={`package-total-value${summary.tradeInCredit == null ? ' is-pending' : ''}`}
            >
              {summary.tradeInDisplay}
            </span>
            {summary.tradeInCredit != null ? (
              <span className="package-total-count">{summary.creditCountLabel}</span>
            ) : null}
          </div>
        </div>

        <div className="package-total-row is-net">
          <span className="package-total-label">Net</span>
          <div className="package-total-value-wrap">
            <span
              className={`package-total-value is-net${summary.net == null ? ' is-pending' : ''}`}
            >
              {summary.netDisplay}
            </span>
          </div>
        </div>
      </div>

      <p className="package-total-fee">{summary.buyerFeeLine}</p>
      <span className="visually-hidden">
        {summary.net == null ? `Net ${NOT_CONFIRMED}` : null}
      </span>
    </section>
  )
}
