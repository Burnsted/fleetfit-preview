/**
 * CLEARED Exact ship proof — inventory freshness + full option rank + dial labels.
 * Quote: recommendation-set/CLEARED-FOR-WOZ.md · SCORE-UI · soft-taper CLEARED.
 */
import { chromium } from 'playwright'
import { copyFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const BASE = process.env.SHOT_BASE || 'https://burnsted.github.io/fleetfit-preview/'
const OUT = process.env.SHOT_OUT || '/opt/cursor/artifacts/screenshots'
const REPO = '/workspace/artifacts/screenshots'
const PKG = 'pkg-tc-electrical-4'
const MIX = 'inventory-rank-20260926-1628'
const SHIP = 'cleared-inv-rank-dial-20260926-1628'
const DIAL = 'score-ui-dial-20260926-1628'
const EXPECT = process.env.EXPECT_BUNDLE || ''

await mkdir(OUT, { recursive: true })
await mkdir(REPO, { recursive: true })

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: { width: 390, height: 900 },
  deviceScaleFactor: 2,
})
await context.route('**/*', async (route) => {
  await route.continue({
    headers: {
      ...route.request().headers(),
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  })
})
const page = await context.newPage()
const bust = `t=${Date.now()}`
await page.goto(`${BASE}?${bust}#/package/${PKG}`, { waitUntil: 'networkidle', timeout: 60000 })

const bundle = await page.locator('script[src*="assets/index-"]').first().getAttribute('src')
console.log('LIVE_BUNDLE', bundle)
if (EXPECT) assert(bundle && bundle.includes(EXPECT), `bundle ${bundle} != ${EXPECT}`)

const pageRoot = page.locator('.package-page')
await pageRoot.waitFor({ timeout: 15000 })
assert((await pageRoot.getAttribute('data-cleared-ship')) === SHIP, 'cleared-ship stamp')
assert((await pageRoot.getAttribute('data-body-mix-build')) === MIX, 'mix stamp')

const mix = page.locator('.recommendation-mix')
assert((await mix.getAttribute('data-has-truck')) === 'true', 'truck missing')
assert((await mix.getAttribute('data-has-van')) === 'true', 'van missing')
assert((await mix.getAttribute('data-has-fresh-my')) === 'true', 'fresh MY missing')

const text = await page.locator('.locked-page').innerText()
assert(!/Best Truck|Best Van|Best fit|Worst fit/i.test(text), 'Best* labels leaked')
assert(!/\bWorth it\b/i.test(text), 'Worth it leaked')
assert(!/\bSOH\b/.test(text), 'SOH pill leaked')
assert(/Includes 2025–2026/.test(text), 'fresh chip missing')

const cards = page.locator('.package-unit-stack .stack-card.is-candidate')
const n = await cards.count()
assert(n >= 5, `full options expected, got ${n}`)

const years = []
const bodies = []
const scores = []
for (let i = 0; i < n; i++) {
  const card = cards.nth(i)
  years.push(Number(await card.getAttribute('data-model-year')))
  bodies.push(await card.getAttribute('data-body-class'))
  const dial = card.locator('.score-dial')
  assert((await dial.count()) === 1, `dial missing card ${i}`)
  assert((await dial.getAttribute('data-score-ui')) === DIAL, 'dial stamp')
  // Dial right of price in price band
  const band = card.locator('.unit-photo-price-band')
  const askBox = await band.locator('.unit-photo-ask').boundingBox()
  const dialBox = await dial.boundingBox()
  assert(askBox && dialBox, 'price/dial boxes')
  assert(dialBox.x > askBox.x, 'dial not right of price')
  const val = await dial.locator('.score-dial-value').innerText()
  if (val !== '—') scores.push(Number(val))
  console.log(
    'CARD',
    i + 1,
    await card.locator('.stack-card-heading').innerText(),
    'year',
    years[i],
    'body',
    bodies[i],
    'score',
    val,
  )
}

assert(years.includes(2025) || years.some((y) => y >= 2025), '2025+ missing')
assert(years.includes(2026) || years.some((y) => y >= 2026), '2026 missing')
assert(bodies.includes('truck') && bodies.includes('van'), 'both body classes')
assert(years[0] >= 2025, `top of set not look-newer: ${years[0]}`)
for (let i = 1; i < scores.length; i++) {
  assert(scores[i - 1] + 0.05 >= scores[i], `not high→low: ${scores}`)
}

await page.locator('.recommendation-mix').scrollIntoViewIfNeeded()
await page.waitForTimeout(200)
await page.screenshot({ path: path.join(OUT, 'cleared-inv-rank-mix.png'), fullPage: false })

await page.locator('.package-unit-stack').scrollIntoViewIfNeeded()
await page.waitForTimeout(200)
await page.screenshot({ path: path.join(OUT, 'cleared-inv-rank-list.png'), fullPage: false })

const firstDial = cards.first().locator('.unit-photo-price-band')
await firstDial.scrollIntoViewIfNeeded()
await page.waitForTimeout(200)
await firstDial.screenshot({ path: path.join(OUT, 'cleared-inv-rank-dial.png') })

// Dial tap still opens readout (SCORE-UI lock)
await cards.first().locator('.score-dial.is-tappable').click()
await page.locator('.score-readout-sheet').waitFor({ timeout: 8000 })
const sheet = await page.locator('.score-readout-sheet').innerText()
assert(/Job Fit detail|Life Delta|Helps|Watch-outs/i.test(sheet), 'readout incomplete')
assert(!/\bSOH\b|\bWorth it\b/.test(sheet), 'banned pills in readout')
await page.screenshot({ path: path.join(OUT, 'cleared-inv-rank-dial-tap.png'), fullPage: false })
await page.locator('.score-readout-close').click()

const files = [
  'cleared-inv-rank-mix.png',
  'cleared-inv-rank-list.png',
  'cleared-inv-rank-dial.png',
  'cleared-inv-rank-dial-tap.png',
]
for (const f of files) await copyFile(path.join(OUT, f), path.join(REPO, f))

console.log('OK CLEARED inv freshness + full rank + dial; top year', years[0], 'n', n)
await browser.close()
