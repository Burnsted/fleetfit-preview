import { listingPhotoRecord } from '../lib/vehiclePhoto'

export function PhotoPending({ current = false, className = '' }) {
  return (
    <span className={`listing-photo-pending ${current ? 'is-current' : ''} ${className}`.trim()}>
      {current
        ? 'Not a listing — your current work vehicle'
        : 'Photo pending — no listing image'}
    </span>
  )
}

export default function ListingPhoto({
  vehicle,
  alias,
  className = '',
  alt = '',
}) {
  const rec = listingPhotoRecord(alias || vehicle)
  if (!rec.src) {
    return <PhotoPending className={className} />
  }
  return <img src={rec.src} alt={alt} className={className} />
}
