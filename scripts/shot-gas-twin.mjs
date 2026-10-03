#!/usr/bin/env node
/**
 * Screenshots + DOM ban scan + 390 scrollWidth checks for gas twin Option 1.
 */
import { chromium, devices } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const BASE =
  process.env.GAS_TWIN_URL ||
  'https://burnsted.github.io/fleetfit-preview/draft-gas-twin/'
const TRADE =
  process.env.TRADE_CARDS_URL ||
  'https://burnsted.github.io/fleetfit-preview/draft-trade-cards/'
const OUT = process.env.SHOT_OUT || '/opt/cursor/artifacts/gas-twin-shots'
mkdirSync(OUT, { recursive: true })

const BANNED_WORDS = /\b(Best|Worst|Worth it|SOH|Battery health)\b/i
const EM_DASH = /\u2014/
// slash as separator in visible copy (allow URLs and lone fractions carefully)
const SLASH_SEP = /\s\/\s|\/\s|\s\//

function collectText(page) {
  return page.evaluate(() => {
    const bits = []
    const walk = (node) => {
      if (!node) return
      if (node.nodeType === Node.TEXT_NODE) {
        const t = node.textContent || ''
        if (t.trim()) bits.push({ kind: 'text', t })
        return
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return
      const el = node
      for (const attr of ['aria-label', 'alt', 'title', 'placeholder']) {
        const v = el.getAttribute?.(attr)
        if (v) bits.push({ kind: attr, t: v })
      }
      for (const child of el.childNodes) walk(child)
    }
    walk(document.body)
    return bits
  })
}

function scanBits(bits, route) {
  const hits = []
  for (const b of bits) {
    if (BANNED_WORDS.test(b.t)) hits.push({ route, kind: b.kind, reason: 'banned-word', sample: b.t.slice(0, 120) })
    if (EM_DASH.test(b.t)) hits.push({ route, kind: b.kind, reason: 'em-dash', sample: b.t.slice(0, 120) })
    // ignore URL-looking strings and date ranges already in app that use en-dash
    if (SLASH_SEP.test(b.t) && !/https?:\/\//.test(b.t)) {
      hits.push({ route, kind: b.kind, reason: 'slash', sample: b.t.slice(0, 120) })
    }
  }
  return hits
}

async function gotoHash(page, hashPath) {
  const url = BASE.replace(/\/?$/, '/') + (hashPath.startsWith('#') ? hashPath : `#${hashPath}`)
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(400)
}

async function setNewPlumbing(page) {
  // Home trade card → plumbing package New
  await gotoHash(page, '/')
  // Try navigate intake then package
  await gotoHash(page, '/intake')
  // Select Plumbing preset if present
  const plumbing = page.locator('button', { hasText: 'Plumbing' }).first()
  if (await plumbing.count()) await plumbing.click()
  // Turn New on
  const newBtn = page.locator('.stock-mode-btn', { hasText: 'New' }).first()
  if (await newBtn.count()) await newBtn.click()
  // Submit if possible
  const submit = page.locator('button[type="submit"], button', { hasText: /See package|Show package|Continue|See your fleet/i }).first()
  if (await submit.count()) {
    await submit.click()
    await page.waitForTimeout(600)
  } else {
    // Direct trade package route used in app
    await gotoHash(page, '/package/pkg-trade-plumbing')
    await page.waitForTimeout(400)
    const newBtn2 = page.locator('.stock-mode-btn', { hasText: 'New' }).first()
    if (await newBtn2.count()) await newBtn2.click()
  }
}

async function setCompare(page, on) {
  const block = page.locator('.gas-twin-toggle-block, .gas-twin-controls').first()
  await block.waitFor({ state: 'visible', timeout: 15000 })
  const btn = block.locator('.gas-twin-btn', { hasText: on ? 'On' : 'Off' }).first()
  const pressed = await btn.getAttribute('aria-pressed')
  if (pressed !== 'true') await btn.click()
  await page.waitForTimeout(300)
}

async function shot(page, name) {
  const path = join(OUT, `${name}.png`)
  await page.screenshot({ path, fullPage: true })
  const w = await page.evaluate(() => window.innerWidth)
  console.log('shot', name, 'innerWidth', w, '→', path)
  return path
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const report = { scans: [], scroll: [], widths: {}, heights: {} }

  // Desktop 1440
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    })
    const page = await context.newPage()
    await setNewPlumbing(page)
    await setCompare(page, false)
    await shot(page, '1440-off')
    report.widths['1440-off'] = await page.evaluate(() => ({
      inner: window.innerWidth,
      scroll: document.documentElement.scrollWidth,
    }))
    report.heights.off1440 = await page.evaluate(() => document.body.scrollHeight)

    await setCompare(page, true)
    await shot(page, '1440-on')
    // years 3 and 7
    await page.locator('.gas-twin-year-btn', { hasText: '3 years' }).click()
    await page.waitForTimeout(200)
    await shot(page, '1440-years-3')
    await page.locator('.gas-twin-year-btn', { hasText: '7 years' }).click()
    await page.waitForTimeout(200)
    await shot(page, '1440-years-7')
    await page.locator('.gas-twin-year-btn', { hasText: '5 years' }).click()

    // Full comparison on first strip that has it
    const full = page.locator('.gas-twin-text-link', { hasText: 'Full comparison' }).first()
    if (await full.count()) {
      await full.click()
      await page.waitForTimeout(400)
      await shot(page, '1440-full-comparison')
      await page.keyboard.press('Escape')
      await page.waitForTimeout(200)
    }

    // Missing twin card
    const missing = page.locator('.gas-twin-strip.is-missing').first()
    if (await missing.count()) {
      await missing.scrollIntoViewIfNeeded()
      await shot(page, '1440-missing-twin')
    }

    // Rough match expand
    const roughCard = page.locator('.gas-twin-strip[data-match-quality="weak"], .gas-twin-strip[data-match-quality="fair"]').first()
    if (await roughCard.count()) {
      await roughCard.scrollIntoViewIfNeeded()
      await roughCard.locator('.gas-twin-text-link', { hasText: 'Why this twin' }).click()
      await page.waitForTimeout(200)
      await shot(page, '1440-rough-match')
    }

    // DOM scan routes
    for (const route of ['/', '/intake', '/package/pkg-trade-plumbing']) {
      await gotoHash(page, route)
      if (route.includes('pkg-trade-plumbing')) {
        const newBtn = page.locator('.stock-mode-btn', { hasText: 'New' }).first()
        if (await newBtn.count()) await newBtn.click()
        await setCompare(page, true)
        const full2 = page.locator('.gas-twin-text-link', { hasText: 'Full comparison' }).first()
        if (await full2.count()) {
          await full2.click()
          await page.waitForTimeout(300)
        }
      }
      const bits = await collectText(page)
      const hits = scanBits(bits, `1440:${route}`)
      report.scans.push(...hits)
      if (route.includes('pkg-trade-plumbing')) {
        await page.keyboard.press('Escape').catch(() => {})
      }
    }

    await context.close()
  }

  // 1024
  {
    const context = await browser.newContext({ viewport: { width: 1024, height: 800 } })
    const page = await context.newPage()
    await setNewPlumbing(page)
    await setCompare(page, false)
    await shot(page, '1024-off')
    await setCompare(page, true)
    await shot(page, '1024-on')
    report.widths['1024-on'] = await page.evaluate(() => ({
      inner: window.innerWidth,
      scroll: document.documentElement.scrollWidth,
    }))
    await context.close()
  }

  // 390 phone
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    })
    const page = await context.newPage()
    await gotoHash(page, '/intake')
    const intakeScroll = await page.evaluate(() => document.documentElement.scrollWidth)
    report.scroll.push({ route: 'intake', scrollWidth: intakeScroll, ok: intakeScroll === 390 })
    await shot(page, '390-intake-off')

    await setNewPlumbing(page)
    await setCompare(page, false)
    const pkgScrollOff = await page.evaluate(() => document.documentElement.scrollWidth)
    report.scroll.push({ route: 'package-off', scrollWidth: pkgScrollOff, ok: pkgScrollOff === 390 })
    await shot(page, '390-off')
    report.heights.off390 = await page.evaluate(() => document.body.scrollHeight)

    await setCompare(page, true)
    const pkgScrollOn = await page.evaluate(() => document.documentElement.scrollWidth)
    report.scroll.push({ route: 'package-on', scrollWidth: pkgScrollOn, ok: pkgScrollOn === 390 })
    await shot(page, '390-on')

    const full = page.locator('.gas-twin-text-link', { hasText: 'Full comparison' }).first()
    if (await full.count()) {
      await full.click()
      await page.waitForTimeout(400)
      const sheetScroll = await page.evaluate(() => document.documentElement.scrollWidth)
      report.scroll.push({ route: 'sheet', scrollWidth: sheetScroll, ok: sheetScroll <= 390 })
      await shot(page, '390-full-comparison-sheet')
      // scan sheet
      const bits = await collectText(page)
      report.scans.push(...scanBits(bits, '390:sheet'))
      await page.locator('.gas-twin-sheet-close').click()
    }

    const missing = page.locator('.gas-twin-strip.is-missing').first()
    if (await missing.count()) {
      await missing.scrollIntoViewIfNeeded()
      await shot(page, '390-missing-twin')
    }

    await context.close()
  }

  // Off-state height compare vs draft-trade-cards at 1440
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    await page.goto(TRADE.replace(/\/?$/, '/') + '#/package/pkg-trade-plumbing', {
      waitUntil: 'networkidle',
      timeout: 60000,
    })
    const newBtn = page.locator('.stock-mode-btn', { hasText: 'New' }).first()
    if (await newBtn.count()) await newBtn.click()
    await page.waitForTimeout(400)
    report.heights.tradeCards1440 = await page.evaluate(() => document.body.scrollHeight)
    await page.screenshot({ path: join(OUT, '1440-trade-cards-baseline.png'), fullPage: true })
    await context.close()
  }

  writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
  const gasTwinHits = report.scans.filter((h) => /gas twin|Rough match|Full comparison|not confirmed|Insurance/i.test(h.sample) || h.route.includes('sheet'))
  console.log('total scan hits', report.scans.length, 'gas-twin-ish', gasTwinHits.length)
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
