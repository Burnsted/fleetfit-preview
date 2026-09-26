import { useState } from 'react'
import ScoreDial from './ScoreDial'
import ScoreReadoutSheet from './ScoreReadoutSheet'

/** Dial + tap-open full Replacement Score readout (+ OEM Specs). */
export default function ScoreDialControl({
  score,
  rank = null,
  size = 'card',
  heading = null,
  unit = null,
  className = '',
}) {
  const [open, setOpen] = useState(false)
  if (!score) return null

  return (
    <>
      <ScoreDial
        score={score}
        rank={rank}
        size={size}
        className={className}
        onOpen={() => setOpen(true)}
      />
      <ScoreReadoutSheet
        open={open}
        onClose={() => setOpen(false)}
        score={score}
        rank={rank}
        heading={heading}
        unit={unit}
      />
    </>
  )
}
