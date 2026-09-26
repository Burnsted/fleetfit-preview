import { LISTINGS } from './listings'
import { vehiclePhotoFor } from '../lib/vehiclePhoto'

function slugify(make, model) {
  return `${make}-${model}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function bodyType(listing) {
  const m = `${listing.model} ${listing.cab}`.toLowerCase()
  if (m.includes('van')) return 'Cargo van'
  return 'Pickup'
}

function oneLiner(listing) {
  const doors = listing.cab?.toLowerCase().includes('super') || listing.cab?.toLowerCase().includes('crew')
    ? '4 doors'
    : '2–4 doors'
  const seats = listing.cab?.toLowerCase().includes('crew') || listing.cab?.toLowerCase().includes('super')
    ? 'up to 5 seats'
    : 'up to 3 seats'
  return listing.bed
    ? `Electric work truck: ${doors}, ${seats}, ${listing.bed} bed.`
    : `Electric work truck: ${doors}, ${seats}.`
}

function workBlurb(make, model) {
  const key = `${make} ${model}`
  const blurbs = {
    'Ford F-150 Lightning':
      'Familiar full-size work truck packaging with onboard power and a usable frunk for jobsite tools. Strong fit for trades that already run F-150s and need documented battery health.',
    'Chevrolet Silverado EV':
      'Work-trim electric pickup with large usable packs and fleet-friendly upfit paths. Built for routes that need range, payload, and a true service body — not lifestyle trim.',
    'GMC Sierra EV':
      'Ultium-platform sibling to Silverado EV with Elevation-class comfort. Same capability class for crews that want GMC dealer support and documented battery health before the buy.',
    'Rivian R1T':
      'Adventure-oriented electric pickup with gear-tunnel storage. Useful for solar and field crews; confirm service coverage on your routes before fleet adoption.',
    'Tesla Cybertruck':
      'High-capability exoskeleton pickup with Supercharger access. Bed and body are atypical for traditional trades — verify vault upfits and hitch logistics for your work.',
    'GMC Hummer EV':
      'Extreme off-road electric pickup. Listed for completeness: width, curb weight, and energy use limit classic fleet routes even when payload and battery health look fine on paper.',
  }
  return (
    blurbs[key] ||
    'Electric work truck in a FleetFit package. Review battery health, payload, warranty, and listing ask on each unit before you travel.'
  )
}

/** Aggregate listings into model families (make + model). */
export function getModels() {
  const map = new Map()
  for (const l of LISTINGS) {
    const key = `${l.make}|${l.model}`
    if (!map.has(key)) {
      map.set(key, {
        make: l.make,
        model: l.model,
        slug: slugify(l.make, l.model),
        listings: [],
      })
    }
    map.get(key).listings.push(l)
  }

  const models = [...map.values()].map((m) => {
    const priced = m.listings.filter((l) => l.allInPrice != null && l.feesKnown)
    const fromPrice = priced.length ? Math.min(...priced.map((l) => l.allInPrice)) : null
    const sohs = m.listings.map((l) => l.soh).filter((v) => v != null)
    const ranges = m.listings.map((l) => l.ratedRange).filter((v) => v != null)
    const payloads = m.listings.map((l) => l.payload).filter((v) => v != null)
    const gvwrs = m.listings.map((l) => l.gvwr).filter((v) => v != null)
    const chargers = m.listings.map((l) => l.dcFastMaxKw).filter((v) => v != null)
    const onboard = m.listings.map((l) => l.onboardChargerKw).filter((v) => v != null)
    const sample = m.listings[0]

    const typical = (arr) => {
      if (!arr.length) return null
      if (arr.length === 1) return arr[0]
      const avg = arr.reduce((a, b) => a + b, 0) / arr.length
      return Math.round(avg)
    }

    return {
      ...m,
      displayName: m.model,
      fullName: `${m.make} ${m.model}`,
      label: `${m.model}.`,
      bodyType: bodyType(sample),
      tag: 'Electric',
      description: oneLiner(sample),
      fromPrice,
      count: m.listings.length,
      image: vehiclePhotoFor(sample) || '',
      heroImage: vehiclePhotoFor(sample) || '',
      lifestyleImage: vehiclePhotoFor(sample) || '',
      blurb: workBlurb(m.make, m.model),
      cab: sample.cab,
      bed: sample.bed,
      stats: {
        rangeMi: {
          value: typical(ranges),
          best: ranges.length ? Math.max(...ranges) : null,
          caption: 'Rated / sticker-class range across listed units (mi)',
          footnote: 'From listing ratedRange fields; EPA/sticker class as provided by seller.',
        },
        payloadLb: {
          value: typical(payloads),
          best: payloads.length ? Math.max(...payloads) : null,
          caption: 'Payload capacity (lb)',
          footnote: 'From listing payload fields on this model.',
        },
        sohPct: {
          value: sohs.length ? Math.round(sohs.reduce((a, b) => a + b, 0) / sohs.length) : null,
          best: sohs.length ? Math.max(...sohs) : null,
          missing: sohs.length < m.listings.length,
          caption: 'Battery health — typical / best across listings',
          footnote: 'From listing battery health readings. Units without a reading show Incomplete Data on the listing.',
        },
        gvwrLb: {
          value: typical(gvwrs),
          best: gvwrs.length ? Math.max(...gvwrs) : null,
          caption: 'Gross vehicle weight rating (lb)',
          footnote: 'From listing gvwr. Tow ratings are omitted when not present in seed data.',
        },
        dcFastKw: {
          value: chargers.length ? Math.max(...chargers) : null,
          caption: 'DC fast max (kW)',
          footnote: 'From listing dcFastMaxKw on this model.',
        },
        onboardKw: {
          value: onboard.length ? Math.max(...onboard) : null,
          caption: 'Onboard AC charger (kW)',
          footnote: 'From listing onboardChargerKw on this model.',
        },
      },
    }
  })

  // Stable order: by count desc then name
  return models.sort((a, b) => b.count - a.count || a.fullName.localeCompare(b.fullName))
}

export function getModelBySlug(slug) {
  return getModels().find((m) => m.slug === slug) || null
}

export const HERO_SLIDES = getModels()
  .slice(0, 5)
  .map((m) => ({
    id: m.slug,
    title: `${m.model}.`,
    image: m.heroImage,
    href: `/model/${m.slug}`,
  }))
