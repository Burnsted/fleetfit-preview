/**
 * CLEARED Recommendation body mix — Best Truck + Best Van when both exist.
 */
import { chromium } from 'playwright'
import { copyFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const BASE = process.env.SHOT_BASE || 'https://burnsted.github.io/fleetfit-preview/'
const OUT = '/opt/cursor/artifacts/screenshots'
const REPO_OUT = '/workspace/artifacts/screenshots'
await mkdir(OUT, { recursive: true })
await mkdir(REPO_OUT, { recursive: true })

const EXPECT_BUNDLE = process.env.EXPECT_BUNDLE || 'index-CaugybC1.js'
const EXPECT_BUILD = 'recommendation-body-mix-20260926-1450'

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
const url = `${BASE}?bodymix=${Date.now()}#/package/pkg-tc-electrical-4`
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(900)

const bundle = await page.locator('script[src*="assets/index-"]').first().getAttribute('src')
console.log('LIVE_BUNDLE', bundle)
assert(bundle && bundle.includes(EXPECT_BUNDLE), `bundle ${bundle}`)

const mix = page.locator('.recommendation-mix')
await mix.waitFor({ timeout: 15000 })
assert((await mix.getAttribute('data-body-mix-build')) === EXPECT_BUILD, 'mix build stamp')
assert((await mix.getAttribute('data-has-truck')) === 'true', 'missing truck class')
assert((await mix.getAttribute('data-has-van')) === 'true', 'missing van class')

const mixText = await mix.innerText()
console.log('MIX', JSON.stringify(mixText))
assert(/Best Truck/i.test(mixText), 'Best Truck chip missing')
assert(/Best Van/i.test(mixText), 'Best Van chip missing')
assert(!/Worth it/i.test(mixText), 'Worth it leaked')
assert(!/\bSOH\b/.test(mixText), 'SOH leaked')

const truckChip = await mix.locator('[data-body-class="truck"]').innerText()
const vanChip = await mix.locator('[data-body-class="van"]').innerText()
console.log('TRUCK_CHIP', truckChip)
console.log('VAN_CHIP', vanChip)

const seats = page.locator('.stack-card-seat')
const seatCount = await seats.count()
assert(seatCount >= 2, `expected ≥2 Best-of seats, got ${seatCount}`)
const seatLabels = []
for (let i = 0; i < seatCount; i++) seatLabels.push(await seats.nth(i).innerText())
console.log('SEATS', seatLabels)
assert(seatLabels.some((s) => /Best Truck/i.test(s)), 'Best Truck seat missing on cards')
assert(seatLabels.some((s) => /Best Van/i.test(s)), 'Best Van seat missing on cards')

await mix.scrollIntoViewIfNeeded()
await page.waitForTimeout(200)
await page.screenshot({
  path: path.join(OUT, 'recommendation-body-mix-chips.png'),
  fullPage: false,
})
await copyFile(
  path.join(OUT, 'recommendation-body-mix-chips.png'),
  path.join(REPO_OUT, 'recommendation-body-mix-chips.png'),
)

await page.locator('#units-title').scrollIntoViewIfNeeded()
await page.waitForTimeout(200)
await page.screenshot({
  path: path.join(OUT, 'recommendation-body-mix-units.png'),
  fullPage: false,
})
await copyFile(
  path.join(OUT, 'recommendation-body-mix-units.png'),
  path.join(REPO_OUT, 'recommendation-body-mix-units.png'),
)

console.log('URL', url)
console.log('PASS body mix Best Truck + Best Van')
await browser.close()
