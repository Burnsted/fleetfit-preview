/**
 * Live Pages R2 quality-bar proof — cache bypass, not local vite.
 * Fails if any of Steve’s 5 R2 FAILs remain.
 */
import { chromium } from 'playwright'
import { copyFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const LIVE = 'https://burnsted.github.io/fleetfit-preview/'
const OUT = '/opt/cursor/artifacts/screenshots'
await mkdir(OUT, { recursive: true })
await mkdir('/workspace/artifacts/screenshots', { recursive: true })

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  // Bypass HTTP cache entirely
  bypassCSP: false,
})
await context.route('**/*', (route) => {
  const headers = {
    ...route.request().headers(),
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
  }
  return route.continue({ headers })
})

const page = await context.newPage()
// Cache-bust query on document so HTML isn’t a stale CDN hit
await page.goto(`${LIVE}?r2bust=${Date.now()}#/intake`, {
  waitUntil: 'networkidle',
  timeout: 60000,
})
await page.getByRole('heading', { name: /Tell us about the work day/ }).waitFor({ timeout: 15000 })
await page.waitForTimeout(500)

const text = await page.locator('body').innerText()
const scripts = await page.locator('script[src]').evaluateAll((els) =>
  els.map((el) => el.getAttribute('src')).filter(Boolean),
)
const bundle = scripts.find((s) => /assets\/index-.*\.js/.test(s)) || '(none)'
console.log('LIVE_BUNDLE', bundle)

// --- Steve’s 5 FAILs must be gone ---
assert(text.includes('Body & units'), 'FAIL1: Body & units missing')
assert(!text.includes('What the trucks need to do'), 'FAIL1: R1 section still present')
assert(text.includes('Units to replace'), 'FAIL2: Units missing')

// Units must appear before Upfits in DOM order (paired with Body, not orphan below Upfits)
const order = await page.evaluate(() => {
  const bodyLabel = [...document.querySelectorAll('.intake-label')].find((el) => el.textContent === 'Body')
  const unitsLabel = [...document.querySelectorAll('.intake-label')].find((el) => el.textContent === 'Units to replace')
  const upfitsLabel = [...document.querySelectorAll('.intake-label')].find((el) => el.textContent === 'Upfits')
  if (!bodyLabel || !unitsLabel || !upfitsLabel) return null
  const pos = (el) => el.compareDocumentPosition(unitsLabel)
  return {
    unitsAfterBody: !!(bodyLabel.compareDocumentPosition(unitsLabel) & Node.DOCUMENT_POSITION_FOLLOWING),
    unitsBeforeUpfits: !!(unitsLabel.compareDocumentPosition(upfitsLabel) & Node.DOCUMENT_POSITION_FOLLOWING),
    inBodyUnitsBlock: !!unitsLabel.closest('fieldset')?.querySelector('legend')?.textContent?.includes('Body & units'),
  }
})
assert(order?.inBodyUnitsBlock, 'FAIL2: Units not inside Body & units block')
assert(order?.unitsAfterBody && order?.unitsBeforeUpfits, `FAIL2: Units orphan layout ${JSON.stringify(order)}`)

assert(text.includes('Haul'), 'FAIL3: Haul missing')
assert(!/\bTow\b/.test(text), 'FAIL3: Tow chips still visible')
assert(!text.includes('Hauls trailer'), 'FAIL3: Hauls trailer chip still present')
assert(!text.includes('Gooseneck enclosed'), 'FAIL3: Gooseneck enclosed must not ship')

const haulOpts = await page
  .locator('label.intake-field')
  .filter({ has: page.locator('.intake-label', { hasText: /^Haul$/ }) })
  .locator('select option')
  .allTextContents()
const haulClean = haulOpts.map((s) => s.trim()).filter((s) => s && s !== '—')
assert(
  haulClean.join('|') === 'None|Open trailer|Enclosed trailer|Gooseneck|Not sure',
  `FAIL3: Haul options wrong: ${haulClean.join('|')}`,
)

const upfits = await page.locator('[aria-label="Upfits"] .chip').allTextContents()
assert(upfits.join('|') === 'Ladder rack|Toolbox|Cargo rails|Other', `FAIL4: Upfits wrong: ${upfits.join('|')}`)
assert(!upfits.includes('Spray liner'), 'FAIL4: Spray liner chip still in Upfits')

// Trade-in must be a <select>, not chips
const tradeChipGroup = await page.locator('[aria-label="Trade-in"]').count()
assert(tradeChipGroup === 0, 'FAIL5: Trade-in still chip group')
const tradeSelect = page
  .locator('label.intake-field')
  .filter({ has: page.locator('.intake-label', { hasText: /^Trade-in$/ }) })
  .locator('select')
assert((await tradeSelect.count()) === 1, 'FAIL5: Trade-in dropdown missing')
await tradeSelect.selectOption('Yes')
await page.waitForTimeout(150)
assert((await page.locator('.intake-label', { hasText: /^Trade-in model$/ }).count()) === 1, 'FAIL5: Trade-in model label missing on Yes')
assert((await page.locator('input[placeholder="Year make model…"]').count()) === 1, 'FAIL5: Year make model… missing on Yes')
await tradeSelect.selectOption('Not sure')
await page.waitForTimeout(100)
assert((await page.locator('input[placeholder="Year make model…"]').count()) === 0, 'FAIL5: model must hide on Not sure')
await tradeSelect.selectOption('Yes')
await page.waitForTimeout(100)

// PATH / chrome still PASS
const pathLabels = await page.locator('.path-chrome .home-path-card span').allTextContents()
assert(pathLabels.join(' · ') === 'Intake · Add to fleet · Budget', `PATH regress: ${pathLabels.join(' · ')}`)
assert(!text.includes('Primary path:'), 'Primary-path essay regress')
assert(!/Vin Not Diesel|\bVND\b/.test(text), 'VND regress')
assert(!/\bBed\b/.test(text), 'Bed regress')

// Screenshots proving FAILs gone
await page.evaluate(() => window.scrollTo(0, 0))
await page.locator('legend', { hasText: 'Body & units' }).scrollIntoViewIfNeeded()
await page.waitForTimeout(250)
const shotMain = path.join(OUT, 'pages-r2-live-body-units-haul.png')
await page.screenshot({ path: shotMain, fullPage: false })

await page.locator('input[placeholder="Year make model…"]').scrollIntoViewIfNeeded()
await page.waitForTimeout(250)
const shotTrade = path.join(OUT, 'pages-r2-live-upfits-tradein-model.png')
await page.screenshot({ path: shotTrade, fullPage: false })

for (const f of ['pages-r2-live-body-units-haul.png', 'pages-r2-live-upfits-tradein-model.png']) {
  await copyFile(path.join(OUT, f), path.join('/workspace/artifacts/screenshots', f))
}

console.log('PAGES_R2_PASS', bundle)
console.log('Haul', haulClean.join(' · '))
console.log('Upfits', upfits.join(' · '))
await browser.close()
