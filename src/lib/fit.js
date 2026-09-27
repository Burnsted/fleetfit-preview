export function fitClass(band) {
  if (band === 'Package notes') return 'fit-if'
  if (band === 'pass') return 'fit-pass'
  return 'fit-nodata'
}

export function formatMoney(price) {
  return `$${price.toLocaleString()}`
}
