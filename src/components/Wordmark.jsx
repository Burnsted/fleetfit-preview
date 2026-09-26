/**
 * Official Franz FleetFit wordmark J6 open plus (Ted ~8:11 PM ET 2026-09-25).
 * Dark surfaces: Fleet white #FFFFFF · Fit amber #F5A623 · open-plus mark.
 * Light surfaces: Fleet #111111 · Fit amber #F5A623 · same J6 open-plus.
 * UI chrome teal #1BB6A8 is not the mark Fit color.
 */
const FILES = {
  dark: {
    nav: 'fleetfit-wordmark-j6-nav-dark.svg',
    hero: 'fleetfit-wordmark-j6-hero-dark.svg',
    eyebrow: 'fleetfit-wordmark-j6-nav-dark.svg',
  },
  light: {
    nav: 'fleetfit-wordmark-j6-nav-light.svg',
    hero: 'fleetfit-wordmark-j6-nav-light.svg',
    eyebrow: 'fleetfit-wordmark-j6-nav-light.svg',
  },
}

function brandSrc(tone, size) {
  const palette = tone === 'light' ? FILES.light : FILES.dark
  const file = palette[size] || palette.nav
  const base = import.meta.env.BASE_URL || '/'
  return `${base}brand/${file}`
}

export default function Wordmark({
  size = 'nav',
  tone = 'dark',
  className = '',
  decorative = false,
}) {
  const src = brandSrc(tone, size)
  return (
    <img
      src={src}
      alt={decorative ? '' : 'FleetFit'}
      aria-label={decorative ? undefined : 'FleetFit'}
      aria-hidden={decorative ? true : undefined}
      className={`wordmark wordmark-${size} wordmark-${tone} ${className}`.trim()}
      draggable={false}
    />
  )
}
