/**
 * Gates + screenshots for draft-photo-add (photo chip + fleet plan panel).
 */
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import assert from 'node:assert/strict'

const BASE = process.env.DRAFT_URL || 'https://burnsted.github.io/fleetfit-preview/draft-photo-add/'
const OUT_PHOTO = '/workspace/artifacts/photo-add'
const OUT_PANEL = '/workspace/artifacts/fleet-panel'
const OUT_GATE = '/workspace/artifacts/fleet-panel'
mkdirSync(OUT_PHOTO, { recursive: true })
mkdirSync(OUT_PANEL, { recursive: true })

const BANNED = /\bBest\b|\bWorst\b|\bWorth it\b|\bSOH\b|\bBattery health\b/i
const EM_DASH = /\u2014/

const browser = await chromium.launch({ headless: true })
const errors = []

async function measureOverflow(page) {
  return page.evaluate(() => {
    const doc = document.documentElement
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      overflow: doc.scrollWidth > doc.clientWidth + 1,
    }
  })
}

async function bodyText(page) {
  return page.locator('body').innerText()
}

async function gotoHash(page, hash) {
  await page.goto(`${BASE}${hash}`, { waitUntil: 'networkidle', timeout: 90000 })
  await page.waitForTimeout(700)
}

try {
  // ——— 390 gates + fleet ———
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console:${msg.text()}`)
  })
  page.on('pageerror', (err) => errors.push(`pageerror:${err}`))

  await gotoHash(page, '#/')
  const homeText = await bodyText(page)
  assert(!BANNED.test(homeText), `banned on home: ${homeText.match(BANNED)?.[0]}`)
  assert(!EM_DASH.test(homeText), 'em dash on home')
  const homeOv = await measureOverflow(page)
  assert(!homeOv.overflow, `home overflow 390: ${homeOv.scrollWidth}>${homeOv.clientWidth}`)

  // Package page — dead button before screenshot (panel not open yet)
  await gotoHash(page, '#/package/pkg-trade-landscaping')
  await page.evaluate(() => {
    sessionStorage.removeItem('fleetfit-fleet-picks')
    sessionStorage.removeItem('fleetfit-fleet-plan')
  })
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(800)

  const addPkg = page.getByRole('button', { name: /Add package to fleet/i }).first()
  await addPkg.scrollIntoViewIfNeeded()
  await page.screenshot({ path: join(OUT_PANEL, 'before-dead-button.png'), fullPage: false })

  // First add → panel
  await addPkg.click()
  await page.waitForSelector('[data-fleet-plan-panel="1"]', { timeout: 5000 })
  await page.waitForTimeout(400)
  await page.screenshot({ path: join(OUT_PANEL, 'after-1-add-panel.png'), fullPage: false })
  const panel1 = await page.locator('[data-fleet-plan-panel="1"]').innerText()
  assert(/Fleet plan/i.test(panel1), 'panel missing Fleet plan')
  assert(/example/i.test(panel1), 'panel missing example label')
  assert(!BANNED.test(panel1), 'banned in panel')
  assert(!EM_DASH.test(panel1), 'em dash in panel')

  // Close and reopen control
  await page.getByRole('button', { name: /Keep adding/i }).click()
  await page.waitForTimeout(300)
  const reopen = page.locator('[data-fleet-plan-reopen="1"]')
  assert((await reopen.count()) === 1, 'reopen control missing')
  await page.screenshot({ path: join(OUT_PANEL, 'reopen-control.png'), fullPage: false })

  // Second add via photo chip (New Cybertruck if available)
  await gotoHash(page, '#/package/pkg-trade-electrical')
  // Ensure New tab for Cybertruck
  const newTab = page.getByRole('button', { name: /^New$/i }).first()
  if (await newTab.count()) {
    await newTab.click()
    await page.waitForTimeout(500)
  }
  let chip = page.locator('[data-photo-add="add"]').first()
  if (!(await chip.count())) {
    // Used listing chip
    const usedTab = page.getByRole('button', { name: /^Used$/i }).first()
    if (await usedTab.count()) await usedTab.click()
    await page.waitForTimeout(400)
    chip = page.locator('[data-photo-add="add"]').first()
  }
  assert((await chip.count()) > 0, 'no photo add chip found for second add')
  await chip.first().scrollIntoViewIfNeeded()
  await chip.first().click()
  await page.waitForSelector('[data-fleet-plan-panel="1"]', { timeout: 5000 })
  await page.waitForTimeout(400)
  const items = await page.locator('.fleet-plan-item').count()
  assert(items >= 2, `expected ≥2 plan items after append, got ${items}`)
  await page.screenshot({ path: join(OUT_PANEL, 'after-2-adds-panel.png'), fullPage: false })

  // Remove one item
  await page.locator('.fleet-plan-item-remove').first().click()
  await page.waitForTimeout(300)
  const afterRemove = await page.locator('.fleet-plan-item').count()
  assert(afterRemove === items - 1, `remove failed: ${afterRemove} vs ${items - 1}`)
  await page.screenshot({ path: join(OUT_PANEL, 'after-remove-one.png'), fullPage: false })

  // Close panel for overflow check
  await page.getByRole('button', { name: /Keep adding|Close fleet plan/i }).first().click().catch(() => {})
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(200)

  const ov390 = await measureOverflow(page)
  assert(!ov390.overflow, `package overflow 390: ${ov390.scrollWidth}>${ov390.clientWidth}`)

  // Photo-add refresh shots (plus / check Cybertruck + used GMC if present)
  await gotoHash(page, '#/package/pkg-trade-electrical')
  await page.evaluate(() => {
    sessionStorage.removeItem('fleetfit-fleet-picks')
    sessionStorage.removeItem('fleetfit-fleet-plan')
  })
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(600)

  // Capture a used card before (plus)
  const usedCard = page.locator('.trade-unit-card, .stack-card, .listing-card').first()
  if (await usedCard.count()) {
    await usedCard.screenshot({ path: join(OUT_PHOTO, 'before-listing-card.png') })
    const plus = usedCard.locator('[data-photo-add="add"]')
    if (await plus.count()) {
      await usedCard.screenshot({ path: join(OUT_PHOTO, 'after-plus-on-photo.png') })
      await plus.click()
      await page.waitForTimeout(400)
      // close panel if open so card is visible
      await page.keyboard.press('Escape')
      await page.waitForTimeout(200)
      await usedCard.screenshot({ path: join(OUT_PHOTO, 'after-check-with-total.png') })
      // used GMC if card text matches
      const cardText = await usedCard.innerText()
      if (/GMC/i.test(cardText)) {
        await usedCard.screenshot({ path: join(OUT_PHOTO, 'after-used-gmc-sierra.png') })
      }
    }
  }

  // New Cybertruck
  const newToggle = page.getByRole('button', { name: /^New$/i }).first()
  if (await newToggle.count()) {
    await newToggle.click()
    await page.waitForTimeout(600)
    const cyber = page.locator('.new-vehicle-card', { hasText: /Cybertruck/i }).first()
    if (await cyber.count()) {
      await cyber.screenshot({ path: join(OUT_PHOTO, 'after-plus-new-cybertruck.png') })
      const cyberPlus = cyber.locator('[data-photo-add="add"]')
      if (await cyberPlus.count()) {
        await cyberPlus.click()
        await page.waitForTimeout(400)
        await page.keyboard.press('Escape')
        await page.waitForTimeout(200)
        await cyber.screenshot({ path: join(OUT_PHOTO, 'after-check-new-cybertruck.png') })
      }
    }
    const gmcNew = page.locator('.new-vehicle-card', { hasText: /Sierra/i }).first()
    if (await gmcNew.count()) {
      await gmcNew.screenshot({ path: join(OUT_PHOTO, 'after-new-gmc-sierra.png') })
    }
  }

  await page.close()

  // ——— 1440 overflow + console ———
  const desk = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const deskErrors = []
  desk.on('console', (msg) => {
    if (msg.type() === 'error') deskErrors.push(msg.text())
  })
  desk.on('pageerror', (err) => deskErrors.push(String(err)))
  await desk.goto(`${BASE}#/package/pkg-trade-electrical`, { waitUntil: 'networkidle', timeout: 90000 })
  await desk.waitForTimeout(700)
  const ov1440 = await measureOverflow(desk)
  assert(!ov1440.overflow, `overflow 1440: ${ov1440.scrollWidth}>${ov1440.clientWidth}`)
  const deskText = await bodyText(desk)
  assert(!BANNED.test(deskText), `banned 1440: ${deskText.match(BANNED)?.[0]}`)
  assert(!EM_DASH.test(deskText), 'em dash 1440')
  await desk.close()

  const allErrors = [...errors, ...deskErrors]
  assert(allErrors.length === 0, `console errors: ${JSON.stringify(allErrors)}`)

  const report = {
    base: BASE,
    overflow390: homeOv,
    overflow1440: ov1440,
    consoleErrors: allErrors,
    bannedClean: true,
    screenshots: {
      fleetPanel: [
        'artifacts/fleet-panel/before-dead-button.png',
        'artifacts/fleet-panel/after-1-add-panel.png',
        'artifacts/fleet-panel/after-2-adds-panel.png',
        'artifacts/fleet-panel/after-remove-one.png',
        'artifacts/fleet-panel/reopen-control.png',
      ],
      photoAdd: [
        'artifacts/photo-add/before-listing-card.png',
        'artifacts/photo-add/after-plus-on-photo.png',
        'artifacts/photo-add/after-check-with-total.png',
        'artifacts/photo-add/after-plus-new-cybertruck.png',
        'artifacts/photo-add/after-check-new-cybertruck.png',
        'artifacts/photo-add/after-used-gmc-sierra.png',
        'artifacts/photo-add/after-new-gmc-sierra.png',
      ],
    },
  }
  writeFileSync(join(OUT_GATE, 'gate.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
  console.log('GATES OK')
} finally {
  await browser.close()
}
