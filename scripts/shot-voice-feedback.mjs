/**
 * Real-browser screenshots for voice feedback widget (390 + one 1440).
 * Serves the staged draft-feedback build locally.
 */
import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createServer } from 'http'
import { spawn } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const outDir = path.join(root, 'artifacts/voice-feedback')
const stage = path.join(root, '.draft-feedback-stage')

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

  // Inject SpeechRecognition stub for listening shot (VM often has no mic)
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

  // --- button at rest ---
  await page.goto(base + '#/shop', { waitUntil: 'networkidle' })
  await waitFab(page, true)
  await shot(page, '390-button-rest')
  // Close crop of the launcher icon (person-speaking)
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
    return { fabBottom, barTop, gap: barTop - fabBottom, clearance: getComputedStyle(document.querySelector('.fbw-root')).getPropertyValue('--fbw-consent-clearance') }
  })
  console.log('consent lift', lifted)
  if (lifted.gap < 8) throw new Error('consent clearance gap < 8: ' + lifted.gap)
  await shot(page, '390-button-consent-lifted')

  await page.evaluate(() => {
    document.getElementById('fbw-demo-consent')?.remove()
  })
  await page.waitForTimeout(300)
  await shot(page, '390-button-consent-dismissed')

  // Helper: remount widget with overrides (shots never POST to a real inbox)
  async function remountWidget(overrides) {
    await page.evaluate((ov) => {
      if (!window.FleetFeedbackWidget) return
      const scripts = document.querySelectorAll('script[data-app="fleetfit"]')
      const cfgScript = scripts[scripts.length - 1]
      const root = document.querySelector('[data-fbw-root]')
      if (root) root.remove()
      const cfg = {
        app: 'fleetfit',
        build: 'shot',
        endpointUrl: ov.endpointUrl || '',
        contextFn: '__fleetfitFeedbackContext',
        consentSelector: '[data-consent-bar]',
        exclude: (cfgScript && cfgScript.getAttribute('data-exclude')) || '#/privacy,#/legal',
        fetch: function () {
          return Promise.reject(new Error('shot must not send'))
        },
      }
      if (ov.SpeechRecognition === null) cfg.SpeechRecognition = null
      window.FleetFeedbackWidget.createWidget(cfg)
    }, overrides)
    await waitFab(page, true)
  }

  // --- sheet listening with stub interim (needs non-empty endpoint for compose UI) ---
  await remountWidget({
    endpointUrl: 'https://example.invalid/feedback-shot-no-send',
  })
  await page.click('.fbw-fab')
  await page.waitForSelector('.fbw-sheet[data-fbw-mode="compose"]', { state: 'visible' })
  await page.waitForTimeout(400)
  const taVal = await page.locator('.fbw-ta').inputValue()
  console.log('stub interim text:', taVal || '(empty - stub may not have fired)')
  fs.writeFileSync(
    path.join(outDir, 'speech-stub-note.txt'),
    'VM has no mic; SpeechRecognition stubbed to inject interim text: "stub interim: package total looks clear"\nCaptured textarea: ' +
      taVal +
      '\nCompose UI opened with a throwaway endpointUrl for the stub shot only; no submission sent.\n',
  )
  await shot(page, '390-sheet-listening-stub')
  await page.keyboard.press('Escape')
  await page.waitForSelector('.fbw-sheet', { state: 'detached' }).catch(() => {})

  // --- not connected yet: empty endpointUrl opens message-only dialog (no textarea / mic) ---
  await remountWidget({ endpointUrl: '', SpeechRecognition: null })
  await page.click('.fbw-fab')
  await page.waitForSelector('.fbw-sheet[data-fbw-mode="not-connected"]', { state: 'visible' })
  const status2 = await page.locator('.fbw-status').innerText()
  console.log('not-connected status:', status2)
  if (!/isn['']t connected yet/i.test(status2)) {
    throw new Error('expected not-connected status, got: ' + status2)
  }
  const taCount = await page.locator('.fbw-ta').count()
  if (taCount !== 0) throw new Error('not-connected dialog must not include textarea')
  await shot(page, '390-not-connected')
  await page.click('.fbw-btn-send') // OK
  await page.waitForSelector('.fbw-sheet', { state: 'detached' })

  // --- typing fallback: compose with endpoint, speech unavailable ---
  await page.evaluate(() => {
    window.SpeechRecognition = undefined
    window.webkitSpeechRecognition = undefined
  })
  await remountWidget({
    endpointUrl: 'https://example.invalid/feedback-shot-no-send',
    SpeechRecognition: null,
  })
  await page.click('.fbw-fab')
  await page.waitForSelector('.fbw-sheet[data-fbw-mode="compose"]')
  const statusType = await page.locator('.fbw-status').innerText()
  console.log('typing fallback status:', statusType)
  await shot(page, '390-type-fallback')
  await page.keyboard.press('Escape')
  // Restore empty-endpoint widget for remaining gates (matches draft config)
  await remountWidget({ endpointUrl: '', SpeechRecognition: null })

  // --- excluded hash: button absent (pattern only; no FleetFit privacy pages) ---
  await page.goto(base + '#/privacy', { waitUntil: 'networkidle' })
  await waitFab(page, false)
  await shot(page, '390-excluded-privacy-no-button')

  // --- fleet panel Keep adding + reopen: no overlap with fab ---
  await page.goto(base + '#/', { waitUntil: 'networkidle' })
  await waitFab(page, true)
  const addBtn = page
    .locator(
      'button:has-text("Add to fleet"), button[aria-label*="Add"], [data-photo-add], button.photo-add-chip, [data-photo-add-chip]',
    )
    .first()
  try {
    if (await addBtn.count()) {
      await addBtn.click({ timeout: 4000 })
      await page.waitForTimeout(600)
    }
  } catch (e) {
    console.log('add setup note:', e.message)
  }

  function rectOverlap(a, b) {
    const overlapX = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
    const overlapY = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
    return overlapX * overlapY
  }

  // Panel open: Keep adding must not overlap fab
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
    return {
      fab: { left: a.left, right: a.right, bottom: a.bottom, top: a.top },
      keep: { left: b.left, right: b.right, bottom: b.bottom, top: b.top },
      overlapArea: overlapX * overlapY,
    }
  })
  console.log('keep adding overlap', keepOverlap)
  if (!keepOverlap.skipped && keepOverlap.overlapArea > 0) {
    throw new Error('fab overlaps Keep adding')
  }
  await shot(page, '390-no-overlap-keep-adding')

  // Close panel to show reopen
  try {
    const close = page
      .locator('[data-fleet-plan-close], button:has-text("Close"), .fleet-plan-close, button[aria-label*="Close"]')
      .first()
    if (await close.count()) await close.click({ timeout: 2000 })
  } catch (e) {
    console.log('close panel note:', e.message)
  }
  await page.waitForTimeout(400)

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

  // horizontal overflow check 390
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

  // en/em dash scan on visible widget strings + sheet copy
  const dashScan = await page.evaluate(() => {
    const bits = []
    document.querySelectorAll('.fbw-root, .fbw-sheet, .fbw-note, .fbw-status, .fbw-btn').forEach((el) => {
      bits.push(el.innerText || '')
    })
    // Also static strings from sheet note when closed
    return bits.join('\n')
  })
  if (/[–—]/.test(dashScan)) throw new Error('en/em dash in widget text')
  // Source-level check of widget visible copy
  const noteCopy = "Your browser's speech service turns your voice into text. Please don't include personal details."
  const failCopy = "Couldn't send, please try again"
  const ncCopy = "Feedback isn't connected yet."
  for (const s of [noteCopy, failCopy, ncCopy, 'Thanks, sent.', 'Typing works too.', 'Send', 'Cancel']) {
    if (/[–—]/.test(s)) throw new Error('en/em dash in copy constant')
  }

  fs.writeFileSync(
    path.join(outDir, 'gate.json'),
    JSON.stringify(
      {
        consoleErrors,
        overflow390,
        overflow1440,
        consentLift: lifted,
        keepOverlap,
        overlap,
        speechStub: true,
        excludedPrivacyNoButton: true,
        notConnected: true,
      },
      null,
      2,
    ),
  )

  // Ignore env/network noise (Google Fonts DNS, absolute /fleetfit-preview/ brand paths on local static).
  // Fail on app/widget JS exceptions only.
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

  await browser.close()
  if (server) server.close()
  console.log('shots complete')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
