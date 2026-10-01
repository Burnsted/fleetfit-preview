#!/usr/bin/env node
/**
 * Audit Add-to-fleet / package / shop suggestible vehicles:
 * fetch outbound URLs + compute Replacement Score vs good threshold (dial is-high = 0.7).
 */
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')

const DEAD_RE =
  /no longer listed|no longer available|this vehicle is sold|vehicle has been sold|listing (is )?(no longer|not) available|page not found|vehicle not found|this listing is unavailable|has been removed|sorry,? this vehicle|is no longer in our inventory|this vehicle has sold|we couldn.?t find this/i

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(45000),
    })
    const text = await res.text()
    return { status: res.status, finalUrl: res.url, text, err: null }
  } catch (e) {
    return { status: 0, finalUrl: url, text: '', err: String(e.message || e) }
  }
}

function pageTitle(text) {
  return (
    (text.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]
      ?.replace(/\s+/g, ' ')
      .trim() || ''
  )
}

function classifyFetch(status, finalUrl, text, err) {
  if (err && !text) return { verdict: 'could not verify', title: '', note: err }
  const title = pageTitle(text)
  const head = `${title}\n${text.slice(0, 5000)}`
  if (/just a moment|attention required|cf-browser-verification|challenge-platform/i.test(head)) {
    return { verdict: 'could not verify', title, note: 'Cloudflare/challenge blocked fetch' }
  }
  const sample = `${title}\n${text.slice(0, 300000)}`
  const sold = DEAD_RE.test(sample)
  const searchRedir = /\/shopping\/|\/for-sale\/vehicles|\/search\?/i.test(finalUrl || '')
  const homeish =
    /\/(inventory\/?)?$/i.test((finalUrl || '').replace(/\?.*$/, '')) &&
    !/vehicledetail|\/vehicle\/|used-|inventory\/Used|inventory\/New/i.test(finalUrl || '')
  if (status === 404 || status === 410 || sold) {
    return { verdict: 'DEAD', title, note: sold ? 'sold/removed text' : `HTTP ${status}` }
  }
  if (searchRedir || homeish) {
    return { verdict: 'WRONG', title, note: searchRedir ? 'search/results redirect' : 'generic/home page' }
  }
  if (status >= 200 && status < 400) {
    // Prefer VIN or year+make+model style VDP signals
    const looksVdp =
      /vin|vehicle|stock|miles|odometer|price|\$\d/i.test(sample.slice(0, 8000)) &&
      !/0 results|no vehicles found/i.test(sample.slice(0, 4000))
    if (!looksVdp) {
      return { verdict: 'WRONG', title, note: 'HTTP ok but not clearly a vehicle listing' }
    }
    return { verdict: 'REAL LISTING', title, note: `HTTP ${status}` }
  }
  return { verdict: 'DEAD', title, note: `HTTP ${status}` }
}

// Load listing rows + outbound without Vite
const photosSrc = readFileSync(path.join(root, 'src/data/listingPhotos.js'), 'utf8')
const rows = {}
for (const m of photosSrc.matchAll(/'((?:unit|vnd)-[^']+)':\s*(\{[\s\S]*?\})\s*,?\s*\n/g)) {
  rows[m[1]] = JSON.parse(m[2])
}
const outboundMod = await import(pathToFileURL(path.join(root, 'src/data/listingOutbound.js')).href)
const outbound = outboundMod.LISTING_OUTBOUND

// Package unit ids (suggestible)
const pkgSrc = readFileSync(path.join(root, 'src/data/package.js'), 'utf8')
const packageUnitIds = [...pkgSrc.matchAll(/id:\s*'(unit-[^']+)'/g)].map((m) => m[1])
const shopIds = Object.keys(rows).filter((id) => id.startsWith('vnd-')).sort()

const GOOD_THRESHOLD = 0.7 // ScoreDial is-high

// Score via vite-node-free path: spawn dynamic import through a small ts transpile isn't available.
// Use the built check-pages script pattern — import score via tsx if present, else compute later in browser.
let scoreFn = null
try {
  // Prefer running scores in a later playwright pass; here we still fetch URLs.
} catch {
  /* noop */
}

const allIds = [...new Set([...packageUnitIds, ...shopIds])]
const results = []

for (const id of allIds) {
  const row = rows[id] || null
  const meta = outbound[id] || {}
  const dealer = meta.dealer_url || null
  const market = row?.listing_url || null
  const storedLive = meta.listingStatus === 'live'
  const preferUrl = storedLive ? dealer || market : dealer || market
  const urlUsed = preferUrl
  let fetchInfo = {
    status: null,
    finalUrl: null,
    title: '',
    verdict: !urlUsed ? 'NO LINK' : 'could not verify',
    note: !urlUsed ? 'no dealer_url or listing_url' : '',
  }
  if (urlUsed) {
    const page = await fetchPage(urlUsed)
    const c = classifyFetch(page.status, page.finalUrl, page.text, page.err)
    fetchInfo = {
      status: page.status,
      finalUrl: page.finalUrl,
      title: c.title,
      verdict: c.verdict,
      note: c.note,
      err: page.err,
    }
    // If dealer failed and we have market, try market too when dealer was preferred
    if (
      dealer &&
      market &&
      urlUsed === dealer &&
      (c.verdict === 'DEAD' || c.verdict === 'WRONG' || c.verdict === 'could not verify')
    ) {
      const page2 = await fetchPage(market)
      const c2 = classifyFetch(page2.status, page2.finalUrl, page2.text, page2.err)
      fetchInfo.altMarket = {
        status: page2.status,
        finalUrl: page2.finalUrl,
        title: c2.title,
        verdict: c2.verdict,
        note: c2.note,
      }
    }
  }

  results.push({
    id,
    surfaces: [
      packageUnitIds.includes(id) ? 'package/add-to-fleet' : null,
      shopIds.includes(id) ? 'shop' : null,
    ].filter(Boolean),
    year: row?.year ?? null,
    make: row?.make ?? null,
    model: row?.model ?? null,
    trim: row?.trim ?? null,
    price: row?.price_usd ?? null,
    dealer: row?.dealer ?? null,
    bodyGuess: /transit|promaster|brightdrop|van/i.test(`${row?.model || ''}`)
      ? 'van'
      : 'truck',
    storedStatus: meta.listingStatus || null,
    dealer_url: dealer,
    listing_url: market,
    urlFetched: urlUsed,
    ...fetchInfo,
  })
  console.log(
    `${id}\t${fetchInfo.verdict}\tHTTP${fetchInfo.status ?? '-'}\t${(row?.year || '')} ${(row?.make || '')} ${(row?.model || '')}`,
  )
  if (fetchInfo.title) console.log(`  title: ${fetchInfo.title.slice(0, 120)}`)
  if (fetchInfo.finalUrl && fetchInfo.finalUrl !== urlUsed) {
    console.log(`  final: ${fetchInfo.finalUrl}`)
  }
}

mkdirSync(path.join(root, 'artifacts'), { recursive: true })
writeFileSync(
  path.join(root, 'artifacts/audit-fetch-raw.json'),
  JSON.stringify({ goodThreshold: GOOD_THRESHOLD, checkedAt: new Date().toISOString(), results }, null, 2),
)
console.log('\nWrote artifacts/audit-fetch-raw.json', results.length)
