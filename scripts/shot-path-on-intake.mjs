import { chromium } from 'playwright'
import { copyFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const BASE = process.env.SHOT_BASE || 'http://127.0.0.1:4173/fleetfit-preview/'
const OUT = process.env.SHOT_OUT || '/opt/cursor/artifacts/screenshots'
await mkdir(OUT, { recursive: true })
await mkdir('/workspace/artifacts/screenshots', { recursive: true })

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
})

await page.goto(`${BASE}#/intake`, { waitUntil: 'networkidle' })
await page.getByRole('heading', { name: /Tell us about the work day/ }).waitFor({ timeout: 8000 })

const pathLabels = await page.locator('.path-chrome .home-path-card span').allTextContents()
assert(
  pathLabels.join(' · ') === 'Intake · Add to fleet · Budget',
  `PATH on intake wrong: ${pathLabels.join(' · ')}`,
)
assert(!pathLabels.includes('Package'), 'Package chip leaked on intake PATH')
assert((await page.locator('.path-chrome .home-path-card.is-active').count()) >= 1, 'Intake step not active')

// Copy still PASS — do not regress
const body = await page.locator('body').innerText()
assert(body.includes('We’ll match a used EV package to the work day.'), 'subline regress')
assert(body.includes('Blank is fine.'), 'fleet helper regress')
assert(body.includes('Match a package'), 'CTA regress')
assert(!body.includes('Primary path:'), 'primary-path essay regress')
assert(!(await page.locator('.locked-crumbs').count()), 'breadcrumb still present instead of PATH')

await page.locator('.path-chrome').scrollIntoViewIfNeeded()
await page.waitForTimeout(200)
await page.screenshot({
  path: path.join(OUT, 'path-fix-intake-top-mobile.png'),
  fullPage: false,
})
await page.locator('.path-chrome').screenshot({
  path: path.join(OUT, 'path-fix-intake-strip-mobile.png'),
})

await page.goto(`${BASE}#/`, { waitUntil: 'networkidle' })
await page.waitForTimeout(300)
const homeLabels = await page.locator('.path-chrome .home-path-card span').allTextContents()
assert(
  homeLabels.join(' · ') === 'Intake · Add to fleet · Budget',
  `PATH on home wrong: ${homeLabels.join(' · ')}`,
)
await page.locator('.path-chrome').scrollIntoViewIfNeeded()
await page.waitForTimeout(200)
await page.locator('.path-chrome').screenshot({
  path: path.join(OUT, 'path-fix-home-strip-mobile.png'),
})

for (const f of [
  'path-fix-intake-top-mobile.png',
  'path-fix-intake-strip-mobile.png',
  'path-fix-home-strip-mobile.png',
]) {
  await copyFile(path.join(OUT, f), path.join('/workspace/artifacts/screenshots', f))
}

console.log('OK intake PATH', pathLabels.join(' · '))
console.log('OK home PATH', homeLabels.join(' · '))
await browser.close()
