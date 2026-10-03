import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
  DEFAULT_YEARLY_MILES,
  DEFAULT_YEARS,
  GAS_TWIN_BUILD,
  YEAR_OPTIONS,
} from '../data/gasTwin/constants'

const STORAGE_KEY = 'fleetfit.gasTwin.session.v1'

const GasTwinContext = createContext(null)

function readSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function writeSession(state) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

export function GasTwinProvider({ children }) {
  const stored = typeof sessionStorage !== 'undefined' ? readSession() : null
  const [compareOn, setCompareOnState] = useState(
    stored?.compareOn === true ? true : false,
  )
  const [years, setYearsState] = useState(
    YEAR_OPTIONS.includes(stored?.years) ? stored.years : DEFAULT_YEARS,
  )
  const [yearlyMiles, setYearlyMilesState] = useState(
    stored?.yearlyMiles != null ? String(stored.yearlyMiles) : String(DEFAULT_YEARLY_MILES),
  )
  const [panelPairId, setPanelPairId] = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const persist = useCallback((next) => {
    writeSession(next)
  }, [])

  const setCompareOn = useCallback(
    (on) => {
      const v = on === true || on === 'On'
      setCompareOnState(v)
      persist({
        compareOn: v,
        years,
        yearlyMiles,
      })
    },
    [persist, years, yearlyMiles],
  )

  const setYears = useCallback(
    (n) => {
      const y = YEAR_OPTIONS.includes(n) ? n : DEFAULT_YEARS
      setYearsState(y)
      persist({ compareOn, years: y, yearlyMiles })
    },
    [persist, compareOn, yearlyMiles],
  )

  const setYearlyMiles = useCallback(
    (raw) => {
      const s = raw == null ? '' : String(raw)
      setYearlyMilesState(s)
      persist({ compareOn, years, yearlyMiles: s })
    },
    [persist, compareOn, years],
  )

  const openFullComparison = useCallback((pairId) => {
    setPanelPairId(pairId)
    setPanelOpen(true)
  }, [])

  const closeFullComparison = useCallback(() => {
    setPanelOpen(false)
    setPanelPairId(null)
  }, [])

  const value = useMemo(
    () => ({
      build: GAS_TWIN_BUILD,
      compareOn,
      setCompareOn,
      years,
      setYears,
      yearlyMiles,
      setYearlyMiles,
      panelOpen,
      panelPairId,
      openFullComparison,
      closeFullComparison,
    }),
    [
      compareOn,
      setCompareOn,
      years,
      setYears,
      yearlyMiles,
      setYearlyMiles,
      panelOpen,
      panelPairId,
      openFullComparison,
      closeFullComparison,
    ],
  )

  return <GasTwinContext.Provider value={value}>{children}</GasTwinContext.Provider>
}

export function useGasTwin() {
  const ctx = useContext(GasTwinContext)
  if (!ctx) {
    throw new Error('useGasTwin requires GasTwinProvider')
  }
  return ctx
}
