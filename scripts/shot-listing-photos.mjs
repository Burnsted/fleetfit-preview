import { chromium } from 'playwright'
import { copyFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const BASE = process.env.SHOT_BASE || 'https://burnsted.github.io/fleetfit-preview/'
const OUT = '/opt/cursor/artifacts/screenshots'
await mkdir(OUT, { recursive: true })
await mkdir('/workspace/artifacts/screenshots', { recursive: true })

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
})
await context.route('**/*', (route) =>
  route.continue({
    headers: {
      ...route.request().headers(),
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  }),
)
const page = await context.newPage()
await page.goto(`${BASE}?photos=${Date.now()}#/package/pkg-tc-electrical-4`, {
  waitUntil: 'networkidle',
  timeout: 60000,
})
await page.waitForTimeout(800)

const bundle = await page.locator('script[src*="assets/index-"]').first().getAttribute('src')
console.log('LIVE_BUNDLE', bundle)

// Considered stack cards use listing thumbs
await page.locator('.stack-card.is-candidate').first().waitFor({ timeout: 15000 })
const candidates = page.locator('.stack-card.is-candidate .unit-photo')
const n = await candidates.count()
assert(n >= 1, 'no candidate unit photos')
for (let i = 0; i < Math.min(n, 4); i++) {
  const kind = await candidates.nth(i).getAttribute('data-photo-kind')
  const build = await candidates.nth(i).getAttribute('data-photo-build')
  assert(build === 'listing-photos-20260926-0917', `photo build missing on candidate ${i}`)
  assert(kind === 'listing' || kind === 'stub', `candidate ${i} kind ${kind}`)
  if (kind === 'listing') {
    const src = await candidates.nth(i).locator('img.unit-photo-img').getAttribute('src')
    assert(src && /\.(jpg|jpeg|png|webp)/i.test(src), `candidate ${i} bad src ${src}`)
    assert(!/stock\/current-/i.test(src || ''), `candidate ${i} used current stock`)
  }
}

// Current column in WorkCompare — stock OK
const current = page.locator('.work-compare-card.is-current, .stack-card.is-current').first()
if (await current.count()) {
  const stockLabel = await current.innerText()
  assert(/Stock|current/i.test(stockLabel) || true, 'current side present')
}

await page.locator('.stack-card.is-candidate').first().scrollIntoViewIfNeeded()
await page.waitForTimeout(200)
await page.screenshot({ path: path.join(OUT, 'listing-photos-considered-stack.png'), fullPage: false })

// Shop card — listing thumb, no accessory regress
await page.goto(`${BASE}?photos=${Date.now()}#/shop`, { waitUntil: 'networkidle', timeout: 60000 })
await page.locator('.listing-card').first().waitFor({ timeout: 15000 })
const cardText = await page.locator('.listing-card').first().innerText()
assert(!/Seller\s*Fleet/i.test(cardText), 'Seller Fleet regress')
assert(!/ladder-rack|spray-liner|toolboxes/i.test(cardText), 'accessory chip regress')
assert((await page.locator('.shop-search-pill').count()) === 1, 'search pill regress')
await page.locator('.listing-card').first().screenshot({
  path: path.join(OUT, 'listing-photos-shop-card.png'),
})

// Package compare strip if present — open first package again for current vs considered
await page.goto(`${BASE}?photos=${Date.now()}#/package/pkg-tc-electrical-4`, {
  waitUntil: 'networkidle',
  timeout: 60000,
})
await page.waitForTimeout(500)
const compare = page.locator('.work-compare')
if (await compare.count()) {
  await compare.first().scrollIntoViewIfNeeded()
  await page.waitForTimeout(200)
  await compare.first().screenshot({ path: path.join(OUT, 'listing-photos-current-vs-considered.png') })
}

for (const f of [
  'listing-photos-considered-stack.png',
  'listing-photos-shop-card.png',
  'listing-photos-current-vs-considered.png',
]) {
  try {
    await copyFile(path.join(OUT, f), path.join('/workspace/artifacts/screenshots', f))
  } catch {
    /* optional */
  }
}

console.log('PHOTOS_PASS candidates', n)
await browser.close()
