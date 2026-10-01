/**
 * Buyer-facing battery confidence. Prefer OEM usable kWh; never invent %.
 */
export function batteryConfidence({ soh, status, warrantyBatteryMonths, usableKwh } = {}) {
  const kwh = usableKwh != null && usableKwh !== '' && Number.isFinite(Number(usableKwh))
    ? Number(usableKwh)
    : null
  if (kwh != null) {
    return {
      label: `Battery ${kwh} kWh`,
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
      label: 'Pack report on file',
      known: false,
    }
  }
  if (soh != null && soh !== '' && Number.isFinite(Number(soh))) {
    return {
      label: 'Pack report on file',
      known: true,
    }
  }
  return {
    label: 'Usable pack size Not published',
    known: false,
  }
}

export function batteryConfidenceFromUnit(unit) {
  return batteryConfidence({
    soh: unit?.battery?.soh,
    status: unit?.battery?.status,
    warrantyBatteryMonths:
      unit?.battery?.warrantyBatteryMonths ?? unit?.warrantyBatteryMonths,
    usableKwh: unit?.usableKwh ?? unit?.battery?.usableKwh,
  })
}

export function batteryConfidenceFromListing(listing) {
  return batteryConfidence({
    soh: listing?.soh,
    status: listing?.soh != null ? 'Reported' : listing?.sohMethod ? 'Reported' : '',
    warrantyBatteryMonths: listing?.warrantyBatteryMonths,
    usableKwh: listing?.usableKwh,
  })
}
