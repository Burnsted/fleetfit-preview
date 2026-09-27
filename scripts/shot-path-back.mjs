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

// --- Intake: Back must NOT render ---
await page.goto(`${BASE}?${bust}#/intake`, { waitUntil: 'networkidle' })
await page.getByRole('heading', { name: /Tell us about the work day/ }).waitFor({ timeout: 10000 })
const intakeBack = page.locator('[data-path-back], button.path-back')
assert((await intakeBack.count()) === 0, 'Back leaked on Intake (must be hidden, not disabled)')
const intakeText = await page.locator('.path-chrome').innerText()
assert(!/\bBack\b/.test(intakeText), `Intake PATH chrome has Back text: ${intakeText}`)

await page.locator('.path-chrome').scrollIntoViewIfNeeded()
await page.waitForTimeout(200)
await page.screenshot({
  path: path.join(OUT, 'path-back-intake-no-back-mobile.png'),
  fullPage: false,
})
await page.locator('.path-chrome').screenshot({
  path: path.join(OUT, 'path-back-intake-chrome-strip.png'),
})

// --- Add to fleet: ← Back upper right ---
await page.goto(`${BASE}?${bust}#/package/${PKG}`, { waitUntil: 'networkidle' })
await page.locator('.path-chrome').waitFor({ timeout: 10000 })
const pkgBack = page.locator('button.path-back')
assert((await pkgBack.count()) === 1, 'Back missing on Add to fleet')
assert((await pkgBack.getAttribute('data-path-back'))?.startsWith('path-back-'), 'missing path-back build attr')
const label = (await pkgBack.innerText()).replace(/\s+/g, ' ').trim()
assert(label === '← Back', `Back label wrong: "${label}"`)
const box = await pkgBack.boundingBox()
assert(box && box.width >= 44 && box.height >= 44, `hit target < 44×44: ${JSON.stringify(box)}`)
const chromeBox = await page.locator('.path-chrome').boundingBox()
assert(box.x > chromeBox.x + chromeBox.width * 0.45, 'Back not on right side of PATH chrome')

await page.locator('.path-chrome').scrollIntoViewIfNeeded()
await page.waitForTimeout(200)
await page.screenshot({
  path: path.join(OUT, 'path-back-package-upper-right-mobile.png'),
  fullPage: false,
})
await page.locator('.path-chrome-band').screenshot({
  path: path.join(OUT, 'path-back-package-band.png'),
})

// Click Back → Intake (no orphan exit)
await pkgBack.click()
await page.waitForURL(/#\/intake/, { timeout: 8000 })
await page.getByRole('heading', { name: /Tell us about the work day/ }).waitFor({ timeout: 8000 })
await page.waitForTimeout(300)
assert((await page.locator('button.path-back').count()) === 0, 'Back still visible after return to Intake')

// --- Budget: ← Back present, goes to package ---
await page.goto(`${BASE}?${bust}#/budget`, { waitUntil: 'networkidle' })
await page.locator('button.path-back').waitFor({ timeout: 8000 })
const budgetLabel = (await page.locator('button.path-back').innerText()).replace(/\s+/g, ' ').trim()
assert(budgetLabel === '← Back', `Budget Back label wrong: "${budgetLabel}"`)
await page.locator('.path-chrome').scrollIntoViewIfNeeded()
await page.waitForTimeout(200)
await page.screenshot({
  path: path.join(OUT, 'path-back-budget-upper-right-mobile.png'),
  fullPage: false,
})
await page.locator('button.path-back').click()
await page.waitForURL(new RegExp(`#/package/`), { timeout: 8000 })

const files = [
  'path-back-intake-no-back-mobile.png',
  'path-back-intake-chrome-strip.png',
  'path-back-package-upper-right-mobile.png',
  'path-back-package-band.png',
  'path-back-budget-upper-right-mobile.png',
]
for (const f of files) {
  await copyFile(path.join(OUT, f), path.join('/workspace/artifacts/screenshots', f))
}

console.log('OK PATH ← Back: hidden on Intake; visible on package + budget')
await browser.close()
