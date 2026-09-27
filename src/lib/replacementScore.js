/**
 * Replacement Score facade — v2 engine (CLEARED-FOR-WOZ-SCORE-V2).
 * Retires v1 weights, specUnknown cap, and Life Delta category.
 */
export {
  SCORE_V2_BUILD as SCORE_BUILD,
  scoreReplacementV2 as scoreReplacementUnit,
  rankUnitsByScoreV2 as rankUnitsByReplacementScore,
  parseJobFromIntake,
  parseCurrentFromIntake,
  parseTradeInModel,
  scoreV2ValidationExample,
} from './scoreV2'

export { SCORE_V2_BUILD } from '../data/scoreV2Rubric'

export function currentMilesForScore(intake, pkg) {
  const n = (v) => {
    if (v == null || v === '') return null
    const x = Number(v)
    return Number.isFinite(x) ? x : null
  }
  return (
    n(intake?.current?.miles) ??
    n(intake?.currentMiles) ??
    n(intake?.currentMileage) ??
    n(pkg?.currentMileage) ??
    null
  )
}
