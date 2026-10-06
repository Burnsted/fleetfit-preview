import { displayAnnualSavings } from '../lib/savings'

export default function SavingsLine({ source, className = '' }) {
  const savings = displayAnnualSavings(source)
  return (
    <div className={`savings-line ${className}`.trim()}>
      <div className="savings-line-top">
        <span className="savings-line-label">Annual savings</span>
        <span className={savings.known ? 'savings-line-value is-known' : 'savings-line-value is-dash'}>
          {savings.text}
        </span>
      </div>
      <p className="savings-line-note">{savings.note}</p>
    </div>
  )
}
