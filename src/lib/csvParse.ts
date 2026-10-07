/** Minimal CSV parser (quoted fields, commas). */

export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let i = 0
  let inQuotes = false
  const s = String(text || '').replace(/^\uFEFF/, '')
  while (i < s.length) {
    const ch = s[i]
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          cell += '"'
          i += 2
          continue
        }
        inQuotes = false
        i += 1
        continue
      }
      cell += ch
      i += 1
      continue
    }
    if (ch === '"') {
      inQuotes = true
      i += 1
      continue
    }
    if (ch === ',') {
      row.push(cell)
      cell = ''
      i += 1
      continue
    }
    if (ch === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
      i += 1
      continue
    }
    if (ch === '\r') {
      i += 1
      continue
    }
    cell += ch
    i += 1
  }
  if (cell.length || row.length) {
    row.push(cell)
    rows.push(row)
  }
  if (!rows.length) return []
  const headers = rows[0].map((h) => h.trim())
  return rows.slice(1).filter((r) => r.some((c) => String(c).trim() !== '')).map((r) => {
    const obj: Record<string, string> = {}
    headers.forEach((h, idx) => {
      obj[h] = r[idx] != null ? String(r[idx]) : ''
    })
    return obj
  })
}

export function numOrNull(value: unknown): number | null {
  if (value == null || value === '') return null
  const s = String(value).trim()
  if (!s || /^unknown$/i.test(s) || /^n\/a$/i.test(s) || /^not published$/i.test(s)) {
    return null
  }
  const cleaned = s.replace(/,/g, '').replace(/^\~/, '')
  const m = cleaned.match(/-?\d+(\.\d+)?/)
  if (!m) return null
  const n = Number(m[0])
  return Number.isFinite(n) ? n : null
}

export function isFactLabel(label: string | undefined | null): boolean {
  if (!label) return false
  const l = String(label).toUpperCase()
  // Treat INF and INFERENCE as equivalent non-FACT for failure-pattern counting
  if (l.includes('UNKNOWN')) return false
  if (l.startsWith('INF') || l.includes('INFERENCE') || l.includes('ALLEGED')) return false
  return l.includes('FACT')
}

export function isAcceptedRetainedLabel(label: string | undefined | null): boolean {
  if (!label) return false
  const l = String(label).toUpperCase()
  if (l.includes('UNKNOWN') || l.includes('N/A')) return false
  // Reject INF / listing-sample ratios / weak CarResaleValue
  if (l.includes('INFERENCE') || l.startsWith('INF ') || l === 'INF') return false
  if (l.includes('WEAK') && l.includes('INF')) return false
  return l.includes('FACT')
}
