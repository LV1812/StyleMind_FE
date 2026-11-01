import { createDemoSeed } from '@/app/data/demoSeed'
import { normalizeDemoDatabase } from '@/app/store/demoReducer'
import type { DemoDatabase } from '@/app/store/types'

export const DEMO_STORAGE_KEY = 'stylemind.demo.database'

export interface LoadDatabaseResult {
  database: DemoDatabase
  recovered: boolean
}

const REQUIRED_ARRAY_KEYS = [
  'users',
  'products',
  'categories',
  'cartLines',
  'addresses',
  'orders',
  'notifications',
  'outfits',
  'outfitShares',
  'wardrobeShares',
  'wardrobeSettings',
  'wardrobePublicLinks',
  'chatSessions',
  'chatMessages',
  'aiConversations',
  'cancellationRequests',
  'returnRequests',
  'compatibilityRules',
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isDemoDatabase(value: unknown): value is DemoDatabase {
  if (!isRecord(value) || value.schemaVersion !== 1) return false
  if (!isRecord(value.fashionMetadata) || !isRecord(value.aiMetrics)) return false
  return REQUIRED_ARRAY_KEYS.every(key => Array.isArray(value[key]))
}

function persist(storage: Storage, database: DemoDatabase) {
  storage.setItem(DEMO_STORAGE_KEY, JSON.stringify(database))
}

function recover(storage: Storage): LoadDatabaseResult {
  const database = createDemoSeed()
  persist(storage, database)
  return { database, recovered: true }
}

export function loadDemoDatabase(storage: Storage): LoadDatabaseResult {
  const raw = storage.getItem(DEMO_STORAGE_KEY)
  if (!raw) {
    const database = createDemoSeed()
    persist(storage, database)
    return { database, recovered: false }
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isDemoDatabase(parsed)) return recover(storage)

    const database = normalizeDemoDatabase(parsed)
    if (database !== parsed) persist(storage, database)
    return { database, recovered: false }
  } catch {
    return recover(storage)
  }
}

export function saveDemoDatabase(storage: Storage, database: DemoDatabase): void {
  persist(storage, {
    ...database,
    session: database.session?.persistent === false ? null : database.session,
  })
}

export function resetDemoDatabase(storage: Storage): DemoDatabase {
  const database = createDemoSeed()
  persist(storage, database)
  return database
}
