/**
 * Buyer-facing battery confidence. Never say SOH. Never invent % or warranty.
 */
export function batteryConfidence({ soh, status, warrantyBatteryMonths } = {}) {
  if (soh != null && soh !== '' && Number.isFinite(Number(soh))) {
    return {
      label: `Battery health ${Number(soh)}%`,
      known: true,
    }
  }
  if (
    warrantyBatteryMonths != null &&
    warrantyBatteryMonths !== '' &&
    Number.isFinite(Number(warrantyBatteryMonths)) &&
    Number(warrantyBatteryMonths) > 0
  ) {
    return {
      label: `Battery coverage ${Number(warrantyBatteryMonths)} months left`,
      known: true,
    }
  }
  const s = String(status || '')
  if (s && /reported/i.test(s) && !/not reported/i.test(s)) {
    return {
      label: 'Battery health reported',
      known: false,
    }
  }
  return {
    label: 'Battery health not reported',
    known: false,
  }
}

export function batteryConfidenceFromUnit(unit) {
  return batteryConfidence({
    soh: unit?.battery?.soh,
    status: unit?.battery?.status,
    warrantyBatteryMonths:
      unit?.battery?.warrantyBatteryMonths ?? unit?.warrantyBatteryMonths,
  })
}

export function batteryConfidenceFromListing(listing) {
  return batteryConfidence({
    soh: listing?.soh,
    status: listing?.soh != null ? 'Reported' : listing?.sohMethod ? 'Reported' : '',
    warrantyBatteryMonths: listing?.warrantyBatteryMonths,
  })
}
