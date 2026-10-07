/**
 * Gates + before/after screenshots for seven-fixes draft.
 * Run: node scripts/gate-seven-fixes.mjs
 */
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync, copyFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../artifacts/screenshots')
const ART = '/opt/cursor/artifacts/screenshots'
mkdirSync(OUT, { recursive: true })
mkdirSync(ART, { recursive: true })

const LIVE = 'https://burnsted.github.io/fleetfit-preview'
const DRAFT = 'https://burnsted.github.io/fleetfit-preview/draft-seven-fixes'
const NEEDLE = 'index-Ce3PFnrQ.js'

const BANNED =
  /\bBest\b|\bWorst\b|\bWorth it\b|\bSOH\b|\bBattery health\b/i
const EM_DASH = /\u2014/
const SLASH_VISIBLE = /(?<![.:\/\w])\/(?![\/\w])/ // rough; we scan text nodes carefully

const ROUTES = [
  '/',
  '/intake',
  '/shop',
  '/budget',
  '/checkout',
  '/package/pkg-trade-electrical',
  '/package/pkg-trade-hvac',
  '/package/pkg-trade-plumbing',
  '/package/pkg-trade-landscaping',
  '/package/pkg-trade-electrical/compare',
]

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

function saveBoth(name) {
  const src = join(OUT, `${name}.png`)
  const dst = join(ART, `${name}.png`)
  if (existsSync(src)) copyFileSync(src, dst)
}

async function waitForDeploy(url, needle, attempts = 36) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { cache: 'no-store' })
      const html = await res.text()
      if (res.ok && html.includes(needle)) return html
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 5000))
  }
  throw new Error(`Deploy not ready: ${url} missing ${needle}`)
}

async function shot(page, name, width = 390) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
  await page.waitForTimeout(250)
  const path = join(OUT, `${name}.png`)
  await page.screenshot({ path, fullPage: false })
  saveBoth(name)
  console.log('wrote', name)
  return path
}

async function collectVisibleText(page) {
  return page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    const parts = []
    let n
    while ((n = walker.nextNode())) {
      const t = n.textContent || ''
      if (!t.trim()) continue
      const el = n.parentElement
      if (!el) continue
      const tag = el.tagName
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') continue
      const style = window.getComputedStyle(el)
      if (style.display === 'none' || style.visibility === 'hidden') continue
      if (Number(style.opacity) === 0) continue
      parts.push(t)
    }
    return parts.join('\n')
  })
}

function scanText(text, route) {
  const issues = []
  if (EM_DASH.test(text)) issues.push('em-dash')
  if (BANNED.test(text)) issues.push(`banned:${text.match(BANNED)?.[0]}`)
  // Visible slash: allow URL-ish and "out of" already fixed; flag lone " / " in UI words
  if (/(^|\s)\/(\s|$)/.test(text) || / \/\d/.test(text) || /\d\/ /.test(text)) {
    // allow path chrome? still flag for report
    if (text.includes(' / ') || /\/\d{2}/.test(text) === false) {
      const hits = text.split('\n').filter((l) => l.includes('/') && !l.includes('http') && !/fonts\.|github|kbb\.com/i.test(l))
      if (hits.some((h) => /\s\/\s|\d\/\d|\/10\b/.test(h))) {
        issues.push('slash')
      }
    }
  }
  return issues
}

function contrastRatio(fg, bg) {
  function parse(c) {
    const m = String(c).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/)
    if (!m) return null
    const a = m[4] != null ? Number(m[4]) : 1
    return { r: +m[1], g: +m[2], b: +m[3], a }
  }
  function lum({ r, g, b }) {
    const to = (v) => {
      v /= 255
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
    }
    return 0.2126 * to(r) + 0.7152 * to(g) + 0.0722 * to(b)
  }
  // Composite fg over bg when fg has alpha
  const F = parse(fg)
  const B = parse(bg)
  if (!F || !B) return null
  const comp = {
    r: F.r * F.a + B.r * (1 - F.a),
    g: F.g * F.a + B.g * (1 - F.a),
    b: F.b * F.a + B.b * (1 - F.a),
  }
  const L1 = lum(comp)
  const L2 = lum(B)
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1]
  return (hi + 0.05) / (lo + 0.05)
}

async function measureDialContrast(page) {
  return page.evaluate((fnSrc) => {
    // eslint-disable-next-line no-new-func
    const contrastRatio = new Function(`return (${fnSrc})`)()
    const dial = document.querySelector('.trade-unit-score .score-dial, .score-dial.is-on-light, .score-dial')
    if (!dial) return { found: false }
    const body = dial.closest('.trade-unit-card-body') || dial.parentElement
    const bg = getComputedStyle(body).backgroundColor
    // Resolve transparent body to white card
    const card = dial.closest('.trade-unit-card')
    const cardBg = card ? getComputedStyle(card).backgroundColor : 'rgb(255,255,255)'
    const effectiveBg = bg === 'rgba(0, 0, 0, 0)' ? cardBg : bg
    const pick = (sel) => {
      const el = dial.querySelector(sel)
      if (!el) return null
      const color = getComputedStyle(el).color
      return { text: el.textContent?.trim(), color, ratio: contrastRatio(color, effectiveBg) }
    }
    return {
      found: true,
      bg: effectiveBg,
      value: pick('.score-dial-value'),
      max: pick('.score-dial-max'),
      diff: pick('.score-dial-diff'),
      current: pick('.score-dial-current'),
      tappable: dial.getAttribute('data-dial-tap') === 'open',
      tag: dial.tagName,
    }
  }, contrastRatio.toString())
}

async function overflowCheck(page, width) {
  await page.setViewportSize({ width, height: 900 })
  await page.waitForTimeout(200)
  return page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    ok: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  }))
}

async function goto(page, base, route) {
  await page.goto(`${base}/#${route}`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(800)
}

async function clearClientState(page) {
  await page.evaluate(() => {
    try {
      sessionStorage.clear()
      localStorage.clear()
    } catch {
      /* ignore */
    }
  })
}

async function fillIntakeVan(page, base) {
  await goto(page, base, '/intake')
  await clearClientState(page)
  await goto(page, base, '/intake')
  // HVAC preset for a real van listing
  const hvac = page.locator('button.intake-preset-btn', { hasText: /^HVAC$/ })
  if (await hvac.count()) await hvac.first().click()
  // fleet size 1-2
  const fleetSelect = page.locator('.intake-field', { hasText: 'Fleet size' }).locator('select')
  if (await fleetSelect.count()) {
    const labels = await fleetSelect.locator('option').allTextContents()
    const hit = labels.find((o) => /1.?2/.test(o))
    if (hit) await fleetSelect.selectOption({ label: hit })
  }
  // Van body chip
  const van = page.locator('.intake-field', { hasText: 'Body' }).locator('button', { hasText: /^Van$/ })
  if (await van.count()) await van.first().click()
  // current vehicle
  async function fillLabeled(label, value) {
    const input = page.locator('.intake-current-vehicle label', { hasText: label }).locator('input')
    if (await input.count()) await input.fill(String(value))
  }
  await fillLabeled('Year', '2019')
  await fillLabeled('Make', 'Ford')
  await fillLabeled('Model', 'Transit-250')
  await fillLabeled('Odometer (mi)', '62000')
  await page.locator('button[type="submit"]', { hasText: 'Match a package' }).click()
  await page.waitForTimeout(2500)
}

async function main() {
  console.log('Waiting for draft deploy…')
  await waitForDeploy(`${DRAFT}/`, NEEDLE)
  console.log('Draft ready')

  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  const consoleErrors = []
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text())
  })
  page.on('pageerror', (e) => consoleErrors.push(String(e)))

  // ——— BEFORE (live root) ———
  await goto(page, LIVE, '/package/pkg-trade-electrical')
  await page.locator('.trade-unit-card').first().scrollIntoViewIfNeeded().catch(() => {})
  await shot(page, 'item1-before')
  await shot(page, 'item2-before')
  // try open dial (should fail on live)
  await page.locator('.score-dial').first().click({ force: true }).catch(() => {})
  await page.waitForTimeout(400)
  await shot(page, 'item2-before-tap')
  await page.locator('.trade-unit-card-media').first().screenshot({ path: join(OUT, 'item3-before.png') }).catch(async () => {
    await shot(page, 'item3-before')
  })
  saveBoth('item3-before')

  // item4 before: van intake on live → pickup shown
  await fillIntakeVan(page, LIVE)
  await shot(page, 'item4-before')
  await page.evaluate(() => {
    const el = [...document.querySelectorAll('h2,h3,p')].find((e) => /trade-?in/i.test(e.textContent || ''))
    el?.scrollIntoView()
  })
  await shot(page, 'item5-before')
  await goto(page, LIVE, '/')
  await shot(page, 'item6-before-home')
  await goto(page, LIVE, '/intake')
  await shot(page, 'item6-before-intake')
  await goto(page, LIVE, '/package/pkg-trade-electrical')
  await page.locator('.trade-size-chips').scrollIntoViewIfNeeded().catch(() => {})
  await shot(page, 'item7-before')

  // ——— AFTER (draft) ———
  consoleErrors.length = 0
  await goto(page, DRAFT, '/package/pkg-trade-electrical')
  await page.locator('.trade-unit-card').first().scrollIntoViewIfNeeded().catch(() => {})
  await shot(page, 'item1-after')
  const contrast = await measureDialContrast(page)
  console.log('CONTRAST', JSON.stringify(contrast, null, 2))
  assert(contrast.found, 'score dial not found on draft electrical')
  for (const key of ['value', 'max', 'diff', 'current']) {
    const row = contrast[key]
    if (!row) continue
    assert(row.ratio >= 4.5, `${key} contrast ${row.ratio} < 4.5 (${row.color} on ${contrast.bg})`)
  }
  assert(contrast.tappable && contrast.tag === 'BUTTON', 'dial must be tappable button')

  await page.locator('.score-dial.is-tappable, button.score-dial').first().click()
  await page.waitForSelector('.score-readout-sheet', { timeout: 5000 })
  await shot(page, 'item2-after')
  await page.locator('.score-readout-panel').screenshot({ path: join(OUT, 'item2-after-readout.png') })
  saveBoth('item2-after-readout')
  await page.locator('.score-readout-close').click()
  await page.waitForTimeout(300)

  await page.locator('.trade-unit-card-media').first().screenshot({ path: join(OUT, 'item3-after.png') })
  saveBoth('item3-after')
  // also full card after
  await page.locator('.trade-unit-card').first().screenshot({ path: join(OUT, 'item3-after-card.png') })
  saveBoth('item3-after-card')

  // item4: van intake on HVAC draft (with current → incomplete vans still show)
  await fillIntakeVan(page, DRAFT)
  await shot(page, 'item4-after')
  const afterBody = await page.innerText('body')
  assert(
    /E-Transit/i.test(afterBody),
    'van + current must still show real van listings (E-Transit), not empty shortfall',
  )
  assert(
    !/No vans with a real listing/i.test(afterBody),
    'honest van shortfall must not appear when real van listings exist',
  )
  assert(
    /Score incomplete:\s*missing/i.test(afterBody),
    'incomplete vans must show plain Score incomplete: missing <field> label',
  )
  await page.locator('.trade-unit-card').first().screenshot({ path: join(OUT, 'item4-after-card.png') })
  saveBoth('item4-after-card')
  await shot(page, 'item4b-after-van-with-current')

  await page.evaluate(() => {
    const el = [...document.querySelectorAll('h2,h3,p')].find((e) => /trade-?in/i.test(e.textContent || ''))
    el?.scrollIntoView()
  })
  await shot(page, 'item5-after')
  const tradeVals = await page.evaluate(() => {
    const row = document.querySelector('[data-trade-in-row="1"]')
    if (!row) return null
    const inputs = [...row.querySelectorAll('input')].map((i) => i.value)
    return inputs
  })
  console.log('TRADEIN row1', tradeVals)
  assert(tradeVals && tradeVals.some((v) => /2019|Ford|Transit/i.test(v)), 'trade-in should prefill from intake')

  await goto(page, DRAFT, '/')
  await shot(page, 'item6-after-home')
  const homeHasSiteHeader = await page.locator('.site-header').count()
  const homeHasLockedNav = await page.locator('.locked-topnav').count()
  assert(homeHasSiteHeader === 1, 'Home must use site-header')
  assert(homeHasLockedNav === 0, 'Home must not use locked-topnav')
  await goto(page, DRAFT, '/intake')
  await shot(page, 'item6-after-intake')
  assert((await page.locator('.site-header').count()) === 1, 'Intake site-header')

  // item7: intake 1-2 → size chip 2
  await fillIntakeVan(page, DRAFT)
  await page.locator('.trade-size-chips').scrollIntoViewIfNeeded().catch(() => {})
  await shot(page, 'item7-after')
  const sizeActive = await page.evaluate(() => {
    const a = document.querySelector('.trade-size-chip.is-active')
    return a?.textContent?.trim()
  })
  console.log('SIZE active after intake 1-2', sizeActive)
  assert(sizeActive === '2', `fleet size should default to 2 from intake 1-2, got ${sizeActive}`)

  // Gates: DOM scan all routes
  const scanIssues = []
  for (const route of ROUTES) {
    await goto(page, DRAFT, route)
    const text = await collectVisibleText(page)
    const issues = scanText(text, route)
    if (issues.length) scanIssues.push({ route, issues })
  }
  console.log('SCAN', JSON.stringify(scanIssues, null, 2))
  // Soft: report but don't fail on pre-existing slash in breadcrumbs if any — still assert no banned/emdash
  for (const row of scanIssues) {
    assert(!row.issues.some((i) => i === 'em-dash' || i.startsWith('banned')), `banned/emdash on ${row.route}: ${row.issues}`)
  }

  // Overflow
  for (const width of [390, 1440]) {
    for (const route of ['/', '/intake', '/package/pkg-trade-electrical', '/shop']) {
      await goto(page, DRAFT, route)
      const ov = await overflowCheck(page, width)
      console.log('OVERFLOW', width, route, ov)
      assert(ov.ok, `overflow at ${width} ${route}: scrollWidth=${ov.scrollWidth} client=${ov.clientWidth}`)
    }
  }

  // Console errors (filter benign)
  const bad = consoleErrors.filter(
    (e) => !/favicon|fonts\.googleapis|ResizeObserver/i.test(e),
  )
  console.log('CONSOLE', bad)
  assert(bad.length === 0, `console errors: ${bad.join(' | ')}`)

  // Rename aliases expected by Ted naming
  const aliases = [
    ['item6-after-home', 'item6-after'],
    ['item6-before-home', 'item6-before'],
  ]
  for (const [from, to] of aliases) {
    const src = join(OUT, `${from}.png`)
    if (existsSync(src)) {
      copyFileSync(src, join(OUT, `${to}.png`))
      saveBoth(to)
    }
  }

  writeFileSync(
    join(OUT, 'seven-fixes-gate.json'),
    JSON.stringify({ contrast, sizeActive, tradeVals, scanIssues, consoleErrors: bad }, null, 2),
  )

  await browser.close()
  console.log('ALL GATES PASSED')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
