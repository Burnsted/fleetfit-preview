import { chromium } from 'playwright'
import { copyFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const BASE = process.env.SHOT_BASE || 'http://127.0.0.1:4173/fleetfit-preview/'
const OUT = process.env.SHOT_OUT || '/opt/cursor/artifacts/screenshots'
const PKG = 'pkg-tc-electrical-4'
const OEM = 'oem-cargo-kwh-20260926-1910'
const OUTBOUND = 'outbound-listing-20260926-1905'
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
const page = await context.newPage()
await page.goto(`${BASE}?t=${Date.now()}#/package/${PKG}`, { waitUntil: 'networkidle' })

const root = page.locator('.package-page')
await root.waitFor()
assert((await root.getAttribute('data-oem-specs')) === OEM, 'oem stamp')
assert((await root.getAttribute('data-outbound-listing')) === OUTBOUND, 'outbound stamp')

const stackText = await page.locator('.package-unit-stack').innerText()
assert(!/Payload —|Bed —|Cab —|Tow —|Cargo —|Battery —/.test(stackText), 'em-dash specs remain')
assert(!/Best Truck|Best Van|Worth it|\bSOH\b|\bFACT\b|Battery health/.test(await page.locator('body').innerText()), 'banned pills')

const cards = page.locator('.package-unit-stack .stack-card.is-candidate')
const n = await cards.count()
assert(n >= 5, `expected full options, got ${n}`)

const status = []
for (let i = 0; i < n; i++) {
  const card = cards.nth(i)
  const heading = (await card.locator('.stack-card-heading').innerText()).trim()
  const chips = (await card.locator('.stack-card-chips').innerText()).replace(/\n/g, ' | ')
  const live = (await card.getAttribute('data-listing-live')) === 'true'
  const bodyClass = await card.getAttribute('data-body-class')
  const cta = card.locator('.stack-card-outbound, .outbound-listing-unavailable')
  const ctaText = (await cta.first().innerText()).trim()
  const titleLink = card.locator('a.stack-card-title-link')
  const titleCount = await titleLink.count()
  if (bodyClass === 'van') {
    assert(/Cargo \d|Cargo Not published/.test(chips), `${heading}: van missing Cargo chip → ${chips}`)
    assert(!/\bBed\b/.test(chips), `${heading}: van still shows Bed → ${chips}`)
  } else {
    assert(/Bed \d|Bed Not published/.test(chips), `${heading}: truck missing Bed chip → ${chips}`)
  }
  assert(/Battery \d|Battery Not published/.test(chips), `${heading}: missing Battery kWh → ${chips}`)
  assert(!/Battery health/.test(chips), `${heading}: battery health chip remains`)
  if (live) {
    assert(titleCount === 1, `${heading}: expected title outbound link`)
    const href = await titleLink.getAttribute('href')
    assert(/^https?:\/\//.test(href || ''), `${heading}: bad href ${href}`)
    assert(/View (on|at) .+ ↗/.test(ctaText), `${heading}: bad CTA ${ctaText}`)
  } else {
    assert(ctaText === 'Seller listing not available', `${heading}: expected unavailable, got ${ctaText}`)
  }
  status.push({ heading, live, ctaText, chips })
  console.log(live ? 'LIVE' : 'FALLBACK', heading, '→', ctaText, '|', chips)
}

// Old in-app unit route redirects to package
await page.goto(`${BASE}?t=${Date.now()}#/package/${PKG}/unit/unit-e5`, { waitUntil: 'networkidle' })
await page.waitForTimeout(400)
assert(page.url().includes(`#/package/${PKG}`) && !page.url().includes('/unit/'), `unit redirect failed: ${page.url()}`)

await page.goto(`${BASE}?t=${Date.now()}#/package/${PKG}`, { waitUntil: 'networkidle' })
await page.locator('.package-unit-stack').scrollIntoViewIfNeeded()
await page.waitForTimeout(250)
await page.screenshot({ path: path.join(OUT, 'outbound-listing-cards.png'), fullPage: false })

// Dial still works
await cards.first().locator('.score-dial.is-tappable').click()
await page.locator('.score-readout-sheet').waitFor()
await page.waitForTimeout(200)
await page.screenshot({ path: path.join(OUT, 'outbound-listing-dial.png'), fullPage: false })

for (const f of ['outbound-listing-cards.png', 'outbound-listing-dial.png']) {
  await copyFile(path.join(OUT, f), path.join('/workspace/artifacts/screenshots', f))
}

console.log('OK outbound', OUTBOUND, 'cards', n, 'live', status.filter((s) => s.live).length)
await browser.close()
