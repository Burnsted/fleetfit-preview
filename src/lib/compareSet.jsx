import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

export const COMPARE_MAX = 4
const STORAGE_KEY = 'fleetfit-compare-set'
const PEEK_MS = 2400

function readStored() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null')
    if (!parsed || typeof parsed.packageId !== 'string' || !Array.isArray(parsed.unitIds)) {
      return { packageId: null, unitIds: [] }
    }
    return {
      packageId: parsed.packageId,
      unitIds: parsed.unitIds.filter((id) => typeof id === 'string').slice(0, COMPARE_MAX),
    }
  } catch {
    return { packageId: null, unitIds: [] }
  }
}

const CompareSetContext = createContext(null)

export function CompareSetProvider({ children }) {
  const [set, setSet] = useState(readStored)
  const [trayOpen, setTrayOpen] = useState(false)
  const [maxPrompt, setMaxPrompt] = useState(null)
  const hideTimer = useRef(null)

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(set))
    } catch {
      /* ignore quota */
    }
  }, [set])

  useEffect(() => () => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
  }, [])

  const cancelHide = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
      hideTimer.current = null
    }
  }, [])

  const peekThenHide = useCallback(() => {
    cancelHide()
    setTrayOpen(true)
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    hideTimer.current = window.setTimeout(() => {
      setTrayOpen(false)
      hideTimer.current = null
    }, reduce ? 0 : PEEK_MS)
  }, [cancelHide])

  const add = useCallback((packageId, unitId) => {
    if (!packageId || !unitId) return { ok: false }
    let result = { ok: true }
    setSet((prev) => {
      if (prev.packageId === packageId && prev.unitIds.includes(unitId)) {
        result = { ok: true, already: true }
        return prev
      }
      if (prev.packageId === packageId && prev.unitIds.length >= COMPARE_MAX) {
        result = { ok: false, atMax: true }
        return prev
      }
      if (prev.packageId !== packageId) {
        return { packageId, unitIds: [unitId] }
      }
      return { packageId, unitIds: [...prev.unitIds, unitId] }
    })
    if (result.atMax) {
      setMaxPrompt({ packageId, unitId })
      cancelHide()
      setTrayOpen(true)
      return result
    }
    setMaxPrompt(null)
    peekThenHide()
    return result
  }, [cancelHide, peekThenHide])

  const remove = useCallback((unitId) => {
    setSet((prev) => {
      const unitIds = prev.unitIds.filter((id) => id !== unitId)
      return unitIds.length ? { ...prev, unitIds } : { packageId: null, unitIds: [] }
    })
  }, [])

  const replace = useCallback((removeId, packageId, unitId) => {
    if (!packageId || !unitId) return
    setSet((prev) => {
      const kept = prev.packageId === packageId
        ? prev.unitIds.filter((id) => id !== removeId)
        : []
      if (kept.includes(unitId) || kept.length >= COMPARE_MAX) {
        return { packageId, unitIds: kept }
      }
      return { packageId, unitIds: [...kept, unitId] }
    })
    setMaxPrompt(null)
    peekThenHide()
  }, [peekThenHide])

  const clear = useCallback(() => {
    setSet({ packageId: null, unitIds: [] })
    setTrayOpen(false)
    setMaxPrompt(null)
    cancelHide()
  }, [cancelHide])

  const value = useMemo(() => ({
    packageId: set.packageId,
    unitIds: set.unitIds,
    count: set.unitIds.length,
    trayOpen,
    maxPrompt,
    has: (packageId, unitId) => set.packageId === packageId && set.unitIds.includes(unitId),
    idsFor: (packageId) => (set.packageId === packageId ? set.unitIds : []),
    add,
    remove,
    replace,
    clear,
    openTray: () => {
      cancelHide()
      setTrayOpen(true)
    },
    closeTray: () => {
      cancelHide()
      setTrayOpen(false)
    },
    dismissMax: () => setMaxPrompt(null),
  }), [set, trayOpen, maxPrompt, add, remove, replace, clear, cancelHide])

  return (
    <CompareSetContext.Provider value={value}>
      {children}
    </CompareSetContext.Provider>
  )
}

export function useCompareSet() {
  const ctx = useContext(CompareSetContext)
  if (!ctx) {
    throw new Error('useCompareSet must be used inside CompareSetProvider')
  }
  return ctx
}

export function unitWhisper(unit) {
  const model = String(unit?.model || '')
  if (/e-transit/i.test(model)) return 'E-Transit'
  if (/lightning/i.test(model)) return 'Lightning'
  if (/silverado/i.test(model)) return 'Silverado'
  if (/promaster/i.test(model)) return 'ProMaster'
  return model || 'EV'
}
