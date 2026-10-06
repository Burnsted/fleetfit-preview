import { chromium } from 'playwright'
import { mkdir, copyFile, writeFile } from 'node:fs/promises'

const LIVE =
  process.env.SHOT_BASE ||
  'https://burnsted.github.io/fleetfit-preview/'
const OUT = '/opt/cursor/artifacts/screenshots'
const LOCAL = '/workspace/artifacts/screenshots'
const STAMP = 'score-v2-f-pages-20260927-1515'
const HASH = 'index-D4Wn_9Gm.js'

await mkdir(OUT, { recursive: true })
await mkdir(LOCAL, { recursive: true })

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 2,
})
await context.route('**/*', (route) => {
  const headers = {
    ...route.request().headers(),
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
  }
  route.continue({ headers })
})
const page = await context.newPage()

const url = `${LIVE}?t=${Date.now()}#/package/pkg-tc-electrical-4`
await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 })
await page.waitForTimeout(1200)

// Confirm live bundle hash
const html = await page.content()
assert(html.includes(HASH), `live html missing ${HASH}`)

const root = page.locator('.package-page')
await root.waitFor({ timeout: 30000 })
const stamp = await root.getAttribute('data-score-v2')
assert(stamp === STAMP, `stamp expected ${STAMP}, got ${stamp}`)

const bodyText = await page.locator('body').innerText()
assert(
  !bodyText.includes('Dash = not on file.'),
  'Dash string still present',
)
assert(
  !bodyText.includes('Full available options · Replacement Score'),
  'Full available options string still present',
)
assert(
  !bodyText.includes('Score incomplete: current vehicle not entered'),
  'old incomplete-current string still on page',
)

// Dials should show real totals (at least one complete score)
const dialValues = await page.locator('.score-dial-value').allTextContents()
const dialDiffs = await page.locator('.score-dial-diff').allTextContents()
const dialCurrents = await page.locator('.score-dial-current').allTextContents()
console.log('dial values', dialValues)
console.log('dial diffs', dialDiffs)
console.log('dial currents', dialCurrents)
assert(
  dialValues.some((v) => /\d+\.\d/.test(v)),
  'no NN.N dial values on cards',
)
assert(dialDiffs.some((d) => /vs current/.test(d)), 'no ± vs current on cards')
assert(
  dialCurrents.some((c) => /^Current\s+\d/.test(c)),
  'no muted Current NN.N on cards',
)

const cardsPath = `${OUT}/pages-bar-score-cards-oX2lAnaU.png`
await page.locator('.package-unit-stack').screenshot({ path: cardsPath })
await copyFile(cardsPath, `${LOCAL}/pages-bar-score-cards-oX2lAnaU.png`)

// Open first tappable dial (highest rank / first with score)
const dialBtn = page.locator('.score-dial.is-tappable').first()
await dialBtn.click()
await page.waitForTimeout(600)
const readout = page.locator('.replacement-score.is-open, .score-readout, [aria-label="Replacement Score"]').first()
await readout.waitFor({ timeout: 15000 })
const readoutText = await readout.innerText()
console.log('--- READOUT ---\n', readoutText.slice(0, 2500))
assert(/Example current vehicle/i.test(readoutText), 'missing Example current vehicle label')
assert(/Transit-250/i.test(readoutText), 'missing Transit-250 in readout')
assert(!/current vehicle not entered/i.test(readoutText), 'incomplete-current in readout')
assert(/\d+\.\d\s*\/\s*\d+/.test(readoutText), 'missing NN.N / PP in readout')

const readoutPath = `${OUT}/pages-bar-score-readout-oX2lAnaU.png`
await page.screenshot({ path: readoutPath, fullPage: false })
await copyFile(readoutPath, `${LOCAL}/pages-bar-score-readout-oX2lAnaU.png`)

// Also capture full cards+header area
const pagePath = `${OUT}/pages-bar-score-package-oX2lAnaU.png`
await page.screenshot({ path: pagePath, fullPage: true })
await copyFile(pagePath, `${LOCAL}/pages-bar-score-package-oX2lAnaU.png`)

const report = {
  url,
  hash: HASH,
  stamp,
  dialValues,
  dialDiffs,
  dialCurrents,
  readoutPreview: readoutText.slice(0, 3000),
}
await writeFile(
  `${OUT}/pages-bar-score-oX2lAnaU.json`,
  JSON.stringify(report, null, 2),
)
await writeFile(
  `${LOCAL}/pages-bar-score-oX2lAnaU.json`,
  JSON.stringify(report, null, 2),
)

console.log('OK', HASH, stamp)
await browser.close()
