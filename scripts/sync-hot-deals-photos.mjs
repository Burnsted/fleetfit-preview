/**
 * CLEARED listing-photos slice — map considered units to hot-deals FACT rows,
 * download thumbnail_url, regenerate listingPhotos.js. Stub if no photo.
 *
 * Silverado EV pack thumbs (ranks 73 / 104 / 107) are cloth or studio teasers —
 * never assign as listing photos. Keep FACT listing metadata; force stub media.
 */
import { mkdir, writeFile, copyFile, readFile, unlink } from 'node:fs/promises'
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

/**
 * FACT pack index → considered unit ids.
 * Value is either a pack index number, or { idx, stubPhoto: true }.
 *
 * Blocked photo ranks (cloth / studio teaser — never listing media):
 *   73  → index 21 red-cloth "Images Coming Soon"
 *   104 → index 22 gray studio/teaser (Steve re-bar FAIL)
 *   107 → index 23 indoor studio booth (not outdoor/lot dealer exterior)
 */
const ASSIGN = {
  'unit-e1': 1, // 2023 E-Transit — outdoor/lot OK
  'unit-e2': { idx: 21, stubPhoto: true }, // Silverado WT FACT; photo blocked rank 73
  'unit-e3': 15, // 2022 Lightning Pro
  'unit-e4': 6, // 2024 ProMaster EV
  'unit-e5': 26, // 2026 Sierra EV — newly used truck freshness
  'unit-e6': 9, // 2025 BrightDrop 600 — newer van freshness
  'unit-l1': { idx: 23, stubPhoto: true }, // Silverado Trail Boss FACT; photo blocked rank 107
  'unit-l2': 16, // 2023 Lightning XLT
  'vnd-001': 14, // 2022 Lightning Pro
  'vnd-002': { idx: 22, stubPhoto: true }, // Silverado LT FACT; photo blocked rank 104
  'vnd-003': 24, // 2026 Sierra EV
  'vnd-004': 25, // 2026 Sierra EV
  'vnd-005': 19, // 2022 R1T
  'vnd-006': 31, // 2024 Cybertruck
  'vnd-007': 27, // 2023 Hummer EV
  'vnd-008': 32, // 2025 Cybertruck
}

/** Pack indices whose thumbnail_url must never be used as listing media */
const BLOCKED_PHOTO_INDICES = new Set([21, 22, 23]) // ranks 73, 104, 107
const BLOCKED_PHOTO_RANKS = new Set([73, 104, 107])

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

function normalizeAssign(raw) {
  if (raw != null && typeof raw === 'object') {
    return { idx: raw.idx, stubPhoto: Boolean(raw.stubPhoto) }
  }
  return { idx: raw, stubPhoto: false }
}

await mkdir(outDir, { recursive: true })
await mkdir(path.dirname(packPath), { recursive: true })

const uploadPack = '/home/ubuntu/.cursor/projects/workspace/uploads/hot-deals-ship-pack_e51d.json'
try {
  await copyFile(uploadPack, packPath)
} catch {
  try {
    await copyFile(
      '/home/ubuntu/.cursor/projects/workspace/uploads/hot-deals-ship-pack_2ed0.json',
      packPath,
    )
  } catch {
    /* pack may already exist */
  }
}

const pack = JSON.parse(await readFile(packPath, 'utf8'))

const rows = {}
const files = {}
/** cache downloaded buffers by pack index so shared assignments reuse one fetch */
const bufByIdx = new Map()

for (const [id, raw] of Object.entries(ASSIGN)) {
  const { idx, stubPhoto } = normalizeAssign(raw)
  const src = pack[idx]
  if (!src) throw new Error(`Missing pack row ${idx}`)

  const rank = src.rank
  const thumbBlocked =
    stubPhoto ||
    BLOCKED_PHOTO_INDICES.has(idx) ||
    BLOCKED_PHOTO_RANKS.has(rank)

  if (
    !stubPhoto &&
    (BLOCKED_PHOTO_INDICES.has(idx) || BLOCKED_PHOTO_RANKS.has(rank))
  ) {
    throw new Error(
      `Refusing cloth/studio teaser pack index ${idx} rank ${rank} for ${id} — set stubPhoto: true`,
    )
  }

  const thumb = src.thumbnail_url
  let hasPhoto = false
  let ext = 'jpg'

  if (thumb && !thumbBlocked) {
    try {
      let cached = bufByIdx.get(idx)
      if (!cached) {
        const res = await fetch(thumb, {
          headers: { 'User-Agent': 'FleetFitPreviewBot/1.0' },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const buf = Buffer.from(await res.arrayBuffer())
        const ct = res.headers.get('content-type') || ''
        if (ct.includes('png')) ext = 'png'
        else if (ct.includes('webp')) ext = 'webp'
        else ext = 'jpg'
        cached = { buf, ext }
        bufByIdx.set(idx, cached)
      }
      ext = cached.ext
      const file = `${id}.${ext}`
      await writeFile(path.join(outDir, file), cached.buf)
      files[id] = file
      hasPhoto = true
      console.log('OK', id, '←', idx, 'rank', rank, file, cached.buf.length)
    } catch (err) {
      console.warn('STUB', id, String(err.message || err))
      hasPhoto = false
    }
  } else if (thumbBlocked) {
    // Remove any prior downloaded teaser so Vite cannot re-bundle it
    for (const e of ['jpg', 'jpeg', 'png', 'webp']) {
      try {
        await unlink(path.join(outDir, `${id}.${e}`))
      } catch {
        /* absent */
      }
    }
    console.log(
      'STUB',
      id,
      '←',
      idx,
      'rank',
      rank,
      '(blocked cloth/studio teaser — Photo pending)',
    )
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
    // Do not expose blocked teaser URLs as usable listing thumbs
    thumbnail_url: hasPhoto ? thumb || null : null,
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
 * Silverado EV ranks 73/104/107 thumbs are cloth/studio teasers → stub (has_photo false).
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
