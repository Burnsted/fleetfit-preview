import { useLocation } from 'react-router-dom'
import Wordmark from './Wordmark'

export default function Footer() {
  const { pathname } = useLocation()
  const onDark = pathname === '/' || pathname === ''

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Wordmark size="nav" tone={onDark ? 'dark' : 'light'} />
          <span>— Used EV fleet packages that fit the work day.</span>
        </div>
        <div>
          Public preview · Anonymized examples · Demo inventory · No payments · We do not hold vehicle funds
        </div>
      </div>
    </footer>
  )
}
