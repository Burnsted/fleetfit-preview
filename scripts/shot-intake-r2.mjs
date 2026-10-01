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

// PATH no regress
const pathLabels = await page.locator('.path-chrome .home-path-card span').allTextContents()
assert(pathLabels.join(' · ') === 'Intake · Add to fleet · Budget', `PATH regress: ${pathLabels.join(' · ')}`)

const body = await page.locator('body').innerText()
assert(body.includes('We’ll match a used EV package to the work day.'), 'subline regress')
assert(body.includes('Match a package'), 'CTA regress')
assert(body.includes('Body & units'), 'Body & units section missing')
assert(body.includes('Units to replace'), 'Units missing')
assert(!body.includes('Spray liner'), 'Spray liner still present')
assert(!body.includes('Gooseneck enclosed'), 'Gooseneck enclosed must not ship')
assert(!/\bTow\b/.test(body) || body.includes('Haul'), 'Haul should replace Tow')

function selectByLabel(label) {
  return page.locator('label.intake-field').filter({ has: page.locator('.intake-label', { hasText: new RegExp(`^${label}$`) }) }).locator('select')
}

// Haul options exact
const haulOpts = await selectByLabel('Haul').locator('option').allTextContents()
const haulClean = haulOpts.map((s) => s.trim()).filter((s) => s && s !== '—')
assert(
  haulClean.join('|') === 'None|Open trailer|Enclosed trailer|Gooseneck|Not sure',
  `Haul options wrong: ${haulClean.join('|')}`,
)
assert(body.includes('Trailer type only — not a full build.'), 'Haul helper missing')

// Upfits exact
const upfitChips = await page.locator('[aria-label="Upfits"] .chip').allTextContents()
assert(
  upfitChips.join('|') === 'Ladder rack|Toolbox|Cargo rails|Other',
  `Upfits wrong: ${upfitChips.join('|')}`,
)

// Trade-in dropdown + model Yes-only
const tradeSelect = selectByLabel('Trade-in')
await tradeSelect.selectOption('Yes')
await page.waitForTimeout(150)
assert(await page.locator('.intake-label', { hasText: /^Trade-in model$/ }).count(), 'Trade-in model label missing on Yes')
const modelPh = await page.locator('input[placeholder="Year make model…"]').getAttribute('placeholder')
assert(modelPh === 'Year make model…', `placeholder wrong: ${modelPh}`)

await page.locator('legend', { hasText: 'Body & units' }).scrollIntoViewIfNeeded()
await page.waitForTimeout(200)
await page.screenshot({ path: path.join(OUT, 'intake-r2-body-units-haul.png'), fullPage: false })

await page.locator('input[placeholder="Year make model…"]').scrollIntoViewIfNeeded()
await page.waitForTimeout(200)
await page.screenshot({ path: path.join(OUT, 'intake-r2-upfits-tradein-model.png'), fullPage: false })

// Trade-in Not sure → model hidden
await tradeSelect.selectOption('Not sure')
await page.waitForTimeout(100)
assert((await page.locator('input[placeholder="Year make model…"]').count()) === 0, 'model must hide on Not sure')

for (const f of ['intake-r2-body-units-haul.png', 'intake-r2-upfits-tradein-model.png']) {
  await copyFile(path.join(OUT, f), path.join('/workspace/artifacts/screenshots', f))
}

console.log('OK R2 Haul', haulClean.join(' · '))
console.log('OK R2 Upfits', upfitChips.join(' · '))
console.log('OK PATH', pathLabels.join(' · '))
await browser.close()
