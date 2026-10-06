/**
 * Build FleetFit with base ./ and stage dist into draft-feedback/ for gh-pages.
 * Rewrites widget script src to relative path and data-build to the main JS hash.
 * Does NOT touch gh-pages root; caller must copy only draft-feedback/.
 */
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

// 1) Minify widget and copy into public for Vite copy-through
execSync('node feedback-widget/scripts/minify.mjs', { cwd: root, stdio: 'inherit' })
const widgetSrc = path.join(root, 'feedback-widget/dist/feedback-widget.min.js')
const publicWidgetDir = path.join(root, 'public/feedback-widget')
fs.mkdirSync(publicWidgetDir, { recursive: true })
fs.copyFileSync(widgetSrc, path.join(publicWidgetDir, 'feedback-widget.min.js'))

// 2) Build with base ./
execSync('npx vite build --base ./', { cwd: root, stdio: 'inherit' })

const dist = path.join(root, 'dist')
const indexPath = path.join(dist, 'index.html')
let html = fs.readFileSync(indexPath, 'utf8')

// Find built JS asset hash (assets/index-XXXX.js)
const m = html.match(/assets\/index-([A-Za-z0-9_-]+)\.js/)
const buildHash = m ? m[1] : 'unknown'
console.log('build hash', buildHash)

// Rewrite widget script for draft relative hosting
html = html.replace(
  /src="[^"]*feedback-widget\.min\.js"/,
  'src="./feedback-widget/feedback-widget.min.js"',
)
html = html.replace(/data-build="[^"]*"/, `data-build="${buildHash}"`)
fs.writeFileSync(indexPath, html)

// Ensure widget is in dist
const distWidget = path.join(dist, 'feedback-widget/feedback-widget.min.js')
fs.mkdirSync(path.dirname(distWidget), { recursive: true })
fs.copyFileSync(widgetSrc, distWidget)

// Stage folder for gh-pages commit
const stage = path.join(root, '.draft-feedback-stage')
fs.rmSync(stage, { recursive: true, force: true })
fs.cpSync(dist, stage, { recursive: true })

const report = {
  buildHash,
  widgetSha256: sha256(distWidget),
  indexSha256: sha256(indexPath),
  css: null,
  js: null,
}
const assets = fs.readdirSync(path.join(dist, 'assets'))
for (const f of assets) {
  if (f.endsWith('.js')) report.js = { name: f, sha256: sha256(path.join(dist, 'assets', f)) }
  if (f.endsWith('.css')) report.css = { name: f, sha256: sha256(path.join(dist, 'assets', f)) }
}
fs.writeFileSync(path.join(root, 'artifacts/voice-feedback/build-report.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
console.log('staged at', stage)
