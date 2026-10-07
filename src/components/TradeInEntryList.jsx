import {
  ADD_SOURCE_AND_DATE,
  CONDITION_OPTIONS,
  DOLLAR_AMOUNT_ERROR,
  ESTIMATE_NOT_QUOTE,
  KBB_LOOKUP_HELP,
  KBB_LOOKUP_LABEL,
  TRADE_IN_ENTRY_BUILD,
  kbbLookupLinkProps,
  missingSourceDateNote,
  parseTradeInDollar,
  rowNeedsSourceDate,
} from '../lib/tradeInEntry'

/**
 * One typed trade-in row per current vehicle (fleet size 1 to 5).
 * No KBB figures are fetched or shown.
 */
export default function TradeInEntryList({ rows, onChange, errors = {} }) {
  const list = Array.isArray(rows) ? rows : []
  const sourceNote = missingSourceDateNote(list)
  const linkProps = kbbLookupLinkProps()

  function setRowField(index, field, value) {
    const next = list.map((row, i) =>
      i === index ? { ...row, [field]: value } : row,
    )
    onChange?.(next)
  }

  return (
    <section
      className="trade-in-entry"
      aria-labelledby="trade-in-entry-title"
      data-trade-in-entry={TRADE_IN_ENTRY_BUILD}
      data-row-count={list.length}
    >
      <div className="trade-in-entry-head">
        <h2 id="trade-in-entry-title" className="trade-in-entry-title">
          Trade-in values
        </h2>
        <p className="trade-in-entry-lead">
          Type an estimate for each vehicle you are replacing. No values are
          pulled from KBB into FleetFit.
        </p>
      </div>

      {list.length === 0 ? (
        <p className="trade-in-entry-empty">Set fleet size to add trade-in rows.</p>
      ) : (
        <ul className="trade-in-entry-list">
          {list.map((row, index) => {
            const parsed = parseTradeInDollar(row.value)
            const showDollarError =
              Boolean(errors[index]) ||
              (String(row.value ?? '').trim() !== '' && !parsed.ok)
            const needsSource = rowNeedsSourceDate(row)
            return (
              <li
                key={`trade-in-row-${index}`}
                className="trade-in-entry-row"
                data-trade-in-row={index + 1}
              >
                <p className="trade-in-entry-row-label">
                  {String(row.label || '').trim() || `Vehicle ${index + 1}`}
                </p>
                <div className="trade-in-entry-fields">
                  <label>
                    Year
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      value={row.year}
                      onChange={(e) => setRowField(index, 'year', e.target.value)}
                    />
                  </label>
                  <label>
                    Make
                    <input
                      type="text"
                      autoComplete="off"
                      value={row.make}
                      onChange={(e) => setRowField(index, 'make', e.target.value)}
                    />
                  </label>
                  <label>
                    Model
                    <input
                      type="text"
                      autoComplete="off"
                      value={row.model}
                      onChange={(e) => setRowField(index, 'model', e.target.value)}
                    />
                  </label>
                  <label>
                    Mileage
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      value={row.mileage}
                      onChange={(e) => setRowField(index, 'mileage', e.target.value)}
                    />
                  </label>
                  <label>
                    Condition
                    <select
                      value={row.condition}
                      onChange={(e) => setRowField(index, 'condition', e.target.value)}
                    >
                      <option value=""> </option>
                      {CONDITION_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="trade-in-entry-value-field">
                    Trade-in value · Example
                    <span className="trade-in-entry-estimate">{ESTIMATE_NOT_QUOTE}</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={row.value}
                      aria-invalid={showDollarError ? 'true' : undefined}
                      onChange={(e) => setRowField(index, 'value', e.target.value)}
                    />
                  </label>
                  <label>
                    Source
                    <input
                      type="text"
                      autoComplete="off"
                      value={row.source}
                      onChange={(e) => setRowField(index, 'source', e.target.value)}
                    />
                  </label>
                  <label>
                    Date
                    <input
                      type="date"
                      value={row.date}
                      onChange={(e) => setRowField(index, 'date', e.target.value)}
                    />
                  </label>
                </div>

                <p className="trade-in-entry-kbb">
                  <a
                    className="trade-in-entry-kbb-link"
                    href={linkProps.href}
                    target={linkProps.target}
                    rel={linkProps.rel}
                    data-kbb-lookup="1"
                  >
                    {KBB_LOOKUP_LABEL}
                  </a>
                </p>
                <p className="trade-in-entry-kbb-help">{KBB_LOOKUP_HELP}</p>

                {showDollarError ? (
                  <p className="trade-in-entry-error" role="alert">
                    {DOLLAR_AMOUNT_ERROR}
                  </p>
                ) : null}
                {needsSource ? (
                  <p className="trade-in-entry-source-note" role="status">
                    {ADD_SOURCE_AND_DATE}
                  </p>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}

      {sourceNote ? (
        <p className="trade-in-entry-package-note" role="status" data-missing-source="1">
          {sourceNote}
        </p>
      ) : null}
    </section>
  )
}
