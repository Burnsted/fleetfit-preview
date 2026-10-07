/**
 * Publish gates for draft-tradein-score (Steve FAIL fixes).
 * Formspree mock BEFORE first page load. Report real request count (must be 0).
 */
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync, copyFileSync } from 'node:fs'
import { join } from 'node:path'

const BASE =
  process.env.GATE_BASE ||
  'http://127.0.0.1:4174/fleetfit-preview/draft-tradein-score/'
const OUT = process.env.GATE_OUT || '/opt/cursor/artifacts'
const QA_OUT = process.env.GATE_QA_OUT || null
mkdirSync(OUT, { recursive: true })
mkdirSync('/workspace/artifacts/tradein-score', { recursive: true })

const BANNED = /\bBest\b|\bWorst\b|\bWorth it\b|\bSOH\b|\bBattery health\b/i
const EM_DASH = /\u2014/
const EN_DASH = /\u2013/
const ARROW = /\u2192|\u27F6|->/
const LE_GE = /\u2264|\u2265/
const FORMSPREE = /formspree\.io/i

function saveShot(pagePath, name) {
  const dests = [
    join(OUT, `tradein-score-${name}.png`),
    join('/workspace/artifacts/tradein-score', `${name}.png`),
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
      if (
        el.closest(
          '.trade-in-score-reason, .score-v2-reason, .trade-in-score-formula-sources',
        )
      ) {
        continue
      }
      const st = getComputedStyle(el)
      if (st.display === 'none' || st.visibility === 'hidden' || st.opacity === '0') {
        continue
      }
      const r = el.getBoundingClientRect()
      if (r.width < 1 || r.height < 1) continue
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      if (dollarRe.test(t) || t.trim() === '$') {
        dollars.push({ text: t.trim().slice(0, 80), cx, cy })
      }
      if (/\bExample\b/i.test(t)) {
        examples.push({ text: t.trim().slice(0, 80), cx, cy })
      }
    }
    for (const input of root.querySelectorAll('input')) {
      const v = String(input.value || '')
      const isTradeVal = input.closest('.trade-in-entry-value-field')
      const isAssumption =
        input.closest('.trade-in-score-assumption') &&
        /gas|diesel|FL regular|FL diesel|Depreciation/i.test(
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
      if (best > 150) {
        misses.push({ dollar: d.text, nearestExamplePx: Math.round(best) })
      }
    }
    return {
      dollarCount: dollars.length,
      exampleCount: examples.length,
      misses,
      scope: sel || 'body',
    }
  }, rootSelector)
}

async function installConsentFixture(page, { visible = true, height = 72 } = {}) {
  await page.evaluate(
    ({ visible, height }) => {
      document.getElementById('ff-consent-fixture')?.remove()
      document.getElementById('ff-fab-fixture')?.remove()
      if (!visible) {
        document.documentElement.style.setProperty('--consent-clearance', '0px')
        return
      }
      const bar = document.createElement('div')
      bar.id = 'ff-consent-fixture'
      bar.setAttribute('data-consent-bar', '1')
      bar.style.cssText = `position:fixed;left:0;right:0;bottom:0;height:${height}px;z-index:90;background:#111;color:#fff;display:flex;align-items:center;justify-content:center;`
      bar.textContent = `Cookie consent (${height}px)`
      document.body.appendChild(bar)
      document.documentElement.style.setProperty(
        '--consent-clearance',
        `${height + 8}px`,
      )
      const fab = document.createElement('button')
      fab.id = 'ff-fab-fixture'
      fab.className = 'fbw-fab'
      fab.setAttribute('data-feedback-fab', '1')
      fab.style.cssText =
        'position:fixed;right:14px;bottom:90px;width:52px;height:52px;z-index:95;border:0;border-radius:50%;background:#0b1220;color:#fff;'
      fab.textContent = 'FB'
      document.body.appendChild(fab)
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
    await installConsentFixture(page, { visible: true, height: 72 })
    return page
  }

  for (const width of [390, 1440]) {
    const page = await openFresh(width)
    await page.waitForSelector('.trade-in-score-badge', { timeout: 10000 })
    const badgeCount = await page.locator('.trade-in-score-badge').count()
    assert.equal(badgeCount, 2, `expected 2 badges at ${width}`)

    const text = await collectVisibleText(page)
    assert.ok(!EM_DASH.test(text), `em dash at ${width}`)
    assert.ok(!EN_DASH.test(text), `en dash at ${width}`)
    assert.ok(!BANNED.test(text), `banned hype at ${width}`)

    const prox = await exampleNearDollars(page)
    console.log('EXAMPLE_PROX', width, JSON.stringify(prox, null, 2))
    assert.equal(prox.misses.length, 0, `Example not near $ at ${width}: ${JSON.stringify(prox.misses)}`)

    const scroll = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
    console.log('OVERFLOW', width, scroll)
    if (width === 390) {
      assert.equal(scroll.scrollWidth, 390, '390 scrollWidth must be 390')
    }

    await page.locator('.trade-in-entry').scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
    const rowsPath = join(OUT, `_tmp-rows-${width}.png`)
    await page.locator('.trade-in-entry').screenshot({ path: rowsPath })
    saveShot(rowsPath, `rows-${width}`)

    async function openSheetAt(badgeIndex) {
      await page.locator('.trade-in-score-badge').nth(badgeIndex).click()
      await page.waitForSelector('.trade-in-score-sheet', { timeout: 5000 })
      await page.waitForTimeout(500)
    }

    async function assertSheetNotesClean(label) {
      const noteList = await page.evaluate(() =>
        [...document.querySelectorAll('.trade-in-score-reason')].map(
          (el) => el.textContent || '',
        ),
      )
      const notes = noteList.join('\n')
      assert.ok(!EM_DASH.test(notes), `em dash in notes ${label}`)
      assert.ok(!EN_DASH.test(notes), `en dash in notes ${label}`)
      assert.ok(!ARROW.test(notes), `arrow in notes ${label}`)
      assert.ok(!LE_GE.test(notes), `≤/≥ in notes ${label}`)
      assert.ok(!/\(OSRM\)/i.test(notes), `OSRM in notes ${label}`)
      assert.ok(!/\bratio\s+[\d.]+/i.test(notes), `ratio in notes ${label}`)
      assert.ok(
        !/cars\.com|Car and Driver|Edmunds|EV Pulse|Fuelly|OEM estimate|not EPA|brochure|NHTSA/i.test(
          notes,
        ),
        `source tag in visible notes ${label}: ${notes.slice(0, 240)}`,
      )
      assert.ok(
        !/\s\/\s|\bCar and Driver\s*\/\s*Edmunds\b/.test(notes),
        `slash in visible notes ${label}`,
      )
      for (const note of noteList) {
        assert.ok(
          !/\(:/.test(note) &&
            !/\( /.test(note) &&
            !/ \)/.test(note) &&
            !/\(\)/.test(note) &&
            !/^[;,:]/.test(note.trim()) &&
            !/[;,:]$/.test(note.trim()),
          `broken punctuation in visible note ${label}: ${JSON.stringify(note)}`,
        )
      }
    }

    await openSheetAt(0)

    // FAB must be hidden while sheet open
    const fabState = await page.evaluate(() => {
      const fabs = [
        ...document.querySelectorAll(
          '.fbw-fab, [data-feedback-fab], .feedback-fab',
        ),
      ]
      return fabs.map((el) => ({
        hidden: el.hasAttribute('data-trade-in-score-hidden'),
        display: getComputedStyle(el).display,
      }))
    })
    assert.ok(
      fabState.every((f) => f.hidden || f.display === 'none'),
      `FAB must hide while sheet open at ${width}: ${JSON.stringify(fabState)}`,
    )

    // Readable factors + body-type pairing (Transit vs E-Transit, not Sierra seats)
    const sheetText = await page.locator('.trade-in-score-panel').innerText()
    assert.match(sheetText, /Duty fit/)
    assert.match(sheetText, /Fuel or energy cost|Age and miles|Not scored for this trade/)
    assert.match(sheetText, /Cost of ownership per year, Example/)
    assert.match(sheetText, /E-Transit|Transit/)
    assert.ok(!/5 seats/.test(sheetText), `Transit sheet must not show 5-seat Sierra cab at ${width}`)
    assert.ok(!EM_DASH.test(sheetText))
    assert.ok(!EN_DASH.test(sheetText))
    assert.ok(!BANNED.test(sheetText))
    await assertSheetNotesClean(`sheet1-${width}`)

    const ownershipProx = await exampleNearDollars(
      page,
      '.trade-in-score-ownership',
    )
    console.log('OWNERSHIP_PROX', width, JSON.stringify(ownershipProx, null, 2))
    assert.equal(
      ownershipProx.misses.length,
      0,
      `ownership Example not near $ at ${width}: ${JSON.stringify(ownershipProx.misses)}`,
    )

    const sheetPath = join(OUT, `_tmp-sheet-${width}.png`)
    await page.locator('.trade-in-score-panel').screenshot({ path: sheetPath })
    saveShot(sheetPath, `sheet-${width}`)

    // Scroll to bottom of open sheet; confirm clear of consent (FAB hidden)
    await page.evaluate(() => {
      const panel = document.querySelector('.trade-in-score-panel')
      if (panel) panel.scrollTop = panel.scrollHeight
    })
    await page.waitForTimeout(400)
    const clearShown = await sheetClearance(page)
    console.log('SHEET_CLEARANCE_CONSENT_SHOWN', width, clearShown)
    assert.ok(clearShown.fabHidden, `FAB hidden at sheet bottom ${width}`)
    assert.ok(
      clearShown.gapConsent == null || clearShown.gapConsent >= 8,
      `content under consent at ${width}: gap=${clearShown.gapConsent}`,
    )
    assert.ok(clearShown.closeVisible, `Close usable at ${width}`)

    if (width === 390) {
      const bottomPath = join(OUT, `_tmp-sheet-bottom-390.png`)
      await page.locator('.trade-in-score-panel').screenshot({ path: bottomPath })
      saveShot(bottomPath, 'sheet-bottom-390')
    }

    // Consent dismissed: pad still clears (no bar)
    await installConsentFixture(page, { visible: false })
    await page.waitForTimeout(300)
    await page.evaluate(() => {
      const panel = document.querySelector('.trade-in-score-panel')
      if (panel) panel.scrollTop = panel.scrollHeight
    })
    await page.waitForTimeout(300)
    const clearDismissed = await sheetClearance(page)
    console.log('SHEET_CLEARANCE_CONSENT_DISMISSED', width, clearDismissed)
    assert.ok(clearDismissed.fabHidden, `FAB still hidden after dismiss at ${width}`)
    assert.ok(clearDismissed.closeVisible, `Close usable after dismiss at ${width}`)

    // Restore consent for formula shots
    await installConsentFixture(page, { visible: true, height: 72 })
    await page.waitForTimeout(200)

    await page.locator('.trade-in-score-formula-toggle', { hasText: /Show formula$/ }).click()
    await page.waitForSelector('.trade-in-score-formula', { timeout: 3000 })
    await page.waitForTimeout(300)
    const formulaProx = await exampleNearDollars(page, '.trade-in-score-formula')
    console.log('FORMULA_PROX', width, JSON.stringify(formulaProx, null, 2))
    assert.equal(
      formulaProx.misses.length,
      0,
      `Example not near $ in formula at ${width}: ${JSON.stringify(formulaProx.misses)}`,
    )
    const formulaText = await page.locator('.trade-in-score-formula').innerText()
    assert.match(formulaText, /Depreciation per year/)
    assert.match(formulaText, /Example/)
    assert.match(formulaText, /Sources used in factor notes/)
    assert.ok(
      !/\bCar and Driver\s*\/\s*Edmunds\b/i.test(formulaText),
      `formula must not slash Car and Driver / Edmunds at ${width}`,
    )
    if (/Car and Driver/i.test(formulaText) && /Edmunds/i.test(formulaText)) {
      assert.match(formulaText, /Car and Driver and Edmunds/i)
    }
    // E-Transit pair: 2 seats in formula sources, not cars.com 1
    assert.match(formulaText, /2 seats/)
    assert.ok(!/1 seat \(cars\.com\)/i.test(formulaText))

    if (width === 390) {
      const formulaPath = join(OUT, `_tmp-formula-390.png`)
      await page.locator('.trade-in-score-panel').screenshot({ path: formulaPath })
      saveShot(formulaPath, 'formula-390')
    }

    await page.locator('.trade-in-score-close').click()
    await page.waitForTimeout(300)
    assert.equal(await page.locator('.trade-in-score-sheet').count(), 0)

    // Second trade row sheet (Silverado vs Sierra) at 390
    if (width === 390) {
      await openSheetAt(1)
      const sheet2Text = await page.locator('.trade-in-score-panel').innerText()
      assert.match(sheet2Text, /Sierra|Silverado/)
      assert.ok(!EM_DASH.test(sheet2Text) && !EN_DASH.test(sheet2Text))
      await assertSheetNotesClean('sheet2-390')
      const sheet2Path = join(OUT, `_tmp-sheet2-390.png`)
      await page.locator('.trade-in-score-panel').screenshot({ path: sheet2Path })
      saveShot(sheet2Path, 'sheet2-390')
      await page.evaluate(() => {
        const panel = document.querySelector('.trade-in-score-panel')
        if (panel) panel.scrollTop = panel.scrollHeight
      })
      await page.waitForTimeout(300)
      const sheet2Bottom = join(OUT, `_tmp-sheet2-bottom-390.png`)
      await page.locator('.trade-in-score-panel').screenshot({ path: sheet2Bottom })
      saveShot(sheet2Bottom, 'sheet2-bottom-390')
      await page.locator('.trade-in-score-close').click()
      await page.waitForTimeout(300)
    }

    // FAB restored
    const fabBack = await page.evaluate(() => {
      const fab = document.querySelector('.fbw-fab, [data-feedback-fab]')
      if (!fab) return { ok: true, note: 'no fab' }
      return {
        ok:
          !fab.hasAttribute('data-trade-in-score-hidden') &&
          getComputedStyle(fab).display !== 'none',
      }
    })
    assert.ok(fabBack.ok, `FAB must restore on close at ${width}`)

    results.widths[width] = {
      badgeCount,
      prox,
      scroll,
      ownershipProx,
      clearShown,
      clearDismissed,
      formulaProx,
    }
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
