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
await page.goto(`${BASE}?card=${Date.now()}#/shop`, {
  waitUntil: 'networkidle',
  timeout: 60000,
})
await page.waitForTimeout(600)

const bundle = await page.locator('script[src*="assets/index-"]').first().getAttribute('src')
console.log('LIVE_BUNDLE', bundle)

await page.locator('.listing-card').first().waitFor({ timeout: 15000 })
const cards = page.locator('.listing-card')
assert((await cards.count()) >= 1, 'no listing cards on shop')

const firstText = await cards.first().innerText()
assert(!/ladder-rack|toolboxes|spray-liner|service-body/i.test(firstText), `accessory tags on card: ${firstText}`)
assert(!/Seller\s*Fleet/i.test(firstText), 'Seller Fleet still on card')
assert(!/Vin Not Diesel|\bVND\b|VINNOTDIESEL/i.test(firstText), 'VND chrome on card')
assert(!firstText.includes('Seller'), 'Seller meta chip still on card face')

// Card-level: no .card-upfits / .tag inside listing cards
assert((await page.locator('.listing-card .card-upfits').count()) === 0, 'card-upfits still rendered')
assert((await page.locator('.listing-card .tag').count()) === 0, 'tag chips still on listing cards')

const stamp = await cards.first().getAttribute('data-card-build')
assert(stamp === 'listing-card-20260926-0910', `card stamp missing: ${stamp}`)

await cards.first().scrollIntoViewIfNeeded()
await page.waitForTimeout(200)
await cards.first().screenshot({ path: path.join(OUT, 'listing-card-face-clean.png') })
await page.screenshot({ path: path.join(OUT, 'listing-card-shop-strip.png'), fullPage: false })

for (const f of ['listing-card-face-clean.png', 'listing-card-shop-strip.png']) {
  await copyFile(path.join(OUT, f), path.join('/workspace/artifacts/screenshots', f))
}

console.log('CARD_CHROME_PASS', stamp)
await browser.close()
