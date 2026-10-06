/**
 * Screenshot Trade Packages surfaces at desktop 1440 and phone 390.
 * Run: npx vite preview --host 127.0.0.1 --port 4173 &
 *      node scripts/shot-trade-packages.mjs
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../artifacts/screenshots')
mkdirSync(OUT, { recursive: true })

const BASE = process.env.PREVIEW_URL || 'http://127.0.0.1:4173'
const TRADES = [
  ['electrical', 'pkg-trade-electrical'],
  ['hvac', 'pkg-trade-hvac'],
  ['plumbing', 'pkg-trade-plumbing'],
  ['landscaping', 'pkg-trade-landscaping'],
]

async function shot(page, name, width) {
  const path = join(OUT, `${name}-${width}.png`)
  await page.screenshot({ path, fullPage: true })
  console.log('wrote', path)
  return path
}

async function setViewport(page, width) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  for (const width of [1440, 390]) {
    await setViewport(page, width)

    // Home with Trade packages entry
    await page.goto(`${BASE}/#/`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(400)
    await shot(page, 'trade-home', width)

    for (const [slug, id] of TRADES) {
      await page.goto(`${BASE}/#/package/${id}`, { waitUntil: 'networkidle' })
      await page.waitForTimeout(500)
      await shot(page, `trade-package-${slug}`, width)
    }

    // Short / empty-ish: size 5 on plumbing (only 1 eligible)
    await page.goto(`${BASE}/#/package/pkg-trade-plumbing`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(400)
    const size5 = page.locator('.trade-size-chip', { hasText: '5' })
    if (await size5.count()) {
      await size5.click()
      await page.waitForTimeout(300)
    }
    await shot(page, 'trade-short-plumbing-size5', width)
  }

  // Remove then Undo sequence (desktop)
  await setViewport(page, 1440)
  await page.goto(`${BASE}/#/package/pkg-trade-electrical`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  const removeBtn = page.locator('.trade-unit-remove').first()
  if (await removeBtn.count()) {
    await removeBtn.click({ force: true })
    await page.waitForTimeout(400)
    await shot(page, 'trade-remove-then-autoreplace', 1440)
    const undo = page.locator('.trade-removed-row .trade-undo-link').first()
    if (await undo.count()) {
      await undo.click({ force: true })
      await page.waitForTimeout(400)
      await shot(page, 'trade-undo-restored', 1440)
    }
  }

  // Add unit ranked list
  await page.goto(`${BASE}/#/package/pkg-trade-hvac`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  // Shrink to size 1 so add unit has room
  const size1 = page.locator('.trade-size-chip', { hasText: /^1$/ })
  if (await size1.count()) await size1.click()
  await page.waitForTimeout(300)
  const addUnit = page.getByRole('button', { name: /Add unit/i })
  if (await addUnit.count()) {
    await addUnit.click()
    await page.waitForTimeout(300)
    await shot(page, 'trade-add-unit-picker', 1440)
  }

  // Phone remove sequence
  await setViewport(page, 390)
  await page.goto(`${BASE}/#/package/pkg-trade-landscaping`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  const removePhone = page.locator('.trade-unit-remove').first()
  if (await removePhone.count()) {
    await removePhone.click({ force: true })
    await page.waitForTimeout(400)
    await shot(page, 'trade-remove-then-autoreplace', 390)
  }

  await browser.close()
  console.log('done')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
