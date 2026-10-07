import { computePackageTotal } from '../lib/packageTotal'

/**
 * Package total block — Total, Trade-in credit, Net, Buyer fee TBD.
 * Pass the active package slot units (M). Optional tradeInRows for typed credit.
 * Math recomputes when the set changes. No KBB figures are fetched or shown.
 */
export default function PackageTotal({ units, tradeInRows }) {
  const summary = computePackageTotal(
    units,
    tradeInRows != null ? { tradeInRows } : undefined,
  )

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
        Package total · Example
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
            <span className="package-total-example-tag">Example</span>
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
            <span className="package-total-example-tag">Example</span>
            {summary.slotCount > 0 &&
            (summary.tradeInCredit != null || !summary.creditComplete) ? (
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
            <span className="package-total-example-tag">Example</span>
            {summary.netHelper ? (
              <span className="package-total-count">{summary.netHelper}</span>
            ) : null}
          </div>
        </div>
      </div>

      <p className="package-total-fee">{summary.buyerFeeLine}</p>
    </section>
  )
}
