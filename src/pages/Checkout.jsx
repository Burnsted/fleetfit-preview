import { Link, useSearchParams } from 'react-router-dom'
import { DEFAULT_PACKAGE_ID, getPackage } from '../data/package'

export default function Checkout() {
  const [params] = useSearchParams()
  const pkg = getPackage(params.get('package')) || getPackage(DEFAULT_PACKAGE_ID)

  return (
    <div className="locked-page">
      <nav className="locked-crumbs" aria-label="Breadcrumb">
        <Link to={`/package/${pkg.id}`}>Package</Link>
        <span aria-hidden="true"> / </span>
        <span>Facilitated sale</span>
      </nav>
      <header className="locked-page-header">
        <h1>FleetFit facilitates the package sale</h1>
        <p className="locked-page-lead">
          There is no one-click checkout in this preview. Add units to the fleet,
          then FleetFit runs the facilitated sale when the mix is ready.
        </p>
      </header>
      <p className="locked-foot-note">
        Fee at checkout — amount TBD. FleetFit does not hold vehicle funds.
        Buyer pays the seller / dealer.
      </p>
      <Link to={`/package/${pkg.id}`} className="btn btn-primary">
        Back to package
      </Link>
    </div>
  )
}
