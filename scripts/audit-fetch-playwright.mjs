#!/usr/bin/env node
/**
 * Re-fetch listing URLs via Playwright (bypasses many Cloudflare HTML challenges).
 */
import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const prior = JSON.parse(readFileSync(path.join(root, 'artifacts/audit-fetch-raw.json'), 'utf8'))

const DEAD_RE =
  /no longer listed|no longer available|this vehicle is sold|vehicle has been sold|listing (is )?(no longer|not) available|page not found|vehicle not found|this listing is unavailable|has been removed|sorry,? this vehicle|is no longer in our inventory|this vehicle has sold|we couldn.?t find this|sorry,? we can.?t find/i

function classify(status, finalUrl, title, text) {
  if (!status && !text) return { verdict: 'could not verify', note: 'empty response' }
  const head = `${title}\n${text.slice(0, 6000)}`
  if (/just a moment|attention required|cf-browser-verification|challenge-platform/i.test(head) && text.length < 8000) {
    return { verdict: 'could not verify', note: 'Cloudflare/challenge' }
  }
  const sample = `${title}\n${text.slice(0, 350000)}`
  if (status === 404 || status === 410 || DEAD_RE.test(sample)) {
    return { verdict: 'DEAD', note: DEAD_RE.test(sample) ? 'sold/removed/not found text' : `HTTP ${status}` }
  }
  if (/\/shopping\/results|\/for-sale\/vehicles\/?(\?|$)|\/search\?/i.test(finalUrl || '')) {
    return { verdict: 'WRONG', note: 'redirected to search/results' }
  }
  // Specific VDP signals
  const vinish = /[A-HJ-NPR-Z0-9]{17}/.test(sample.slice(0, 50000))
  const detail =
    /vehicledetail|\/vehicle\/|inventory\/Used|inventory\/New|used-[A-Za-z]|\/used-/i.test(finalUrl || '') ||
    /\bVIN\b|\bStock\b|odometer|mileage|\$\s?\d{2,}/i.test(sample.slice(0, 12000))
  if (status >= 200 && status < 400 && detail) {
    return { verdict: 'REAL LISTING', note: vinish ? `HTTP ${status} + VIN-like` : `HTTP ${status} VDP signals` }
  }
  if (status >= 200 && status < 400) {
    return { verdict: 'WRONG', note: 'HTTP ok but not a specific vehicle listing' }
  }
  return { verdict: 'could not verify', note: `HTTP ${status || 0}` }
}

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  locale: 'en-US',
})

const updated = []
for (const row of prior.results) {
  const urls = []
  if (row.dealer_url) urls.push({ kind: 'dealer', url: row.dealer_url })
  if (row.listing_url) urls.push({ kind: 'market', url: row.listing_url })
  if (!urls.length) {
    updated.push({ ...row, playwright: { verdict: 'NO LINK', note: 'no url' } })
    console.log(`${row.id}\tNO LINK`)
    continue
  }

  let best = null
  for (const u of urls) {
    const page = await context.newPage()
    let status = 0
    let finalUrl = u.url
    let title = ''
    let text = ''
    let err = null
    try {
      const resp = await page.goto(u.url, { waitUntil: 'domcontentloaded', timeout: 45000 })
      status = resp?.status() || 0
      finalUrl = page.url()
      // Wait briefly for CF / client render
      await page.waitForTimeout(2500)
      title = await page.title()
      text = await page.content()
      finalUrl = page.url()
    } catch (e) {
      err = String(e.message || e)
    }
    await page.close()
    const c = classify(status, finalUrl, title, text)
    const entry = {
      kind: u.kind,
      url: u.url,
      status,
      finalUrl,
      title,
      verdict: err && !text ? 'could not verify' : c.verdict,
      note: err && !text ? err : c.note,
    }
    console.log(
      `${row.id}\t${u.kind}\t${entry.verdict}\tHTTP${status}\t${title.slice(0, 90)}`,
    )
    if (!best) best = entry
    else if (entry.verdict === 'REAL LISTING' && best.verdict !== 'REAL LISTING') best = entry
    else if (best.verdict === 'could not verify' && entry.verdict !== 'could not verify') best = entry
    // Prefer dealer REAL LISTING
    if (u.kind === 'dealer' && entry.verdict === 'REAL LISTING') {
      best = entry
      break
    }
  }
  updated.push({ ...row, playwright: best })
}

await browser.close()

const out = {
  goodThreshold: 0.7,
  checkedAt: new Date().toISOString(),
  results: updated,
}
writeFileSync(path.join(root, 'artifacts/audit-fetch-playwright.json'), JSON.stringify(out, null, 2))
console.log('wrote artifacts/audit-fetch-playwright.json')
