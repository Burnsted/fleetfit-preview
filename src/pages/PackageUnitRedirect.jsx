import { Navigate, useParams } from 'react-router-dom'
import { findUnitAnywhere, getPackage } from '../data/package'

const FALLBACK_PACKAGE = 'pkg-tc-electrical-4'

/**
 * CLEARED outbound · kill package unit seller-mirror → owning package page.
 */
export default function PackageUnitRedirect() {
  const { packageId, unitId } = useParams()
  if (packageId && getPackage(packageId)) {
    return <Navigate to={`/package/${packageId}`} replace />
  }
  const hit = unitId ? findUnitAnywhere(unitId) : null
  const dest = hit?.pkg?.id || FALLBACK_PACKAGE
  return <Navigate to={`/package/${dest}`} replace />
}
