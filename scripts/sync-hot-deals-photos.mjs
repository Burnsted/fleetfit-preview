/**
 * CLEARED listing-photos slice — map considered units to hot-deals FACT rows,
 * download thumbnail_url, regenerate listingPhotos.js. Stub if no photo.
 */
import { mkdir, writeFile, copyFile, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const packPath = path.join(
  root,
  'fleetfit/product/listing-photos/hot-deals-ship-pack.json',
)
const outDir = path.join(root, 'src/assets/listings')
const outJs = path.join(root, 'src/data/listingPhotos.js')

/** Distinct FACT rows from pack → considered unit ids */
const ASSIGN = {
  'unit-e1': 1, // 2023 E-Transit
  'unit-e2': 21, // 2024 Silverado EV WT
  'unit-e3': 15, // 2022 Lightning Pro (URL match)
  'unit-e4': 6, // 2024 ProMaster EV (URL match)
  'unit-l1': 22, // 2026 Silverado EV LT
  'unit-l2': 16, // 2023 Lightning XLT
  'vnd-001': 14, // 2022 Lightning Pro
  'vnd-002': 22, // conflict — fixed below
  'vnd-003': 24, // 2026 Sierra EV
  'vnd-004': 25, // 2026 Sierra EV
  'vnd-005': 19, // 2022 R1T
  'vnd-006': 31, // 2024 Cybertruck (URL match)
  'vnd-007': 27, // 2023 Hummer EV
  'vnd-008': 32, // 2025 Cybertruck
}

// vnd-002 URL-matched Silverado LT is index 22; unit-l1 also wanted 22 — split
ASSIGN['unit-l1'] = 23 // Trail Boss Extended
ASSIGN['vnd-002'] = 22

const ALIASES = {
  'strip-lightning': 'unit-e3',
  'strip-cyber': 'vnd-006',
  'strip-r1t': 'vnd-005',
  hero: 'unit-e3',
}

function cleanModel(model) {
  return String(model || '')
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanTrim(trim, model) {
  const t = String(trim || '').trim()
  if (!t || /^e?FWD/i.test(t)) return ''
  if (cleanModel(model).includes(t)) return ''
  return t.slice(0, 40)
}

await mkdir(outDir, { recursive: true })
await mkdir(path.dirname(packPath), { recursive: true })

const uploadPack = '/home/ubuntu/.cursor/projects/workspace/uploads/hot-deals-ship-pack_2ed0.json'
try {
  await copyFile(uploadPack, packPath)
} catch {
  /* pack may already exist */
}

const pack = JSON.parse(await readFile(packPath, 'utf8'))
const used = new Set()
for (const [id, idx] of Object.entries(ASSIGN)) {
  if (used.has(idx)) throw new Error(`Duplicate pack index ${idx} for ${id}`)
  used.add(idx)
}

const rows = {}
const files = {}

for (const [id, idx] of Object.entries(ASSIGN)) {
  const src = pack[idx]
  if (!src) throw new Error(`Missing pack row ${idx}`)
  const thumb = src.thumbnail_url
  let hasPhoto = false
  let ext = 'jpg'
  if (thumb) {
    try {
      const res = await fetch(thumb, {
        headers: { 'User-Agent': 'FleetFitPreviewBot/1.0' },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      const ct = res.headers.get('content-type') || ''
      if (ct.includes('png')) ext = 'png'
      else if (ct.includes('webp')) ext = 'webp'
      else ext = 'jpg'
      const file = `${id}.${ext}`
      await writeFile(path.join(outDir, file), buf)
      files[id] = file
      hasPhoto = true
      console.log('OK', id, '←', idx, file, buf.length)
    } catch (err) {
      console.warn('STUB', id, String(err.message || err))
      hasPhoto = false
    }
  }

  rows[id] = {
    id,
    year: src.year,
    make: src.make,
    model: cleanModel(src.model),
    trim: cleanTrim(src.trim, src.model),
    price_usd: src.price_usd,
    mileage: src.mileage,
    dealer: src.dealer,
    city: src.city,
    state: src.state,
    listing_url: src.listing_url,
    source_site: src.source_site,
    drivetrain: src.drivetrain || '',
    thumbnail_url: thumb || null,
    has_photo: hasPhoto,
  }
}

const importLines = Object.entries(files)
  .map(([id, file]) => {
    const varName = id.replace(/-/g, '_')
    return `import ${varName} from '../assets/listings/${file}'`
  })
  .join('\n')

const fileMap = Object.keys(files)
  .map((id) => `  '${id}': ${id.replace(/-/g, '_')},`)
  .join('\n')

const rowMap = Object.entries(rows)
  .map(([id, row]) => `  '${id}': ${JSON.stringify(row)},`)
  .join('\n')

const aliasMap = Object.entries(ALIASES)
  .map(([k, v]) => `  '${k}': '${v}',`)
  .join('\n')

const js = `/**
 * FACT Hot Deals listing photos for considered units.
 * Generated from hot-deals-ship-pack.json thumbnail_url rows.
 * Never invent VIN / price / miles / dealer. No OEM / lifestyle stock for considered.
 * CLEARED listing-photos · 2026-09-26
 */
${importLines}

export const LISTING_PHOTO_FILES = {
${fileMap}
}

export const LISTING_ALIASES = {
${aliasMap}
}

export const LISTING_ROWS = {
${rowMap}
}
`

await writeFile(outJs, js)
console.log('Wrote', outJs, 'rows', Object.keys(rows).length, 'photos', Object.keys(files).length)
