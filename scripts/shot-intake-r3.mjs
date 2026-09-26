/**
 * CLEARED-FOR-WOZ-R3 live proof on #/intake
 */
import { chromium } from 'playwright'
import { copyFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const BASE = process.env.SHOT_BASE || 'https://burnsted.github.io/fleetfit-preview/'
const OUT = '/opt/cursor/artifacts/screenshots'
const REPO_OUT = '/workspace/artifacts/screenshots'
await mkdir(OUT, { recursive: true })
await mkdir(REPO_OUT, { recursive: true })

const EXPECT_BUNDLE = 'index-CTPAdDTx.js'
const EXPECT_BUILD = 'intake-r3-20260926-1422'

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
const url = `${BASE}?r3=${Date.now()}#/intake`
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(700)

const bundle = await page.locator('script[src*="assets/index-"]').first().getAttribute('src')
console.log('LIVE_BUNDLE', bundle)
assert(bundle && bundle.includes(EXPECT_BUNDLE), `bundle ${bundle}`)

const stamp = await page.locator(`[data-cleared="${EXPECT_BUILD}"]`).count()
assert(stamp === 1, `missing data-cleared ${EXPECT_BUILD}`)

const body = await page.locator('.locked-page').innerText()
const must = [
  'Tell us about the work day',
  'We’ll match a used EV package to the work day.',
  'Trade',
  'Fleet size',
  'Blank is fine.',
  'Address',
  'Typical day miles',
  'Map my day',
  'Map in ABRP',
  'Sketch the day so range isn’t a guess.',
  'Overnight charging',
  'Body',
  'Add unit',
  'Add each unit you want to replace.',
  'Payload',
  'Light',
  'Medium',
  'Heavy',
  'Not sure',
  'Weight band — not a typed number alone.',
  'Cab',
  'Double',
  'Crew',
  'Haul',
  'Upfits',
  'Ladder rack',
  'Toolbox',
  'Cargo rails',
  'Trade-in',
  'Notes (optional)',
  'Match a package',
  'We’ll build from what you set above. Blanks stay open.',
  'Clear',
  'Intake',
  'Add to fleet',
  'Budget',
]
for (const s of must) assert(body.includes(s), `missing live string: ${s}`)

const banned = [
  'Region',
  'Units to replace',
  'Body & units',
  'Spray liner',
  'Regular',
  'Extended',
  'Typical daily miles',
]
for (const s of banned) assert(!body.includes(s), `banned live string: ${s}`)

// Other → Your trade
await page.locator('label.intake-field', { hasText: 'Trade' }).locator('select').selectOption('Other')
await page.waitForTimeout(200)
const tradeOther = page.locator('label.intake-field', { hasText: 'Your trade' })
assert((await tradeOther.count()) === 1, 'Your trade field missing')
assert(
  (await tradeOther.locator('input').getAttribute('placeholder')) === 'Type your trade…',
  'Your trade placeholder',
)

await page.locator('.locked-page-header').scrollIntoViewIfNeeded()
await page.screenshot({
  path: path.join(OUT, 'intake-r3-top.png'),
  fullPage: false,
})
await copyFile(path.join(OUT, 'intake-r3-top.png'), path.join(REPO_OUT, 'intake-r3-top.png'))

await page.locator('.intake-add-unit').scrollIntoViewIfNeeded()
await page.waitForTimeout(200)
await page.screenshot({
  path: path.join(OUT, 'intake-r3-customize.png'),
  fullPage: false,
})
await copyFile(
  path.join(OUT, 'intake-r3-customize.png'),
  path.join(REPO_OUT, 'intake-r3-customize.png'),
)

console.log('SHOTS intake-r3-top.png intake-r3-customize.png')
console.log('URL', url)
console.log('PASS R3 Exact ship strings live')
await browser.close()
