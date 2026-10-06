/**
 * CLEARED Score UI dial + body mix — dial RIGHT of price; Best Truck+Van.
 */
import { chromium } from 'playwright'
import { copyFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const BASE = process.env.SHOT_BASE || 'https://burnsted.github.io/fleetfit-preview/'
const OUT = '/opt/cursor/artifacts/screenshots'
const REPO_OUT = '/workspace/artifacts/screenshots'
await mkdir(OUT, { recursive: true })
await mkdir(REPO_OUT, { recursive: true })

const EXPECT_BUNDLE = process.env.EXPECT_BUNDLE || 'index-CmDw0bSf.js'
const DIAL_BUILD = 'score-ui-dial-20260926-1451'
const MIX_BUILD = 'recommendation-body-mix-20260926-1450'

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
const url = `${BASE}?dial=${Date.now()}#/package/pkg-tc-electrical-4`
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(900)

const bundle = await page.locator('script[src*="assets/index-"]').first().getAttribute('src')
console.log('LIVE_BUNDLE', bundle)
assert(bundle && bundle.includes(EXPECT_BUNDLE), `bundle ${bundle}`)

// Body mix still present
const mix = page.locator('.recommendation-mix')
await mix.waitFor({ timeout: 15000 })
assert((await mix.getAttribute('data-body-mix-build')) === MIX_BUILD, 'mix stamp')
const mixText = await mix.innerText()
assert(/Best Truck/i.test(mixText) && /Best Van/i.test(mixText), 'body mix missing')
console.log('MIX', mixText.replace(/\n+/g, ' | '))

// Dial chrome in price band
const bands = page.locator('.unit-photo-price-band[data-score-chrome="dial"]')
await bands.first().waitFor({ timeout: 10000 })
assert((await bands.count()) >= 2, 'expected dial price bands on cards')

const dials = page.locator('.score-dial')
assert((await dials.count()) >= 2, 'expected score dials')
assert(
  (await dials.first().getAttribute('data-score-ui')) === DIAL_BUILD,
  'dial build stamp',
)

// Thin compact strip must not be primary on stack cards
assert(
  (await page.locator('.stack-card .replacement-score.is-compact').count()) === 0,
  'compact #n X.X/10 strip still primary on cards',
)

const firstBand = bands.first()
const askBox = await firstBand.locator('.unit-photo-ask').boundingBox()
const dialBox = await firstBand.locator('.score-dial').boundingBox()
assert(askBox && dialBox, 'ask/dial boxes missing')
assert(dialBox.x > askBox.x, `dial must be RIGHT of price (dial ${dialBox.x} ask ${askBox.x})`)
console.log('ASK', askBox, 'DIAL', dialBox)

const dialVal = await firstBand.locator('.score-dial-value').innerText()
console.log('DIAL_VALUE', dialVal)
assert(/^\d+\.\d$|^—$/.test(dialVal.trim()), `dial value ${dialVal}`)

await page.locator('.package-unit-stack .stack-card.is-candidate').first().scrollIntoViewIfNeeded()
await page.waitForTimeout(250)
await page.locator('.package-unit-stack .unit-photo').first().screenshot({
  path: path.join(OUT, 'score-dial-beside-price.png'),
})
await copyFile(
  path.join(OUT, 'score-dial-beside-price.png'),
  path.join(REPO_OUT, 'score-dial-beside-price.png'),
)

await mix.scrollIntoViewIfNeeded()
await page.waitForTimeout(200)
await page.screenshot({
  path: path.join(OUT, 'score-dial-and-body-mix.png'),
  fullPage: false,
})
await copyFile(
  path.join(OUT, 'score-dial-and-body-mix.png'),
  path.join(REPO_OUT, 'score-dial-and-body-mix.png'),
)

// Open detail still has full score panel
await page.locator('.package-unit-stack a.stack-card-open-quiet').first().click()
await page.waitForTimeout(800)
await page.locator('.replacement-score.is-open').first().waitFor({ timeout: 10000 })
const openText = await page.locator('.replacement-score.is-open').first().innerText()
assert(/Life Delta|Job Fit|Helps|Watch-outs/i.test(openText), 'open score regress')
assert((await page.locator('.unit-photo-price-band .score-dial').count()) >= 1, 'hero dial missing')
await page.locator('.unit-photo.is-hero').screenshot({
  path: path.join(OUT, 'score-dial-unit-hero.png'),
})
await copyFile(
  path.join(OUT, 'score-dial-unit-hero.png'),
  path.join(REPO_OUT, 'score-dial-unit-hero.png'),
)

console.log('URL', url)
console.log('PASS dial right of price + body mix')
await browser.close()
