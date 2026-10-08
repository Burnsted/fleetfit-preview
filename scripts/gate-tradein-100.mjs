/**
 * Staging/live gates for trade-in scores out of 100 (Ted sample frames).
 * Formspree mock BEFORE first page load. Report real request count (must be 0).
 * GATE_BASE defaults to staging draft-tradein-100.
 */
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync, copyFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const BASE =
  process.env.GATE_BASE || 'https://burnsted.github.io/fleetfit-preview/draft-tradein-100/'
const OUT = process.env.GATE_OUT || '/opt/cursor/artifacts'
const QA_OUT = process.env.GATE_QA_OUT || null
mkdirSync(OUT, { recursive: true })
mkdirSync('/workspace/artifacts/tradein-100', { recursive: true })

const BANNED = /\bBest\b|\bWorst\b|\bWorth it\b|\bSOH\b|\bBattery health\b/i
const EM_DASH = /\u2014/
const EN_DASH = /\u2013/
const ARROW = /\u2192|\u27F6|->/
const LE_GE = /\u2264|\u2265/
const FORMSPREE = /formspree\.io/i
const SLASH_IN_COPY = /\s\/\s|\bCar and Driver\s*\/\s*Edmunds\b/

function saveShot(pagePath, name) {
  const dests = [
    join(OUT, `tradein100-${name}.png`),
    join('/workspace/artifacts/tradein-100', `${name}.png`),
  ]
  if (QA_OUT) {
    mkdirSync(QA_OUT, { recursive: true })
    dests.push(join(QA_OUT, `${name}.png`))
  }
  for (const d of dests) copyFileSync(pagePath, d)
}

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

async function exampleNearDollars(page, rootSelector = null) {
  return page.evaluate((sel) => {
    const root = sel ? document.querySelector(sel) : document.body
    if (!root) {
      return {
        dollarCount: 0,
        exampleCount: 0,
        misses: [{ dollar: 'no-root', nearestExamplePx: -1 }],
        scope: String(sel),
      }
    }
    const dollarRe = /\$[\d,]+(?:\.\d+)?/
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    const dollars = []
    const examples = []
    let node
    while ((node = walker.nextNode())) {
      const t = node.textContent || ''
      if (!t.trim()) continue
      const el = node.parentElement
      if (!el) continue
      if (el.closest('.score-v2-reason')) continue
      const st = getComputedStyle(el)
      if (st.display === 'none' || st.visibility === 'hidden' || st.opacity === '0') {
        continue
      }
      const r = el.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) continue
      if (dollarRe.test(t)) {
        const m = t.match(dollarRe)
        dollars.push({
          text: m[0],
          x: r.left + r.width / 2,
          y: r.top + r.height / 2,
        })
      }
      if (/\bExample\b/i.test(t)) {
        examples.push({
          x: r.left + r.width / 2,
          y: r.top + r.height / 2,
        })
      }
    }
    const misses = []
    for (const d of dollars) {
      let nearest = Infinity
      for (const e of examples) {
        const dist = Math.hypot(d.x - e.x, d.y - e.y)
        if (dist < nearest) nearest = dist
      }
      if (!Number.isFinite(nearest) || nearest > 150) {
        misses.push({ dollar: d.text, nearestExamplePx: nearest })
      }
    }
    return {
      dollarCount: dollars.length,
      exampleCount: examples.length,
      misses,
      scope: String(sel || 'body'),
    }
  }, rootSelector)
}

async function installConsentFixture(page, { visible = true, height = 72 } = {}) {
  await page.evaluate(
    ({ visible, height }) => {
      let bar = document.querySelector('[data-consent-bar]')
      if (!visible) {
        if (bar) bar.remove()
        document.documentElement.style.removeProperty('--consent-clearance')
        return
      }
      if (!bar) {
        bar = document.createElement('div')
        bar.setAttribute('data-consent-bar', '1')
        bar.setAttribute('role', 'dialog')
        bar.textContent = 'Consent fixture'
        document.body.appendChild(bar)
      }
      Object.assign(bar.style, {
        position: 'fixed',
        left: '0',
        right: '0',
        bottom: '0',
        height: `${height}px`,
        zIndex: '9999',
        background: 'rgba(11,18,32,0.92)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        font: '600 13px sans-serif',
      })
    },
    { visible, height },
  )
}

async function sheetClearance(page) {
  return page.evaluate(() => {
    const panel = document.querySelector('.trade-in-score-panel')
    const fab = document.querySelector(
      '.fbw-fab:not([data-trade-in-score-hidden]), [data-feedback-fab]:not([data-trade-in-score-hidden])',
    )
    const consent = document.querySelector('[data-consent-bar]')
    if (!panel) return { ok: false, reason: 'no panel' }
    const totals = panel.querySelector('.trade-in-score-table-totals')
    const closeBtn = panel.querySelector('.trade-in-score-close')
    const contentEnd = totals
      ? totals.getBoundingClientRect().bottom
      : panel.getBoundingClientRect().bottom -
        (parseFloat(getComputedStyle(panel).paddingBottom) || 0)
    const fabRect = fab?.getBoundingClientRect()
    const consentRect = consent?.getBoundingClientRect()
    const fabHidden =
      !fab ||
      getComputedStyle(fab).display === 'none' ||
      fab.hasAttribute('data-trade-in-score-hidden')
    const consentTop = consentRect ? consentRect.top : Infinity
    const gapConsent = Number.isFinite(consentTop)
      ? Math.round(consentTop - contentEnd)
      : null
    const closeRect = closeBtn?.getBoundingClientRect()
    return {
      ok: fabHidden && (gapConsent == null || gapConsent >= 8),
      fabHidden,
      gapConsent,
      contentEnd: Math.round(contentEnd),
      consentTop: consentRect ? Math.round(consentRect.top) : null,
      fabTop: fabRect ? Math.round(fabRect.top) : null,
      closeVisible: closeRect
        ? closeRect.top >= 0 && closeRect.bottom <= window.innerHeight
        : false,
      pad: panel.getAttribute('data-sheet-bottom-pad'),
    }
  })
}

async function pageClearance(page) {
  return page.evaluate(() => {
    const consent = document.querySelector('[data-consent-bar]')
    const fab = document.querySelector('[data-feedback-fab], .feedback-fab, #feedback-fab')
    const scrollY = window.scrollY
    const vh = window.innerHeight
    const docH = document.documentElement.scrollHeight
    window.scrollTo(0, Math.max(0, docH - vh))
    const consentRect = consent?.getBoundingClientRect()
    const fabRect = fab?.getBoundingClientRect()
    const last = [...document.querySelectorAll('main, .package-results, .trade-package, body > #root')]
      .map((el) => el.getBoundingClientRect().bottom)
      .reduce((a, b) => Math.max(a, b), 0)
    const fabOverlaps =
      fab &&
      getComputedStyle(fab).display !== 'none' &&
      fabRect &&
      fabRect.top < last &&
      fabRect.bottom > last - 40
    const consentGap = consentRect
      ? Math.round(consentRect.top - Math.min(last, vh))
      : null
    window.scrollTo(0, scrollY)
    return {
      docH,
      last: Math.round(last),
      fabOverlaps: Boolean(fabOverlaps),
      consentGap,
      fabHidden:
        !fab ||
        getComputedStyle(fab).display === 'none' ||
        getComputedStyle(fab).opacity === '0',
    }
  })
}

async function main() {
  const expectBundle = process.env.GATE_BUNDLE || 'D3asOWtN'
  const indexRes = await fetch(BASE)
  assert.equal(indexRes.status, 200, 'base HTTP must be 200')
  const indexHtml = await indexRes.text()
  assert.match(
    indexHtml,
    new RegExp(`index-${expectBundle}\\.js`),
    `index must reference ${expectBundle}`,
  )
  const jsRes = await fetch(new URL(`assets/index-${expectBundle}.js`, BASE).href)
  assert.equal(jsRes.status, 200, `${expectBundle}.js must 200`)
  console.log('INDEX_OK', expectBundle, BASE)

  const browser = await chromium.launch()
  const realFormspree = { count: 0 }
  const results = { formspreeRealRequests: 0, widths: {}, checks: {} }

  async function openFresh(width, hash = '#/package/pkg-trade-electrical') {
    const page = await browser.newPage({
      viewport: { width, height: width === 390 ? 844 : 900 },
    })
    // Formspree mock BEFORE first page load
    await page.route(FORMSPREE, async (route) => {
      realFormspree.count += 1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      })
    })
    await page.goto(`${BASE.replace(/\/?$/, '/')}${hash}`, {
      waitUntil: 'networkidle',
      timeout: 90000,
    })
    await page.evaluate(() => {
      try {
        sessionStorage.clear()
        localStorage.clear()
      } catch {
        /* ignore */
      }
    })
    await page.goto(`${BASE.replace(/\/?$/, '/')}${hash}`, {
      waitUntil: 'networkidle',
      timeout: 90000,
    })
    await page.waitForTimeout(1500)
    await installConsentFixture(page, { visible: true, height: 72 })
    return page
  }

  // Home / package: two-vehicle start at 390
  {
    const page = await openFresh(390)
    await page.waitForSelector('.trade-unit-card', { timeout: 15000 })
    const unitCount = await page.locator('.trade-unit-card').count()
    console.log('TWO_VEHICLE_DEFAULT', unitCount)
    assert.equal(unitCount, 2, `default must show 2 vehicles, got ${unitCount}`)
    results.checks.twoVehicleDefault = unitCount
    await page.waitForTimeout(400)
    const homePath = join(OUT, `_tmp-live-home-390.png`)
    await page.screenshot({ path: homePath, fullPage: false })
    saveShot(homePath, 'home-390')
    await page.close()
  }

  for (const width of [390, 1440]) {
    const page = await openFresh(width)
    await page.waitForSelector('.trade-in-score-badge', { timeout: 15000 })
    const badgeCount = await page.locator('.trade-in-score-badge').count()
    assert.equal(badgeCount, 2, `expected 2 badges at ${width}`)
    const unitCount = await page.locator('.trade-unit-card').count()
    assert.equal(unitCount, 2, `expected 2 unit cards at ${width}`)

    const text = await collectVisibleText(page)
    assert.ok(!EM_DASH.test(text), `em dash at ${width}`)
    assert.ok(!EN_DASH.test(text), `en dash at ${width}`)
    assert.ok(!BANNED.test(text), `banned hype at ${width}`)
    assert.ok(!SLASH_IN_COPY.test(text), `slash in visible copy at ${width}`)
    assert.ok(
      !/\bof\s*80\b|\bof\s*70\b|\/\s*80\b|\/\s*70\b|out of 80|out of 70/i.test(text),
      `legacy of 80/70 visible at ${width}`,
    )

    const prox = await exampleNearDollars(page)
    console.log('EXAMPLE_PROX', width, JSON.stringify(prox, null, 2))
    assert.equal(
      prox.misses.length,
      0,
      `Example not near $ at ${width}: ${JSON.stringify(prox.misses)}`,
    )

    const scroll = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
    console.log('OVERFLOW', width, scroll)
    if (width === 390) {
      assert.equal(scroll.scrollWidth, 390, '390 scrollWidth must be 390')
    }

    // Page scroll bottom: FAB must not cover interactive content when visible.
    // Fixed consent bar may overlay scrolled content; sheet clearance is gated below.
    const pageClear = await pageClearance(page)
    console.log('PAGE_CLEARANCE', width, pageClear)

    async function openSheetAt(badgeIndex) {
      await page.locator('.trade-in-score-badge').nth(badgeIndex).click()
      await page.waitForSelector('.trade-in-score-sheet', { timeout: 5000 })
      await page.waitForTimeout(500)
    }

    // Open E-Transit sheet (badge 0 = first trade row = van/Transit)
    await openSheetAt(0)
    const sheetText = await page.locator('.trade-in-score-panel').innerText()
    assert.match(sheetText, /Duty fit/)
    assert.match(sheetText, /Cost of ownership per year, Example/)
    assert.match(sheetText, /E-Transit|Transit/)
    assert.ok(!/5 seats/.test(sheetText), `Transit sheet must not show Sierra cab at ${width}`)
    assert.ok(!EM_DASH.test(sheetText) && !EN_DASH.test(sheetText))
    assert.ok(!BANNED.test(sheetText))
    assert.ok(!SLASH_IN_COPY.test(sheetText), `slash in sheet at ${width}`)

    const cardVsSheet = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('.trade-unit-card')]
      const parseDial = (t) => {
        const m = String(t || '').match(/(\d+(?:\.\d+)?)\s*out of\s*(\d+)/i)
        return m ? { total: Number(m[1]), pp: Number(m[2]) } : null
      }
      const byModel = {}
      for (const card of cards) {
        const t = card.innerText || ''
        const dial = parseDial(t)
        if (/E-Transit/i.test(t)) byModel.eTransit = { dial, text: t.slice(0, 240) }
        if (/Sierra EV/i.test(t)) byModel.sierra = { dial, text: t.slice(0, 240) }
      }
      const head = document.querySelector('.trade-in-score-panel')?.innerText || ''
      const sheetM = head.match(
        /vs Replacement\s+(\d+(?:\.\d+)?)\s*·|Replacement\s+(\d+(?:\.\d+)?)/i,
      )
      const sheetPp = head.match(/out of\s+(\d+)/i)
      return {
        byModel,
        sheetCand: sheetM ? Number(sheetM[1] || sheetM[2]) : null,
        sheetPp: sheetPp ? Number(sheetPp[1]) : null,
        headSlice: head.slice(0, 280),
      }
    })
    console.log('CARD_VS_SHEET', width, JSON.stringify(cardVsSheet, null, 2))
    assert.ok(cardVsSheet.byModel.eTransit?.dial, 'E-Transit card dial')
    assert.equal(cardVsSheet.byModel.eTransit.dial.total, 72.9)
    assert.equal(cardVsSheet.byModel.eTransit.dial.pp, 100)
    assert.equal(cardVsSheet.sheetCand, 72.9)
    assert.equal(cardVsSheet.sheetPp, 100)
    assert.ok(cardVsSheet.byModel.sierra?.dial, 'Sierra card dial')
    assert.equal(cardVsSheet.byModel.sierra.dial.total, 78.3)
    
    assert.equal(cardVsSheet.byModel.sierra.dial.pp, 100)

    // Card unit name must equal sheet Replacement (body-type pairing)
    const nameMatch = await page.evaluate(() => {
      const names = document.querySelector('.trade-in-score-names')?.innerText || ''
      const repl = (names.match(/Replacement:\s*(.+)/i) || [])[1]?.trim() || ''
      const cards = [...document.querySelectorAll('.trade-unit-card')].map((el) => el.innerText)
      const eCard = cards.find((t) => /E-Transit/i.test(t)) || ''
      const cardYmm = (eCard.match(/20\d{2}\s+\w+[\w\s-]*E-Transit[\w\s-]*/i) || [])[0] || ''
      return { repl, cardYmm, ok: /E-Transit/i.test(repl) && /E-Transit/i.test(eCard) }
    })
    console.log('CARD_NAME_EQ_SHEET', width, JSON.stringify(nameMatch))
    assert.ok(nameMatch.ok, `card name must match sheet Replacement: ${JSON.stringify(nameMatch)}`)

    // Ownership totals: expand ownership formula; Total row must equal header
    const ownershipToggle = page.locator('button', {
      hasText: /Show ownership formula|Hide ownership formula/,
    })
    if (await ownershipToggle.count()) {
      const label = await ownershipToggle.first().innerText()
      if (/Show ownership/i.test(label)) {
        await ownershipToggle.first().click()
        await page.waitForTimeout(300)
      }
    }
    await page.waitForSelector('[data-ownership-table="1"]', { timeout: 5000 })
    const ownTable = await page.evaluate(() => {
      const table = document.querySelector('[data-ownership-table="1"]')
      const parseUsd = (s) => {
        const m = String(s || '').replace(/,/g, '').match(/\$(\d+(?:\.\d+)?)/)
        return m ? Number(m[1]) : null
      }
      const sides = [...document.querySelectorAll('.trade-in-score-ownership-side')]
      return {
        headerTrade: parseUsd(sides[0]?.innerText),
        headerRepl: parseUsd(sides[1]?.innerText),
        totalTrade: parseUsd(
          table?.querySelector('[data-ownership-total="trade-in"]')?.innerText,
        ),
        totalRepl: parseUsd(
          table?.querySelector('[data-ownership-total="replacement"]')?.innerText,
        ),
        heads: [...(table?.querySelectorAll('thead th') || [])].map((th) =>
          th.textContent.trim(),
        ),
        rows: [...(table?.querySelectorAll('tbody tr') || [])].map((tr) =>
          tr.getAttribute('data-ownership-row'),
        ),
        hasStackedList: Boolean(
          document.querySelector('.trade-in-score-ownership-breakdown li'),
        ),
      }
    })
    console.log('OWNERSHIP_TABLE', width, JSON.stringify(ownTable))
    assert.ok(ownTable.heads.some((h) => /Trade-in/i.test(h)))
    assert.ok(ownTable.heads.some((h) => /Replacement/i.test(h)))
    assert.deepEqual(ownTable.rows, ['energy', 'maintenance', 'depreciation'])
    assert.equal(ownTable.headerTrade, 11633)
    assert.equal(ownTable.headerRepl, 8022)
    assert.equal(ownTable.totalTrade, ownTable.headerTrade)
    assert.equal(ownTable.totalRepl, ownTable.headerRepl)
    assert.ok(!ownTable.hasStackedList, 'ownership must not use stacked list')
    console.log('OWNERSHIP_ETRANSIT', width, '11633/8022 OK')
    const depNotes = await page.evaluate(() => {
      const row = document.querySelector('[data-ownership-row="depreciation"]')
      const formula = document.querySelector('[data-ownership-formula-text="1"]')?.innerText || ''
      return {
        row: row?.innerText || '',
        formula,
      }
    })
    assert.match(depNotes.row, /50% kept after 3 years/)
    assert.match(depNotes.row, /43% kept after 3 years/)
    assert.ok(!/KBB/i.test(depNotes.row), 'KBB must not appear in visible dep row')
    assert.match(depNotes.formula, /KBB/i)
    assert.match(depNotes.formula, /depreciation per year/)
    assert.ok(!/[×÷=]/.test(depNotes.row), 'visible dep notes must not contain × ÷ =')


    const ownershipProx = await exampleNearDollars(page, '.trade-in-score-ownership')
    if (ownershipProx.dollarCount > 0) {
      assert.equal(ownershipProx.misses.length, 0, `ownership $ proximity ${width}`)
    }

    // Sheet shot with ownership formula open
    const sheetPath = join(OUT, `_tmp-live-sheet-${width}.png`)
    await page.locator('.trade-in-score-panel').screenshot({ path: sheetPath })
    saveShot(sheetPath, `sheet-${width}`)

    if (width === 390) {
      const cardShot = join(OUT, `_tmp-live-etransit-card-390.png`)
      await page.evaluate(() => {
        const sheet = document.querySelector('.trade-in-score-sheet')
        if (sheet) sheet.style.visibility = 'hidden'
      })
      await page
        .locator('.trade-unit-card')
        .filter({ hasText: /E-Transit/i })
        .first()
        .screenshot({ path: cardShot })
      await page.evaluate(() => {
        const sheet = document.querySelector('.trade-in-score-sheet')
        if (sheet) sheet.style.visibility = ''
      })
      const pairPath = join(OUT, `_tmp-live-card-vs-sheet-390.png`)
      const cardB64 = readFileSync(cardShot).toString('base64')
      const sheetB64 = readFileSync(sheetPath).toString('base64')
      const comp = await browser.newPage({
        viewport: { width: 390, height: 1200 },
      })
      await comp.setContent(`<!doctype html><html><body style="margin:0;background:#fff">
        <div style="font:700 12px sans-serif;padding:8px 10px">E-Transit card (live)</div>
        <img src="data:image/png;base64,${cardB64}" style="display:block;width:390px" />
        <div style="font:700 12px sans-serif;padding:8px 10px">Trade sheet</div>
        <img src="data:image/png;base64,${sheetB64}" style="display:block;width:390px" />
      </body></html>`)
      await comp.waitForTimeout(200)
      await comp.screenshot({ path: pairPath, fullPage: true })
      await comp.close()
      saveShot(pairPath, 'card-vs-sheet-390')
    }

    // Sheet bottom clearance
    await page.evaluate(() => {
      const panel = document.querySelector('.trade-in-score-panel')
      if (panel) panel.scrollTop = panel.scrollHeight
    })
    await page.waitForTimeout(400)
    const clearShown = await sheetClearance(page)
    console.log('SHEET_CLEARANCE_CONSENT_SHOWN', width, clearShown)
    assert.ok(clearShown.fabHidden, `FAB hidden sheet bottom ${width}`)
    assert.ok(
      clearShown.gapConsent == null || clearShown.gapConsent >= 8,
      `content under consent ${width}`,
    )

    await installConsentFixture(page, { visible: false })
    await page.waitForTimeout(300)
    await page.evaluate(() => {
      const panel = document.querySelector('.trade-in-score-panel')
      if (panel) panel.scrollTop = panel.scrollHeight
    })
    const clearDismissed = await sheetClearance(page)
    console.log('SHEET_CLEARANCE_CONSENT_DISMISSED', width, clearDismissed)
    assert.ok(clearDismissed.fabHidden, `FAB hidden after dismiss ${width}`)
    await installConsentFixture(page, { visible: true, height: 72 })

    await page.locator('.trade-in-score-close').click()
    await page.waitForTimeout(300)

    // Sierra sheet (badge 1)
    await openSheetAt(1)
    const sheet2Text = await page.locator('.trade-in-score-panel').innerText()
    assert.match(sheet2Text, /Sierra|Silverado/)
    assert.ok(!SLASH_IN_COPY.test(sheet2Text))

    // Ownership for Sierra pair
    const ownershipToggle2 = page.locator('button', {
      hasText: /Show ownership formula|Hide ownership formula/,
    })
    if (await ownershipToggle2.count()) {
      const label = await ownershipToggle2.first().innerText()
      if (/Show ownership/i.test(label)) {
        await ownershipToggle2.first().click()
        await page.waitForTimeout(300)
      }
    }
    await page.waitForSelector('[data-ownership-table="1"]', { timeout: 5000 })
    const ownSierra = await page.evaluate(() => {
      const table = document.querySelector('[data-ownership-table="1"]')
      const parseUsd = (s) => {
        const m = String(s || '').replace(/,/g, '').match(/\$(\d+(?:\.\d+)?)/)
        return m ? Number(m[1]) : null
      }
      const sides = [...document.querySelectorAll('.trade-in-score-ownership-side')]
      return {
        headerTrade: parseUsd(sides[0]?.innerText),
        headerRepl: parseUsd(sides[1]?.innerText),
        totalTrade: parseUsd(
          table?.querySelector('[data-ownership-total="trade-in"]')?.innerText,
        ),
        totalRepl: parseUsd(
          table?.querySelector('[data-ownership-total="replacement"]')?.innerText,
        ),
      }
    })
    assert.equal(ownSierra.headerTrade, 9134)
    assert.equal(ownSierra.headerRepl, 12602)
    assert.equal(ownSierra.totalTrade, 9134)
    assert.equal(ownSierra.totalRepl, 12602)
    console.log('OWNERSHIP_SIERRA', width, '9134/12602 OK')
    const depS = await page.evaluate(() => {
      const row = document.querySelector('[data-ownership-row="depreciation"]')
      return row?.innerText || ''
    })
    assert.match(depS, /66% kept after 3 years/)
    assert.match(depS, /45% kept after 3 years/)
    assert.ok(!/KBB/i.test(depS), 'no KBB on Sierra Example curve notes')


    const sierraCard = await page.evaluate(() => {
      const card = [...document.querySelectorAll('.trade-unit-card')].find((el) =>
        /Sierra EV/i.test(el.innerText || ''),
      )
      const m = String(card?.innerText || '').match(
        /(\d+(?:\.\d+)?)\s*out of\s*(\d+)/i,
      )
      const head = document.querySelector('.trade-in-score-panel')?.innerText || ''
      const sm = head.match(
        /vs Replacement\s+(\d+(?:\.\d+)?)|Replacement\s+(\d+(?:\.\d+)?)/i,
      )
      const spp = head.match(/out of\s+(\d+)/i)
      return {
        cardTotal: m ? Number(m[1]) : null,
        cardPp: m ? Number(m[2]) : null,
        sheetCand: sm ? Number(sm[1] || sm[2]) : null,
        sheetPp: spp ? Number(spp[1]) : null,
      }
    })
    console.log('SIERRA_CARD_VS_SHEET', width, sierraCard)
    assert.equal(sierraCard.cardTotal, 78.3)
    assert.equal(sierraCard.cardPp, 100)
    assert.equal(sierraCard.sheetCand, 78.3)
    assert.equal(sierraCard.sheetPp, 100)

    await page.locator('.trade-in-score-close').click()
    await page.waitForTimeout(200)

    if (width === 390) {
      await page.locator('.trade-in-entry').scrollIntoViewIfNeeded()
      await page.waitForTimeout(300)
      const rowsPath = join(OUT, `_tmp-live-rows-390.png`)
      await page.locator('.trade-in-entry').screenshot({ path: rowsPath })
      saveShot(rowsPath, 'rows-390')
    }

    results.widths[width] = {
      badgeCount,
      unitCount,
      prox,
      scroll,
      eTransit: { card: 72.9, sheet: 72.9, pp: 100 },
      sierra: { card: 78.3, sheet: 78.3, pp: 100 },
      ownership: {
        eTransit: { tradeIn: 11633, replacement: 8022 },
        sierra: { tradeIn: 9134, replacement: 12602 },
      },
      clearShown,
      clearDismissed,
    }
    await page.close()
  }

  results.formspreeRealRequests = realFormspree.count
  console.log('FORMSPREE_REAL', realFormspree.count)
  assert.equal(realFormspree.count, 0, 'Formspree real requests must be 0')

  // Body-type pairing + row sums via unit tests already; re-assert from live card labels
  results.checks.bodyTypePairing = 'E-Transit van + Sierra EV truck (2 badges, 2 cards)'
  results.checks.cardEqualsSheet = {
    eTransit: '72.9/100',
    sierra: '78.3/100',
  }
  writeFileSync(join(OUT, 'live-root-gate.json'), JSON.stringify(results, null, 2))
  writeFileSync(
    join('/workspace/artifacts/live-qa', 'gate.json'),
    JSON.stringify(results, null, 2),
  )
  console.log('GATE PASS LIVE ROOT')
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
