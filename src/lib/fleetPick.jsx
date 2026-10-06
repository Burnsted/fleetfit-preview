import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  fleetCatalogKey,
  fleetListingKey,
  fleetUnitKey,
  toggleFleetPick,
} from './fleetPickKeys'

export {
  fleetCatalogKey,
  fleetListingKey,
  fleetUnitKey,
  toggleFleetPick,
}

const STORAGE_KEY = 'fleetfit-fleet-picks'
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

export function FleetPickProvider({ children }) {
  const [ids, setIds] = useState(readPicks)

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    } catch {
      /* ignore quota */
    }
  }, [ids])

  const value = useMemo(() => ({
    ids,
    count: ids.length,
    has: (id) => Boolean(id) && ids.includes(id),
    toggle: (id) => {
      if (!id) return
      setIds((prev) => toggleFleetPick(prev, id))
    },
    remove: (id) => setIds((prev) => prev.filter((x) => x !== id)),
    add: (id) => {
      if (!id) return
      setIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
    },
  }), [ids])

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
