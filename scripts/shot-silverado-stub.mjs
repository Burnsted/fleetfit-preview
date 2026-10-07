/**
 * Proof: unit-e2 on pkg-tc-electrical-4 is Photo pending stub (not teaser listing).
 */
import { chromium } from 'playwright'
import { copyFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const BASE = process.env.SHOT_BASE || 'https://burnsted.github.io/fleetfit-preview/'
const OUT = '/opt/cursor/artifacts/screenshots'
const REPO_OUT = '/workspace/artifacts/screenshots'
await mkdir(OUT, { recursive: true })
await mkdir(REPO_OUT, { recursive: true })

const EXPECT_BUILD = 'listing-photos-20260926-1337'
const EXPECT_BUNDLE = 'index-DYMS6RKz.js'

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
const url = `${BASE}?silvstub=${Date.now()}#/package/pkg-tc-electrical-4`
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(900)

const bundle = await page.locator('script[src*="assets/index-"]').first().getAttribute('src')
console.log('LIVE_BUNDLE', bundle)
assert(bundle && bundle.includes(EXPECT_BUNDLE), `unexpected bundle ${bundle}`)

await page.locator('.stack-card.is-candidate').first().waitFor({ timeout: 15000 })
const cards = page.locator('.stack-card.is-candidate')
const n = await cards.count()

let silverado = null
for (let i = 0; i < n; i++) {
  const text = await cards.nth(i).innerText()
  if (/Silverado/i.test(text)) {
    silverado = cards.nth(i)
    console.log('SILVERADO_CARD_TEXT', JSON.stringify(text.slice(0, 280)))
    break
  }
}
assert(silverado, 'Silverado EV candidate card not found')

const photo = silverado.locator('.unit-photo').first()
const kind = await photo.getAttribute('data-photo-kind')
const build = await photo.getAttribute('data-photo-build')
const classes = await photo.getAttribute('class')
console.log('PHOTO_KIND', kind, 'BUILD', build, 'CLASS', classes)
assert(build === EXPECT_BUILD, `photo build ${build}`)
assert(kind === 'stub', `expected stub, got ${kind}`)
assert(classes.includes('is-pending'), 'expected is-pending')
assert(!classes.includes('has-photo'), 'must not claim has-photo')

const pending = photo.locator('.listing-photo-pending')
await pending.waitFor({ timeout: 5000 })
const label = (await pending.innerText()).trim()
console.log('PENDING_LABEL', JSON.stringify(label))
assert(label === 'Photo pending — no listing image', `label ${label}`)
assert((await photo.locator('img.unit-photo-img').count()) === 0, 'stub must not render img')

// Non-Silverado candidates still listing
for (let i = 0; i < n; i++) {
  const text = await cards.nth(i).innerText()
  if (/Silverado/i.test(text)) continue
  const k = await cards.nth(i).locator('.unit-photo').first().getAttribute('data-photo-kind')
  console.log('OTHER', text.split('\n').find((l) => /\d{4}/.test(l)), 'kind', k)
  assert(k === 'listing', `non-Silverado should stay listing, got ${k}`)
}

await silverado.scrollIntoViewIfNeeded()
await page.waitForTimeout(250)
const shotName = 'silverado-ev-photo-pending-stub.png'
const outPath = path.join(OUT, shotName)
await silverado.screenshot({ path: outPath })
await copyFile(outPath, path.join(REPO_OUT, shotName))
console.log('SHOT', outPath)
console.log('URL', url)
console.log('PASS unit-e2 Photo pending stub')

await browser.close()
