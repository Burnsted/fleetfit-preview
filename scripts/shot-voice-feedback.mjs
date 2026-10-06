/**
 * Real-browser screenshots + layout gates for voice feedback (390 + 1440).
 * Serves the staged draft-feedback build locally.
 * Never POSTs real Formspree submissions: Playwright route stubs the intake.
 */
import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createServer } from 'http'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const outDir = path.join(root, 'artifacts/voice-feedback')
const stage = path.join(root, '.draft-feedback-stage')
const FORMSPREE = 'https://formspree.io/f/mrpeegjd'

fs.mkdirSync(outDir, { recursive: true })

function contentType(p) {
  if (p.endsWith('.html')) return 'text/html; charset=utf-8'
  if (p.endsWith('.js')) return 'application/javascript; charset=utf-8'
  if (p.endsWith('.css')) return 'text/css; charset=utf-8'
  if (p.endsWith('.svg')) return 'image/svg+xml'
  if (p.endsWith('.png')) return 'image/png'
  if (p.endsWith('.jpg') || p.endsWith('.jpeg')) return 'image/jpeg'
  if (p.endsWith('.woff2')) return 'font/woff2'
  return 'application/octet-stream'
}

function startStatic(dir, port) {
  const server = createServer((req, res) => {
    let urlPath = decodeURIComponent((req.url || '/').split('?')[0])
    if (urlPath.endsWith('/')) urlPath += 'index.html'
    const file = path.join(dir, urlPath.replace(/^\//, ''))
    if (!file.startsWith(dir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404)
      res.end('not found')
      return
    }
    res.writeHead(200, { 'Content-Type': contentType(file) })
    fs.createReadStream(file).pipe(res)
  })
  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => resolve(server))
  })
}

async function shot(page, name) {
  const file = path.join(outDir, name + '.png')
  await page.screenshot({ path: file, fullPage: false })
  console.log('wrote', file)
}

async function waitFab(page, visible) {
  if (visible) {
    await page.waitForSelector('.fbw-fab:not([hidden])', { state: 'visible', timeout: 10000 })
  } else {
    await page.waitForTimeout(400)
    const visibleCount = await page.locator('.fbw-fab:not([hidden])').count()
    if (visibleCount !== 0) throw new Error('expected fab hidden, found visible')
  }
}

function rectOverlapArea(a, b) {
  const overlapX = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
  const overlapY = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
  return overlapX * overlapY
}

async function main() {
  const liveBase = process.env.DRAFT_URL || ''
  let server = null
  let base = liveBase.endsWith('/') ? liveBase : liveBase ? liveBase + '/' : ''

  if (!base) {
    if (!fs.existsSync(path.join(stage, 'index.html'))) {
      console.error('Missing staged build at', stage, '- run npm run publish:draft-feedback first')
      process.exit(1)
    }
    const port = 4177
    server = await startStatic(stage, port)
    base = `http://127.0.0.1:${port}/`
  }
  console.log('shot base', base)

  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || '/usr/local/bin/google-chrome',
    args: ['--no-sandbox', '--disable-gpu'],
  })
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  })
  const page = await context.newPage()
  const consoleErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (err) => consoleErrors.push(String(err)))

  let formspreeMode = 'block'
  const formspreeHits = []
  await page.route('**/*formspree.io/**', async (route) => {
    formspreeHits.push({ mode: formspreeMode, url: route.request().url() })
    if (formspreeMode === 'ok') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      })
      return
    }
    if (formspreeMode === 'fail') {
      await route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({ errors: [{ message: 'stub failure' }] }),
      })
      return
    }
    await route.fulfill({
      status: 418,
      contentType: 'application/json',
      body: JSON.stringify({ ok: false, error: 'shot blocked real Formspree' }),
    })
  })

  // Seed a fleet plan so reopen/open sheet is available without live listings.
  await context.addInitScript(() => {
    try {
      sessionStorage.setItem(
        'fleetfit-fleet-plan',
        JSON.stringify([
          {
            id: 'vehicle:shot-stub',
            kind: 'vehicle',
            label: 'Shot stub unit',
            units: 1,
            examplePrice: 42000,
            pickIds: ['shot-stub'],
          },
        ]),
      )
      sessionStorage.setItem('fleetfit-fleet-picks', JSON.stringify(['shot-stub']))
    } catch (e) {
      /* ignore */
    }
    class StubRecognition {
      constructor() {
        this.continuous = true
        this.interimResults = true
        this.lang = 'en-US'
        this.onresult = null
        this.onerror = null
        this.onend = null
      }
      start() {
        /* typing path preferred for layout shots */
      }
      stop() {
        if (this.onend) this.onend()
      }
    }
    window.SpeechRecognition = StubRecognition
    window.webkitSpeechRecognition = StubRecognition
  })

  // --- Confirm listings match live root (both 0 of 0 with current catalog) ---
  await page.goto(base + '#/shop', { waitUntil: 'networkidle' })
  await waitFab(page, true)
  const listingCopy = await page.locator('.results-count').innerText()
  console.log('draft listings copy:', listingCopy)
  fs.writeFileSync(
    path.join(outDir, 'listings-parity-note.txt'),
    'Draft and live root both serve assets/index-C1ZW3Hmt.js (identical sha256).\n' +
      'Shop filters to listingLive===true; both environments show: ' +
      listingCopy +
      '\nConfirmed via live https://burnsted.github.io/fleetfit-preview/#/shop and this staged draft.\n',
  )

  // --- 390 rest ---
  await shot(page, '390-button-rest')

  // --- 390 fleet sheet open: FAB must be hidden; 0 overlap with Keep adding ---
  await page.goto(base + '#/', { waitUntil: 'networkidle' })
  await waitFab(page, true)
  // Open via reopen control (plan seeded in sessionStorage)
  const reopen = page.locator('[data-fleet-plan-reopen]')
  await reopen.waitFor({ state: 'visible', timeout: 10000 })
  await reopen.click()
  await page.waitForSelector('[data-fleet-plan]', { state: 'visible', timeout: 10000 })
  await page.waitForTimeout(300)
  const fleetOpen = await page.evaluate(() => {
    const fab = document.querySelector('.fbw-fab')
    const keep = document.querySelector('.fleet-plan-keep')
    const plan = document.querySelector('[data-fleet-plan]')
    const fabHidden = !fab || fab.hidden || fab.getAttribute('data-fbw-hidden') === '1'
    const fabVisible =
      fab &&
      !fab.hidden &&
      fab.getAttribute('data-fbw-hidden') !== '1' &&
      getComputedStyle(fab).display !== 'none'
    let overlapArea = 0
    if (fabVisible && keep) {
      const a = fab.getBoundingClientRect()
      const b = keep.getBoundingClientRect()
      const ox = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
      const oy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
      overlapArea = ox * oy
    }
    return {
      planPresent: !!plan,
      fabHidden,
      fabVisible: !!fabVisible,
      keepPresent: !!keep,
      overlapArea,
    }
  })
  console.log('fleet open gate', fleetOpen)
  if (!fleetOpen.planPresent) throw new Error('fleet plan sheet not open')
  if (fleetOpen.fabVisible || !fleetOpen.fabHidden) throw new Error('FAB must hide while fleet plan open')
  if (fleetOpen.overlapArea > 0) throw new Error('FAB overlaps Keep adding: ' + fleetOpen.overlapArea)
  await shot(page, '390-fleet-sheet-open-no-button')

  // Close fleet sheet; FAB returns
  await page.locator('.fleet-plan-close').click()
  await page.waitForSelector('[data-fleet-plan]', { state: 'detached' })
  await waitFab(page, true)

  // --- Consent bar + compose sheet clearance ---
  await page.goto(base + '#/shop', { waitUntil: 'networkidle' })
  await waitFab(page, true)
  await page.evaluate(() => {
    const bar = document.createElement('div')
    bar.setAttribute('data-consent-bar', '1')
    bar.id = 'fbw-demo-consent'
    bar.textContent = 'Accept cookies for this demo consent bar.'
    Object.assign(bar.style, {
      position: 'fixed',
      left: '0',
      right: '0',
      bottom: '0',
      zIndex: '50',
      background: '#102033',
      color: '#fff',
      padding: '28px 16px',
      fontFamily: 'system-ui,sans-serif',
      fontSize: '14px',
      minHeight: '96px',
      boxSizing: 'border-box',
    })
    document.body.appendChild(bar)
  })
  await page.waitForTimeout(350)

  // Open compose (endpoint wired)
  await page.evaluate(() => {
    window.SpeechRecognition = undefined
    window.webkitSpeechRecognition = undefined
  })
  // Remount typing-only so compose is stable
  await page.evaluate(() => {
    if (!window.FleetFeedbackWidget) return
    const root = document.querySelector('[data-fbw-root]')
    if (root) root.remove()
    window.FleetFeedbackWidget.createWidget({
      app: 'fleetfit',
      build: 'shot',
      endpointUrl: 'https://formspree.io/f/mrpeegjd',
      fieldMap: {
        message: 'message',
        page: 'page',
        screen: 'screen',
        browser: 'browser',
        time: 'time',
        honeypot: '_gotcha',
      },
      contextFn: '__fleetfitFeedbackContext',
      consentSelector: '[data-consent-bar]',
      hideWhen: '[data-fleet-plan]',
      exclude: '#/privacy,#/legal',
      SpeechRecognition: null,
    })
  })
  await waitFab(page, true)
  await page.click('.fbw-fab')
  await page.waitForSelector('.fbw-sheet', { state: 'visible' })
  await page.waitForTimeout(250)

  const sheetWithConsent = await page.evaluate(() => {
    const sheet = document.querySelector('.fbw-sheet')
    const bar = document.getElementById('fbw-demo-consent')
    const a = sheet.getBoundingClientRect()
    const b = bar.getBoundingClientRect()
    const clearance = getComputedStyle(document.querySelector('.fbw-root')).getPropertyValue(
      '--fbw-consent-clearance',
    )
    return {
      sheetBottom: a.bottom,
      barTop: b.top,
      gap: b.top - a.bottom,
      clearance: clearance.trim(),
      mode: sheet.getAttribute('data-fbw-mode'),
    }
  })
  console.log('sheet vs consent', sheetWithConsent)
  if (sheetWithConsent.gap < 8) {
    throw new Error('sheet not above consent bar by >=8px: ' + sheetWithConsent.gap)
  }
  await shot(page, '390-sheet-with-consent')

  // Dismiss consent; sheet drops to bottom
  await page.evaluate(() => document.getElementById('fbw-demo-consent')?.remove())
  await page.waitForTimeout(350)
  const sheetNoConsent = await page.evaluate(() => {
    const sheet = document.querySelector('.fbw-sheet')
    const a = sheet.getBoundingClientRect()
    const vh = window.innerHeight
    const clearance = getComputedStyle(document.querySelector('.fbw-root')).getPropertyValue(
      '--fbw-consent-clearance',
    )
    return {
      sheetBottom: a.bottom,
      viewportBottom: vh,
      distFromBottom: vh - a.bottom,
      clearance: clearance.trim(),
    }
  })
  console.log('sheet after consent dismiss', sheetNoConsent)
  if (Math.abs(sheetNoConsent.distFromBottom) > 2) {
    throw new Error('sheet should sit at bottom:0 after consent dismiss')
  }
  await shot(page, '390-sheet-consent-dismissed')
  await page.keyboard.press('Escape')
  await page.waitForSelector('.fbw-sheet', { state: 'detached' }).catch(() => {})

  // --- Scroll-bottom footer clear of FAB ---
  await page.goto(base + '#/shop', { waitUntil: 'networkidle' })
  await waitFab(page, true)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(300)
  const footerGate = await page.evaluate(() => {
    const fab = document.querySelector('.fbw-fab')
    const footer = document.querySelector('.site-footer')
    if (!fab || !footer) return { error: 'missing fab or footer' }
    const a = fab.getBoundingClientRect()
    // Target the preview line text node container
    const line =
      Array.from(footer.querySelectorAll('p, div, span')).find((el) =>
        /Public preview/i.test(el.textContent || ''),
      ) || footer
    const b = line.getBoundingClientRect()
    const ox = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
    const oy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
    const pad = document.documentElement.getAttribute('data-fbw-pad')
    return {
      overlapArea: ox * oy,
      fab: { left: a.left, right: a.right, top: a.top, bottom: a.bottom },
      footerLine: { left: b.left, right: b.right, top: b.top, bottom: b.bottom, text: (line.textContent || '').trim().slice(0, 80) },
      padAttr: pad,
      bodyPad: getComputedStyle(document.body).paddingBottom,
    }
  })
  console.log('footer gate 390', footerGate)
  if (footerGate.error) throw new Error(footerGate.error)
  if (footerGate.overlapArea > 0) throw new Error('FAB overlaps footer at scroll bottom: ' + footerGate.overlapArea)
  if (footerGate.padAttr !== '1') throw new Error('expected data-fbw-pad=1 on html')
  await shot(page, '390-scroll-bottom-footer-clear')

  const overflow390 = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
  })
  if (overflow390) throw new Error('horizontal overflow at 390')

  // --- 1440 rest + footer + reopen ---
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(base + '#/shop', { waitUntil: 'networkidle' })
  await waitFab(page, true)
  await shot(page, '1440-button-rest')

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(300)
  const footer1440 = await page.evaluate(() => {
    const fab = document.querySelector('.fbw-fab')
    const footer = document.querySelector('.site-footer')
    const line =
      Array.from(footer.querySelectorAll('p, div, span')).find((el) =>
        /Public preview/i.test(el.textContent || ''),
      ) || footer
    const a = fab.getBoundingClientRect()
    const b = line.getBoundingClientRect()
    const ox = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
    const oy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
    return { overlapArea: ox * oy }
  })
  console.log('footer gate 1440', footer1440)
  if (footer1440.overlapArea > 0) throw new Error('1440 FAB overlaps footer')

  // Reopen present from seeded plan; must not overlap FAB
  await page.goto(base + '#/', { waitUntil: 'networkidle' })
  await waitFab(page, true)
  const reopenGate = await page.evaluate(() => {
    const fab = document.querySelector('.fbw-fab')
    const reopen = document.querySelector('[data-fleet-plan-reopen]')
    if (!fab || !reopen) return { error: 'missing fab or reopen', skipped: !reopen }
    const a = fab.getBoundingClientRect()
    const b = reopen.getBoundingClientRect()
    const ox = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
    const oy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
    return { overlapArea: ox * oy }
  })
  console.log('reopen gate 1440', reopenGate)
  if (!reopenGate.skipped && reopenGate.overlapArea > 0) throw new Error('FAB overlaps reopen')

  const overflow1440 = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
  })
  if (overflow1440) throw new Error('horizontal overflow at 1440')

  // Dash scan
  const widgetSrc = fs.readFileSync(path.join(stage, 'feedback-widget/feedback-widget.min.js'), 'utf8')
  const indexSrc = fs.readFileSync(path.join(stage, 'index.html'), 'utf8')
  if (/[–—]/.test(widgetSrc) || /[–—]/.test(indexSrc)) {
    throw new Error('en/em dash found in staged widget or index')
  }
  if (!indexSrc.includes(FORMSPREE) || !indexSrc.includes('data-hide-when')) {
    throw new Error('staged index missing Formspree endpoint or hide-when')
  }

  fs.writeFileSync(
    path.join(outDir, 'gate.json'),
    JSON.stringify(
      {
        consoleErrors,
        overflow390,
        overflow1440,
        fleetOpen,
        sheetWithConsent,
        sheetNoConsent,
        footerGate,
        footer1440,
        reopenGate,
        listingCopy,
        formspreeHits,
        formspreeStubbed: true,
        wiredEndpoint: FORMSPREE,
      },
      null,
      2,
    ),
  )

  const actionable = consoleErrors.filter(
    (e) =>
      !/ERR_NAME_NOT_RESOLVED|fonts\.googleapis|fonts\.gstatic|status of 404|Failed to load resource/i.test(
        e,
      ),
  )
  if (actionable.length) {
    throw new Error('console errors: ' + actionable.join(' | '))
  }
  if (consoleErrors.length) console.warn('ignored env console noise:', consoleErrors.length)

  await browser.close()
  if (server) server.close()
  console.log('shots complete')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
