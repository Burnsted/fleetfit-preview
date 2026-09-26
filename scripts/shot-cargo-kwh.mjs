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
const page = await (await browser.newContext({
  viewport: { width: 390, height: 900 },
  deviceScaleFactor: 2,
})).newPage()

await page.goto(`${BASE}?t=${Date.now()}#/package/${PKG}`, { waitUntil: 'networkidle' })
const root = page.locator('.package-page')
await root.waitFor()
assert((await root.getAttribute('data-oem-specs')) === STAMP, 'stamp')

const vans = page.locator('.package-unit-stack .stack-card.is-candidate[data-body-class="van"]')
const n = await vans.count()
assert(n >= 2, `expected vans, got ${n}`)
for (let i = 0; i < n; i++) {
  const card = vans.nth(i)
  const heading = (await card.locator('.stack-card-heading').innerText()).trim()
  const chips = (await card.locator('.stack-card-chips').innerText()).replace(/\n/g, ' | ')
  assert(/Cargo [\d.]+ cu ft/.test(chips), `${heading}: need Cargo cu ft → ${chips}`)
  assert(/Battery [\d.]+ kWh/.test(chips), `${heading}: need Battery kWh → ${chips}`)
  assert(!/\bBed\b|Battery health|\bSOH\b/.test(chips), `${heading}: banned chip → ${chips}`)
  console.log('VAN', heading, '→', chips)
}

await vans.first().scrollIntoViewIfNeeded()
await page.waitForTimeout(200)
await page.screenshot({ path: path.join(OUT, 'oem-cargo-kwh-van-cards.png'), fullPage: false })
await copyFile(
  path.join(OUT, 'oem-cargo-kwh-van-cards.png'),
  path.join('/workspace/artifacts/screenshots', 'oem-cargo-kwh-van-cards.png'),
)

console.log('OK', STAMP, 'vans', n)
await browser.close()
