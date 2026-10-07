/**
 * Visible sheet notes vs formula-view sources for trade-in score.
 * Visible: plain-word facts only. Formula: keep sources; never slash-as-or.
 */

const SOURCE_INNER =
  /cars\.com|Car and Driver|Edmunds|Fuelly|EPA|OEM|brochure|listing|sourced|estimate|OSRM|ratio|NHTSA|Pulse|lowest across|third-party|INFERENCE|FACT|AAA|EIA|KBB|NOT MSRP/i

const SOURCE_PREFIX_FACT =
  /^(?:Fuelly(?:\s+crowd-sourced)?(?:\s+mpg)?|EV Pulse|cars\.com|Car and Driver(?:\s*(?:\/|and)\s*Edmunds)?|Edmunds|OEM estimate(?:,?\s*not EPA)?|brochure)[^:]*:\s*(.+)$/i

const SOURCE_ONLY_SEGMENT =
  /^(?:cars\.com|Car and Driver|Edmunds|EV Pulse|Fuelly|OEM estimate|not EPA|brochure|listing|sourced|estimate|NHTSA|lower used for candidate|CONFLICT)(?:\b.*)?$/i

/** Drop parentheticals that name a source; innermost-first so nesting stays balanced. */
function dropSourceParens(text) {
  let s = String(text)
  let changed = true
  while (changed) {
    changed = false
    s = s.replace(/\(([^()]*)\)/g, (full, inner) => {
      if (SOURCE_INNER.test(inner)) {
        changed = true
        return ''
      }
      return full
    })
  }
  // Drop orphan ) or ( left by nested source removal; keep balanced fact parens
  let depth = 0
  let out = ''
  for (const ch of s) {
    if (ch === '(') {
      depth += 1
      out += ch
    } else if (ch === ')') {
      if (depth === 0) continue
      depth -= 1
      out += ch
    } else {
      out += ch
    }
  }
  if (depth > 0) {
    let remove = depth
    out = [...out]
      .reverse()
      .map((ch) => {
        if (ch === '(' && remove > 0) {
          remove -= 1
          return ''
        }
        return ch
      })
      .reverse()
      .join('')
  }
  return out
}

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

/**
 * Soften engine jargon for visible sheet notes.
 * Sources move to the formula view only.
 */
export function scrubSheetReason(reason) {
  if (reason == null) return ''
  let s = String(reason)
  s = s.replace(/\u2013|\u2014/g, '-')
  s = s.replace(/\s*\(OSRM\)/gi, '')
  s = s.replace(/\s*\(ratio\s+[\d.]+\)/gi, '')
  s = s.replace(/\bratio\s+[\d.]+/gi, '')
  s = s.replace(/\s*(?:\u2192|\u27F6|\u27A1|\u2794|->)\s*/g, ' to ')
  s = s.replace(/\u2264/g, 'up to ')
  s = s.replace(/\u2265/g, 'at least ')
  s = s.replace(/\broad\s+mi\b/gi, 'road miles')

  // Drop parentheticals that are source or meta tags (balanced)
  s = dropSourceParens(s)

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
      p = p.replace(/\bFord\s+\d{4}\s+Transit\s+brochure\b/gi, '')
      p = p.replace(/\bbrochure\b/gi, '')
      p = p.replace(/\blisting\b/gi, '')
      p = p.replace(/\bsourced\b/gi, '')
      p = p.replace(/\bestimate\b/gi, '')
      p = p.replace(/\blowest across[^;)]*/gi, '')
      p = p.replace(/\bcab not entered\b/gi, '')
      p = p.replace(/\slower used for candidate\b/gi, '')
      p = p.replace(/\bNOT MSRP\b/gi, '')
      return p.trim()
    })
    .filter(Boolean)
    .join(' \u00b7 ')

  s = cleanupPunctuation(s)

  // Second pass if scrub left broken punctuation
  if (hasBrokenSheetPunctuation(s)) {
    s = cleanupPunctuation(
      s
        .replace(/\(:/g, '(')
        .replace(/\( /g, '(')
        .replace(/ \)/g, ')')
        .replace(/\(\)/g, '')
        .replace(/^[;,:]+\s*/, '')
        .replace(/\s*[;,:]+$/, ''),
    )
  }
  return s
}

/**
 * Formula-view source text: keep names; never use slash-as-or between them.
 */
export function formatFormulaSourceText(reason) {
  if (reason == null) return ''
  let s = String(reason)
  s = s.replace(/\u2013|\u2014/g, '-')
  s = s.replace(/\bCar and Driver\s*\/\s*Edmunds\b/gi, 'Car and Driver and Edmunds')
  // Space-slash-space is source alternation, not units like mi/kWh
  s = s.replace(/\s+\/\s+/g, ' and ')
  return s.trim()
}

/** Collect formula-view source lines from a score (raw engine reasons). */
export function formulaSourceLines(score) {
  const lines = []
  for (const row of score?.categories || []) {
    for (const side of ['current', 'candidate']) {
      const cell = row[side]
      const raw = cell?.reason
      if (!raw || !String(raw).trim()) continue
      const formatted = formatFormulaSourceText(raw)
      if (!formatted) continue
      // Only list rows that actually carry a source name or citation tag
      if (
        !/(cars\.com|Car and Driver|Edmunds|EV Pulse|Fuelly|OEM|EPA|brochure|listing|NHTSA|AAA|EIA|KBB|OSRM|sourced|estimate)/i.test(
          formatted,
        )
      ) {
        continue
      }
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
