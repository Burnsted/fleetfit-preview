/**
 * Ted: every complete score displays out of 100.
 * score = (points earned / points possible) × 100, one decimal.
 * Factor rows are rescaled so they sum exactly to each total.
 */
import { round1 } from '../data/scoreV2Rubric'

export const SCORE_OUT_OF = 100

/**
 * Rescale a complete score so pointsPossible is 100 and every counted
 * factor row sums exactly to the out-of-100 total.
 */
export function normalizeScoreOutOf100(score) {
  if (!score || score.incomplete) return score
  const pp = Number(score.pointsPossible) || 0
  if (pp <= 0) return score
  if (pp === SCORE_OUT_OF) {
    if (score.candidateTotal == null) return score
    const cand = Number(score.candidateTotal)
    const cur = score.currentTotal == null ? null : Number(score.currentTotal)
    const diff =
      cur == null || score.difference == null
        ? score.difference
        : round1(cand - cur)
    return {
      ...score,
      pointsPossible: SCORE_OUT_OF,
      difference: diff,
      dialTotal: `${cand.toFixed(1)} out of ${SCORE_OUT_OF}`,
      dialDiff:
        diff == null
          ? null
          : `${diff > 0 ? '+' : ''}${diff.toFixed(1)} vs current`,
      dialCurrent: cur == null ? null : `Current ${cur.toFixed(1)}`,
      scaledOutOf100: true,
    }
  }

  const scale = SCORE_OUT_OF / pp
  const targetCur =
    score.currentTotal == null
      ? null
      : round1(Number(score.currentTotal) * scale)
  const targetCand =
    score.candidateTotal == null
      ? null
      : round1(Number(score.candidateTotal) * scale)

  function scaleCell(cell) {
    if (!cell?.counted || cell.points == null) return cell
    const pts = round1(Number(cell.points) * scale)
    const disp = String(cell.display ?? '').trim()
    const next = { ...cell, points: pts }
    if (/^\d+(\.\d+)?$/.test(disp)) next.display = pts.toFixed(1)
    return next
  }

  const categories = (score.categories || []).map((row) => ({
    ...row,
    current: scaleCell(row.current),
    candidate: scaleCell(row.candidate),
  }))

  function adjustToTarget(side, target) {
    if (target == null) return
    let sum = 0
    let last = -1
    for (let i = 0; i < categories.length; i += 1) {
      const cell = categories[i][side]
      if (cell?.counted) {
        sum = round1(sum + (Number(cell.points) || 0))
        last = i
      }
    }
    if (last < 0 || sum === target) return
    const delta = round1(target - sum)
    const cell = categories[last][side]
    const pts = round1((Number(cell.points) || 0) + delta)
    const disp = String(cell.display ?? '').trim()
    categories[last][side] = {
      ...cell,
      points: pts,
      display: /^\d+(\.\d+)?$/.test(disp) ? pts.toFixed(1) : cell.display,
    }
  }
  adjustToTarget('current', targetCur)
  adjustToTarget('candidate', targetCand)

  const difference =
    targetCur == null || targetCand == null
      ? null
      : round1(targetCand - targetCur)

  return {
    ...score,
    categories,
    currentTotal: targetCur,
    candidateTotal: targetCand,
    pointsPossible: SCORE_OUT_OF,
    difference,
    dialTotal:
      targetCand == null
        ? null
        : `${targetCand.toFixed(1)} out of ${SCORE_OUT_OF}`,
    dialDiff:
      difference == null
        ? null
        : `${difference > 0 ? '+' : ''}${difference.toFixed(1)} vs current`,
    dialCurrent:
      targetCur == null ? null : `Current ${targetCur.toFixed(1)}`,
    total: targetCand,
    scaledOutOf100: true,
    rawPointsPossible: pp,
  }
}
