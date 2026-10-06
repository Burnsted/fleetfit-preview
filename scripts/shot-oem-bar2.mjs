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
const page = await (
  await browser.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2 })
).newPage()

await page.goto(`${BASE}?t=${Date.now()}#/package/${PKG}`, { waitUntil: 'networkidle' })
const root = page.locator('.package-page')
await root.waitFor()
assert((await root.getAttribute('data-oem-specs')) === STAMP, 'oem stamp')
assert((await root.getAttribute('data-outbound-listing')) === STAMP, 'outbound stamp')

const facts = await page.locator('.match-header-chips').innerText()
assert(!/Battery —|Recalls —|Trade-in —/.test(facts), `Match Facts still have —:\n${facts}`)
assert(/Battery .+kWh|Battery Not published/.test(facts), `Battery fact missing:\n${facts}`)
assert(/Recalls Not checked/.test(facts), `Recalls fact missing:\n${facts}`)
console.log('FACTS', facts.replace(/\n/g, ' | '))

// ProMaster must be fallback
const promaster = page.locator('.package-unit-stack .stack-card', { hasText: 'ProMaster' })
await promaster.first().waitFor()
const pmCta = await promaster.locator('.stack-card-outbound, .outbound-listing-unavailable').first().innerText()
assert(pmCta.trim() === 'Seller listing not available', `ProMaster outbound: ${pmCta}`)

// Redirects
await page.goto(`${BASE}?t=${Date.now()}#/listing/unit-e5`, { waitUntil: 'networkidle' })
await page.waitForTimeout(400)
assert(
  page.url().includes(`#/package/${PKG}`) && !page.url().includes('/listing/'),
  `listing redirect failed: ${page.url()}`,
)
await page.goto(`${BASE}?t=${Date.now()}#/package/${PKG}/unit/unit-e1`, { waitUntil: 'networkidle' })
await page.waitForTimeout(400)
assert(
  page.url().includes(`#/package/${PKG}`) && !page.url().includes('/unit/'),
  `unit redirect failed: ${page.url()}`,
)

await page.goto(`${BASE}?t=${Date.now()}#/package/${PKG}`, { waitUntil: 'networkidle' })
await page.locator('.match-header-chips').scrollIntoViewIfNeeded()
await page.waitForTimeout(200)
await page.screenshot({ path: path.join(OUT, 'oem-bar2-match-facts.png'), fullPage: false })

const sierra = page.locator('.package-unit-stack .stack-card', { hasText: 'Sierra EV' }).first()
await sierra.locator('.score-dial.is-tappable').click()
await page.locator('.score-readout-sheet').waitFor()
await page.locator('.unit-specs-block').waitFor()
const specs = await page.locator('.unit-specs-block').innerText()
assert(/Range \(EPA\)/.test(specs), 'specs missing range')
assert(/Battery/.test(specs) && /kWh|Not published/.test(specs), 'specs missing battery')
assert(/GVWR|Curb|AC charge|DC fast/.test(specs), 'specs missing weight/charger rows')
assert(!/—/.test(specs), `specs still have em dash:\n${specs}`)
console.log('SPECS', specs.replace(/\n/g, ' | ').slice(0, 400))
await page.waitForTimeout(200)
await page.screenshot({ path: path.join(OUT, 'oem-bar2-specs-readout.png'), fullPage: false })

for (const f of ['oem-bar2-match-facts.png', 'oem-bar2-specs-readout.png']) {
  await copyFile(path.join(OUT, f), path.join('/workspace/artifacts/screenshots', f))
}

console.log('OK', STAMP)
await browser.close()
