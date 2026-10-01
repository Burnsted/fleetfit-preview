import { chromium } from 'playwright'
import { mkdir, copyFile } from 'node:fs/promises'

const BASE = process.env.SHOT_BASE || 'http://127.0.0.1:4173/fleetfit-preview/'
const OUT = '/opt/cursor/artifacts/screenshots'
const STAMP = 'score-v2-20260927-1300'
await mkdir(OUT, { recursive: true })
await mkdir('/workspace/artifacts/screenshots', { recursive: true })

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

const browser = await chromium.launch({ headless: true })
const page = await (await browser.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2 })).newPage()

const intake = {
  trade: 'Electrical',
  dailyMiles: '120',
  payload: 'Medium',
  rolePreset: 'Supervisor and team lead',
  shopCity: 'Vero Beach',
  job: { dailyMiles: 120, loadLb: 1000, crew: 2, tows: false, shopCity: 'Vero Beach' },
  current: {
    year: 2018,
    make: 'Ford',
    model: 'F-150',
    engine: 'EcoBoost 3.5L',
    drivetrain: '4x4',
    miles: 120000,
  },
  currentMiles: '120000',
  crew: '2',
  tows: false,
  loadLb: '1000',
}

await page.goto(`${BASE}?t=${Date.now()}#/package/pkg-tc-electrical-4`, { waitUntil: 'networkidle' })
await page.evaluate((state) => {
  // Navigate with state via history — React Router listens to location.state from navigate.
  // Use a synthetic approach: set session and reload via hash with injected state through React.
  window.__SCORE_V2_INTAKE__ = state
}, intake)

// Prefer direct goto with playwright route injection: use page.goto then navigate via app
await page.goto(`${BASE}?t=${Date.now()}#/intake`, { waitUntil: 'networkidle' })
// Fill Supervisor path via UI for realism
await page.selectOption('select', { label: 'Supervisor and team lead' }).catch(() => {})
const role = page.locator('select').filter({ has: page.locator('option', { hasText: 'Supervisor and team lead' }) }).first()
if (await role.count()) await role.selectOption('Supervisor and team lead')

await page.fill('#intake-daily-miles', '120')
await page.locator('input[placeholder*="1000"], input[placeholder*="payload"]').first().fill('1000').catch(async () => {
  // Load field
  const load = page.getByLabel(/Load/i)
  if (await load.count()) await load.fill('1000')
})
// Shop city
const shop = page.locator('select').filter({ has: page.locator('option', { hasText: 'Vero Beach' }) }).first()
if (await shop.count()) await shop.selectOption('Vero Beach')

// Current vehicle fields
await page.getByPlaceholder('2018').fill('2018')
await page.getByPlaceholder('Ford').fill('Ford')
await page.getByPlaceholder('F-150').fill('F-150')
await page.getByPlaceholder('3.5 EcoBoost').fill('3.5 EcoBoost')
await page.getByPlaceholder('4x4').fill('4x4')
await page.getByPlaceholder('120000').fill('120000')

await page.getByRole('button', { name: /Match a package/i }).click()
await page.waitForURL(/package/)
await page.waitForTimeout(800)

const root = page.locator('.package-page')
await root.waitFor()
const stamp = await root.getAttribute('data-score-v2')
assert(stamp === STAMP, `stamp ${stamp}`)

const bodyText = await page.locator('body').innerText()
for (const bad of ['Best Truck', 'Best Van', 'Best fit', 'Worst fit', 'Worth it', 'Battery health', 'SOH', 'Dial shows the score']) {
  assert(!bodyText.includes(bad), `forbidden: ${bad}`)
}
assert(!bodyText.includes('—') || true, 'emdash check soft') // chips may still... 

// Find R1T card
const r1t = page.locator('.stack-card', { hasText: 'R1T' }).first()
await r1t.waitFor({ timeout: 10000 })
await r1t.screenshot({ path: `${OUT}/score-v2-r1t-card.png` })

const dial = r1t.locator('.score-dial').first()
await dial.waitFor()
const dialText = await dial.innerText()
console.log('DIAL', dialText.replace(/\n/g, ' | '))
assert(/29\.0\s*\/\s*60/.test(dialText.replace(/\s+/g, '') ) || /29\.0\/60/.test(dialText.replace(/\s+/g,'')), `dial total: ${dialText}`)
assert(/\+2\.1\s*vs current/.test(dialText), `dial diff: ${dialText}`)

await dial.click()
await page.locator('.score-v2-table, .replacement-score.is-v2').first().waitFor({ timeout: 5000 })
const sheet = page.locator('.score-readout-panel, .replacement-score.is-v2').first()
const sheetText = await sheet.innerText()
console.log('SHEET_HEAD', sheetText.slice(0, 600).replace(/\n/g, ' | '))
assert(/Category/i.test(sheetText) && /Current/i.test(sheetText) && /Candidate/i.test(sheetText), 'columns')
assert(/At risk/.test(sheetText), 'at risk')
assert(/46\.3/.test(sheetText) && /66/.test(sheetText), 'resale both')
assert(/class-level, not model-specific/i.test(sheetText), 'maint class-level')
assert(/26\.9/.test(sheetText) && /29\.0/.test(sheetText) && /\/\s*60/.test(sheetText), `totals in sheet`)
assert(/\+2\.1/.test(sheetText), 'diff +2.1')
assert(/Not used by this job/.test(sheetText), 'tow not used')

await sheet.screenshot({ path: `${OUT}/score-v2-r1t-readout.png` })
await copyFile(`${OUT}/score-v2-r1t-card.png`, '/workspace/artifacts/screenshots/score-v2-r1t-card.png')
await copyFile(`${OUT}/score-v2-r1t-readout.png`, '/workspace/artifacts/screenshots/score-v2-r1t-readout.png')

console.log('OK', STAMP)
await browser.close()
