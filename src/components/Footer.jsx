import Wordmark from './Wordmark'

/**
 * Site footer. Always light surface (white) — wordmark matches Header
 * (dark FLEET #111, orange FIT #F5A623). Do not use the dark-surface
 * wordmark here; Home used to skip Footer entirely, and the old
 * pathname→dark tone left white FLEET invisible on the white footer.
 */
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Wordmark size="nav" tone="light" />
          <span>Used EV fleet packages that fit the work day.</span>
        </div>
        <div>
          Public preview · Anonymized examples · Demo inventory · No payments · We do not hold vehicle funds
        </div>
      </div>
    </footer>
  )
}
