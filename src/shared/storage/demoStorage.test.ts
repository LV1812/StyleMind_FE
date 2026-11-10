import { describe, expect, it } from 'vitest'

import { createDemoSeed } from '@/app/data/demoSeed'

import { DEMO_STORAGE_KEY, loadDemoDatabase, readDemoSnapshot, resetDemoDatabase, saveDemoDatabase } from './demoStorage'

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
  it('deduplicates shared galleries without losing variant image IDs or changing live data', () => {
    const storage = createMemoryStorage()
    const database = createDemoSeed()
    const product = database.products[0]
    const images = Array.from({ length: 8 }, (_, index) => ({
      id: `image-${index}`, url: `https://images.example.com/${'long-path/'.repeat(30)}${index}.jpg`, alt: 'Product photo', isPrimary: index === 0, order: index,
    }))
    product.variants = Array.from({ length: 40 }, (_, index) => ({
      ...product.variants[0], id: `variant-${index}`,
      images: images.map(image => ({ ...image, id: `${index}-${image.id}` })),
    }))
    const before = JSON.stringify(database)
    expect(saveDemoDatabase(storage, database)).toBe(true)
    const raw = storage.getItem(DEMO_STORAGE_KEY)!
    expect(raw.length).toBeLessThan(before.length / 2)
    expect(readDemoSnapshot(raw)?.products).toEqual(database.products)
    expect(loadDemoDatabase(storage).database.products).toEqual(database.products)
    expect(JSON.stringify(database)).toBe(before)
  })

  it('keeps the last snapshot when storage is full and allows loading and resetting in memory', () => {
    const storage = createMemoryStorage()
    const saved = createDemoSeed()
    storage.setItem(DEMO_STORAGE_KEY, JSON.stringify(saved))
    const before = storage.getItem(DEMO_STORAGE_KEY)
    storage.setItem = () => { throw new DOMException('Storage full', 'QuotaExceededError') }
    expect(saveDemoDatabase(storage, saved)).toBe(false)
    expect(storage.getItem(DEMO_STORAGE_KEY)).toBe(before)
    const loaded = loadDemoDatabase(storage)
    expect(loaded.recovered).toBe(false)
    expect(loaded.database.products).toEqual(saved.products)
    expect(() => resetDemoDatabase(storage)).not.toThrow()
  })

  it('does not crash when storage is full on first load or recovery', () => {
    const storage = createMemoryStorage()
    storage.setItem = () => { throw new DOMException('Storage full', 'QuotaExceededError') }
    expect(loadDemoDatabase(storage).database.schemaVersion).toBe(1)
    storage.getItem = () => '{broken'
    expect(loadDemoDatabase(storage).recovered).toBe(true)
    storage.getItem = () => { throw new DOMException('Storage disabled', 'SecurityError') }
    expect(loadDemoDatabase(storage).database.schemaVersion).toBe(1)
  })

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
