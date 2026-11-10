import { createDemoSeed } from '@/app/data/demoSeed'
import { normalizeDemoDatabase } from '@/app/store/demoReducer'
import type { DemoDatabase } from '@/app/store/types'

export const DEMO_STORAGE_KEY = 'stylemind.demo.database'

export interface LoadDatabaseResult {
  database: DemoDatabase
  recovered: boolean
}

// Imported variants frequently share the same gallery. Store each gallery once
// while preserving all images and restoring the original in-memory shape.
function encodeSnapshot(database: DemoDatabase): string {
  const galleries: DemoDatabase['products'][number]['variants'][number]['images'][] = []
  const galleryIds = new Map<string, number>()
  const products = database.products.map(product => ({
    ...product,
    variants: product.variants.map(variant => {
      const signature = JSON.stringify(variant.images.map(({ url, alt, isPrimary, order }) => ({ url, alt, isPrimary, order })))
      let gallery = galleryIds.get(signature)
      if (gallery === undefined) {
        gallery = galleries.length
        galleryIds.set(signature, gallery)
        galleries.push(variant.images)
      }
      // Image IDs can differ across variants even when the gallery is identical.
      return { ...variant, images: [], _gallery: gallery, _imageIds: variant.images.map(image => image.id) }
    }),
  }))
  return JSON.stringify({ ...database, products, _galleries: galleries })
}

function decodeSnapshot(raw: string): unknown {
  const parsed: unknown = JSON.parse(raw)
  if (!isRecord(parsed) || !('_galleries' in parsed)) return parsed
  if (!Array.isArray(parsed._galleries) || !Array.isArray(parsed.products)) return null
  const galleries = parsed._galleries
  const products = parsed.products.map(product => {
    if (!isRecord(product) || !Array.isArray(product.variants)) throw new Error('Invalid stored product')
    return { ...product, variants: product.variants.map(variant => {
      if (!isRecord(variant) || !Number.isInteger(variant._gallery) || !Array.isArray(variant._imageIds)) throw new Error('Invalid stored gallery')
      const images = galleries[variant._gallery as number]
      if (!Array.isArray(images) || images.length !== variant._imageIds.length) throw new Error('Invalid stored images')
      const { _gallery, _imageIds, ...rest } = variant
      return { ...rest, images: images.map((image, index) => ({ ...image, id: _imageIds[index] })) }
    }) }
  })
  const { _galleries, ...database } = parsed
  return { ...database, products }
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

export function readDemoSnapshot(raw: string | null): DemoDatabase | null {
  if (!raw) return null
  try {
    const parsed = decodeSnapshot(raw)
    return isDemoDatabase(parsed) ? normalizeDemoDatabase(parsed) : null
  } catch { return null }
}

function persist(storage: Storage, database: DemoDatabase) {
  try {
    storage.setItem(DEMO_STORAGE_KEY, encodeSnapshot(database))
    return true
  } catch {
    // Keep the last saved snapshot. The current session can continue in memory.
    return false
  }
}

function recover(storage: Storage): LoadDatabaseResult {
  const database = createDemoSeed()
  persist(storage, database)
  return { database, recovered: true }
}

export function loadDemoDatabase(storage: Storage): LoadDatabaseResult {
  let raw: string | null
  try { raw = storage.getItem(DEMO_STORAGE_KEY) }
  catch { return { database: createDemoSeed(), recovered: false } }
  if (!raw) {
    const database = createDemoSeed()
    persist(storage, database)
    return { database, recovered: false }
  }

  try {
    const parsed = decodeSnapshot(raw)
    if (!isDemoDatabase(parsed)) return recover(storage)

    const database = normalizeDemoDatabase(parsed)
    if (database !== parsed) persist(storage, database)
    return { database, recovered: false }
  } catch {
    return recover(storage)
  }
}

export function saveDemoDatabase(storage: Storage, database: DemoDatabase): boolean {
  return persist(storage, {
    ...database,
    session: database.session?.persistent === false ? null : database.session,
  })
}

export function resetDemoDatabase(storage: Storage): DemoDatabase {
  const database = createDemoSeed()
  persist(storage, database)
  return database
}
