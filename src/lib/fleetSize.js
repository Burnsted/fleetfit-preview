/**
 * Map intake fleet-size chip to the trade-package size picker (1–5).
 * Ranges use a representative count; never invent beyond the chip.
 */

export const FLEET_SIZE_BUILD = 'fleet-size-intake-20261006'
export const SIZE_PICKER_MAX = 5

/**
 * @param {object|null|undefined} intake
 * @param {number} [fallback=4]
 * @returns {number} integer 1..5
 */
export function fleetSizeFromIntake(intake, fallback = 4) {
  const raw = String(intake?.fleetSize ?? '').trim()
  const fb = clampSize(fallback)

  if (!raw || raw === 'not-surveyed') return fb

  if (raw === '1-2') return 2
  if (raw === '3-5') return 4
  if (raw === '6-10' || raw === '10+') return SIZE_PICKER_MAX

  // Plain integer string from future or stored intake
  const n = Number(raw)
  if (Number.isFinite(n) && n > 0) return clampSize(n)

  return fb
}

function clampSize(n) {
  const v = Math.floor(Number(n))
  if (!Number.isFinite(v) || v < 1) return 4
  return Math.min(SIZE_PICKER_MAX, v)
}
