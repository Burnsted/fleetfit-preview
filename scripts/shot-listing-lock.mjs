import { chromium } from 'playwright-core'
import { copyFile, mkdir } from 'node:fs/promises'

const LIVE = process.env.SHOT_BASE || 'https://burnsted.github.io/fleetfit-preview/'
const MARKER = 'index-DI7OHLdB'
const ART = '/opt/cursor/artifacts/screenshots'
const REPO = '/workspace/artifacts/screenshots'

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

async function save(page, name) {
  const dest = `${ART}/${name}`
  await page.screenshot({ path: dest })
  await copyFile(dest, `${REPO}/${name}`)
  console.log('saved', name)
}

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome-stable',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
})
await mkdir(ART, { recursive: true })
await mkdir(REPO, { recursive: true })

let ready = false
for (let i = 0; i < 20; i++) {
  const res = await page.goto(`${LIVE}?v=${Date.now()}`, { waitUntil: 'networkidle', timeout: 30000 })
  const html = await page.content()
  const listingThumbs = await page.locator('img.home-ex-art, img.home-hero-plate-art').count()
  console.log(`poll ${i} status=${res?.status()} marker=${html.includes(MARKER)} listingImgs=${listingThumbs}`)
  if (html.includes(MARKER) && listingThumbs >= 3) {
    ready = true
    break
  }
  await page.waitForTimeout(3000)
}
assert(ready, 'live Pages never picked up listing-photo build — hard-refresh')

const home = await page.locator('body').innerText()
assert(home.includes('Match my fleet'), 'CTA missing')
assert(!/inventory FACT/.test(home), 'FACT pill leaked')
const heroSrc = await page.locator('.home-hero-plate img').getAttribute('src')
assert(/unit-e3/.test(heroSrc || ''), `hero not listing thumb: ${heroSrc}`)

await page.goto(`${LIVE}#/package/pkg-tc-electrical-4?v=${Date.now()}`, { waitUntil: 'networkidle' })
await page.locator('.unit-photo-img').first().waitFor({ timeout: 8000 })
const pkgSrcs = await page.locator('.unit-photo-img').evaluateAll((els) => els.map((el) => el.getAttribute('src')))
assert(pkgSrcs.some((src) => /unit-e1|unit-e2|unit-e3|unit-e4/.test(src || '')), `package not listing thumbs: ${pkgSrcs}`)
const pkg = await page.locator('body').innerText()
assert(pkg.includes('Not a listing — your current work vehicle'), 'current stub missing')
assert(!/Worth it/i.test(pkg), 'Worth it leaked')
await page.evaluate(() => window.scrollTo(0, 180))
await page.waitForTimeout(250)
await save(page, '40-package-listing-photo-mobile.png')

const compareBtns = page.locator('.compare-control')
await compareBtns.nth(0).click()
await compareBtns.nth(1).click()
if (await page.locator('.compare-nub').count()) await page.locator('.compare-nub').click()
await page.locator('.compare-tray-photo').first().waitFor({ timeout: 8000 })
const thumbSrcs = await page.locator('.compare-tray-photo').evaluateAll((els) => els.map((el) => el.getAttribute('src')))
assert(thumbSrcs.every((src) => /unit-e|listings/.test(src || '') || /\.webp/.test(src || '')), `thumbs not listing: ${thumbSrcs}`)
await page.waitForTimeout(200)
await save(page, '40b-compare-listing-thumbs-mobile.png')

console.log('ok listing-photo lock')
await browser.close()
