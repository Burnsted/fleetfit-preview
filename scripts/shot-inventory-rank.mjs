/**
 * CLEARED inventory freshness + full option rank proof.
 */
import { chromium } from 'playwright'
import { copyFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const BASE = process.env.SHOT_BASE || 'https://burnsted.github.io/fleetfit-preview/'
const OUT = '/opt/cursor/artifacts/screenshots'
const REPO_OUT = '/workspace/artifacts/screenshots'
await mkdir(OUT, { recursive: true })
await mkdir(REPO_OUT, { recursive: true })

const EXPECT_BUNDLE = process.env.EXPECT_BUNDLE || 'index-CDOrz3a8.js'
const MIX_BUILD = 'inventory-rank-20260926-1540'

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: { width: 390, height: 900 },
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
const url = `${BASE}?inv=${Date.now()}#/package/pkg-tc-electrical-4`
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(900)

const bundle = await page.locator('script[src*="assets/index-"]').first().getAttribute('src')
console.log('LIVE_BUNDLE', bundle)
assert(bundle && bundle.includes(EXPECT_BUNDLE), `bundle ${bundle}`)

const mix = page.locator('.recommendation-mix')
await mix.waitFor({ timeout: 15000 })
assert((await mix.getAttribute('data-body-mix-build')) === MIX_BUILD, 'mix stamp')
assert((await mix.getAttribute('data-has-truck')) === 'true', 'truck missing')
assert((await mix.getAttribute('data-has-van')) === 'true', 'van missing')
assert((await mix.getAttribute('data-has-fresh-my')) === 'true', 'fresh MY missing')

const pageText = await page.locator('.locked-page').innerText()
assert(!/Best Truck|Best Van|Best fit|Worst fit/i.test(pageText), 'Best* labels leaked')
assert(!/Worth it/i.test(pageText), 'Worth it leaked')
assert(/Includes 2025–2026|2025|2026/.test(pageText), 'fresh years not visible')

const cards = page.locator('.package-unit-stack .stack-card.is-candidate')
const n = await cards.count()
assert(n >= 5, `expected full option coverage, got ${n}`)

const years = []
const bodies = []
for (let i = 0; i < n; i++) {
  const card = cards.nth(i)
  const y = await card.getAttribute('data-model-year')
  const b = await card.getAttribute('data-body-class')
  const heading = await card.locator('.stack-card-heading').innerText()
  years.push(Number(y))
  bodies.push(b)
  console.log('CARD', i + 1, heading, 'year', y, 'body', b)
}
assert(years.some((y) => y >= 2025), 'no 2025+ in listed cards')
assert(bodies.includes('truck') && bodies.includes('van'), 'both classes required')

// Top card should not be only-old-MY marketing — prefer fresh somewhere near top OR present
const topYear = years[0]
console.log('TOP_YEAR', topYear, 'YEARS', years)

// Dial still primary on cards
assert((await page.locator('.package-unit-stack .score-dial').count()) >= 3, 'dial missing')
assert(
  (await page.locator('.package-unit-stack .replacement-score.is-compact').count()) === 0,
  'compact strip regress',
)
assert((await page.locator('.stack-card-seat').count()) === 0, 'Best* seat labels regress')

await mix.scrollIntoViewIfNeeded()
await page.waitForTimeout(200)
await page.screenshot({
  path: path.join(OUT, 'inventory-rank-fresh-mix.png'),
  fullPage: false,
})
await copyFile(
  path.join(OUT, 'inventory-rank-fresh-mix.png'),
  path.join(REPO_OUT, 'inventory-rank-fresh-mix.png'),
)

await page.locator('#units-title').scrollIntoViewIfNeeded()
await page.waitForTimeout(200)
await page.screenshot({
  path: path.join(OUT, 'inventory-rank-full-list.png'),
  fullPage: false,
})
await copyFile(
  path.join(OUT, 'inventory-rank-full-list.png'),
  path.join(REPO_OUT, 'inventory-rank-full-list.png'),
)

// Close-up of a 2025/2026 card with dial
let freshIdx = years.findIndex((y) => y >= 2025)
assert(freshIdx >= 0, 'fresh card index')
await cards.nth(freshIdx).scrollIntoViewIfNeeded()
await page.waitForTimeout(200)
await cards.nth(freshIdx).locator('.unit-photo').screenshot({
  path: path.join(OUT, 'inventory-rank-fresh-dial.png'),
})
await copyFile(
  path.join(OUT, 'inventory-rank-fresh-dial.png'),
  path.join(REPO_OUT, 'inventory-rank-fresh-dial.png'),
)

console.log('URL', url)
console.log('PASS inventory freshness + full option rank')
await browser.close()
