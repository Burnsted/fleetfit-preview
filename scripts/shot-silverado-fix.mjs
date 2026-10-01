/**
 * Proof: pkg-tc-electrical-4 Silverado EV is real dealer truck (not cloth teaser).
 */
import { chromium } from 'playwright'
import { copyFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'

const BASE = process.env.SHOT_BASE || 'https://burnsted.github.io/fleetfit-preview/'
const OUT = '/opt/cursor/artifacts/screenshots'
const REPO_OUT = '/workspace/artifacts/screenshots'
await mkdir(OUT, { recursive: true })
await mkdir(REPO_OUT, { recursive: true })

const EXPECT_BUILD = 'listing-photos-20260926-1328'
const EXPECT_BUNDLE = 'index-BTQWfDTP.js'

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
})
await context.route('**/*', (route) =>
  route.continue({
    headers: {
      ...route.request().headers(),
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  }),
)
const page = await context.newPage()
const url = `${BASE}?silverado=${Date.now()}#/package/pkg-tc-electrical-4`
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(900)

const bundle = await page.locator('script[src*="assets/index-"]').first().getAttribute('src')
console.log('LIVE_BUNDLE', bundle)
assert(bundle && bundle.includes(EXPECT_BUNDLE), `unexpected bundle ${bundle}`)

await page.locator('.stack-card.is-candidate').first().waitFor({ timeout: 15000 })
const cards = page.locator('.stack-card.is-candidate')
const n = await cards.count()
assert(n >= 2, `expected >=2 candidates, got ${n}`)

let silverado = null
let silveradoIdx = -1
for (let i = 0; i < n; i++) {
  const text = await cards.nth(i).innerText()
  if (/Silverado/i.test(text)) {
    silverado = cards.nth(i)
    silveradoIdx = i
    console.log('SILVERADO_CARD_TEXT', JSON.stringify(text.slice(0, 220)))
    break
  }
}
assert(silverado, 'Silverado EV candidate card not found')

const photo = silverado.locator('.unit-photo').first()
const kind = await photo.getAttribute('data-photo-kind')
const build = await photo.getAttribute('data-photo-build')
const hasPhotoClass = await photo.evaluate((el) => el.classList.contains('has-photo'))
console.log('PHOTO_KIND', kind, 'BUILD', build, 'has-photo', hasPhotoClass)
assert(build === EXPECT_BUILD, `photo build ${build}`)
assert(kind === 'listing', `expected listing kind, got ${kind}`)
assert(hasPhotoClass, 'expected has-photo class')

const img = photo.locator('img.unit-photo-img')
await img.waitFor({ timeout: 10000 })
const src = await img.getAttribute('src')
console.log('IMG_SRC', src)
assert(src && /unit-e2-ByIusP2A\.jpg/i.test(src), `unexpected img src ${src}`)

const imgResp = await page.request.get(
  src.startsWith('http') ? src : new URL(src, BASE).href,
  { headers: { 'Cache-Control': 'no-cache' } },
)
assert(imgResp.ok(), `img fetch failed ${imgResp.status()}`)
const buf = Buffer.from(await imgResp.body())
const md5 = createHash('md5').update(buf).digest('hex')
console.log('IMG_MD5', md5, 'BYTES', buf.length)
assert(md5 === '9f0300fb2f875333c49a9639993d644c', `img md5 ${md5} is not rank104 truck`)
assert(md5 !== '1a9e3213e1a8f92c2b7a7f52216fca4c', 'img still cloth teaser md5')

await silverado.scrollIntoViewIfNeeded()
await page.waitForTimeout(250)
const shotName = 'silverado-ev-listing-photo-fixed.png'
const outPath = path.join(OUT, shotName)
await silverado.screenshot({ path: outPath })
await copyFile(outPath, path.join(REPO_OUT, shotName))
console.log('SHOT', outPath)
console.log('URL', url)
console.log('PASS silverado listing photo is real dealer truck')

await browser.close()
