/**
 * Tiny minify for the single-file widget (no build toolchain required).
 * Strips block/line comments and collapses safe whitespace.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const src = path.join(__dirname, '../src/feedback-widget.js')
const distDir = path.join(__dirname, '../dist')
const out = path.join(distDir, 'feedback-widget.min.js')

let code = fs.readFileSync(src, 'utf8')
// Remove block comments
code = code.replace(/\/\*[\s\S]*?\*\//g, '')
// Remove line comments (not inside strings — heuristic)
code = code.replace(/(^|[^:\\])\/\/.*$/gm, '$1')
// Collapse whitespace
code = code.replace(/\s+/g, ' ').trim()
// Keep a short banner
const banner =
  '/*! Fleet Feedback Widget (fbw) v1 — vanilla, zero deps. See feedback-widget/README.md */\n'
fs.mkdirSync(distDir, { recursive: true })
fs.writeFileSync(out, banner + code + '\n')
const hash = crypto.createHash('sha256').update(fs.readFileSync(out)).digest('hex')
console.log('wrote', out)
console.log('sha256', hash)
console.log('bytes', fs.statSync(out).size)
