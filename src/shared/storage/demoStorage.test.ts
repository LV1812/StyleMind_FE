import { describe, expect, it } from 'vitest'

import { createDemoSeed } from '@/app/data/demoSeed'

import { DEMO_STORAGE_KEY, loadDemoDatabase, saveDemoDatabase } from './demoStorage'

function createMemoryStorage(): Storage {
  const store = new Map<string, string>()

  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.get(key) ?? null
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
  }
}

describe('demoStorage', () => {
  it('recovers from malformed JSON with a fresh seed', () => {
    const storage = createMemoryStorage()
    storage.setItem(DEMO_STORAGE_KEY, '{broken')

    const result = loadDemoDatabase(storage)

    expect(result.database.schemaVersion).toBe(1)
    expect(result.recovered).toBe(true)
  })

  it('recovers from an unsupported schema version', () => {
    const storage = createMemoryStorage()
    storage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ schemaVersion: 99 }))

    const result = loadDemoDatabase(storage)

    expect(result.database).toEqual(createDemoSeed())
    expect(result.recovered).toBe(true)
  })

  it('does not persist a non-persistent session', () => {
    const storage = createMemoryStorage()
    const database = {
      ...createDemoSeed(),
      session: { userId: 'usr-customer-01', persistent: false },
    }

    saveDemoDatabase(storage, database)

    expect(JSON.parse(storage.getItem(DEMO_STORAGE_KEY) ?? '{}').session).toBeNull()
  })
})
