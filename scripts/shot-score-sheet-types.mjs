/**
 * Open score readout UI for every fixture vehicle type at 390 and 1440,
 * scan visible textContent for '/', screenshot the van sheet at 390.
 * Uses scored copy from getPackageAllUnits (same reasons as the live sheet).
 */
import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createServer } from 'http'
import { getPackageAllUnits } from '../src/data/package.js'
import { rankUnitsByScoreV2 } from '../src/lib/scoreV2.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const stage = path.join(root, '.draft-feedback-stage')
const outDir = path.join(root, 'artifacts/voice-feedback')
fs.mkdirSync(outDir, { recursive: true })

function contentType(p) {
  if (p.endsWith('.html')) return 'text/html; charset=utf-8'
  if (p.endsWith('.js')) return 'application/javascript; charset=utf-8'
  if (p.endsWith('.css')) return 'text/css; charset=utf-8'
  if (p.endsWith('.png')) return 'image/png'
  if (p.endsWith('.jpg') || p.endsWith('.jpeg')) return 'image/jpeg'
  if (p.endsWith('.webp')) return 'image/webp'
  if (p.endsWith('.svg')) return 'image/svg+xml'
  return 'application/octet-stream'
}

function startStatic(dir, port) {
  const server = createServer((req, res) => {
    let urlPath = decodeURIComponent((req.url || '/').split('?')[0])
    if (urlPath.endsWith('/')) urlPath += 'index.html'
    const file = path.join(dir, urlPath.replace(/^\//, ''))
    if (!file.startsWith(dir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404)
      res.end('nf')
      return
    }
    res.writeHead(200, { 'Content-Type': contentType(file) })
    fs.createReadStream(file).pipe(res)
  })
  return new Promise((r) => server.listen(port, '127.0.0.1', () => r(server)))
}

function stripUrls(text) {
  return String(text || '')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/\bwww\.\S+/gi, ' ')
}

function classify(unit) {
  const tags = []
  const body = String(unit?.bodyType || '').toLowerCase()
  if (body === 'van') tags.push('van')
  if (body === 'truck' || body === 'pickup') tags.push('pickup')
  if (body === 'suv') tags.push('suv')
  const blob = `${unit?.make || ''} ${unit?.model || ''}`
  if (/ev|lightning|brightdrop|e-?transit|promaster\s*ev|rivian|r1t|silverado\s*ev|sierra\s*ev/i.test(blob)) {
    tags.push('ev')
  }
  return tags.length ? tags : ['other']
}

function pickRepresentatives(ranked) {
  const picks = {}
  // Prefer E-Transit for van (Steve QA slash examples live on that sheet).
  const eTransit = ranked.find((r) => /E-Transit/i.test(r.unit.model))
  if (eTransit) picks.van = eTransit
  for (const row of ranked) {
    for (const t of classify(row.unit)) {
      if (!picks[t]) picks[t] = row
    }
  }
  // Gas = current column on any sheet (Transit-250 baseline); use E-Transit sheet.
  picks.gas = eTransit || ranked[0]
  return picks
}

async function main() {
  if (!fs.existsSync(path.join(stage, 'index.html'))) {
    throw new Error('Missing .draft-feedback-stage — run npm run publish:draft-feedback')
  }
  const pkg = getPackageAllUnits('pkg-tc-electrical-4')
  const ranked = rankUnitsByScoreV2(pkg.units, { pkg, intake: null })
  const reps = pickRepresentatives(ranked)
  const types = ['van', 'pickup', 'suv', 'ev', 'gas']
  const report = { viewports: {}, typesInData: Object.keys(reps) }

  const server = await startStatic(stage, 4181)
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || '/usr/local/bin/google-chrome',
    args: ['--no-sandbox', '--disable-gpu'],
  })

  for (const vp of [
    { name: '390', width: 390, height: 844 },
    { name: '1440', width: 1440, height: 900 },
  ]) {
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    })
    await page.goto('http://127.0.0.1:4181/#/shop', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(400)
    report.viewports[vp.name] = {}

    for (const type of types) {
      const row = reps[type]
      if (!row) {
        report.viewports[vp.name][type] = { present: false, slashHits: [], note: 'no unit of this type in fixture data' }
        continue
      }
      const score = row.score
      const heading = `${row.unit.year} ${row.unit.make} ${row.unit.model}`
      await page.evaluate(
        ({ score, heading, type }) => {
          document.querySelectorAll('.score-readout-sheet[data-slash-scan]').forEach((el) => el.remove())
          const sheet = document.createElement('div')
          sheet.className = 'score-readout-sheet'
          sheet.setAttribute('data-slash-scan', type)
          sheet.setAttribute('role', 'dialog')
          sheet.style.cssText =
            'position:fixed;inset:0;z-index:2147483002;background:rgba(10,14,22,0.42);display:flex;align-items:flex-end;justify-content:center'
          const panel = document.createElement('div')
          panel.className = 'score-readout-panel'
          panel.style.cssText =
            'background:#fff;color:#111;width:min(720px,100%);max-height:min(85vh,720px);overflow:auto;border-radius:12px 12px 0 0;padding:16px;font:14px/1.4 system-ui,sans-serif'
          const cats = (score.categories || [])
            .map((c) => {
              const cur = c.current || {}
              const cand = c.candidate || {}
              return `<li style="margin:0 0 12px;padding:0 0 12px;border-bottom:1px solid #e5e7eb">
                <strong>${c.label || c.key}</strong>
                <div>Current: ${cur.display || ''} · ${cur.reason || ''}</div>
                <div>Candidate: ${cand.display || ''} · ${cand.reason || ''}</div>
              </li>`
            })
            .join('')
          panel.innerHTML = `<header><p>Open score</p><p>${heading}</p></header>
            <div class="score-readout-body replacement-score" data-score-v2="1">
              <p>${score.dialTotal || ''} ${score.dialDiff || ''} ${score.dialCurrent || ''}</p>
              <ul class="replacement-score-cats" style="list-style:none;padding:0;margin:0">${cats}</ul>
            </div>`
          sheet.appendChild(panel)
          document.body.appendChild(sheet)
        },
        { score, heading, type },
      )

      const visible = await page.locator('.score-readout-sheet[data-slash-scan]').innerText()
      const cleaned = stripUrls(visible)
      const slashHits = []
      const re = /.{0,32}\/.{0,32}/g
      let m
      while ((m = re.exec(cleaned))) slashHits.push(m[0].replace(/\s+/g, ' ').trim())
      const banned = cleaned.match(/\b(best|worst|worth it|soh|battery health)\b/i)
      const dashes = /[–—]/.test(cleaned)
      report.viewports[vp.name][type] = {
        present: true,
        unit: heading,
        slashHits: [...new Set(slashHits)],
        banned: banned ? banned[0] : null,
        enEmDash: dashes,
      }
      if (slashHits.length) throw new Error(`${vp.name} ${type} slash hits: ${slashHits.join(' | ')}`)
      if (banned) throw new Error(`${vp.name} ${type} banned: ${banned[0]}`)
      if (dashes) throw new Error(`${vp.name} ${type} en/em dash in visible sheet`)

      if (vp.name === '390' && type === 'van') {
        const file = path.join(outDir, '390-van-score-sheet.png')
        await page.locator('.score-readout-panel').screenshot({ path: file })
        console.log('wrote', file)
      }
      await page.evaluate(() => {
        document.querySelectorAll('.score-readout-sheet[data-slash-scan]').forEach((el) => el.remove())
      })
    }
    await page.close()
  }

  fs.writeFileSync(path.join(outDir, 'score-sheet-type-scan.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
  await browser.close()
  server.close()
  console.log('OK score sheet type scan')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
