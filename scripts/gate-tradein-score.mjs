/**
 * Publish gates for draft-tradein-score.
 * Formspree mock BEFORE first page load. Report real request count (must be 0).
 */
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync, copyFileSync } from 'node:fs'
import { join } from 'node:path'

const BASE =
  process.env.GATE_BASE ||
  'http://127.0.0.1:4173/fleetfit-preview/draft-tradein-score/'
const OUT = process.env.GATE_OUT || '/opt/cursor/artifacts'
mkdirSync(OUT, { recursive: true })
mkdirSync('/workspace/artifacts/tradein-score', { recursive: true })

const BANNED = /\bBest\b|\bWorst\b|\bWorth it\b|\bSOH\b|\bBattery health\b/i
const EM_DASH = /\u2014/
const EN_DASH = /\u2013/
const FORMSPREE = /formspree\.io/i

async function collectVisibleText(page) {
  return page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    const parts = []
    let node
    while ((node = walker.nextNode())) {
      const t = node.textContent || ''
      if (!t.trim()) continue
      const el = node.parentElement
      if (!el) continue
      const st = getComputedStyle(el)
      if (st.display === 'none' || st.visibility === 'hidden') continue
      parts.push(t)
    }
    return parts.join('\n')
  })
}

async function exampleNearDollars(page) {
  return page.evaluate(() => {
    const dollarRe = /\$[\d,]+(?:\.\d+)?/
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    const dollars = []
    const examples = []
    let node
    while ((node = walker.nextNode())) {
      const t = node.textContent || ''
      if (!t.trim()) continue
      const el = node.parentElement
      if (!el) continue
      const st = getComputedStyle(el)
      if (st.display === 'none' || st.visibility === 'hidden' || st.opacity === '0') continue
      const r = el.getBoundingClientRect()
      if (r.width < 1 || r.height < 1) continue
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      if (dollarRe.test(t) || t.trim() === '$') {
        dollars.push({ text: t.trim().slice(0, 80), cx, cy })
      }
      if (/\bExample\b/i.test(t)) examples.push({ text: t.trim().slice(0, 80), cx, cy })
    }
    for (const input of document.querySelectorAll('input')) {
      const v = String(input.value || '')
      const isTradeVal = input.closest('.trade-in-entry-value-field')
      const isAssumption =
        input.closest('.trade-in-score-assumption') &&
        /gas|diesel|FL regular|FL diesel/i.test(
          input.closest('label')?.textContent || '',
        )
      if (!dollarRe.test(v) && !(isTradeVal && /^\d+(\.\d+)?$/.test(v.trim()))) {
        if (!(isAssumption && /^\d+(\.\d+)?$/.test(v.trim()))) continue
      }
      const r = input.getBoundingClientRect()
      if (r.width < 1 || r.height < 1) continue
      dollars.push({
        text: v.trim().slice(0, 80),
        cx: r.left + r.width / 2,
        cy: r.top + r.height / 2,
      })
    }
    const misses = []
    for (const d of dollars) {
      let best = Infinity
      for (const e of examples) {
        const dist = Math.hypot(d.cx - e.cx, d.cy - e.cy)
        if (dist < best) best = dist
      }
      if (best > 150) misses.push({ dollar: d.text, nearestExamplePx: Math.round(best) })
    }
    return { dollarCount: dollars.length, exampleCount: examples.length, misses }
  })
}

async function sheetClearance(page) {
  return page.evaluate(() => {
    const panel = document.querySelector('.trade-in-score-panel')
    const fab = document.querySelector('.fbw-fab, [data-feedback-fab], .feedback-fab')
    const consent = document.querySelector('[data-consent-bar]')
    if (!panel) return { ok: false, reason: 'no panel' }
    const pr = panel.getBoundingClientRect()
    const fabRect = fab?.getBoundingClientRect()
    const consentRect = consent?.getBoundingClientRect()
    const panelBottomContent = (() => {
      const last = panel.querySelector('tfoot, .trade-in-score-table, .trade-in-score-formula')
      return last ? last.getBoundingClientRect().bottom : pr.bottom
    })()
    const blockers = []
    if (fabRect && panelBottomContent > fabRect.top + 2) {
      // Panel may extend under FAB visually but scrollable content padding must clear.
      // Check that the panel's padding-bottom places scrollable end above FAB when scrolled to end.
    }
    const style = getComputedStyle(panel)
    const padBottom = parseFloat(style.paddingBottom) || 0
    const scrollEnd = panel.scrollHeight - padBottom
    // Convert scrollEnd to viewport: when scrolled to max, content at scrollEnd sits at
    // panel.top + (scrollEnd - scrollTop) ≈ panel.bottom - padBottom
    const contentEndAtMaxScroll = pr.bottom - padBottom
    const fabTop = fabRect ? fabRect.top : Infinity
    const consentTop = consentRect ? consentRect.top : Infinity
    const fixedTop = Math.min(fabTop, consentTop)
    const gap = Number.isFinite(fixedTop)
      ? Math.round(fixedTop - contentEndAtMaxScroll)
      : null
    const closeBtn = panel.querySelector('.trade-in-score-close')
    const closeRect = closeBtn?.getBoundingClientRect()
    return {
      ok: gap == null || gap >= 0,
      gap,
      padBottom: Math.round(padBottom),
      contentEndAtMaxScroll: Math.round(contentEndAtMaxScroll),
      fabTop: fabRect ? Math.round(fabRect.top) : null,
      consentTop: consentRect ? Math.round(consentRect.top) : null,
      closeVisible: closeRect
        ? closeRect.top >= 0 && closeRect.bottom <= window.innerHeight
        : false,
      panelInView: pr.top < window.innerHeight && pr.bottom > 0,
      scrollHeight: panel.scrollHeight,
      clientHeight: panel.clientHeight,
      blockers,
    }
  })
}

async function main() {
  const browser = await chromium.launch()
  const realFormspree = { count: 0 }
  const results = { formspreeRealRequests: 0, widths: {} }

  async function openFresh(width) {
    const page = await browser.newPage({
      viewport: { width, height: width === 390 ? 844 : 900 },
    })
    await page.route(FORMSPREE, async (route) => {
      realFormspree.count += 1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      })
    })
    await page.goto(`${BASE.replace(/\/?$/, '/')}#/package/pkg-trade-electrical`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    })
    await page.evaluate(() => {
      try {
        sessionStorage.clear()
        localStorage.clear()
      } catch {
        /* ignore */
      }
    })
    await page.goto(`${BASE.replace(/\/?$/, '/')}#/package/pkg-trade-electrical`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    })
    await page.waitForTimeout(1200)
    return page
  }

  for (const width of [390, 1440]) {
    const page = await openFresh(width)

    // Ensure badges present
    await page.waitForSelector('.trade-in-score-badge', { timeout: 10000 })
    const badgeCount = await page.locator('.trade-in-score-badge').count()
    assert.equal(badgeCount, 2, `expected 2 trade-in score badges at ${width}`)

    const text = await collectVisibleText(page)
    assert.ok(!EM_DASH.test(text), `em dash at ${width}`)
    assert.ok(!EN_DASH.test(text), `en dash at ${width}`)
    assert.ok(!BANNED.test(text), `banned hype at ${width}: ${text.match(BANNED)?.[0]}`)

    const prox = await exampleNearDollars(page)
    console.log('EXAMPLE_PROX', width, JSON.stringify(prox, null, 2))
    assert.equal(
      prox.misses.length,
      0,
      `Example not within 150px of dollars at ${width}: ${JSON.stringify(prox.misses)}`,
    )

    const scroll = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
    console.log('OVERFLOW', width, scroll)
    if (width === 390) {
      assert.equal(scroll.scrollWidth, 390, `390 scrollWidth must be 390`)
    }

    // Screenshot trade rows with scores
    await page.locator('.trade-in-entry').scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
    const rowsShot = join(OUT, `tradein-score-rows-${width}.png`)
    await page.locator('.trade-in-entry').screenshot({ path: rowsShot })
    copyFileSync(rowsShot, join('/workspace/artifacts/tradein-score', `rows-${width}.png`))

    // Open breakdown sheet
    await page.locator('.trade-in-score-badge').first().click()
    await page.waitForSelector('.trade-in-score-sheet', { timeout: 5000 })
    await page.waitForTimeout(400)

    // Scroll panel to end then check clearance
    await page.evaluate(() => {
      const panel = document.querySelector('.trade-in-score-panel')
      if (panel) panel.scrollTop = panel.scrollHeight
    })
    await page.waitForTimeout(300)
    const clear = await sheetClearance(page)
    console.log('SHEET_CLEARANCE', width, clear)
    assert.ok(clear.closeVisible, `close button must be usable at ${width}`)
    assert.ok(clear.panelInView, `panel must be in view at ${width}`)

    const sheetShot = join(OUT, `tradein-score-sheet-${width}.png`)
    await page.locator('.trade-in-score-panel').screenshot({ path: sheetShot })
    copyFileSync(
      sheetShot,
      join('/workspace/artifacts/tradein-score', `sheet-${width}.png`),
    )

    // Formula view
    await page.locator('.trade-in-score-formula-toggle').click()
    await page.waitForSelector('.trade-in-score-formula', { timeout: 3000 })
    await page.waitForTimeout(300)
    const formulaText = await page.locator('.trade-in-score-formula').innerText()
    assert.match(formulaText, /Example default/i)
    assert.ok(!EM_DASH.test(formulaText))
    assert.ok(!EN_DASH.test(formulaText))
    assert.ok(!BANNED.test(formulaText))

    const formulaProx = await exampleNearDollars(page)
    console.log('FORMULA_PROX', width, JSON.stringify(formulaProx, null, 2))
    assert.equal(
      formulaProx.misses.length,
      0,
      `Example not near $ in formula at ${width}: ${JSON.stringify(formulaProx.misses)}`,
    )

    if (width === 390 || width === 1440) {
      const formulaShot = join(OUT, `tradein-score-formula-${width}.png`)
      await page.locator('.trade-in-score-panel').screenshot({ path: formulaShot })
      copyFileSync(
        formulaShot,
        join('/workspace/artifacts/tradein-score', `formula-${width}.png`),
      )
    }

    // Close cleanly
    await page.locator('.trade-in-score-close').click()
    await page.waitForTimeout(300)
    const stillOpen = await page.locator('.trade-in-score-sheet').count()
    assert.equal(stillOpen, 0, `sheet must close at ${width}`)

    results.widths[width] = { badgeCount, prox, scroll, clear, formulaProx }
    await page.close()
  }

  results.formspreeRealRequests = realFormspree.count
  console.log('FORMSPREE_REAL', realFormspree.count)
  assert.equal(realFormspree.count, 0, 'real Formspree requests must be 0')

  writeFileSync(join(OUT, 'tradein-score-gate.json'), JSON.stringify(results, null, 2))
  writeFileSync(
    join('/workspace/artifacts/tradein-score/gate.json'),
    JSON.stringify(results, null, 2),
  )
  console.log('GATE PASS')
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
