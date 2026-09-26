import { displayAnnualSavings } from '../lib/savings'

export default function SavingsLine({ source, className = '' }) {
  const savings = displayAnnualSavings(source)
  return (
    <div className={`savings-line ${className}`.trim()}>
      <div className="savings-line-top">
        <span className="savings-line-label">Annual savings</span>
        <strong className={savings.known ? 'savings-line-value is-known' : 'savings-line-value is-dash'}>
          {savings.text}
        </strong>
      </div>
      <p className="savings-line-note">{savings.note}</p>
    </div>
  )
}
