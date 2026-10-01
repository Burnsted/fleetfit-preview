/**
 * New OEM catalog — figures only from new_ev_trims.csv + new_ev_links.csv.
 * Never invent MSRP, specs, URLs, or photos.
 */
import trimsCsv from './newEv/new_ev_trims.csv?raw'
import linksCsv from './newEv/new_ev_links.csv?raw'
import { parseCsv, numOrNull } from '../lib/csvParse'
import {
  NEW_CATALOG_IDS,
  NOT_CONFIRMED,
  PHOTO_NOT_CONFIRMED,
} from './newEv/catalogIds'

import cybertruckPhoto from '../assets/new-catalog/cybertruck.jpg'
import r1tPhoto from '../assets/new-catalog/r1t.jpg'
import silveradoPhoto from '../assets/new-catalog/silverado-ev.jpg'
import sierraPhoto from '../assets/new-catalog/sierra-ev.jpg'

export {
  NEW_CATALOG_BUILD,
  NEW_CATALOG_IDS,
  NOT_CONFIRMED,
  PHOTO_NOT_CONFIRMED,
  NEW_HELPER_LINE,
  USED_HELPER_LINE,
  USED_RESULTS_HELPER,
  NEW_RESULTS_HELPER,
} from './newEv/catalogIds'

/**
 * Draft-only Commons-based plates. License check TBD before public use.
 * E-Transit Commons plate carries courier livery (DPD) — not shown; Photo not confirmed.
 */
const PHOTO_BY_ID = {
  tesla_cybertruck_dual: cybertruckPhoto,
  rivian_r1t_premium: r1tPhoto,
  ford_etransit_cargo_van_low_roof_148_wb: null,
  chevy_silverado_ev_wt_4wt: silveradoPhoto,
  gmc_sierra_ev_elevation_standard: sierraPhoto,
  /** No accurate unbranded photo yet */
  rivian_rcv_500: null,
  mb_esprinter_81: null,
}

const DISPLAY = {
  tesla_cybertruck_dual: {
    title: '2026 Tesla Cybertruck',
    trimLabel: 'Dual Motor AWD',
  },
  rivian_rcv_500: {
    title: 'Fleet Rivian Commercial Van',
    trimLabel: 'Delivery 500',
  },
  rivian_r1t_premium: {
    title: '2027 Rivian R1T',
    trimLabel: 'Premium',
  },
  ford_etransit_cargo_van_low_roof_148_wb: {
    title: '2026 Ford E-Transit',
    trimLabel: 'Cargo Van Low Roof',
  },
  chevy_silverado_ev_wt_4wt: {
    title: '2026 Chevrolet Silverado EV',
    trimLabel: 'WT 4WT',
  },
  gmc_sierra_ev_elevation_standard: {
    title: '2026 GMC Sierra EV',
    trimLabel: 'Elevation Standard Range',
  },
  mb_esprinter_81: {
    title: '2026 Mercedes-Benz eSprinter',
    trimLabel: 'Cargo Van 81 kWh',
  },
}

function isUnknown(value) {
  const s = String(value ?? '').trim()
  return !s || /^unknown\b/i.test(s) || /^n\/a$/i.test(s)
}

/**
 * Figure confirmed when CSV label includes FACT and is not UNKNOWN / pure INFERENCE.
 * Mixed cells like "FACT (price…); … INFERENCE (config mapping)" still count
 * as confirmed for the FACT portion (e.g. eSprinter MSRP).
 */
function isConfirmedFigure(label) {
  const l = String(label || '').toUpperCase()
  if (l.includes('UNKNOWN') && !l.includes('FACT')) return false
  if (l.startsWith('UNKNOWN')) return false
  if (l.startsWith('INFERENCE') || l === 'INF' || l.startsWith('INF ')) return false
  if (l.includes('INFERENCE') && !l.includes('FACT')) return false
  return l.includes('FACT')
}

function money(n) {
  return `$${Number(n).toLocaleString('en-US')}`
}

function primaryRangeMi(raw) {
  if (isUnknown(raw)) return null
  // Take first number (e.g. "300 (20in) / 329 …")
  return numOrNull(String(raw).split('/')[0])
}

function primaryPayloadLb(raw) {
  if (isUnknown(raw)) return null
  // "3,320 (max cargo van)" → 3320
  return numOrNull(String(raw).split('/')[0])
}

function rangeBasisSuffix(basis) {
  const raw = String(basis || '')
  const b = raw.toLowerCase()
  // "not EPA" / "not on fueleconomy" must not count as EPA
  const notEpa = /\bnot\s+epa\b/i.test(raw) || /\bnot on fueleconomy/i.test(raw)
  if (!notEpa && /\bepa\b/i.test(raw)) return 'EPA'
  if (b.includes('maximum range') || /\bmaximum\b/.test(b)) return 'max est'
  if (b.includes('oem') || b.includes('rivian') || b.includes('est')) return 'est'
  return 'est'
}

function findLinkRow(linkRows, make, model) {
  const m = String(make || '').toLowerCase()
  const mod = String(model || '').toLowerCase()
  return (
    linkRows.find(
      (r) =>
        String(r.make || '').toLowerCase() === m &&
        String(r.model || '')
          .toLowerCase()
          .includes(mod.split(' ')[0]),
    ) || null
  )
}

/** Pull a bare http(s) URL from a CSV cell that may include notes. */
function extractHttpUrl(raw) {
  const m = String(raw || '').match(/https?:\/\/[^\s)'"]+/)
  return m ? m[0] : ''
}

/**
 * Build / maker link only when CSV marks the URL FACT.
 * INFERENCE build URLs get no link. Real status_page_url may use
 * "Build on the maker site (status page)" when the page itself is FACT.
 */
export function resolveMakerLink(linkRow) {
  if (!linkRow) return null
  const label = String(linkRow.label || '')
  const build = extractHttpUrl(linkRow.build_configure_url)
  const fleet = extractHttpUrl(linkRow.fleet_url)
  const status = extractHttpUrl(linkRow.status_page_url)

  const labelU = label.toUpperCase()

  // Rivian Commercial Van: label FACT (order via fleet page)
  if (labelU === 'FACT') {
    const href = fleet || build || status
    if (href) {
      return { href, text: 'Build on the maker site', kind: 'build' }
    }
  }

  // Status page when CSV marks page FACT (e.g. Mercedes)
  const pageFact =
    labelU.includes('PAGE FACT') ||
    labelU.includes('FACT STATUS PAGE') ||
    labelU.includes('FACT PAGE')
  if (pageFact && status) {
    return {
      href: status,
      text: 'Build on the maker site (status page)',
      kind: 'status',
    }
  }

  // Pure INFERENCE pattern / build=INFERENCE → no link
  return null
}

function priceLine(row) {
  const msrp = numOrNull(row.msrp_usd)
  const fleetOnly = String(row.fleet_only || '').toUpperCase() === 'Y'
  const msrpKnown = msrp != null && isConfirmedFigure(row.msrp_label)

  if (!msrpKnown) {
    return `MSRP ${NOT_CONFIRMED}`
  }
  if (fleetOnly) {
    return `Fleet orders only · from ${money(msrp)}`
  }
  const fromish = /from/i.test(String(row.msrp_label || ''))
  return fromish ? `MSRP from ${money(msrp)}` : `MSRP ${money(msrp)}`
}

function specLine(row) {
  const parts = []
  const rangeMi = primaryRangeMi(row.range_mi)
  const rangeOk = rangeMi != null && isConfirmedFigure(row.range_label)
  if (rangeOk) {
    const suffix = rangeBasisSuffix(row.range_basis)
    parts.push(`Range ${rangeMi} mi ${suffix}`)
  } else {
    parts.push(`Range ${NOT_CONFIRMED}`)
  }

  const payload = primaryPayloadLb(row.payload_lb)
  const payloadOk = payload != null && isConfirmedFigure(row.payload_label)
  if (payloadOk) {
    parts.push(`Payload ${payload.toLocaleString('en-US')} lb`)
  } else if (!isUnknown(row.payload_lb) || String(row.payload_label || '').includes('UNKNOWN')) {
    // Only append payload clause when the field was expected; vans with UNKNOWN still say not confirmed when body is van
    if (/van/i.test(String(row.body || '')) || /pickup|cab/i.test(String(row.body || ''))) {
      // Show payload not confirmed only when CSV has a payload column intent for trucks/vans with UNKNOWN
      if (isUnknown(row.payload_lb) || !payloadOk) {
        // Keep cards tight: omit payload when not confirmed (Cybertruck payload is INFERENCE)
        // Exception: eSprinter UNKNOWN — omit per "unknown fields read not confirmed" on missing display fields
      }
    }
  }

  // CLEARED examples show payload when confirmed; omit when not confirmed (no "Payload not confirmed" clutter except when range missing alone)
  return parts.join(' · ')
}

function buildCard(row, linkRows) {
  const id = row.vehicle_id
  const display = DISPLAY[id] || {
    title: `${row.model_year} ${row.make} ${row.model}`.trim(),
    trimLabel: row.trim,
  }
  const linkRow = findLinkRow(linkRows, row.make, row.model)
  const makerLink = resolveMakerLink(linkRow)
  const photo = PHOTO_BY_ID[id] ?? null
  const rangeMi = primaryRangeMi(row.range_mi)
  const rangeOk = rangeMi != null && isConfirmedFigure(row.range_label)
  const payload = primaryPayloadLb(row.payload_lb)
  const payloadOk = payload != null && isConfirmedFigure(row.payload_label)

  return {
    id,
    stockMode: 'New',
    title: display.title,
    trimLabel: display.trimLabel,
    make: row.make,
    model: row.model,
    modelYear: row.model_year,
    trim: row.trim,
    body: row.body,
    fleetOnly: String(row.fleet_only || '').toUpperCase() === 'Y',
    msrpUsd: numOrNull(row.msrp_usd),
    msrpConfirmed: numOrNull(row.msrp_usd) != null && isConfirmedFigure(row.msrp_label),
    priceLabel: priceLine(row),
    rangeMi: rangeOk ? rangeMi : null,
    payloadLb: payloadOk ? payload : null,
    specsLabel: specLine(row),
    photo,
    photoPending: !photo,
    photoPendingLabel: PHOTO_NOT_CONFIRMED,
    makerLink,
    /** Hard rule: New cards never carry used listing fields */
    sellerUrl: null,
    mileage: null,
    usedPrice: null,
    askPrice: null,
    listingLive: false,
  }
}

let _cache = null

export function loadNewTrimRows() {
  return parseCsv(trimsCsv)
}

export function loadNewLinkRows() {
  return parseCsv(linksCsv)
}

export function getNewCatalog() {
  if (_cache) return _cache
  const trims = loadNewTrimRows()
  const links = loadNewLinkRows()
  const byId = new Map(trims.map((r) => [r.vehicle_id, r]))
  const cards = NEW_CATALOG_IDS.map((id) => {
    const row = byId.get(id)
    if (!row) {
      throw new Error(`Missing CSV trim row for ${id}`)
    }
    // Gate: never show discontinued / production-ended as orderable new
    const status = String(row.sale_status || '').toUpperCase()
    if (status.includes('DISCONTINUED') || status.includes('PRODUCTION ENDED')) {
      throw new Error(`Catalog id ${id} is not orderable: ${row.sale_status}`)
    }
    return buildCard(row, links)
  })
  _cache = cards
  return cards
}

export function assertNoUsedFieldsOnNewCard(card) {
  return (
    card.sellerUrl == null &&
    card.mileage == null &&
    card.usedPrice == null &&
    card.askPrice == null &&
    card.listingLive === false
  )
}
