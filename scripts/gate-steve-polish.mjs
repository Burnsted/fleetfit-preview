/**
 * Screenshots + clearance gates for draft-steve-polish.
 */
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync, copyFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import assert from 'node:assert/strict'

const BASE = 'https://burnsted.github.io/fleetfit-preview/draft-steve-polish/'
const OUT = '/workspace/artifacts/steve-polish'
mkdirSync(OUT, { recursive: true })

const BANNED = /\bBest\b|\bWorst\b|\bWorth it\b|\bSOH\b|\bBattery health\b/i
const EM_DASH = /\u2014/
const EN_DASH = /\u2013/
/** Slash used as "or" / "per" in short UI labels (not URLs). */
const SLASH_OR_PER =
  /\b(?:mi|miles|¢|cents|\$[\d.]+|engines?|body|mpg|kWh|day|hr|hrs|hour|hours)\s*\/\s*(?:day|mi|mile|body|styles?|hr|hrs|hour|kWh)\b|\b\w+\s*\/\s*\w+\b/i

async function injectConsent(page, { show = true, zIndex = '9999', detectable = true } = {}) {
  await page.evaluate(
    ({ visible, zIndex, detectable }) => {
      document.getElementById('ff-consent-fixture')?.remove()
      if (!visible) {
        document.documentElement.style.setProperty('--consent-clearance', '0px')
        return
      }
      const bar = document.createElement('div')
      bar.id = 'ff-consent-fixture'
      if (detectable) bar.setAttribute('data-consent-bar', '1')
      else bar.setAttribute('data-consent-fixture-visual', '1')
      bar.innerHTML = detectable
        ? '<span>Cookie consent (96px)</span><button type="button" id="ff-consent-accept">Accept</button>'
        : '<span>Overlay bar (96px)</span><button type="button" id="ff-consent-accept">Accept</button>'
      Object.assign(bar.style, {
        position: 'fixed',
        left: '0',
        right: '0',
        bottom: '0',
        height: '96px',
        zIndex: String(zIndex),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        background: '#0b1220',
        color: '#fff',
        font: '600 14px/1.2 system-ui,sans-serif',
      })
      const btn = bar.querySelector('button')
      Object.assign(btn.style, {
        background: '#fff',
        color: '#0b1220',
        border: '0',
        padding: '10px 16px',
        fontWeight: '700',
        cursor: 'pointer',
      })
      btn.addEventListener('click', () => {
        bar.remove()
        document.documentElement.style.setProperty('--consent-clearance', '0px')
      })
      document.body.appendChild(bar)
      if (!detectable) {
        document.documentElement.style.setProperty('--consent-clearance', '0px')
      }
    },
    { visible: show, zIndex, detectable },
  )
  await page.waitForTimeout(700)
}

async function clearanceGap(page, sel, consentSel = '#ff-consent-fixture, [data-consent-bar]') {
  return page.evaluate(
    ({ sel, consentSel }) => {
      const el = document.querySelector(sel)
      const bar = document.querySelector(consentSel)
      if (!el) return { gap: null, reason: 'missing-el' }
      const er = el.getBoundingClientRect()
      if (!bar) {
        const vh = window.innerHeight
        return {
          gap: Math.round(vh - er.bottom),
          elBottom: Math.round(er.bottom),
          barTop: null,
          dismissed: true,
        }
      }
      const br = bar.getBoundingClientRect()
      return {
        gap: Math.round(br.top - er.bottom),
        elBottom: Math.round(er.bottom),
        barTop: Math.round(br.top),
        dismissed: false,
        barHeight: Math.round(br.height),
      }
    },
    { sel, consentSel },
  )
}

async function gotoHash(page, path) {
  await page.goto(`${BASE}#${path}`, { waitUntil: 'networkidle', timeout: 90000 })
  await page.waitForTimeout(700)
}

async function scanCopy(page) {
  return page.evaluate(() => {
    const EM = /\u2014/
    const EN = /\u2013/
    const hits = []
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    let node
    while ((node = walker.nextNode())) {
      const t = node.textContent || ''
      if (!t.trim()) continue
      // Skip script/style
      const p = node.parentElement
      if (!p || /^(SCRIPT|STYLE|NOSCRIPT)$/i.test(p.tagName)) continue
      // Skip inputs that hold URLs
      if (/https?:\/\//.test(t)) continue
      // Year ranges like 2020–2026 are dates — leave
      const isYearRange = /\b(19|20)\d{2}\s*[\u2013\-]\s*(19|20)\d{2}\b/.test(t) && !EM.test(t)
      if (EN.test(t) && !isYearRange) {
        hits.push({ kind: 'en-dash', text: t.trim().slice(0, 120) })
      }
      if (EM.test(t)) {
        hits.push({ kind: 'em-dash', text: t.trim().slice(0, 120) })
      }
      // slash as or/per in short phrases
      const slashHit =
        /\b(mi|miles|¢|cents)\s*\/\s*(day|mi|mile)\b/i.test(t) ||
        /\bengines?\s*\/\s*body\b/i.test(t) ||
        /\$0\.31\s*\/\s*mi\b/i.test(t) ||
        /\bUsed\s*\/\s*New\b/.test(t) ||
        /\bEV\s*\/\s*work\b/i.test(t)
      if (slashHit) {
        hits.push({ kind: 'slash', text: t.trim().slice(0, 120) })
      }
    }
    return hits
  })
}

async function ensureFleetItem(page) {
  await page.evaluate(() => sessionStorage.clear())
  await gotoHash(page, '/package/pkg-trade-electrical')
  const newTab = page.getByRole('button', { name: /^New$/i }).first()
  if (await newTab.count()) await newTab.click()
  await page.waitForTimeout(400)
  const plus = page.locator('[data-photo-add="add"]').first()
  await plus.click()
  await page.waitForSelector('[data-fleet-plan-panel="1"]', { timeout: 5000 })
  await page.waitForTimeout(500)
}

const browser = await chromium.launch({ headless: true })
const consoleErrors = []
const report = { clearances: {}, copyScan: [], consoleErrors: [], copyChangesNote: 'see PR body' }

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text())
  })
  page.on('pageerror', (e) => consoleErrors.push(String(e)))

  // Intake fleet-size options (expand native select so options are visible)
  await gotoHash(page, '/intake')
  const fleetField = page.locator('.intake-field', { hasText: 'Fleet size' })
  await fleetField.scrollIntoViewIfNeeded()
  await page.evaluate(() => {
    const sel = [...document.querySelectorAll('select')].find((s) =>
      [...s.options].some((o) => /1 to 2|3 to 5|6 to 10/.test(o.textContent || '')),
    )
    if (sel) {
      sel.size = Math.min(sel.options.length, 8)
      sel.style.height = 'auto'
      sel.focus()
    }
  })
  await page.waitForTimeout(200)
  await fleetField.screenshot({
    path: join(OUT, 'intake-fleet-size-options.png'),
  })
  const fleetLabels = await page
    .locator('.intake-field', { hasText: 'Fleet size' })
    .locator('option')
    .allTextContents()
  assert(fleetLabels.some((l) => /1 to 2/.test(l)), `missing 1 to 2: ${fleetLabels}`)
  assert(fleetLabels.some((l) => /3 to 5/.test(l)), `missing 3 to 5: ${fleetLabels}`)
  assert(fleetLabels.some((l) => /6 to 10/.test(l)), `missing 6 to 10: ${fleetLabels}`)
  assert(!fleetLabels.some((l) => EN_DASH.test(l) || EM_DASH.test(l)), 'en/em dash in fleet labels')
  // collapse select again
  await page.evaluate(() => {
    const sel = [...document.querySelectorAll('select')].find((s) =>
      [...s.options].some((o) => /1 to 2/.test(o.textContent || '')),
    )
    if (sel) sel.size = 1
  })

  // Score sheet lines
  await gotoHash(page, '/package/pkg-trade-electrical')
  await page.locator('.score-dial.is-tappable, button.score-dial').first().click()
  await page.waitForSelector('.score-readout-sheet', { timeout: 5000 })
  await page.locator('.score-readout-panel').screenshot({
    path: join(OUT, 'score-sheet-lines.png'),
  })
  const sheet = await page.locator('.score-readout-panel').innerText()
  assert(!/mi\/day/.test(sheet), 'mi/day still present')
  assert(!/engines\/body/.test(sheet), 'engines/body still present')
  assert(!/¢\/mi|\$0\.31\/mi/.test(sheet), 'per-mile slash still present')
  await page.locator('.score-readout-close').click().catch(() => {})

  // --- Consent BEFORE (undetectable bar = zero clearance, z 9999 covers UI) ---
  await ensureFleetItem(page)
  await injectConsent(page, { show: true, zIndex: '9999', detectable: false })
  await page.waitForTimeout(400)
  await page.screenshot({ path: join(OUT, 'panel-foot-consent-before.png'), fullPage: false })
  const footBefore = await clearanceGap(page, '.fleet-plan-keep')
  report.clearances.panelFoot390ConsentBefore = footBefore
  assert(footBefore.gap != null && footBefore.gap < 8, `expected before overlap, got gap ${footBefore.gap}`)

  // Close via force-click Close — Keep adding is under the bar in the before state
  await page.locator('.fleet-plan-close').click({ force: true })
  await page.waitForSelector('[data-fleet-plan-reopen="1"]', { timeout: 5000 })
  await page.waitForTimeout(500)
  // Re-assert undetectable bar still present (zero clearance)
  await injectConsent(page, { show: true, zIndex: '9999', detectable: false })
  await page.waitForTimeout(400)
  await page.screenshot({ path: join(OUT, 'reopen-consent-before.png'), fullPage: false })
  const reopenBefore = await clearanceGap(page, '[data-fleet-plan-reopen="1"]')
  report.clearances.reopen390ConsentBefore = reopenBefore
  assert(
    reopenBefore.gap != null && reopenBefore.gap < 8,
    `expected reopen before overlap, got ${JSON.stringify(reopenBefore)}`,
  )

  // --- Consent AFTER (detectable bar → --consent-clearance applied) ---
  await injectConsent(page, { show: true, zIndex: '9999', detectable: true })
  await page.waitForTimeout(800)
  // Reopen lifts above bar; click it
  await page.locator('[data-fleet-plan-reopen="1"]').click({ force: true })
  await page.waitForSelector('[data-fleet-plan-panel="1"]', { timeout: 5000 })
  await page.waitForTimeout(800)
  await page.screenshot({ path: join(OUT, 'panel-foot-consent-after.png'), fullPage: false })
  const footAfter = await clearanceGap(page, '.fleet-plan-keep')
  report.clearances.panelFoot390ConsentAfter = footAfter
  assert(footAfter.gap != null && footAfter.gap >= 8, `panel foot gap ${footAfter.gap}`)

  await page.getByRole('button', { name: /Keep adding/i }).click({ force: true })
  await page.waitForTimeout(500)
  await page.screenshot({ path: join(OUT, 'reopen-consent-after.png'), fullPage: false })
  const reopenAfter = await clearanceGap(page, '[data-fleet-plan-reopen="1"]')
  report.clearances.reopen390ConsentAfter = reopenAfter
  assert(reopenAfter.gap != null && reopenAfter.gap >= 8, `reopen gap ${reopenAfter.gap}`)

  // --- Dismissed ---
  await injectConsent(page, { show: false })
  await page.waitForTimeout(400)
  await page.locator('[data-fleet-plan-reopen="1"]').click()
  await page.waitForSelector('[data-fleet-plan-panel="1"]', { timeout: 5000 })
  await page.waitForTimeout(300)
  await page.screenshot({ path: join(OUT, 'panel-consent-dismissed.png'), fullPage: false })
  const footDismissed = await clearanceGap(page, '.fleet-plan-keep')
  report.clearances.panelFoot390Dismissed = footDismissed
  assert(footDismissed.gap != null && footDismissed.gap >= 8, `panel foot dismissed ${footDismissed.gap}`)

  await page.getByRole('button', { name: /Keep adding/i }).click()
  await page.waitForTimeout(300)
  await page.screenshot({ path: join(OUT, 'reopen-consent-dismissed.png'), fullPage: false })
  const reopenDismissed = await clearanceGap(page, '[data-fleet-plan-reopen="1"]')
  report.clearances.reopen390Dismissed = reopenDismissed
  assert(reopenDismissed.gap != null && reopenDismissed.gap >= 8, `reopen dismissed ${reopenDismissed.gap}`)

  // 1440 with consent
  await page.setViewportSize({ width: 1440, height: 900 })
  await injectConsent(page, { show: true, zIndex: '9999', detectable: true })
  await page.evaluate(() => {
    document.querySelector('[data-fleet-plan-reopen="1"]')?.click()
  })
  await page.waitForTimeout(700)
  const foot1440 = await clearanceGap(page, '.fleet-plan-keep')
  report.clearances.panelFoot1440Consent = foot1440
  assert(foot1440.gap != null && foot1440.gap >= 8, `panel foot 1440 gap ${foot1440.gap}`)
  await page.getByRole('button', { name: /Keep adding/i }).click({ force: true })
  await page.waitForTimeout(300)
  const reopen1440 = await clearanceGap(page, '[data-fleet-plan-reopen="1"]')
  report.clearances.reopen1440Consent = reopen1440
  assert(reopen1440.gap != null && reopen1440.gap >= 8, `reopen 1440 gap ${reopen1440.gap}`)
  await injectConsent(page, { show: false })
  await page.waitForTimeout(300)
  const reopen1440Off = await clearanceGap(page, '[data-fleet-plan-reopen="1"]')
  report.clearances.reopen1440Dismissed = reopen1440Off
  assert(reopen1440Off.gap != null && reopen1440Off.gap >= 8, `reopen 1440 dismissed ${reopen1440Off.gap}`)
  await page.locator('[data-fleet-plan-reopen="1"]').click()
  await page.waitForTimeout(400)
  const foot1440Off = await clearanceGap(page, '.fleet-plan-keep')
  report.clearances.panelFoot1440Dismissed = foot1440Off
  assert(foot1440Off.gap != null && foot1440Off.gap >= 8, `panel foot 1440 dismissed ${foot1440Off.gap}`)
  // Close panel before copy/overflow scan
  await page.locator('.fleet-plan-close').click({ force: true }).catch(() => {})
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(300)

  // Overflow + banned + copy scan at 390 and 1440
  const copyHits = []
  for (const [w, h] of [
    [390, 844],
    [1440, 900],
  ]) {
    await page.setViewportSize({ width: w, height: h })
    for (const route of ['/', '/intake', '/package/pkg-trade-electrical']) {
      await gotoHash(page, route)
      // Ensure no leftover panel covers the page
      if (await page.locator('[data-fleet-plan-panel="1"]').count()) {
        await page.locator('.fleet-plan-close').click({ force: true }).catch(() => {})
        await page.waitForTimeout(200)
      }
      if (route.includes('package')) {
        const dial = page.locator('.score-dial.is-tappable, button.score-dial').first()
        if (await dial.count()) {
          await dial.click({ force: true })
          await page.waitForTimeout(400)
        }
      }
      const ov = await page.evaluate(() => ({
        ok: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
        sw: document.documentElement.scrollWidth,
        cw: document.documentElement.clientWidth,
      }))
      assert(ov.ok, `overflow ${w} ${route}`)
      const text = await page.locator('body').innerText()
      assert(!BANNED.test(text), `banned on ${route} @${w}`)
      const hits = await scanCopy(page)
      for (const hit of hits) {
        copyHits.push({ viewport: w, route, ...hit })
      }
      if (route.includes('package')) {
        await page.locator('.score-readout-close').click({ force: true }).catch(() => {})
        await page.waitForTimeout(200)
        const reopen = page.locator('[data-fleet-plan-reopen="1"]')
        if (await reopen.count()) {
          await reopen.click({ force: true })
          await page.waitForTimeout(400)
          const panelHits = await scanCopy(page)
          for (const hit of panelHits) {
            copyHits.push({ viewport: w, route: route + '#panel', ...hit })
          }
          await page.locator('.fleet-plan-close').click({ force: true }).catch(() => {})
          await page.waitForTimeout(200)
        }
      }
    }
  }

  // Filter known-allowed: year ranges already skipped in scanCopy
  report.copyScan = copyHits
  const bad = copyHits.filter((h) => h.kind === 'en-dash' || h.kind === 'em-dash' || h.kind === 'slash')
  const badUnique = [...new Map(bad.map((h) => [h.kind + '|' + h.text, h])).values()]
  report.copyScanUnique = badUnique
  // Write report even if copy issues remain so we can fix them
  writeFileSync(join(OUT, 'gate.json'), JSON.stringify(report, null, 2))
  assert(
    badUnique.length === 0,
    `copy issues still visible:\n${badUnique.map((h) => `${h.kind}: ${h.text}`).join('\n')}`,
  )

  report.consoleErrors = consoleErrors.filter(
    (e) => !/favicon|fonts\.googleapis|ResizeObserver/i.test(e),
  )
  assert(report.consoleErrors.length === 0, `console: ${report.consoleErrors}`)

  writeFileSync(join(OUT, 'gate.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
  console.log('STEVE POLISH GATES OK')
} finally {
  await browser.close()
}
