import { chromium } from 'playwright'
import { copyFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const BASE = process.env.SHOT_BASE || 'http://127.0.0.1:4173/fleetfit-preview/'
const OUT = process.env.SHOT_OUT || '/opt/cursor/artifacts/screenshots'
const PKG = 'pkg-tc-electrical-4'
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
await context.route('**/*', async (route) => {
  const headers = {
    ...route.request().headers(),
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
  }
  await route.continue({ headers })
})
const page = await context.newPage()
const bust = `t=${Date.now()}`

await page.goto(`${BASE}?${bust}#/package/${PKG}`, { waitUntil: 'networkidle' })
await page.locator('.stack-card.is-candidate .score-dial.is-tappable').first().waitFor({ timeout: 12000 })

const body = await page.locator('body').innerText()
assert(!/Best Truck|Best Van|Best fit|Worst fit/i.test(body), 'Best* labels leaked')
assert(!/\bWorth it\b|\bSOH\b|\bFACT\b/i.test(body), 'banned pills leaked on package')
assert(/2025|2026/.test(body), 'freshness years missing')

const dial = page.locator('.stack-card.is-candidate .score-dial.is-tappable').first()
assert((await dial.getAttribute('data-dial-tap')) === 'open', 'dial missing tap affordance')
const box = await dial.boundingBox()
assert(box && box.width >= 40 && box.height >= 40, `dial hit too small: ${JSON.stringify(box)}`)

await dial.scrollIntoViewIfNeeded()
await page.waitForTimeout(250)
await page.screenshot({
  path: path.join(OUT, 'score-dial-tap-card-dial.png'),
  fullPage: false,
})

await dial.click()
const sheet = page.locator('.score-readout-sheet[data-score-dial-tap]')
await sheet.waitFor({ timeout: 8000 })
const cats = page.locator('.score-readout-body .replacement-score-cats > li')
assert((await cats.count()) >= 10, `expected ≥10 categories, got ${await cats.count()}`)
const sheetText = await sheet.innerText()
assert(/Job Fit detail|Life Delta|Warranty|Battery Health|Range|Charging|Serviceability|Energy|Maintenance|Residual/i.test(sheetText), 'category labels missing')
assert(/Helps/i.test(sheetText), 'Helps missing')
assert(/Watch-outs/i.test(sheetText), 'Watch-outs missing')
assert(/Replacement Score|Score incomplete/i.test(sheetText), 'total missing')
assert(!/\bSOH\b|\bWorth it\b|\bFACT\b/i.test(sheetText), 'banned pills in readout')

await page.waitForTimeout(200)
await page.screenshot({
  path: path.join(OUT, 'score-dial-tap-readout-open.png'),
  fullPage: false,
})
await page.locator('.score-readout-panel').screenshot({
  path: path.join(OUT, 'score-dial-tap-readout-panel.png'),
})

await page.locator('.score-readout-close').click()
await sheet.waitFor({ state: 'detached', timeout: 5000 })

// Freshness / order still live — top candidate year
const topYear = await page.locator('.stack-card.is-candidate').first().getAttribute('data-model-year')
assert(topYear === '2026' || topYear === '2025', `top year not fresh: ${topYear}`)
await page.locator('.recommendation-mix').scrollIntoViewIfNeeded()
await page.waitForTimeout(200)
await page.screenshot({
  path: path.join(OUT, 'score-dial-tap-freshness-mix.png'),
  fullPage: false,
})

const files = [
  'score-dial-tap-card-dial.png',
  'score-dial-tap-readout-open.png',
  'score-dial-tap-readout-panel.png',
  'score-dial-tap-freshness-mix.png',
]
for (const f of files) {
  await copyFile(path.join(OUT, f), path.join('/workspace/artifacts/screenshots', f))
}

console.log('OK dial tap → full readout; freshness still live; top year', topYear)
await browser.close()
