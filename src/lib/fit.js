export function fitClass(band) {
  if (band === 'worth it') return 'fit-worth'
  if (band?.startsWith('worth it if') || band?.startsWith('Good package if')) return 'fit-if'
  if (band === 'pass') return 'fit-pass'
  return 'fit-nodata'
}

export function formatMoney(price) {
  return `$${price.toLocaleString()}`
}
