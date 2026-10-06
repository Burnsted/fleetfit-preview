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
await page.goto(`${BASE}?density=${Date.now()}#/package/pkg-tc-electrical-4`, {
  waitUntil: 'networkidle',
  timeout: 60000,
})
await page.waitForTimeout(600)

const bundle = await page.locator('script[src*="assets/index-"]').first().getAttribute('src')
console.log('LIVE_BUNDLE', bundle)

const pkgText = await page.locator('body').innerText()
assert(!/Free EV layer/i.test(pkgText), 'Free EV layer still on package')
assert(!/About this unit/i.test(pkgText), 'About on package')
assert(!/Open items/i.test(pkgText), 'Open items on package')
assert(!/Annual savings/i.test(pkgText), 'Annual savings prose on package')
assert(!/what is FleetFit|How money works/i.test(pkgText), 'extra FleetFit essay')
assert(pkgText.includes('Fee at checkout — amount TBD'), 'package fee line missing')
assert(pkgText.includes('FleetFit has not seen these trucks'), 'quiet foot missing')
assert((await page.locator('.match-header .spec-chip').count()) >= 3, 'match chips missing')
assert((await page.locator('.stack-card.is-candidate .stack-card-chips .spec-chip').count()) >= 3, 'unit face chips missing')
assert((await page.locator('.stack-card-open-quiet').count()) >= 1, 'quiet Open missing')

await page.locator('.match-header').scrollIntoViewIfNeeded()
await page.waitForTimeout(200)
await page.screenshot({ path: path.join(OUT, 'package-density-results.png'), fullPage: false })

await page.locator('.stack-card-open-quiet').first().click()
await page.waitForTimeout(500)
assert(page.url().includes('/unit/'), `unit nav failed: ${page.url()}`)
const unitText = await page.locator('body').innerText()
assert(!/Free EV layer/i.test(unitText), 'Free EV layer still on unit')
assert(!/About this unit/i.test(unitText), 'About still on unit')
assert(!/Open items/i.test(unitText), 'Open items still on unit')
assert(!/Annual savings vs a twin/i.test(unitText), 'savings guilt note on unit')
assert(!/Buyer’s fee appears only at checkout/i.test(unitText), 'per-card fee note on unit')
assert((await page.locator('[data-density-build="package-unit-density-20260926-0923"]').count()) === 1, 'unit density stamp missing')
assert((await page.locator('.unit-dense-chips .spec-chip').count()) >= 5, 'unit chips thin')
assert(unitText.includes('Fee at checkout — amount TBD'), 'unit fee line missing')
assert(unitText.includes('FleetFit has not seen these trucks'), 'unit foot missing')

await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(200)
await page.screenshot({ path: path.join(OUT, 'package-density-unit.png'), fullPage: false })

for (const f of ['package-density-results.png', 'package-density-unit.png']) {
  await copyFile(path.join(OUT, f), path.join('/workspace/artifacts/screenshots', f))
}

console.log('DENSITY_PASS', bundle)
await browser.close()
