import type { DemoDatabase } from '@/app/store/types'
import type { OutfitVisibility } from '@/entities/outfit/model/types'
import { areFriends } from '@/features/friends/model/friendshipModel'
import { selectOutfitDetail } from '@/features/wardrobe/model/outfitSelectors'

export const visibilityLabels: Record<OutfitVisibility, string> = {
  private: 'Riêng tư', friends: 'Bạn bè', public: 'Công khai',
}

export function isOutfitVisibility(value: unknown): value is OutfitVisibility {
  return value === 'private' || value === 'friends' || value === 'public'
}

export function activeCustomer(database: DemoDatabase, userId: string) {
  return database.users.find(u => u.id === userId && u.role === 'customer' && u.status === 'active')
}

export function canReadOutfit(database: DemoDatabase, outfitId: string, viewerId: string): boolean {
  const outfit = database.outfits.find(o => o.id === outfitId)
  if (!outfit || !activeCustomer(database, outfit.ownerId) || !activeCustomer(database, viewerId)) return false
  if (outfit.ownerId === viewerId) return true
  return outfit.visibility === 'public' || (outfit.visibility === 'friends' && areFriends(database, outfit.ownerId, viewerId))
}

export function selectFriendOutfits(database: DemoDatabase, ownerId: string, viewerId: string) {
  // This list belongs to a friend's wardrobe. Public links remain independently usable after unfriend.
  if (!activeCustomer(database, ownerId) || !activeCustomer(database, viewerId) || !areFriends(database, ownerId, viewerId)) return []
  return database.outfits
    .filter(o => o.ownerId === ownerId && canReadOutfit(database, o.id, viewerId))
    .flatMap(o => { const detail = selectOutfitDetail(database, o.id); return detail ? [detail] : [] })
    .sort((a, b) => b.outfit.updatedAt.localeCompare(a.outfit.updatedAt))
}

export function changeOutfitVisibility(database: DemoDatabase, outfitId: string, visibility: OutfitVisibility, publicToken?: string): DemoDatabase {
  const actor = database.session && activeCustomer(database, database.session.userId)
  const outfit = database.outfits.find(o => o.id === outfitId)
  if (!actor || !outfit || outfit.ownerId !== actor.id || !isOutfitVisibility(visibility)) return database
  const token = outfit.publicToken || (visibility === 'public' ? publicToken || crypto.randomUUID() : undefined)
  return { ...database, outfits: database.outfits.map(o => o.id === outfitId ? { ...o, visibility, publicToken: token, updatedAt: new Date().toISOString() } : o) }
}
