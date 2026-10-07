/**
 * CLEARED Replacement Score live proof — ranked list + similar-mile sidegrade visible.
 */
import { chromium } from 'playwright'
import { copyFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const BASE = process.env.SHOT_BASE || 'https://burnsted.github.io/fleetfit-preview/'
const OUT = '/opt/cursor/artifacts/screenshots'
const REPO_OUT = '/workspace/artifacts/screenshots'
await mkdir(OUT, { recursive: true })
await mkdir(REPO_OUT, { recursive: true })

const EXPECT_BUNDLE = process.env.EXPECT_BUNDLE || 'index-DWXObi0h.js'
const EXPECT_BUILD = 'replacement-score-20260926-1439'

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
const url = `${BASE}?score=${Date.now()}#/package/pkg-tc-electrical-4`
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(900)

const bundle = await page.locator('script[src*="assets/index-"]').first().getAttribute('src')
console.log('LIVE_BUNDLE', bundle)
assert(bundle && bundle.includes(EXPECT_BUNDLE), `bundle ${bundle}`)

await page.locator('.package-unit-stack .stack-card.is-candidate').first().waitFor({ timeout: 15000 })
const cards = page.locator('.package-unit-stack .stack-card.is-candidate')
const n = await cards.count()
assert(n >= 4, `expected 4 candidates, got ${n}`)

const stamps = await page.locator(`[data-score-build="${EXPECT_BUILD}"]`).count()
assert(stamps >= 4, `score build stamps ${stamps}`)

const body = await page.locator('.locked-page').innerText()
assert(!/Worth it/i.test(body), 'Worth it leaked')
assert(!/\bSOH\b/.test(body), 'SOH leaked')
assert(!/\bFACT\b/.test(body), 'FACT pill leaked')
assert(/Ranked by Replacement Score/i.test(body), 'rank note missing')

let sideIdx = -1
const order = []
for (let i = 0; i < n; i++) {
  const card = cards.nth(i)
  const text = await card.innerText()
  const side = (await card.getAttribute('data-sidegrade')) === 'true'
  const title = text.split('\n').find((l) => /\d{4}/.test(l)) || '?'
  order.push({ i, title, side, text: text.slice(0, 160) })
  if (side && sideIdx < 0) sideIdx = i
  console.log('CARD', i + 1, title, side ? 'SIDEGRADE' : 'ok')
}
assert(sideIdx >= 0, 'no similar-mile sidegrade visible')
assert(sideIdx >= 2, `sidegrade should sort lower, idx ${sideIdx}`)

await page.locator('#units-title').scrollIntoViewIfNeeded()
await page.waitForTimeout(200)
await page.screenshot({
  path: path.join(OUT, 'replacement-score-ranked-units.png'),
  fullPage: false,
})
await copyFile(
  path.join(OUT, 'replacement-score-ranked-units.png'),
  path.join(REPO_OUT, 'replacement-score-ranked-units.png'),
)

// Open a sidegrade unit for open score panel
const sideCard = cards.nth(sideIdx)
const open = sideCard.locator('a.stack-card-open-quiet')
await open.click()
await page.waitForTimeout(800)
await page.locator('.replacement-score.is-open').first().waitFor({ timeout: 10000 })
const openText = await page.locator('.replacement-score.is-open').first().innerText()
console.log('OPEN_SCORE', JSON.stringify(openText.slice(0, 400)))
assert(/Replacement Score/i.test(openText), 'open score missing')
assert(/Life Delta/i.test(openText), 'Life Delta cat missing')
assert(/Job Fit/i.test(openText), 'Job Fit cat missing')
assert(!/Worth it/i.test(openText), 'Worth it in open score')
assert(!/\bSOH\b/.test(openText), 'SOH in open score')
assert(/Similar miles|Watch-outs|Life Delta/i.test(openText), 'sidegrade narrative missing')

await page.locator('.replacement-score.is-open').first().scrollIntoViewIfNeeded()
await page.waitForTimeout(200)
await page.screenshot({
  path: path.join(OUT, 'replacement-score-sidegrade-open.png'),
  fullPage: false,
})
await copyFile(
  path.join(OUT, 'replacement-score-sidegrade-open.png'),
  path.join(REPO_OUT, 'replacement-score-sidegrade-open.png'),
)

console.log('URL', url)
console.log('PASS replacement score UI + sidegrade visible')
await browser.close()
