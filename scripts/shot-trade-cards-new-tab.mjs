/**
 * Screenshot trade cards + New tab surfaces at 1440 and 390.
 * Run: npx vite preview --host 127.0.0.1 --port 4173 &
 *      node scripts/shot-trade-cards-new-tab.mjs
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.PREVIEW_URL || 'http://127.0.0.1:4173/fleetfit-preview/#'
const OUT = process.env.SHOT_OUT || '/opt/cursor/artifacts/screenshots'
mkdirSync(OUT, { recursive: true })

const shots = []

async function shot(page, name) {
  const path = join(OUT, name)
  await page.screenshot({ path, fullPage: true })
  shots.push(path)
  console.log('wrote', path)
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  try {
    for (const [w, h, tag] of [
      [1440, 900, '1440'],
      [390, 844, '390'],
    ]) {
      const page = await browser.newPage({ viewport: { width: w, height: h } })

      await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
      await shot(page, `trade-cards-home-${tag}.png`)

      await page.goto(`${BASE}/intake`, { waitUntil: 'networkidle' })
      await shot(page, `trade-cards-intake-${tag}.png`)

      // Used package (Electrical)
      await page.goto(`${BASE}/package/pkg-trade-electrical`, {
        waitUntil: 'networkidle',
      })
      await page.waitForSelector('[data-stock-mode]')
      await shot(page, `trade-cards-package-used-${tag}.png`)

      // Toggle New
      await page.getByRole('button', { name: 'New', exact: true }).click()
      await page.waitForSelector('.new-catalog')
      await shot(page, `trade-cards-package-new-${tag}.png`)

      // Scroll to include vans
      await page.locator('[data-vehicle-id="rivian_rcv_500"]').scrollIntoViewIfNeeded()
      await shot(page, `trade-cards-package-new-rcv-${tag}.png`)
      await page.locator('[data-vehicle-id="mb_esprinter_81"]').scrollIntoViewIfNeeded()
      await shot(page, `trade-cards-package-new-esprinter-${tag}.png`)
      await page.locator('[data-vehicle-id="tesla_cybertruck_dual"]').scrollIntoViewIfNeeded()
      await shot(page, `trade-cards-package-new-cybertruck-${tag}.png`)
      await page.locator('[data-vehicle-id="rivian_r1t_premium"]').scrollIntoViewIfNeeded()
      await shot(page, `trade-cards-package-new-r1t-${tag}.png`)

      // Intake → New carry-through
      await page.goto(`${BASE}/intake`, { waitUntil: 'networkidle' })
      await page.getByRole('button', { name: 'Plumbing', exact: true }).click()
      await page.locator('.stock-mode-btn', { hasText: 'New' }).click()
      await page.getByRole('button', { name: 'Match a package' }).click()
      await page.waitForURL(/package\/pkg-trade-plumbing/)
      await page.waitForSelector('.new-catalog')
      await shot(page, `trade-cards-intake-new-carry-${tag}.png`)

      await page.close()
    }
  } finally {
    await browser.close()
  }
  console.log(JSON.stringify({ shots }, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
