/**
 * Focused Run 6 layout gates for draft-feedback (390 + 1440 rest).
 * Never hits Formspree for real.
 */
import { chromium } from 'playwright'
import { createServer } from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const stage = path.join(__dirname, '../.draft-feedback-stage')
const outDir = path.join(__dirname, '../artifacts/voice-feedback')
fs.mkdirSync(outDir, { recursive: true })

function ct(p) {
  if (p.endsWith('.html')) return 'text/html'
  if (p.endsWith('.js')) return 'application/javascript'
  if (p.endsWith('.css')) return 'text/css'
  if (p.endsWith('.png')) return 'image/png'
  if (p.endsWith('.jpg') || p.endsWith('.jpeg')) return 'image/jpeg'
  if (p.endsWith('.webp')) return 'image/webp'
  if (p.endsWith('.svg')) return 'image/svg+xml'
  return 'application/octet-stream'
}

const server = createServer((req, res) => {
  let u = decodeURIComponent((req.url || '/').split('?')[0])
  if (u.endsWith('/')) u += 'index.html'
  const f = path.join(stage, u.replace(/^\//, ''))
  if (!f.startsWith(stage) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    res.writeHead(404)
    res.end('nf')
    return
  }
  res.writeHead(200, { 'Content-Type': ct(f) })
  fs.createReadStream(f).pipe(res)
})
await new Promise((r) => server.listen(4191, '127.0.0.1', r))

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || '/usr/local/bin/google-chrome',
  args: ['--no-sandbox'],
})
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await page.route('**/*formspree.io/**', (r) => r.fulfill({ status: 418, body: '{}' }))
await page.goto('http://127.0.0.1:4191/#/shop', { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.fbw-fab', { timeout: 10000 })

await page.evaluate(() => {
  const w = document.createElement('div')
  w.setAttribute('data-fleet-plan', '1')
  w.innerHTML =
    '<button class="fleet-plan-keep" style="position:fixed;left:14px;bottom:18px;z-index:200">Keep adding</button>'
  document.body.appendChild(w)
})
await page.waitForTimeout(400)
const fleet = await page.evaluate(() => {
  const fab = document.querySelector('.fbw-fab')
  const hidden = !fab || fab.hidden || fab.getAttribute('data-fbw-hidden') === '1'
  const display = fab ? getComputedStyle(fab).display : 'none'
  return { hidden, display }
})
if (!fleet.hidden && fleet.display !== 'none') throw new Error('fab not hidden: ' + JSON.stringify(fleet))
await page.screenshot({ path: path.join(outDir, '390-fleet-sheet-open-no-button.png') })
await page.evaluate(() => document.querySelector('[data-fleet-plan]')?.remove())
await page.waitForTimeout(300)

await page.evaluate(() => {
  const bar = document.createElement('div')
  bar.id = 'c'
  bar.setAttribute('data-consent-bar', '1')
  Object.assign(bar.style, {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: '96px',
    background: '#102033',
    color: '#fff',
    padding: '28px 16px',
    zIndex: 50,
  })
  bar.textContent = 'Consent'
  document.body.appendChild(bar)
})
await page.waitForTimeout(350)
await page.evaluate(() => {
  document.querySelector('[data-fbw-root]')?.remove()
  window.FleetFeedbackWidget.createWidget({
    app: 'fleetfit',
    endpointUrl: 'https://formspree.io/f/mrpeegjd',
    SpeechRecognition: null,
    consentSelector: '[data-consent-bar]',
    hideWhen: '[data-fleet-plan]',
  })
})
await page.waitForSelector('.fbw-fab:not([hidden])')
await page.click('.fbw-fab')
await page.waitForSelector('.fbw-sheet')
const withC = await page.evaluate(() => {
  const s = document.querySelector('.fbw-sheet').getBoundingClientRect()
  const b = document.getElementById('c').getBoundingClientRect()
  return { gap: b.top - s.bottom }
})
if (withC.gap < 8) throw new Error('sheet consent gap ' + withC.gap)
await page.screenshot({ path: path.join(outDir, '390-sheet-with-consent.png') })
await page.evaluate(() => document.getElementById('c')?.remove())
await page.waitForTimeout(350)
const noC = await page.evaluate(() => {
  const s = document.querySelector('.fbw-sheet').getBoundingClientRect()
  return { dist: window.innerHeight - s.bottom }
})
if (Math.abs(noC.dist) > 2) throw new Error('sheet not at bottom ' + noC.dist)
await page.screenshot({ path: path.join(outDir, '390-sheet-consent-dismissed.png') })
await page.keyboard.press('Escape')

await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
await page.waitForTimeout(300)
const foot = await page.evaluate(() => {
  const fab = document.querySelector('.fbw-fab')
  const line =
    [...document.querySelectorAll('.site-footer p, .site-footer div, .site-footer span')].find((el) =>
      /Public preview/i.test(el.textContent || ''),
    ) || document.querySelector('.site-footer')
  const a = fab.getBoundingClientRect()
  const b = line.getBoundingClientRect()
  const ox = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
  const oy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
  const padPx = parseFloat(getComputedStyle(document.body).paddingBottom) || 0
  return {
    overlap: ox * oy,
    pad: document.documentElement.getAttribute('data-fbw-pad'),
    padPx,
  }
})
if (foot.overlap > 0) throw new Error('footer overlap ' + foot.overlap)
if (foot.pad !== '1') throw new Error('missing pad')
if (foot.padPx < 66) throw new Error('footer padding-bottom < 66px: ' + foot.padPx)
await page.screenshot({ path: path.join(outDir, '390-scroll-bottom-footer-clear.png') })

// Counter copy: "n of 1000", never slash
await page.click('.fbw-fab')
await page.waitForSelector('.fbw-sheet .fbw-ta', { timeout: 5000 })
await page.locator('.fbw-ta').fill('Draft feedback for the package total screen.')
const countText = await page.locator('.fbw-count').innerText()
if (countText !== '44 of 1000') throw new Error('counter expected "44 of 1000", got ' + countText)
if (countText.includes('/')) throw new Error('counter must not use slash')
const sheetText = await page.locator('.fbw-sheet').innerText()
const sheetNoUrls = sheetText.replace(/https?:\/\/\S+/g, '')
if (sheetNoUrls.includes('/')) throw new Error('slash in visible widget sheet text: ' + sheetNoUrls)
await page.keyboard.press('Escape')

await page.setViewportSize({ width: 1440, height: 900 })
await page.goto('http://127.0.0.1:4191/#/shop', { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.fbw-fab')
await page.screenshot({ path: path.join(outDir, '1440-button-rest.png') })

console.log('layout smoke OK', { fleet, withC, noC, foot })
await browser.close()
server.close()
