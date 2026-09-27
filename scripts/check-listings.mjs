#!/usr/bin/env node
/**
 * Re-check listing / dealer URLs for sold / unavailable pages.
 * Usage: npm run check-listings
 *
 * Prints LIVE / DEAD / BLOCKED (Cloudflare) per unit.
 * Does not auto-write listingOutbound.js — update listingStatus there after review.
 *
 * Dead signals: HTTP 404/410, sold/"No longer listed"/"no longer available" body text,
 * redirects onto marketplace search results.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const DEAD_RE =
  /no longer listed|no longer available|this vehicle is sold|vehicle has been sold|listing (is )?(no longer|not) available|page not found|vehicle not found|this listing is unavailable|has been removed|sorry,? this vehicle|is no longer in our inventory|this vehicle has sold|we couldn.?t find this/i

function loadListingRows() {
  const src = readFileSync(path.join(root, 'src/data/listingPhotos.js'), 'utf8')
  const rows = {}
  for (const m of src.matchAll(/'((?:unit|vnd)-[^']+)':\s*(\{[\s\S]*?\})\s*,?\s*\n/g)) {
    rows[m[1]] = JSON.parse(m[2])
  }
  return rows
}

async function loadOutbound() {
  const mod = await import(path.join(root, 'src/data/listingOutbound.js'))
  return mod.LISTING_OUTBOUND
}

async function fetchPage(url) {
  try {
    const { requests } = await import('curl_cffi').catch(() => ({ requests: null }))
    if (requests) {
      const r = await requests.get(url, {
        impersonate: 'chrome131',
        timeout: 40,
        allow_redirects: true,
      })
      return { status: r.status_code, finalUrl: String(r.url), text: r.text || '', err: null }
    }
  } catch {
    /* fall through to fetch */
  }
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

function classify(status, finalUrl, text) {
  const title =
    (text.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]?.replace(/\s+/g, ' ').trim() || ''
  const cf = /just a moment|attention required|cf-browser-verification|challenge-platform/i.test(
    `${title}\n${text.slice(0, 4000)}`,
  )
  if (cf) return { kind: 'BLOCKED', title }
  const sample = `${title}\n${text.slice(0, 300000)}`
  const sold = DEAD_RE.test(sample)
  const searchRedir = /\/shopping\/|\/for-sale\/|\/search/i.test(finalUrl || '')
  if (status === 404 || status === 410 || sold || searchRedir) {
    return { kind: 'DEAD', title, sold, searchRedir }
  }
  if (status >= 200 && status < 400) return { kind: 'LIVE', title }
  return { kind: 'DEAD', title, http: status }
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
  const c = classify(page.status, page.finalUrl, page.text)
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
  if (page.err) console.log(`  err: ${page.err}`)
}

console.log('\nsummary', { live, dead, blocked, total: ids.length })
console.log(
  'Update src/data/listingOutbound.js listingStatus + checkedAt after review. Do not invent URLs.',
)
