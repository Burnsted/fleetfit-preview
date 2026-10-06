import { chromium } from 'playwright-core'
import { copyFile, mkdir } from 'node:fs/promises'

const LIVE = process.env.SHOT_BASE || 'https://burnsted.github.io/fleetfit-preview/'
const MARKER = 'index-I_0gKya-'
const ART = '/opt/cursor/artifacts/screenshots'
const REPO = '/workspace/artifacts/screenshots'

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

async function save(page, name, opts = {}) {
  const dest = `${ART}/${name}`
  await page.screenshot({ path: dest, ...opts })
  await copyFile(dest, `${REPO}/${name}`)
  console.log('saved', name)
}

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome-stable',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
})
const page = await context.newPage()
await mkdir(ART, { recursive: true })
await mkdir(REPO, { recursive: true })

let ready = false
for (let i = 0; i < 20; i++) {
  const res = await page.goto(`${LIVE}?v=${Date.now()}`, {
    waitUntil: 'networkidle',
    timeout: 30000,
  })
  const html = await page.content()
  const plate = await page.locator('.home-hero-plate img').count()
  const strip = await page.locator('.home-ex-art').count()
  console.log(`poll ${i} status=${res?.status()} marker=${html.includes(MARKER)} plate=${plate} strip=${strip}`)
  if (html.includes(MARKER) && plate === 1 && strip === 3) {
    ready = true
    break
  }
  await page.waitForTimeout(3000)
}
assert(ready, 'live Pages never picked up real-photo build')

const home = await page.locator('body').innerText()
assert(home.includes('Match my fleet'), 'CTA missing')
assert(home.includes('Demo package'), 'hero chip missing')
assert(home.includes('Lightning') && home.includes('Cybertruck') && home.includes('R1T'), 'example strip missing')
assert(home.includes('Demo · composite · not shop inventory'), 'demo label missing')
assert(!home.includes('inventory FACT'), 'public FACT pill leaked')
assert(home.includes('Budget'), 'PATH Budget missing')
assert(home.includes('Add to fleet'), 'PATH Add to fleet missing')
{
  const pathLabels = await page.locator('.home-path-card span').allTextContents()
  assert(
    pathLabels.join(' · ') === 'Intake · Add to fleet · Budget',
    `PATH chrome wrong: ${pathLabels.join(' · ')}`,
  )
}
assert(!/worth it/i.test(home), 'Worth it leaked on home')
assert(!/\bSOH\b/.test(home), 'SOH leaked on home')
assert(!/VinNotDiesel/i.test(home), 'VinNotDiesel leaked')

const plateSrc = await page.locator('.home-hero-plate img').getAttribute('src')
assert(/lightning/i.test(plateSrc || ''), `hero still cartoon: ${plateSrc}`)
const stripSrcs = await page.locator('.home-ex-art').evaluateAll((els) => els.map((el) => el.getAttribute('src')))
assert(stripSrcs.every((src) => src && !src.includes('hero-coastal')), `strip still fake: ${stripSrcs}`)

await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(250)
await save(page, '39-home-real-photos-mobile.png', { fullPage: true })

await page.getByRole('link', { name: 'Match my fleet' }).click()
await page.getByRole('heading', { name: /Tell us about the work day/ }).waitFor({ timeout: 8000 })
assert(page.url().includes('#/intake'), `intake nav broke: ${page.url()}`)
await page.getByRole('button', { name: 'Match a package' }).click()
await page.getByRole('heading', { name: /Treasure Coast electrical/ }).waitFor({ timeout: 8000 })

const photos = page.locator('.unit-photo-img')
await photos.first().waitFor({ timeout: 8000 })
assert((await photos.count()) >= 3, `package photos missing: ${await photos.count()}`)
const pkgSrcs = await photos.evaluateAll((els) => els.map((el) => el.getAttribute('src')))
assert(pkgSrcs.every((src) => /\.webp/.test(src || '')), `package still silhouette: ${pkgSrcs}`)

const pkg = await page.locator('body').innerText()
assert(!/\bSOH\b/.test(pkg), 'SOH leaked on package')
assert(!/Buy Now/i.test(pkg), 'Buy Now leaked')
assert(pkg.includes('Add to fleet'), 'Add to fleet missing')

await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(200)
await save(page, '39b-package-real-photos-mobile.png')

const compareBtns = page.locator('.compare-control')
assert((await compareBtns.count()) >= 2, 'compare controls missing')
await compareBtns.nth(0).click()
await compareBtns.nth(1).click()
await page.locator('.compare-tray, .compare-nub').first().waitFor({ timeout: 8000 })
if (await page.locator('.compare-nub').count()) {
  await page.locator('.compare-nub').click()
}
await page.locator('.compare-tray').waitFor({ timeout: 8000 })
const thumbs = page.locator('.compare-tray-photo')
assert((await thumbs.count()) >= 2, 'compare thumbs missing')
const thumbSrcs = await thumbs.evaluateAll((els) => els.map((el) => el.getAttribute('src')))
assert(thumbSrcs.every((src) => /\.webp/.test(src || '')), `thumbs still glyphs: ${thumbSrcs}`)

await page.getByRole('button', { name: /Compare \d/ }).click()
await page.getByRole('heading', { name: /Compare/ }).waitFor({ timeout: 8000 })
assert(page.url().includes('/compare'), `full compare missing: ${page.url()}`)
const compareText = await page.locator('body').innerText()
assert(compareText.includes('Your current work vehicle') || compareText.includes('Now'), 'current column missing')
assert(/non-EV work vehicle|current work vehicle/i.test(compareText), 'current label missing')
assert(!/gas\/diesel|gas or diesel/i.test(compareText), 'gas/diesel leaked')
assert((await page.locator('.unit-photo-img').count()) >= 3, 'compare photos missing')

await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(200)
await save(page, '39c-compare-real-thumbs-mobile.png')

await page.goto(`${LIVE}#/budget`, { waitUntil: 'networkidle' })
await page.getByRole('heading', { name: 'Budget' }).waitFor({ timeout: 8000 })
await page.getByRole('button', { name: 'See what fits' }).click()
await page.getByRole('heading', { name: /Treasure Coast electrical/ }).waitFor({ timeout: 8000 })
assert(page.url().includes('#/package/'), `blank budget broke: ${page.url()}`)

await page.getByRole('button', { name: 'Add to fleet' }).first().click()
await page.getByRole('button', { name: 'In fleet' }).first().waitFor({ timeout: 8000 })

console.log('ok overnight real-photo E2E')
await browser.close()
