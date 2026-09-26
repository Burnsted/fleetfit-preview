import { Navigate, useParams } from 'react-router-dom'

/** CLEARED outbound · kill in-app /listing/:id mirror → package home */
export default function ListingRedirect() {
  useParams()
  return <Navigate to="/intake" replace />
}
