#!/usr/bin/env node
/**
 * Re-check listing / dealer URLs for sold / unavailable pages.
 * Usage: npm run check-listings
 *
 * Prints LIVE / DEAD / BLOCKED (Cloudflare) per unit.
 * Does not auto-write listingOutbound.js — update listingStatus there after review.
 *
 * Dead signals: HTTP 404/410, sold/"No longer listed"/"no longer available" body text,
 * redirects onto marketplace search results, OR redirects onto a dealer inventory /
 * make-model index (200 that is not a specific vehicle page). See listingPageKind.js.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import { classifyListingFetch } from '../src/lib/listingPageKind.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function loadListingRows() {
  const src = readFileSync(path.join(root, 'src/data/listingPhotos.js'), 'utf8')
  const rows = {}
  for (const m of src.matchAll(/'((?:unit|vnd)-[^']+)':\s*(\{[\s\S]*?\})\s*,?\s*\n/g)) {
    rows[m[1]] = JSON.parse(m[2])
  }
  return rows
}

async function loadOutbound() {
  const mod = await import(pathToFileURL(path.join(root, 'src/data/listingOutbound.js')).href)
  return mod.LISTING_OUTBOUND
}

function vinFromUrl(url) {
  if (!url) return null
  const m = String(url).match(/[A-HJ-NPR-Z0-9]{17}/i)
  return m ? m[0].toUpperCase() : null
}

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html',
      },
      signal: AbortSignal.timeout(40000),
    })
    const text = await res.text()
    return { status: res.status, finalUrl: res.url, text, err: null }
  } catch (e) {
    return { status: 0, finalUrl: url, text: '', err: String(e.message || e) }
  }
}

const rows = loadListingRows()
const outbound = await loadOutbound()
const ids = Object.keys(rows).sort()

console.log('check-listings ·', new Date().toISOString().slice(0, 10))
console.log('id\tstored\thttp\tresult\turl')

let dead = 0
let live = 0
let blocked = 0

for (const id of ids) {
  const row = rows[id]
  const meta = outbound[id] || {}
  const url = meta.dealer_url || row.listing_url
  if (!url) {
    console.log(`${id}\t${meta.listingStatus || '?'}\t-\tDEAD\t(no url)`)
    dead++
    continue
  }
  const page = await fetchPage(url)
  const vin = vinFromUrl(url)
  const c = classifyListingFetch({
    status: page.status,
    finalUrl: page.finalUrl,
    originalUrl: url,
    text: page.text,
    vin,
  })
  if (c.kind === 'LIVE') live++
  else if (c.kind === 'BLOCKED') blocked++
  else dead++
  const stored = meta.listingStatus || '?'
  const flag =
    stored === 'live' && c.kind === 'DEAD'
      ? ' ← UPDATE listingStatus to dead'
      : stored === 'dead' && c.kind === 'LIVE'
        ? ' ← review (stored dead, fetch live)'
        : ''
  console.log(
    `${id}\t${stored}\tHTTP${page.status}\t${c.kind}\t${url.slice(0, 90)}${flag}`,
  )
  if (c.title) console.log(`  title: ${c.title.slice(0, 100)}`)
  if (c.reason) console.log(`  reason: ${c.reason}`)
  if (page.finalUrl && page.finalUrl !== url) {
    console.log(`  final: ${page.finalUrl.slice(0, 120)}`)
  }
  if (page.err) console.log(`  err: ${page.err}`)
}

console.log('\nsummary', { live, dead, blocked, total: ids.length })
console.log(
  'Update src/data/listingOutbound.js listingStatus + checkedAt after review. Do not invent URLs.',
)
