import { createContext, useContext, useEffect, useMemo, useReducer, useState, type PropsWithChildren } from 'react'

import { demoReducer } from './demoReducer'
import type { DemoAction, DemoDatabase } from './types'
import { DEMO_STORAGE_KEY, loadDemoDatabase, readDemoSnapshot, resetDemoDatabase, saveDemoDatabase } from '@/shared/storage/demoStorage'

interface DemoStoreValue {
  state: DemoDatabase
  dispatch: React.Dispatch<DemoAction>
  storageRecovered: boolean
  resetDatabase: () => void
}

const DemoStoreContext = createContext<DemoStoreValue | null>(null)

function getBrowserStorage(): Storage | null {
  try { return typeof window === 'undefined' ? null : window.localStorage }
  catch { return null }
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
  const [storageFailed, setStorageFailed] = useState(false)

  useEffect(() => {
    const storage = getBrowserStorage()
    const receive = (event: StorageEvent) => {
      if (!storage || event.storageArea !== storage || event.key !== DEMO_STORAGE_KEY) return
      let raw: string | null
      try { raw = storage.getItem(DEMO_STORAGE_KEY) } catch { return }
      const next = readDemoSnapshot(raw)
      if (next) dispatch({ type: 'database/replaced', payload: next })
    }
    window.addEventListener('storage', receive)
    return () => window.removeEventListener('storage', receive)
  }, [])

  useEffect(() => {
    const storage = getBrowserStorage()
    setStorageFailed(!storage || !saveDemoDatabase(storage, state))
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

  return <DemoStoreContext.Provider value={value}>
    {storageFailed && <p role="status" className="bg-amber-50 px-4 py-2 text-sm text-amber-900">Không thể lưu dữ liệu tạm trên trình duyệt. Bạn vẫn có thể sử dụng trang; thay đổi chưa đồng bộ có thể mất khi tải lại.</p>}
    {children}
  </DemoStoreContext.Provider>
}

export function useDemoStore(): DemoStoreValue {
  const context = useContext(DemoStoreContext)
  if (!context) throw new Error('useDemoStore must be used inside DemoStoreProvider')
  return context
}
