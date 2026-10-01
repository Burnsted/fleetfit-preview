import { chromium } from 'playwright'
import { copyFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const BASE = process.env.SHOT_BASE || 'https://burnsted.github.io/fleetfit-preview/'
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
await page.goto(`${BASE}?search=${Date.now()}#/shop`, {
  waitUntil: 'networkidle',
  timeout: 60000,
})
await page.waitForTimeout(500)

const bundle = await page.locator('script[src*="assets/index-"]').first().getAttribute('src')
console.log('LIVE_BUNDLE', bundle)

const search = page.locator('.shop-search-pill')
await search.waitFor({ timeout: 10000 })
assert((await search.getAttribute('data-search-build')) === 'search-20260926-0914', 'search stamp missing')
assert((await search.locator('input[type="search"]').count()) === 1, 'typable box missing')
assert((await search.getByRole('button', { name: 'Search' }).count()) === 1, 'Search button missing')

await search.screenshot({ path: path.join(OUT, 'search-pill-typable.png') })

await page.getByRole('button', { name: 'Filter' }).click()
await page.locator('.filters-panel.open').waitFor({ timeout: 8000 })
const yearRange = page.locator('[aria-label="Year range"]')
const yearMulti = page.locator('[aria-label="Years multi-select"]')
await yearRange.waitFor({ timeout: 5000 })
const rangeLabels = await yearRange.locator('.chip').allTextContents()
const yearLabels = await yearMulti.locator('.chip').allTextContents()
assert(rangeLabels.length >= 5, `year ranges thin: ${rangeLabels.join('|')}`)
assert(yearLabels.join('|') === '2020|2021|2022|2023|2024|2025|2026', `years wrong: ${yearLabels.join('|')}`)
assert(!rangeLabels.every((l) => /^\d{4}$/.test(l.trim())), 'expected multi-year ranges, not only single years')

await page.locator('.filter-section', { hasText: 'Vehicle' }).screenshot({
  path: path.join(OUT, 'search-multiyear-options.png'),
})

for (const f of ['search-pill-typable.png', 'search-multiyear-options.png']) {
  await copyFile(path.join(OUT, f), path.join('/workspace/artifacts/screenshots', f))
}

console.log('SEARCH_PASS ranges', rangeLabels.join(' · '))
console.log('SEARCH_PASS years', yearLabels.join(' · '))
await browser.close()
