/**
 * Gates + before/after screenshots for title/count sync draft.
 * Run: node scripts/gate-title-count.mjs
 */
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../artifacts/screenshots')
mkdirSync(OUT, { recursive: true })

const LIVE = 'https://burnsted.github.io/fleetfit-preview'
const DRAFT = 'https://burnsted.github.io/fleetfit-preview/draft-title-count'

const BANNED =
  /\bBest\b|\bWorst\b|\bWorth it\b|\bSOH\b|\bBattery health\b/i
const EM_DASH = /\u2014/

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

async function waitForDeploy(url, needle, attempts = 24) {
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

async function shotTop(page, name, width) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(200)
  const path = join(OUT, `${name}.png`)
  await page.screenshot({ path, fullPage: false })
  console.log('wrote', path)
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

async function scanRoute(page, base, route) {
  const errors = []
  const onErr = (msg) => errors.push(String(msg))
  page.on('pageerror', onErr)
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })

  const url = `${base}/#${route}`
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(500)

  const text = await collectVisibleText(page)
  const findings = []
  if (EM_DASH.test(text)) findings.push('em-dash')
  if (BANNED.test(text)) {
    const m = text.match(BANNED)
    findings.push(`banned:${m?.[0]}`)
  }
  // Slash gate: ignore breadcrumb / known path separators in links? Ted: no visible slashes.
  // Match common UI slash patterns (A / B) while ignoring lone path crumbs already using ·
  const slashHits = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.includes('/') && !/^https?:\/\//i.test(l) && !l.includes('fonts.googleapis'))
  // Allow number ranges already using en dash; flag " / " and mid-word slashes in labels
  const badSlashes = slashHits.filter((l) => /\s\/\s|\w\/\w/.test(l))
  if (badSlashes.length) findings.push(`slash:${badSlashes[0].slice(0, 80)}`)

  const scroll = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))

  page.off('pageerror', onErr)

  return { route, findings, errors, scroll, title: await page.locator('h1.match-title').count()
    ? await page.locator('h1.match-title').innerText()
    : null }
}

async function main() {
  console.log('Waiting for draft deploy…')
  await waitForDeploy(`${DRAFT}/index.html`, 'index-BziBZZQf.js')
  console.log('Draft host ready')

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  // BEFORE: live root electrical package @ 390 from top
  await page.goto(`${LIVE}/#/package/pkg-trade-electrical`, {
    waitUntil: 'networkidle',
    timeout: 60000,
  })
  await page.waitForTimeout(800)
  const beforeTitle = await page.locator('h1.match-title').innerText()
  const beforeUnits = await page.locator('.trade-unit-stack > li').count()
  console.log('BEFORE title:', beforeTitle, 'unit rows:', beforeUnits)
  await shotTop(page, 'before-live-root-electrical-390', 390)

  // AFTER: draft electrical @ 390 and 1440
  await page.goto(`${DRAFT}/#/package/pkg-trade-electrical`, {
    waitUntil: 'networkidle',
    timeout: 60000,
  })
  await page.waitForTimeout(800)
  const afterTitle = await page.locator('h1.match-title').innerText()
  const afterUnits = await page
    .locator('.trade-unit-stack > li:not([data-removed])')
    .count()
  // Prefer counting TradeUnitCard roots
  const cardCount = await page.locator('.trade-unit-stack .trade-unit-card, .trade-unit-stack [data-unit-id]').count()
  const unitCards = cardCount || (await page.locator('.package-unit-stack > li').count())
  console.log('AFTER title:', afterTitle, 'cards:', unitCards, 'lis:', afterUnits)
  assert(/1 vehicle/.test(afterTitle), `expected singular 1 vehicle, got ${afterTitle}`)
  assert(!/4 vehicles/.test(afterTitle), `still claims 4 vehicles: ${afterTitle}`)
  await shotTop(page, 'after-draft-electrical-390', 390)
  await shotTop(page, 'after-draft-electrical-1440', 1440)

  // Different count: HVAC has 2 eligible
  await page.goto(`${DRAFT}/#/package/pkg-trade-hvac`, {
    waitUntil: 'networkidle',
    timeout: 60000,
  })
  await page.waitForTimeout(800)
  const hvacTitle = await page.locator('h1.match-title').innerText()
  console.log('HVAC title:', hvacTitle)
  await shotTop(page, 'after-draft-hvac-390', 390)

  // Gates on draft — all routes, both widths
  const report = { widths: {}, consoleErrors: 0, scanFindings: [] }
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
    report.widths[width] = []
    for (const route of ROUTES) {
      const r = await scanRoute(page, DRAFT, route)
      report.widths[width].push({
        route: r.route,
        scrollWidth: r.scroll.scrollWidth,
        clientWidth: r.scroll.clientWidth,
        overflow: r.scroll.scrollWidth > r.scroll.clientWidth + 1,
        findings: r.findings,
        errors: r.errors,
        title: r.title,
      })
      report.consoleErrors += r.errors.length
      for (const f of r.findings) report.scanFindings.push({ width, route, f })
      console.log(
        `gate ${width} ${route}: scroll=${r.scroll.scrollWidth}/${r.scroll.clientWidth}`,
        r.findings.length ? r.findings.join(',') : 'clean',
        r.errors.length ? `errs=${r.errors.length}` : '',
      )
    }
  }

  // Fail hard on overflow / console / banned / em dash
  const overflows = []
  for (const width of [390, 1440]) {
    for (const row of report.widths[width]) {
      if (row.overflow) overflows.push(`${width}${row.route}`)
    }
  }
  const hardFindings = report.scanFindings.filter(
    (x) => x.f.startsWith('em-dash') || x.f.startsWith('banned'),
  )

  writeFileSync(join(OUT, 'gate-title-count-report.json'), JSON.stringify(report, null, 2))

  console.log('\n=== GATE SUMMARY ===')
  console.log('beforeTitle', beforeTitle)
  console.log('afterTitle', afterTitle)
  console.log('hvacTitle', hvacTitle)
  console.log('consoleErrors', report.consoleErrors)
  console.log('overflows', overflows.length ? overflows.join(', ') : 'none')
  console.log('hardFindings', hardFindings.length ? hardFindings : 'none')
  console.log('slashFindings', report.scanFindings.filter((x) => x.f.startsWith('slash')))

  assert(report.consoleErrors === 0, `console errors: ${report.consoleErrors}`)
  assert(overflows.length === 0, `scrollWidth overflow: ${overflows.join(', ')}`)
  assert(hardFindings.length === 0, `banned/em-dash: ${JSON.stringify(hardFindings)}`)

  // Slash: warn but match prior package policy — fail if new " / " in package titles/chips area
  const slashHard = report.scanFindings.filter(
    (x) => x.f.startsWith('slash') && /package|vehicle|unit|fleet/i.test(x.f),
  )
  assert(slashHard.length === 0, `slash in package UI: ${JSON.stringify(slashHard)}`)

  await browser.close()
  console.log('GATES PASS')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
