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
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 1,
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

// Intake — zero Back
await page.goto(`${BASE}?${bust}#/intake`, { waitUntil: 'networkidle' })
await page.getByRole('heading', { name: /Tell us about the work day/ }).waitFor()
assert((await page.locator('button.path-back').count()) === 0, 'Back leaked on Intake')
assert((await page.locator('.header-nav button.path-back').count()) === 0, 'header Back on Intake')
await page.screenshot({ path: path.join(OUT, 'path-back-one-intake.png'), fullPage: false })

// Add to fleet via PATH chip — exactly one Back, in PATH band only
await page.locator('.path-chrome .home-path-card', { hasText: 'Add to fleet' }).click()
await page.waitForURL(/#\/package\//)
await page.locator('.path-chrome .home-path-card.is-active', { hasText: 'Add to fleet' }).waitFor()
await page.waitForTimeout(300)
const backs = page.locator('button.path-back')
assert((await backs.count()) === 1, `expected exactly 1 Back, got ${await backs.count()}`)
assert((await page.locator('.header-nav button.path-back').count()) === 0, 'header duplicate still present')
assert((await page.locator('.path-chrome button.path-back').count()) === 1, 'PATH-band Back missing')
assert(
  (await page.locator('.path-chrome button.path-back').getAttribute('data-path-back')) ===
    'path-back-20260926-1613',
  'wrong stamp',
)
const label = (await backs.innerText()).replace(/\s+/g, ' ').trim()
assert(label === '← Back', `label ${label}`)
await page.screenshot({ path: path.join(OUT, 'path-back-one-add-to-fleet.png'), fullPage: false })
await page.locator('.path-chrome-band').screenshot({
  path: path.join(OUT, 'path-back-one-path-band.png'),
})

// Budget — exactly one
await page.locator('.path-chrome .home-path-card', { hasText: 'Budget' }).click()
await page.waitForURL(/#\/budget/)
await page.waitForTimeout(300)
assert((await page.locator('button.path-back').count()) === 1, 'Budget Back count != 1')
assert((await page.locator('.header-nav button.path-back').count()) === 0, 'Budget header duplicate')
await page.screenshot({ path: path.join(OUT, 'path-back-one-budget.png'), fullPage: false })

const files = [
  'path-back-one-intake.png',
  'path-back-one-add-to-fleet.png',
  'path-back-one-path-band.png',
  'path-back-one-budget.png',
]
for (const f of files) {
  await copyFile(path.join(OUT, f), path.join('/workspace/artifacts/screenshots', f))
}

console.log('OK single PATH-band ← Back; Intake none')
await browser.close()
