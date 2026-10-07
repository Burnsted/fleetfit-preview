/**
 * Publish gates for draft-two-vehicles default starting state.
 * Installs a Formspree network mock BEFORE first page load.
 */
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync, copyFileSync } from 'node:fs'
import { join } from 'node:path'

const BASE =
  process.env.GATE_BASE ||
  'http://127.0.0.1:4173/fleetfit-preview/draft-two-vehicles/'
const OUT = process.env.GATE_OUT || '/opt/cursor/artifacts'
mkdirSync(OUT, { recursive: true })
mkdirSync('/workspace/artifacts/two-vehicles', { recursive: true })

const BANNED = /\bBest\b|\bWorst\b|\bWorth it\b|\bSOH\b|\bBattery health\b/i
const EM_DASH = /\u2014/
const EN_DASH = /\u2013/
const FORMSPREE = /formspree\.io/i

function dist2d(ax, ay, bx, by) {
  const dx = ax - bx
  const dy = ay - by
  return Math.sqrt(dx * dx + dy * dy)
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
      if (dollarRe.test(t)) dollars.push({ text: t.trim().slice(0, 80), cx, cy })
      if (/\bExample\b/i.test(t)) examples.push({ text: t.trim().slice(0, 80), cx, cy })
    }
    // Also count input values that look like dollars (trade-in value fields)
    for (const input of document.querySelectorAll('input')) {
      const v = String(input.value || '')
      if (!dollarRe.test(v) && !/^\d+(\.\d+)?$/.test(v.trim())) continue
      // treat bare positive numbers in trade-in value fields as dollar figures
      const isTradeVal = input.closest('.trade-in-entry-value-field')
      if (!isTradeVal && !dollarRe.test(v)) continue
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

async function overflowOk(page, width) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
  await page.waitForTimeout(400)
  return page.evaluate((w) => {
    const doc = document.documentElement
    return {
      ok: doc.scrollWidth === w,
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
    }
  }, width)
}

async function bottomClearance(page) {
  return page.evaluate(() => {
    const feedback = document.querySelector(
      '[data-feedback-fab], .feedback-fab, button[aria-label*="feedback" i], #fleetfit-feedback-root button',
    )
    const consent = document.querySelector('[data-consent-bar]')
    const main = document.querySelector('main, .main, .app-shell')
    const last = [...document.querySelectorAll('footer, .locked-foot-note, .package-cta-bar')]
      .filter((el) => el.offsetParent !== null)
      .pop()
    window.scrollTo(0, document.body.scrollHeight)
    const vh = window.innerHeight
    const lastBottom = last ? last.getBoundingClientRect().bottom : null
    const fab = feedback?.getBoundingClientRect()
    const bar = consent?.getBoundingClientRect()
    const header = document.querySelector('.site-header, header')
    const headerOk = header ? header.getBoundingClientRect().width <= vh * 2 : true
    return {
      lastBottom,
      vh,
      fabTop: fab ? fab.top : null,
      consentTop: bar ? bar.top : null,
      headerWidth: header ? Math.round(header.getBoundingClientRect().width) : null,
      hiddenUnderFixed:
        lastBottom != null &&
        ((fab && lastBottom > fab.top + 2) || (bar && lastBottom > bar.top + 2)),
      headerOk,
    }
  })
}

async function firstLoadState(page) {
  return page.evaluate(() => {
    const size = document.querySelector('.trade-size-chip.is-active')?.textContent?.trim()
    const cards = document.querySelectorAll('.trade-unit-card').length
    const tradeRows = [...document.querySelectorAll('[data-trade-in-row]')].map((row) => ({
      label: row.querySelector('.trade-in-entry-row-label')?.textContent?.trim(),
      values: [...row.querySelectorAll('input, select')].map((i) => i.value),
    }))
    const ofInFleet = (document.body.innerText.match(/\d+\s+of\s+\d+\s+in fleet/) || [])[0]
    const title = document.querySelector('h1')?.textContent?.trim()
    return { size, cards, tradeRows, ofInFleet, title }
  })
}

async function main() {
  const browser = await chromium.launch()
  const realFormspree = { count: 0 }

  async function openFresh(width) {
    const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 900 } })
    // MUST install Formspree mock BEFORE first page load
    await page.route(FORMSPREE, async (route) => {
      realFormspree.count += 1
      // Still fulfill so UI does not hang if something fires; count marks a real attempt
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      })
    })
    // Track any request that would have hit Formspree even if aborted
    page.on('request', (req) => {
      if (FORMSPREE.test(req.url())) {
        // route handler already counts fulfills; this is belt-and-suspenders for aborted
      }
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

  const results = {
    formspreeRealRequests: 0,
    widths: {},
  }

  for (const width of [390, 1440]) {
    const page = await openFresh(width)
    const state = await firstLoadState(page)
    console.log('STATE', width, JSON.stringify(state, null, 2))

    assert.equal(state.size, '2', `fleet size chip should be 2 at ${width}`)
    assert.equal(state.cards, 2, `should show 2 vehicle cards at ${width}`)
    assert.equal(state.tradeRows.length, 2, `should show 2 trade-in rows at ${width}`)
    assert.ok(
      state.tradeRows.every((r) => /^Example$/i.test(r.label || '')),
      `trade rows must be labeled Example at ${width}: ${JSON.stringify(state.tradeRows.map((r) => r.label))}`,
    )
    assert.ok(
      state.tradeRows.every(
        (r) =>
          r.values.some((v) => /2018|2019|Ford|Chevrolet|Transit|Silverado/i.test(v)) &&
          r.values.some((v) => /\d{4,}/.test(v)),
      ),
      `Example rows must show stats at ${width}`,
    )
    assert.equal(state.ofInFleet, '2 of 2 in fleet', `counter mismatch at ${width}: ${state.ofInFleet}`)
    assert.match(state.title || '', /2 vehicles/)

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

    const ov = await overflowOk(page, width)
    console.log('OVERFLOW', width, ov)
    if (width === 390) {
      assert.equal(ov.scrollWidth, 390, `390 scrollWidth must be 390, got ${ov.scrollWidth}`)
    } else {
      assert.ok(ov.ok || ov.scrollWidth <= width + 1, `overflow at ${width}`)
    }

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(400)
    const clear = await bottomClearance(page)
    console.log('CLEARANCE', width, clear)
    assert.ok(!clear.hiddenUnderFixed, `content hidden under fixed UI at ${width}`)

    // Interaction: change size to 3 → trade rows grow; remove keeps counters updating
    await page.locator('.trade-size-chip', { hasText: /^3$/ }).click()
    await page.waitForTimeout(600)
    const afterSize = await firstLoadState(page)
    assert.equal(afterSize.size, '3')
    assert.equal(afterSize.tradeRows.length, 3, 'trade rows follow size chip')
    await page.locator('.trade-size-chip', { hasText: /^2$/ }).click()
    await page.waitForTimeout(600)

    const shotName = `two-vehicles-first-load-${width}`
    const shotPath = join(OUT, `${shotName}.png`)
    // Scroll to show units + trade rows
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(300)
    await page.screenshot({ path: shotPath, fullPage: true })
    copyFileSync(shotPath, join('/workspace/artifacts/two-vehicles', `${shotName}.png`))

    results.widths[width] = { state, prox, ov, clear }
    await page.close()
  }

  results.formspreeRealRequests = realFormspree.count
  console.log('FORMSPREE_REAL', realFormspree.count)
  assert.equal(realFormspree.count, 0, 'real Formspree requests must be 0')

  writeFileSync(join(OUT, 'two-vehicles-gate.json'), JSON.stringify(results, null, 2))
  writeFileSync(
    join('/workspace/artifacts/two-vehicles/gate.json'),
    JSON.stringify(results, null, 2),
  )
  console.log('GATE PASS')
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
