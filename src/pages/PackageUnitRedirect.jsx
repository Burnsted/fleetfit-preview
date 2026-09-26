import { Navigate, useParams } from 'react-router-dom'

/** CLEARED outbound · kill package unit seller-mirror → package page */
export default function PackageUnitRedirect() {
  const { packageId } = useParams()
  if (!packageId) return <Navigate to="/intake" replace />
  return <Navigate to={`/package/${packageId}`} replace />
}
