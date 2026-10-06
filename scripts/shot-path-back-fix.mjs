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

// Intake — Back must not render (header or PATH)
await page.goto(`${BASE}?${bust}#/intake`, { waitUntil: 'networkidle' })
await page.getByRole('heading', { name: /Tell us about the work day/ }).waitFor()
assert((await page.locator('button.path-back').count()) === 0, 'Back leaked on Intake')
await page.screenshot({
  path: path.join(OUT, 'path-back-fix-intake-1280.png'),
  fullPage: false,
})

// Add to fleet — Back in header + PATH band
await page.goto(`${BASE}?${bust}#/package/${PKG}`, { waitUntil: 'networkidle' })
await page.locator('.path-chrome').waitFor()
const pkgHeaderBack = page.locator('.header-nav button.path-back')
const pkgPathBack = page.locator('.path-chrome button.path-back')
assert((await pkgHeaderBack.count()) === 1, 'Header Back missing on Add to fleet')
assert((await pkgPathBack.count()) === 1, 'PATH-band Back missing on Add to fleet')
assert(
  (await pkgHeaderBack.getAttribute('data-path-back')) === 'path-back-20260926-1602',
  'stale path-back stamp',
)
const hLabel = (await pkgHeaderBack.innerText()).replace(/\s+/g, ' ').trim()
assert(hLabel === '← Back', `header label: ${hLabel}`)
const hBox = await pkgHeaderBack.boundingBox()
assert(hBox && hBox.width >= 44 && hBox.height >= 44, `header hit ${JSON.stringify(hBox)}`)
assert(hBox.x > 900, 'Header Back not upper-right')
await page.screenshot({
  path: path.join(OUT, 'path-back-fix-package-1280.png'),
  fullPage: false,
})

// Budget
await page.goto(`${BASE}?${bust}#/budget`, { waitUntil: 'networkidle' })
await page.locator('.header-nav button.path-back').waitFor()
assert((await page.locator('.header-nav button.path-back').count()) === 1, 'Header Back missing on Budget')
assert((await page.locator('.path-chrome button.path-back').count()) === 1, 'PATH Back missing on Budget')
await page.screenshot({
  path: path.join(OUT, 'path-back-fix-budget-1280.png'),
  fullPage: false,
})

// PATH chip navigation still shows Back
await page.goto(`${BASE}?${bust}#/intake`, { waitUntil: 'networkidle' })
await page.locator('.path-chrome .home-path-card', { hasText: 'Add to fleet' }).click()
await page.waitForURL(/#\/package\//)
await page.waitForTimeout(400)
assert((await page.locator('.header-nav button.path-back').count()) === 1, 'Back missing after PATH chip')

const files = [
  'path-back-fix-intake-1280.png',
  'path-back-fix-package-1280.png',
  'path-back-fix-budget-1280.png',
]
for (const f of files) {
  await copyFile(path.join(OUT, f), path.join('/workspace/artifacts/screenshots', f))
}

console.log('OK path-back fix: Intake hidden; package+budget Header+PATH ← Back')
await browser.close()
