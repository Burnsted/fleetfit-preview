import { Navigate, useParams } from 'react-router-dom'
import { findUnitAnywhere } from '../data/package'

const FALLBACK_PACKAGE = 'pkg-tc-electrical-4'

/**
 * CLEARED outbound · kill in-app /listing/:id mirror.
 * Send to the package that owns the unit; else electrical package fallback.
 */
export default function ListingRedirect() {
  const { id } = useParams()
  const hit = id ? findUnitAnywhere(id) : null
  const packageId = hit?.pkg?.id || FALLBACK_PACKAGE
  return <Navigate to={`/package/${packageId}`} replace />
}
