import { WORK_SPEC_ROWS } from '../lib/workSpec'

export default function WorkSpecRows({ spec, className = '' }) {
  return (
    <dl className={`work-spec-rows ${className}`.trim()} aria-label="Work specs">
      {WORK_SPEC_ROWS.map((row) => {
        const field = spec[row.key]
        return (
          <div key={row.key} className="work-spec-row">
            <dt>{row.label}</dt>
            <dd>
              <span className={field.known ? 'work-spec-value is-known' : 'work-spec-value is-dash'}>
                {field.text}
              </span>
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
