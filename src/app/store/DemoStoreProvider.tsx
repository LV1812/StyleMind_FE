import { createContext, useContext, useEffect, useMemo, useReducer, useState, type PropsWithChildren } from 'react'

import { demoReducer } from './demoReducer'
import type { DemoAction, DemoDatabase } from './types'
import { loadDemoDatabase, resetDemoDatabase, saveDemoDatabase } from '@/shared/storage/demoStorage'

interface DemoStoreValue {
  state: DemoDatabase
  dispatch: React.Dispatch<DemoAction>
  storageRecovered: boolean
  resetDatabase: () => void
}

const DemoStoreContext = createContext<DemoStoreValue | null>(null)

function getBrowserStorage(): Storage | null {
  return typeof window === 'undefined' ? null : window.localStorage
}

function loadInitialDatabase() {
  const storage = getBrowserStorage()
  if (!storage) {
    return {
      database: loadDemoDatabase({
        length: 0,
        clear() {},
        getItem() {
          return null
        },
        key() {
          return null
        },
        removeItem() {},
        setItem() {},
      }).database,
      recovered: false,
    }
  }

  return loadDemoDatabase(storage)
}

export function DemoStoreProvider({ children }: PropsWithChildren) {
  const initial = useMemo(() => loadInitialDatabase(), [])
  const [state, dispatch] = useReducer(demoReducer, initial.database)
  const [storageRecovered, setStorageRecovered] = useState(initial.recovered)

  useEffect(() => {
    const storage = getBrowserStorage()
    if (storage) saveDemoDatabase(storage, state)
  }, [state])

  const value = useMemo<DemoStoreValue>(
    () => ({
      state,
      dispatch,
      storageRecovered,
      resetDatabase: () => {
        const storage = getBrowserStorage()
        if (!storage) return
        dispatch({ type: 'database/replaced', payload: resetDemoDatabase(storage) })
        setStorageRecovered(false)
      },
    }),
    [state, storageRecovered],
  )

  return <DemoStoreContext.Provider value={value}>{children}</DemoStoreContext.Provider>
}

export function useDemoStore(): DemoStoreValue {
  const context = useContext(DemoStoreContext)
  if (!context) throw new Error('useDemoStore must be used inside DemoStoreProvider')
  return context
}
