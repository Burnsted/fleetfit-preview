/**
 * Real-browser screenshots for voice feedback widget (390 + one 1440).
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
    await page.waitForSelector('.fbw-fab', { state: 'visible', timeout: 10000 })
  } else {
    await page.waitForTimeout(400)
    const n = await page.locator('.fbw-fab').count()
    if (n !== 0) throw new Error('expected no fab, found ' + n)
  }
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

  // Block / stub all Formspree traffic — never send real submissions from shots.
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

  await context.addInitScript(() => {
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
        const self = this
        setTimeout(() => {
          if (!self.onresult) return
          self.onresult({
            resultIndex: 0,
            results: [
              {
                isFinal: false,
                0: { transcript: 'stub interim: package total looks clear' },
                length: 1,
              },
            ],
          })
        }, 200)
      }
      stop() {
        if (this.onend) this.onend()
      }
    }
    window.SpeechRecognition = StubRecognition
    window.webkitSpeechRecognition = StubRecognition
  })

  // --- button at rest (wired endpoint; person-speaking icon) ---
  await page.goto(base + '#/shop', { waitUntil: 'networkidle' })
  await waitFab(page, true)
  const wired = await page.evaluate(() => {
    const cfg = window.FEEDBACK_CONFIG || {}
    const script = document.querySelector('script[data-endpoint-url]')
    return {
      configUrl: cfg.endpointUrl || '',
      dataUrl: (script && script.getAttribute('data-endpoint-url')) || '',
    }
  })
  console.log('wired endpoint', wired)
  if (wired.configUrl !== FORMSPREE || wired.dataUrl !== FORMSPREE) {
    throw new Error('expected Formspree URL in FEEDBACK_CONFIG and data-endpoint-url, got ' + JSON.stringify(wired))
  }
  await shot(page, '390-button-rest')
  const fabBox = await page.locator('.fbw-fab').boundingBox()
  if (fabBox) {
    const pad = 8
    await page.screenshot({
      path: path.join(outDir, '390-button-icon-crop.png'),
      clip: {
        x: Math.max(0, fabBox.x - pad),
        y: Math.max(0, fabBox.y - pad),
        width: fabBox.width + pad * 2,
        height: fabBox.height + pad * 2,
      },
    })
    console.log('wrote', path.join(outDir, '390-button-icon-crop.png'))
  }
  const aria = await page.locator('.fbw-fab').getAttribute('aria-label')
  if (aria !== 'Send feedback') throw new Error('aria-label expected Send feedback, got: ' + aria)

  // --- consent lift up / down ---
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
      padding: '16px',
      fontFamily: 'system-ui,sans-serif',
      fontSize: '14px',
    })
    document.body.appendChild(bar)
  })
  await page.waitForTimeout(300)
  const lifted = await page.evaluate(() => {
    const fab = document.querySelector('.fbw-fab')
    const bar = document.getElementById('fbw-demo-consent')
    const fabBottom = fab.getBoundingClientRect().bottom
    const barTop = bar.getBoundingClientRect().top
    return {
      fabBottom,
      barTop,
      gap: barTop - fabBottom,
      clearance: getComputedStyle(document.querySelector('.fbw-root')).getPropertyValue('--fbw-consent-clearance'),
    }
  })
  console.log('consent lift', lifted)
  if (lifted.gap < 8) throw new Error('consent clearance gap < 8: ' + lifted.gap)
  await shot(page, '390-button-consent-lifted')

  await page.evaluate(() => {
    document.getElementById('fbw-demo-consent')?.remove()
  })
  await page.waitForTimeout(300)
  await shot(page, '390-button-consent-dismissed')

  // Remount helper: keep Formspree URL; do NOT override fetch (Playwright route stubs it).
  async function remountWidget(overrides = {}) {
    await page.evaluate((ov) => {
      if (!window.FleetFeedbackWidget) return
      const scripts = document.querySelectorAll('script[data-app="fleetfit"]')
      const cfgScript = scripts[scripts.length - 1]
      const root = document.querySelector('[data-fbw-root]')
      if (root) root.remove()
      const cfg = {
        app: 'fleetfit',
        build: 'shot',
        endpointUrl: ov.endpointUrl != null ? ov.endpointUrl : 'https://formspree.io/f/mrpeegjd',
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
        exclude: (cfgScript && cfgScript.getAttribute('data-exclude')) || '#/privacy,#/legal',
      }
      if (ov.SpeechRecognition === null) cfg.SpeechRecognition = null
      window.FleetFeedbackWidget.createWidget(cfg)
    }, overrides)
    await waitFab(page, true)
  }

  // --- compose open (typing path; no speech fill) ---
  await remountWidget({ SpeechRecognition: null })
  await page.click('.fbw-fab')
  await page.waitForSelector('.fbw-sheet[data-fbw-mode="compose"]', { state: 'visible' })
  await page.waitForTimeout(200)
  await shot(page, '390-compose-open')

  // --- typed text with character counter ---
  const typed = 'Draft feedback for the package total screen.'
  await page.locator('.fbw-ta').fill(typed)
  const countText = await page.locator('.fbw-count').innerText()
  console.log('counter:', countText)
  if (countText !== typed.length + ' / 1000') {
    throw new Error('expected counter "' + typed.length + ' / 1000", got ' + countText)
  }
  await shot(page, '390-compose-typed-counter')

  // --- listening stub (voice path) ---
  await page.keyboard.press('Escape')
  await page.waitForSelector('.fbw-sheet', { state: 'detached' }).catch(() => {})
  await remountWidget({}) // default SpeechRecognition from init script
  await page.click('.fbw-fab')
  await page.waitForSelector('.fbw-sheet[data-fbw-mode="compose"]', { state: 'visible' })
  await page.waitForTimeout(400)
  const taVal = await page.locator('.fbw-ta').inputValue()
  console.log('stub interim text:', taVal || '(empty)')
  fs.writeFileSync(
    path.join(outDir, 'speech-stub-note.txt'),
    'VM has no mic; SpeechRecognition stubbed. Formspree requests intercepted by Playwright route; no real submissions.\nCaptured textarea: ' +
      taVal +
      '\n',
  )
  await shot(page, '390-sheet-listening-stub')
  await page.keyboard.press('Escape')
  await page.waitForSelector('.fbw-sheet', { state: 'detached' }).catch(() => {})

  // --- thank-you (stubbed ok:true) ---
  formspreeMode = 'ok'
  await remountWidget({ SpeechRecognition: null })
  await page.click('.fbw-fab')
  await page.waitForSelector('.fbw-sheet[data-fbw-mode="compose"]')
  await page.locator('.fbw-ta').fill('Stubbed success path. Do not deliver.')
  // Honor 3s minimum open-to-send
  await page.waitForTimeout(3200)
  await page.click('.fbw-btn-send')
  await page.waitForFunction(() => {
    const s = document.querySelector('.fbw-status')
    return s && /Thanks, sent/i.test(s.textContent || '')
  })
  const thanks = await page.locator('.fbw-status').innerText()
  console.log('thanks status:', thanks)
  await shot(page, '390-thanks-stubbed')
  await page.keyboard.press('Escape')
  await page.waitForSelector('.fbw-sheet', { state: 'detached' }).catch(() => {})

  // --- failure (stubbed 422) ---
  formspreeMode = 'fail'
  await remountWidget({ SpeechRecognition: null })
  await page.click('.fbw-fab')
  await page.waitForSelector('.fbw-sheet[data-fbw-mode="compose"]')
  const failText = 'Stubbed failure path keeps this text.'
  await page.locator('.fbw-ta').fill(failText)
  await page.waitForTimeout(3200)
  await page.click('.fbw-btn-send')
  await page.waitForFunction(() => {
    const s = document.querySelector('.fbw-status')
    return s && /Couldn't send, please try again/i.test(s.textContent || '')
  })
  const failStatus = await page.locator('.fbw-status').innerText()
  const kept = await page.locator('.fbw-ta').inputValue()
  console.log('fail status:', failStatus, 'kept:', kept)
  if (kept !== failText) throw new Error('failure path must keep typed text')
  await shot(page, '390-failure-stubbed')
  await page.keyboard.press('Escape')
  await page.waitForSelector('.fbw-sheet', { state: 'detached' }).catch(() => {})
  formspreeMode = 'block'

  // --- not-connected regression (empty endpoint remount) ---
  await remountWidget({ endpointUrl: '', SpeechRecognition: null })
  await page.click('.fbw-fab')
  await page.waitForSelector('.fbw-sheet[data-fbw-mode="not-connected"]', { state: 'visible' })
  await shot(page, '390-not-connected')
  await page.click('.fbw-btn-send')
  await page.waitForSelector('.fbw-sheet', { state: 'detached' })

  // Restore wired endpoint for remaining gates
  await remountWidget({ SpeechRecognition: null })

  // --- excluded hash ---
  await page.goto(base + '#/privacy', { waitUntil: 'networkidle' })
  await waitFab(page, false)
  await shot(page, '390-excluded-privacy-no-button')

  // --- reopen: no overlap with fab ---
  await page.goto(base + '#/', { waitUntil: 'networkidle' })
  await waitFab(page, true)

  const keepOverlap = await page.evaluate(() => {
    const fab = document.querySelector('.fbw-fab')
    const keep = Array.from(document.querySelectorAll('button')).find((b) =>
      /keep adding/i.test(b.textContent || ''),
    )
    if (!fab) return { error: 'no fab' }
    if (!keep) return { error: 'no keep adding', skipped: true }
    const a = fab.getBoundingClientRect()
    const b = keep.getBoundingClientRect()
    const overlapX = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
    const overlapY = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
    return { overlapArea: overlapX * overlapY }
  })
  console.log('keep adding overlap', keepOverlap)
  if (!keepOverlap.skipped && keepOverlap.overlapArea > 0) {
    throw new Error('fab overlaps Keep adding')
  }
  await shot(page, '390-no-overlap-keep-adding')

  const overlap = await page.evaluate(() => {
    let reopen = document.querySelector('[data-fleet-plan-reopen], .fleet-plan-reopen')
    if (!reopen) {
      reopen = document.createElement('button')
      reopen.className = 'fleet-plan-reopen'
      reopen.setAttribute('data-fleet-plan-reopen', '1')
      reopen.style.cssText =
        'position:fixed;right:14px;bottom:18px;z-index:92;width:52px;height:52px;border-radius:50%;background:#0b1220;color:#fff;border:0'
      reopen.textContent = '1'
      document.body.appendChild(reopen)
    }
    const fab = document.querySelector('.fbw-fab')
    const a = fab.getBoundingClientRect()
    const b = reopen.getBoundingClientRect()
    const overlapX = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
    const overlapY = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
    return {
      fab: { left: a.left, right: a.right, bottom: a.bottom },
      reopen: { left: b.left, right: b.right, bottom: b.bottom },
      overlapArea: overlapX * overlapY,
    }
  })
  console.log('reopen overlap', overlap)
  if (overlap.overlapArea > 0) throw new Error('fab overlaps reopen control')
  await shot(page, '390-no-overlap-reopen')

  // Consent bar overlap at 390 with wired widget
  await page.evaluate(() => {
    const bar = document.createElement('div')
    bar.setAttribute('data-consent-bar', '1')
    bar.id = 'fbw-gate-consent'
    bar.textContent = 'Consent bar gate'
    Object.assign(bar.style, {
      position: 'fixed',
      left: '0',
      right: '0',
      bottom: '0',
      zIndex: '50',
      background: '#102033',
      color: '#fff',
      padding: '16px',
    })
    document.body.appendChild(bar)
  })
  await page.waitForTimeout(300)
  const consentGate = await page.evaluate(() => {
    const fab = document.querySelector('.fbw-fab')
    const bar = document.getElementById('fbw-gate-consent')
    const a = fab.getBoundingClientRect()
    const b = bar.getBoundingClientRect()
    const overlapX = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
    const overlapY = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
    return { gap: b.top - a.bottom, overlapArea: overlapX * overlapY }
  })
  console.log('consent gate', consentGate)
  if (consentGate.gap < 8 || consentGate.overlapArea > 0) {
    throw new Error('fab overlaps or too close to consent bar')
  }
  await page.evaluate(() => document.getElementById('fbw-gate-consent')?.remove())

  const overflow390 = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
  })
  if (overflow390) throw new Error('horizontal overflow at 390')

  // --- 1440 ---
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(base + '#/shop', { waitUntil: 'networkidle' })
  await waitFab(page, true)
  await shot(page, '1440-button-rest')
  const overflow1440 = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
  })
  if (overflow1440) throw new Error('horizontal overflow at 1440')

  // consent + reopen overlap at 1440
  await page.evaluate(() => {
    const bar = document.createElement('div')
    bar.setAttribute('data-consent-bar', '1')
    bar.id = 'fbw-gate-consent-1440'
    bar.textContent = 'Consent bar gate'
    Object.assign(bar.style, {
      position: 'fixed',
      left: '0',
      right: '0',
      bottom: '0',
      zIndex: '50',
      background: '#102033',
      color: '#fff',
      padding: '16px',
    })
    document.body.appendChild(bar)
    let reopen = document.querySelector('[data-fleet-plan-reopen], .fleet-plan-reopen')
    if (!reopen) {
      reopen = document.createElement('button')
      reopen.className = 'fleet-plan-reopen'
      reopen.setAttribute('data-fleet-plan-reopen', '1')
      reopen.style.cssText =
        'position:fixed;right:14px;bottom:18px;z-index:92;width:52px;height:52px;border-radius:50%;background:#0b1220;color:#fff;border:0'
      reopen.textContent = '1'
      document.body.appendChild(reopen)
    }
  })
  await page.waitForTimeout(300)
  const gate1440 = await page.evaluate(() => {
    const fab = document.querySelector('.fbw-fab')
    const bar = document.getElementById('fbw-gate-consent-1440')
    const reopen = document.querySelector('[data-fleet-plan-reopen], .fleet-plan-reopen')
    const a = fab.getBoundingClientRect()
    const b = bar.getBoundingClientRect()
    const c = reopen.getBoundingClientRect()
    const o = (r1, r2) => {
      const ox = Math.max(0, Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left))
      const oy = Math.max(0, Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top))
      return ox * oy
    }
    return {
      consentGap: b.top - a.bottom,
      consentOverlap: o(a, b),
      reopenOverlap: o(a, c),
    }
  })
  console.log('1440 gates', gate1440)
  if (gate1440.consentGap < 8 || gate1440.consentOverlap > 0 || gate1440.reopenOverlap > 0) {
    throw new Error('1440 overlap gate failed: ' + JSON.stringify(gate1440))
  }

  const dashScan = await page.evaluate(() => {
    const bits = []
    document.querySelectorAll('.fbw-root, .fbw-sheet, .fbw-note, .fbw-status, .fbw-btn, .fbw-count').forEach((el) => {
      bits.push(el.innerText || '')
    })
    return bits.join('\n')
  })
  if (/[–—]/.test(dashScan)) throw new Error('en/em dash in widget text')
  const copyConsts = [
    "Your browser's speech service turns your voice into text. Please don't include personal details.",
    "Couldn't send, please try again",
    "Feedback isn't connected yet.",
    'Thanks, sent.',
    'Typing works too.',
    'Send',
    'Cancel',
  ]
  for (const s of copyConsts) {
    if (/[–—]/.test(s)) throw new Error('en/em dash in copy constant')
  }

  // Source scan of staged widget + index for en/em dashes in user-facing strings
  const widgetSrc = fs.readFileSync(path.join(stage, 'feedback-widget/feedback-widget.min.js'), 'utf8')
  const indexSrc = fs.readFileSync(path.join(stage, 'index.html'), 'utf8')
  if (/[–—]/.test(widgetSrc) || /[–—]/.test(indexSrc)) {
    throw new Error('en/em dash found in staged widget or index')
  }
  if (!indexSrc.includes(FORMSPREE)) {
    throw new Error('staged index missing Formspree endpoint')
  }

  fs.writeFileSync(
    path.join(outDir, 'gate.json'),
    JSON.stringify(
      {
        consoleErrors,
        overflow390,
        overflow1440,
        consentLift: lifted,
        consentGate,
        gate1440,
        keepOverlap,
        overlap,
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
    console.warn('console errors:', actionable)
    throw new Error('console errors: ' + actionable.join(' | '))
  }
  if (consoleErrors.length) {
    console.warn('ignored env console noise:', consoleErrors.length)
  }

  const realPosts = formspreeHits.filter((h) => h.mode !== 'ok' && h.mode !== 'fail' && h.mode !== 'block')
  if (realPosts.length) throw new Error('unexpected formspree mode hits')
  console.log('formspree stub hits', formspreeHits.length)

  await browser.close()
  if (server) server.close()
  console.log('shots complete')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
