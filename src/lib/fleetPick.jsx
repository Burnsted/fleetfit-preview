import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  fleetCatalogKey,
  fleetListingKey,
  fleetUnitKey,
  toggleFleetPick,
} from './fleetPickKeys'
import {
  appendPlanItem,
  collectPlanPickIds,
  createPackagePlanItem,
  createVehiclePlanItem,
  dropPickIds,
  mergePickIds,
  planExampleTotal,
  planUnitCount,
  removePickFromPlan,
  removePlanItemById,
} from './fleetPlanModel'
import { resolveFleetPickMeta, resolvePackagePlanMeta } from './resolveFleetPickMeta'

export {
  fleetCatalogKey,
  fleetListingKey,
  fleetUnitKey,
  toggleFleetPick,
}

const STORAGE_KEY = 'fleetfit-fleet-picks'
const PLAN_STORAGE_KEY = 'fleetfit-fleet-plan'
const FleetPickContext = createContext(null)

function readPicks() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

function readPlan() {
  try {
    const raw = sessionStorage.getItem(PLAN_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((row) => row && row.id) : []
  } catch {
    return []
  }
}

export function FleetPickProvider({ children }) {
  const [ids, setIds] = useState(readPicks)
  const [planItems, setPlanItems] = useState(readPlan)
  const [planOpen, setPlanOpen] = useState(false)

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    } catch {
      /* ignore quota */
    }
  }, [ids])

  useEffect(() => {
    try {
      sessionStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(planItems))
    } catch {
      /* ignore quota */
    }
  }, [planItems])

  const openPlan = useCallback(() => setPlanOpen(true), [])
  const closePlan = useCallback(() => setPlanOpen(false), [])

  const addVehicleToPlan = useCallback(({ pickId, label, examplePrice } = {}) => {
    if (!pickId) return false
    const meta = label
      ? { pickId, label, examplePrice }
      : resolveFleetPickMeta(pickId) || { pickId, label: pickId, examplePrice: null }
    const item = createVehiclePlanItem(meta)
    if (!item) return false
    setPlanItems((prev) => appendPlanItem(prev, item))
    setIds((prev) => mergePickIds(prev, [pickId]))
    setPlanOpen(true)
    return true
  }, [])

  const addPackageToPlan = useCallback(({
    packageId,
    label,
    examplePrice,
    pickIds,
    units,
  } = {}) => {
    if (!packageId) return false
    const base = resolvePackagePlanMeta(packageId, pickIds, units)
    const item = createPackagePlanItem({
      packageId,
      label: label != null ? label : base.label,
      examplePrice: examplePrice != null ? examplePrice : base.examplePrice,
      pickIds: pickIds?.length ? pickIds : base.pickIds,
    })
    if (!item) return false
    setPlanItems((prev) => appendPlanItem(removePlanItemById(prev, item.id), item))
    setIds((prev) => mergePickIds(prev, item.pickIds))
    setPlanOpen(true)
    return true
  }, [])

  const removePlanItem = useCallback((itemId) => {
    setPlanItems((prev) => {
      const target = prev.find((row) => row.id === itemId)
      if (target?.pickIds?.length) {
        setIds((idsPrev) => dropPickIds(idsPrev, target.pickIds))
      }
      return removePlanItemById(prev, itemId)
    })
  }, [])

  const clearPlan = useCallback(() => {
    setPlanItems([])
    setIds([])
    setPlanOpen(false)
  }, [])

  const add = useCallback((id) => {
    if (!id) return
    addVehicleToPlan({ pickId: id })
  }, [addVehicleToPlan])

  const remove = useCallback((id) => {
    if (!id) return
    setIds((prev) => prev.filter((x) => x !== id))
    setPlanItems((prev) => removePickFromPlan(prev, id))
  }, [])

  const toggle = useCallback((id) => {
    if (!id) return
    setIds((prev) => {
      const wasIn = prev.includes(id)
      const next = toggleFleetPick(prev, id)
      if (!wasIn && next.includes(id)) {
        const meta = resolveFleetPickMeta(id)
        const item = createVehiclePlanItem(
          meta || { pickId: id, label: id, examplePrice: null },
        )
        if (item) setPlanItems((planPrev) => appendPlanItem(planPrev, item))
        setPlanOpen(true)
      } else if (wasIn && !next.includes(id)) {
        setPlanItems((planPrev) => removePickFromPlan(planPrev, id))
      }
      return next
    })
  }, [])

  const value = useMemo(() => ({
    ids,
    count: ids.length,
    has: (id) => Boolean(id) && ids.includes(id),
    toggle,
    remove,
    add,
    planItems,
    planOpen,
    planCount: planItems.length,
    planUnits: planUnitCount(planItems),
    planTotal: planExampleTotal(planItems),
    planPickIds: collectPlanPickIds(planItems),
    openPlan,
    closePlan,
    addVehicleToPlan,
    addPackageToPlan,
    removePlanItem,
    clearPlan,
  }), [
    ids,
    planItems,
    planOpen,
    toggle,
    remove,
    add,
    openPlan,
    closePlan,
    addVehicleToPlan,
    addPackageToPlan,
    removePlanItem,
    clearPlan,
  ])

  return (
    <FleetPickContext.Provider value={value}>
      {children}
    </FleetPickContext.Provider>
  )
}

export function useFleetPick() {
  const ctx = useContext(FleetPickContext)
  if (!ctx) {
    throw new Error('useFleetPick must be used inside FleetPickProvider')
  }
  return ctx
}
