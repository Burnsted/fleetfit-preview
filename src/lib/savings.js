import { DASH } from './workSpec'

/**
 * Annual savings vs a twin non-EV work vehicle.
 * Only a number already on the unit or package is shown. Never invent.
 */
export function displayAnnualSavings(source) {
  const raw = source?.annualSavingsUsd
  if (raw == null || raw === '') {
    return {
      text: DASH,
      known: false,
      note: 'Annual savings vs a twin non-EV work vehicle is not on file yet.',
    }
  }
  const n = Number(raw)
  if (!Number.isFinite(n)) {
    return {
      text: DASH,
      known: false,
      note: 'Annual savings vs a twin non-EV work vehicle is not on file yet.',
    }
  }
  return {
    text: `~$${n.toLocaleString()} / yr`,
    known: true,
    note: 'Annual savings vs a twin non-EV work vehicle.',
  }
}
