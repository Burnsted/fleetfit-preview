import { chromium } from 'playwright'
import { copyFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const BASE = process.env.SHOT_BASE || 'http://127.0.0.1:4173/fleetfit-preview/'
const OUT = process.env.SHOT_OUT || '/opt/cursor/artifacts/screenshots'
const PKG = 'pkg-tc-electrical-4'
const STAMP = 'oem-bar2-20260926-1915'
await mkdir(OUT, { recursive: true })
await mkdir('/workspace/artifacts/screenshots', { recursive: true })

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
await page.goto(`${BASE}?t=${Date.now()}#/package/${PKG}`, { waitUntil: 'networkidle' })

const root = page.locator('.package-page')
await root.waitFor()
assert((await root.getAttribute('data-oem-specs')) === STAMP, 'oem stamp')

const text = await page.locator('.package-unit-stack').innerText()
assert(!/Payload —|Bed —|Cab —|Tow —/.test(text), `em-dash specs remain:\n${text.slice(0, 400)}`)
assert(/Payload \d|Payload Not published/.test(text), 'payload chips missing')
assert(/Tow \d|Tow Not published/.test(text), 'tow chips missing')
assert(!/Best Truck|Best Van|Worth it|\bSOH\b/.test(await page.locator('body').innerText()), 'banned pills')

const cards = page.locator('.package-unit-stack .stack-card.is-candidate')
const n = await cards.count()
assert(n >= 5, `expected full options, got ${n}`)
for (let i = 0; i < n; i++) {
  const card = cards.nth(i)
  const heading = await card.locator('.stack-card-heading').innerText()
  const chips = await card.locator('.stack-card-chips').innerText()
  console.log('CARD', heading, '→', chips.replace(/\n/g, ' | '))
}

await page.locator('.package-unit-stack').scrollIntoViewIfNeeded()
await page.waitForTimeout(250)
await page.screenshot({ path: path.join(OUT, 'oem-specs-package-cards.png'), fullPage: false })

await cards.first().locator('.score-dial.is-tappable').click()
await page.locator('.score-readout-sheet').waitFor()
await page.waitForTimeout(200)
await page.screenshot({ path: path.join(OUT, 'oem-specs-dial-tap.png'), fullPage: false })

for (const f of ['oem-specs-package-cards.png', 'oem-specs-dial-tap.png']) {
  await copyFile(path.join(OUT, f), path.join('/workspace/artifacts/screenshots', f))
}

console.log('OK OEM specs', STAMP, 'cards', n)
await browser.close()
