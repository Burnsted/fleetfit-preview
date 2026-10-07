import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const BASE = process.env.SHOT_BASE || 'http://127.0.0.1:4173/fleetfit-preview/'
const OUT = process.env.SHOT_OUT || '/opt/cursor/artifacts/screenshots'
await mkdir(OUT, { recursive: true })
await mkdir('/workspace/artifacts/screenshots', { recursive: true })

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  headless: true,
})
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
})

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForTimeout(400)

const home = await page.locator('body').innerText()
assert(home.includes('Match my fleet'), 'home CTA missing')
const pathLabels = await page.locator('.home-path-card span').allTextContents()
assert(
  pathLabels.join(' · ') === 'Intake · Add to fleet · Budget',
  `PATH chrome wrong: ${pathLabels.join(' · ')}`,
)
assert(!pathLabels.includes('Package'), 'Package chip still on PATH')

await page.locator('.home-path-icons').scrollIntoViewIfNeeded()
await page.waitForTimeout(200)
const pathShot = path.join(OUT, 'cleared-path-home-mobile.png')
await page.locator('section[aria-label="Path"]').screenshot({ path: pathShot })
await page.screenshot({
  path: path.join(OUT, 'cleared-home-path-full-mobile.png'),
  fullPage: false,
})

await page.getByRole('link', { name: 'Match my fleet' }).click()
await page.getByRole('heading', { name: /Tell us about the work day/ }).waitFor({ timeout: 8000 })
assert(page.url().includes('#/intake'), `intake nav broke: ${page.url()}`)

const intake = await page.locator('body').innerText()
const eyebrowHtml = await page.locator('.locked-eyebrow').innerHTML()
assert(/Fleet swap/i.test(eyebrowHtml), 'eyebrow Fleet swap missing')
assert(intake.includes('We’ll match a used EV package to the work day.'), 'CLEARED subline missing')
assert(!intake.includes('Primary path:'), 'primary-path essay still present')
assert(!intake.includes('Fleet size can stay blank if you have not surveyed yet'), 'old blank essay leaked into subline')
assert(intake.includes('Blank is fine.'), 'fleet size helper missing')
assert(intake.includes('What the trucks need to do'), 'customize section missing')
assert(intake.includes('Match a package'), 'CTA missing')
assert(intake.includes('We’ll build from what you set above. Blanks stay open.'), 'CTA helper missing')
assert(!intake.includes('See my package'), 'retired See my package leaked')
assert(!/electrical → 4-unit/i.test(intake), 'long trade-example helper leaked')
for (const chip of ['Van', 'Pickup', 'Either', 'Light', 'Medium', 'Heavy', 'Not sure', 'Regular', 'Extended', 'Crew', 'None', 'Hauls trailer', 'Ladder rack', 'Toolbox', 'Cargo rails', 'Spray liner', 'Other', 'Yes', 'No']) {
  assert(intake.includes(chip), `chip missing: ${chip}`)
}
assert(intake.includes('Units to replace'), 'Units to replace missing')
assert(intake.includes('Trade-in'), 'Trade-in missing')
assert(!/\bBed\b/.test(intake), 'Bed chips should be out this pass')

const placeholder = await page.locator('textarea').getAttribute('placeholder')
assert(placeholder === 'Anything else about the routes or crew…', `notes placeholder wrong: ${placeholder}`)

await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(200)
const intakeTop = path.join(OUT, 'cleared-intake-top-mobile.png')
await page.screenshot({ path: intakeTop, fullPage: false })

await page.locator('.intake-customize').scrollIntoViewIfNeeded()
await page.waitForTimeout(200)
const intakeChips = path.join(OUT, 'cleared-intake-customize-mobile.png')
await page.screenshot({ path: intakeChips, fullPage: false })

await page.locator('.intake-actions').scrollIntoViewIfNeeded()
await page.waitForTimeout(200)
const intakeCta = path.join(OUT, 'cleared-intake-cta-mobile.png')
await page.screenshot({ path: intakeCta, fullPage: false })

// Also copy key shots into workspace artifacts
import { copyFile } from 'node:fs/promises'
for (const f of [
  'cleared-path-home-mobile.png',
  'cleared-intake-top-mobile.png',
  'cleared-intake-customize-mobile.png',
  'cleared-intake-cta-mobile.png',
]) {
  await copyFile(path.join(OUT, f), path.join('/workspace/artifacts/screenshots', f))
}

console.log('OK PATH', pathLabels.join(' · '))
console.log('shots', OUT)
await browser.close()
