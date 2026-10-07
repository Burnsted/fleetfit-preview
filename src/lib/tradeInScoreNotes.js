/**
 * Visible sheet notes vs formula-view detail for trade-in score.
 * Visible: one short plain line. Formula: full engine text; never slash-as-or.
 */

export const VISIBLE_NOTE_MAX = 60

const SOURCE_PREFIX_FACT =
  /^(?:Fuelly(?:\s+crowd-sourced)?(?:\s+mpg)?|EV Pulse|cars\.com|Car and Driver(?:\s*(?:\/|and)\s*Edmunds)?|Edmunds|OEM estimate(?:,?\s*not EPA)?|brochure)[^:]*:\s*(.+)$/i

const SOURCE_ONLY_SEGMENT =
  /^(?:cars\.com|Car and Driver|Edmunds|EV Pulse|Fuelly|OEM estimate|not EPA|brochure|listing|sourced|estimate|NHTSA|lower used for candidate|CONFLICT|Argonne)(?:\b.*)?$/i

/**
 * True when visible note text has broken punctuation left by source scrubbing.
 */
export function hasBrokenSheetPunctuation(text) {
  if (text == null) return false
  const s = String(text)
  if (/\(:/.test(s)) return true
  if (/\( /.test(s)) return true
  if (/ \)/.test(s)) return true
  if (/\(\)/.test(s)) return true
  const t = s.trim()
  if (/^[;,:]/.test(t)) return true
  if (/[;,:]$/.test(t)) return true
  return false
}

/** Nested parentheses or any parenthesis chain left in a visible note. */
export function hasNestedOrChainedParens(text) {
  if (text == null) return false
  const s = String(text)
  if (!s.includes('(') && !s.includes(')')) return false
  // Any parentheses in visible notes are banned (chains / engine asides).
  return /[()]/.test(s)
}

/** Visible money must be at most 2 decimal places. */
export function hasExcessMoneyDecimals(text) {
  if (text == null) return false
  return /\$\d[\d,]*\.\d{3,}/.test(String(text))
}

function cleanupPunctuation(s) {
  let out = s
  out = out.replace(/\(:/g, '(')
  out = out.replace(/\(\s+/g, '(')
  out = out.replace(/\s+\)/g, ')')
  out = out.replace(/\(\)/g, '')
  out = out.replace(/\(\s*[;,]+\s*/g, '(')
  out = out.replace(/[;,]\s*\)/g, ')')
  out = out.replace(/\s*;\s*;+/g, ';')
  out = out.replace(/\s*,\s*,+/g, ',')
  out = out.replace(/\s*\u00b7\s*\u00b7+/g, ' \u00b7 ')
  out = out.replace(/\s{2,}/g, ' ')
  out = out.replace(/\s+([.,;:])/g, '$1')
  out = out.replace(/^\s*[\u00b7;,:.\-]+\s*/, '')
  out = out.replace(/\s*[\u00b7;,:.\-]+\s*$/, '')
  return out.trim()
}

/** Format a numeric money amount as $X.XX with thousands separators. */
export function formatMoneyCents(n) {
  const num = Number(n)
  if (!Number.isFinite(num)) return ''
  return `$${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * Soften engine jargon for visible sheet notes.
 * One short plain line; sources and asides move to the formula view.
 */
export function scrubSheetReason(reason) {
  if (reason == null) return ''
  let s = String(reason)
  s = s.replace(/\u2013|\u2014|\u2212/g, '-')
  s = s.replace(/\s*\(OSRM\)/gi, '')
  s = s.replace(/\s*\(ratio\s+[\d.]+\)/gi, '')
  s = s.replace(/\bratio\s+[\d.]+/gi, '')
  s = s.replace(/\s*(?:\u2192|\u27F6|\u27A1|\u2794|->)\s*/g, ' to ')
  s = s.replace(/\u2264/g, 'up to ')
  s = s.replace(/\u2265/g, 'at least ')
  s = s.replace(/\broad\s+mi\b/gi, 'road miles')

  // Drop every parenthetical (engine asides, sources, meta)
  let prev
  do {
    prev = s
    s = s.replace(/\([^()]*\)/g, '')
  } while (s !== prev)
  s = s.replace(/[()]/g, '')

  // Drop · segments that are source-only; keep fact after "Source: fact"
  s = s
    .split(/\s*\u00b7\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      let p = part
      const factAfter = p.match(SOURCE_PREFIX_FACT)
      if (factAfter) {
        p = factAfter[1].trim()
      } else if (SOURCE_ONLY_SEGMENT.test(p)) {
        return ''
      }
      p = p.replace(/\bcars\.com\b/gi, '')
      p = p.replace(/\bCar and Driver(?:\s*(?:\/|and)\s*Edmunds)?\b/gi, '')
      p = p.replace(/\bEdmunds\b/gi, '')
      p = p.replace(/\bEV Pulse\b/gi, '')
      p = p.replace(/\bFuelly(?:\s+crowd-sourced)?\b/gi, '')
      p = p.replace(/\bOEM estimate(?:,?\s*not EPA)?\b/gi, '')
      p = p.replace(/\bnot EPA(?:-rated)?\b/gi, '')
      p = p.replace(/\bEPA\b/g, '')
      p = p.replace(/\bNHTSA\b/g, '')
      p = p.replace(/\bKBB\b/g, '')
      p = p.replace(/\bAAA\b/g, '')
      p = p.replace(/\bEIA\b/g, '')
      p = p.replace(/\bArgonne\b/gi, '')
      p = p.replace(/\bFord\s+\d{4}\s+Transit\s+brochure\b/gi, '')
      p = p.replace(/\bbrochure\b/gi, '')
      p = p.replace(/\blisting\b/gi, '')
      p = p.replace(/\bsourced\b/gi, '')
      p = p.replace(/\bestimate\b/gi, '')
      p = p.replace(/\blowest across[^;)]*/gi, '')
      p = p.replace(/\bcab not entered\b/gi, '')
      p = p.replace(/\slower used for candidate\b/gi, '')
      p = p.replace(/\bNOT MSRP\b/gi, '')
      p = p.replace(/\blast-3-yr private-party\b/gi, '')
      p = p.replace(/\bvalue lost next 3 yr basis\b/gi, '')
      p = p.replace(/\ball engines and body styles\b/gi, '')
      p = p.replace(/\bopen status not checked\b/gi, '')
      p = p.replace(/\bno VIN lookup\b/gi, '')
      p = p.replace(/\bone step below confirmed\b/gi, '')
      p = p.replace(/\bno failure patterns counted\b/gi, '')
      p = p.replace(/\bscheduled-only\b/gi, '')
      p = p.replace(/\bdepreciation page\b/gi, '')
      p = p.replace(/\bengine not entered\b/gi, '')
      p = p.replace(/\bhighest published mpg for\b/gi, 'mpg for')
      p = p.replace(/\bBattery capacity floor\b/gi, 'floor')
      p = p.replace(/\bFL regular\b/gi, '')
      p = p.replace(/\bFL commercial\b/gi, '')
      return p.trim()
    })
    .filter(Boolean)
    .join(' \u00b7 ')

  // Round every $ to cents and mark Example beside it
  s = s.replace(/\$(\d[\d,]*(?:\.\d+)?)/g, (_, raw) => {
    const num = Number(String(raw).replace(/,/g, ''))
    if (!Number.isFinite(num)) return `$${raw}`
    return `${formatMoneyCents(num)} Example`
  })

  s = cleanupPunctuation(s)
  s = s.replace(/\s*;\s*/g, ' · ')
  s = s.replace(/\s*\u00b7\s*\u00b7+/g, ' \u00b7 ')
  s = cleanupPunctuation(s)

  // Prefer the first plain fact clause; hard-cap length
  if (s.length > VISIBLE_NOTE_MAX) {
    const clauses = s.split(/\s*\u00b7\s*/).filter(Boolean)
    s = clauses[0] || s
    if (s.length > VISIBLE_NOTE_MAX) {
      s = `${s.slice(0, VISIBLE_NOTE_MAX - 1).trim()}…`
    }
  }

  if (hasBrokenSheetPunctuation(s)) {
    s = cleanupPunctuation(
      s
        .replace(/\(:/g, '')
        .replace(/[()]/g, '')
        .replace(/^[;,:]+\s*/, '')
        .replace(/\s*[;,:]+$/, ''),
    )
  }
  // Final guarantee: no parens in visible notes
  s = s.replace(/[()]/g, '')
  s = cleanupPunctuation(s)
  if (s.length > VISIBLE_NOTE_MAX) {
    s = `${s.slice(0, VISIBLE_NOTE_MAX - 1).trim()}…`
  }
  return s
}

/**
 * Formula-view text: keep names and detail; never use slash-as-or between sources.
 */
export function formatFormulaSourceText(reason) {
  if (reason == null) return ''
  let s = String(reason)
  s = s.replace(/\u2013|\u2014/g, '-')
  s = s.replace(/\bCar and Driver\s*\/\s*Edmunds\b/gi, 'Car and Driver and Edmunds')
  s = s.replace(/\s+\/\s+/g, ' and ')
  // Round money; mark Example beside each $ so proximity gates pass in formula view
  s = s.replace(/\$(\d[\d,]*(?:\.\d+)?)/g, (_, raw) => {
    const num = Number(String(raw).replace(/,/g, ''))
    if (!Number.isFinite(num)) return `$${raw}`
    return `${formatMoneyCents(num)} Example`
  })
  return s.trim()
}

/** Collect formula-view detail lines from a score (raw engine reasons). */
export function formulaSourceLines(score) {
  const lines = []
  for (const row of score?.categories || []) {
    for (const side of ['current', 'candidate']) {
      const cell = row[side]
      const raw = cell?.reason
      if (!raw || !String(raw).trim()) continue
      const formatted = formatFormulaSourceText(raw)
      if (!formatted) continue
      lines.push({
        key: `${row.key}-${side}`,
        label: row.label,
        side: side === 'current' ? 'Trade-in' : 'Replacement',
        text: formatted,
      })
    }
  }
  return lines
}
