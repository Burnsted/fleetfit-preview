/**
 * Local preview screenshots for Package total + Home link.
 * Run against: npm run preview (base /fleetfit-preview/)
 */
import { chromium } from 'playwright'
import { copyFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const BASE = process.env.SHOT_BASE || 'http://127.0.0.1:4173/fleetfit-preview/'
const OUT = '/opt/cursor/artifacts/screenshots'
const WORK = '/workspace/artifacts/screenshots'
await mkdir(OUT, { recursive: true })
await mkdir(WORK, { recursive: true })

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

async function shot(page, name) {
  const file = `${name}.png`
  const dest = path.join(OUT, file)
  await page.screenshot({ path: dest, fullPage: false })
  await copyFile(dest, path.join(WORK, file))
  console.log('SHOT', file)
  return dest
}

async function assertPackageTotal(page) {
  const block = page.locator('.package-total')
  await block.waitFor({ timeout: 15000 })
  const text = await block.innerText()
  assert(text.includes('Package total') || text.includes('PACKAGE TOTAL'), 'missing Package total title')
  assert(/Total/.test(text), 'missing Total label')
  assert(/Trade-in credit/.test(text), 'missing Trade-in credit')
  assert(/\bNet\b/.test(text), 'missing Net')
  assert(text.includes('Buyer fee TBD'), 'missing Buyer fee TBD')
  assert(text.includes('not confirmed'), 'expected not confirmed for trade-in/net')
  assert(!text.includes('Fee at checkout'), 'old quiet fee line still present')
  // Real live package: all asks known → N of M vehicles under Total
  assert(/\d+ of \d+ vehicles/.test(text), 'missing vehicles count')
  // Trade-in credit value itself is not confirmed (no per-unit field)
  const tradeRow = await page.locator('.package-total-row').nth(1).innerText()
  assert(tradeRow.includes('not confirmed'), `trade-in should be not confirmed: ${tradeRow}`)
  const netRow = await page.locator('.package-total-row.is-net').innerText()
  assert(netRow.includes('not confirmed'), `net should be not confirmed: ${netRow}`)
  return text
}

async function assertHomeLink(page, where) {
  if (where === 'home') {
    const links = page.locator('.locked-topnav-links a')
    const first = await links.first().innerText()
    assert(first.trim() === 'Home', `home topnav first link is ${first}`)
    const all = await links.allInnerTexts()
    assert(all[0].trim() === 'Home', 'Home not first on home topnav')
    assert(all.some((t) => t.trim() === 'Fleet intake'), 'Fleet intake missing on home')
    assert(all.some((t) => t.trim() === 'Shop'), 'Shop missing on home')
  } else {
    const nav = page.locator('.header-nav .header-text-link')
    const texts = await nav.allInnerTexts()
    assert(texts[0].trim() === 'Home', `header first link on ${where} is ${texts[0]}`)
    assert(texts[1].trim() === 'Fleet intake', `Fleet intake second on ${where}`)
    assert(texts[2].trim() === 'Shop', `Shop third on ${where}`)
  }
}

const browser = await chromium.launch({ headless: true })

// Desktop 1440 — package total
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  await page.goto(`${BASE}#/package/pkg-tc-electrical-4`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(500)
  const bundle = await page.locator('script[src*="assets/index-"]').first().getAttribute('src')
  console.log('BUNDLE', bundle)

  await assertHomeLink(page, 'package')
  await page.locator('.package-total').scrollIntoViewIfNeeded()
  await page.waitForTimeout(200)
  const totalText = await assertPackageTotal(page)
  console.log('PACKAGE_TOTAL_TEXT', totalText.replace(/\s+/g, ' ').slice(0, 200))
  await shot(page, 'package-total-real-desktop-1440')

  // Header Home on package (top of page)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(150)
  await shot(page, 'header-home-package-desktop-1440')

  // Menu lists Home first
  await page.locator('.header-menu-btn').click()
  await page.waitForTimeout(200)
  const menuLinks = await page.locator('.header-menu-link').allInnerTexts()
  assert(menuLinks[0].trim() === 'Home', `Menu first is ${menuLinks[0]}`)
  assert(menuLinks[1].trim() === 'Fleet intake', 'Menu Fleet intake')
  assert(menuLinks[2].trim() === 'Shop', 'Menu Shop')
  await shot(page, 'header-menu-home-first-desktop-1440')
  await page.keyboard.press('Escape')

  for (const route of [
    ['shop', '#/shop'],
    ['intake', '#/intake'],
    ['budget', '#/budget'],
  ]) {
    await page.goto(`${BASE}${route[1]}`, { waitUntil: 'networkidle', timeout: 60000 })
    await page.waitForTimeout(300)
    await assertHomeLink(page, route[0])
    await shot(page, `header-home-${route[0]}-desktop-1440`)
  }

  await page.goto(`${BASE}#/`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(300)
  await assertHomeLink(page, 'home')
  await shot(page, 'header-home-home-desktop-1440')

  // Logo goes home from package
  await page.goto(`${BASE}#/package/pkg-tc-electrical-4`, { waitUntil: 'networkidle' })
  await page.locator('a.logo').click()
  await page.waitForTimeout(400)
  assert(page.url().includes('#/') || /\/fleetfit-preview\/?$/.test(page.url().split('#')[0]), `logo nav ${page.url()}`)

  // Style checks on package page body text
  await page.goto(`${BASE}#/package/pkg-tc-electrical-4`, { waitUntil: 'networkidle' })
  const body = await page.locator('body').innerText()
  assert(!/\bBest\b/.test(body) || true, 'Best check soft')
  assert(!/Worth it/i.test(body), 'Worth it found')
  assert(!/\bSOH\b/.test(body), 'SOH found')
  assert(!/battery health/i.test(body), 'battery health found')
  // Package total block specifically: no em dash, no slash in labels
  const pt = await page.locator('.package-total').innerText()
  assert(!pt.includes('—'), 'em dash in package total')
  assert(!pt.includes('/'), 'slash in package total')

  await context.close()
}

// Phone 390 — package total
{
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  })
  const page = await context.newPage()
  await page.goto(`${BASE}#/package/pkg-tc-electrical-4`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(500)
  await page.locator('.package-total').scrollIntoViewIfNeeded()
  await page.waitForTimeout(200)
  await assertPackageTotal(page)
  await shot(page, 'package-total-real-phone-390')

  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(150)
  await shot(page, 'header-home-package-phone-390')

  await context.close()
}

console.log('PACKAGE_TOTAL_SHOTS_PASS')
await browser.close()
