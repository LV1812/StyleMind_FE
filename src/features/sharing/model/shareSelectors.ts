import type { DemoDatabase } from '@/app/store/types'
import type { WardrobePublicLink, WardrobeSettings, WardrobeShare, WardrobeVisibility } from '@/entities/share/model/types'
import { selectOutfitDetail, type OutfitDetail } from '@/features/wardrobe/model/outfitSelectors'

export interface SharedOutfitDetail extends OutfitDetail {
  share: WardrobeShare
}

export interface PublicWardrobeDetail {
  link: WardrobePublicLink
  ownerName: string
  outfits: OutfitDetail[]
}

export interface SharedWardrobeSummary {
  ownerId: string
  ownerName: string
  ownerInitials: string
  share: WardrobeShare
  settings: WardrobeSettings
  outfitCount: number
  total: number
  updatedAt: string
  canOpen: boolean
  canChat: boolean
}

export function getWardrobeSettings(database: DemoDatabase, ownerId: string): WardrobeSettings {
  return database.wardrobeSettings.find(item => item.ownerId === ownerId) ?? {
    ownerId,
    visibility: 'private',
    updatedAt: new Date(0).toISOString(),
  }
}

export function getWardrobeVisibilityLabel(visibility: WardrobeVisibility) {
  if (visibility === 'private') return 'Riêng tư'
  if (visibility === 'public') return 'Công khai'
  return 'Chia sẻ bằng email'
}

export function selectWardrobeSharesForOwner(database: DemoDatabase, ownerId: string): WardrobeShare[] {
  return database.wardrobeShares
    .filter(share => share.ownerId === ownerId)
    .sort((a, b) => Number(b.active) - Number(a.active) || b.createdAt.localeCompare(a.createdAt))
}

export function selectActiveWardrobeSharesForOwner(database: DemoDatabase, ownerId: string): WardrobeShare[] {
  return selectWardrobeSharesForOwner(database, ownerId).filter(share => share.active)
}

export function canViewSharedWardrobe(database: DemoDatabase, ownerId: string, email: string): boolean {
  const settings = getWardrobeSettings(database, ownerId)
  if (settings.visibility === 'private') return false

  return database.wardrobeShares.some(
    share => share.ownerId === ownerId && share.active && share.viewerEmail.toLowerCase() === email.toLowerCase(),
  )
}

export function canChatAboutWardrobe(database: DemoDatabase, ownerId: string, email: string): boolean {
  const settings = getWardrobeSettings(database, ownerId)
  return settings.visibility !== 'private' && database.wardrobeShares.some(
    share => share.ownerId === ownerId && share.active && share.viewerEmail.toLowerCase() === email.toLowerCase(),
  )
}

export function selectSharedWardrobesForEmail(database: DemoDatabase, email: string): SharedWardrobeSummary[] {
  const normalizedEmail = email.toLowerCase()

  return database.wardrobeShares
    .filter(share => share.viewerEmail.toLowerCase() === normalizedEmail)
    .flatMap(share => {
      const owner = database.users.find(user => user.id === share.ownerId)
      if (!owner) return []

      const settings = getWardrobeSettings(database, share.ownerId)
      const outfits = selectWardrobeOutfits(database, share.ownerId)
      const canOpen = share.active && settings.visibility !== 'private'

      return [{
        ownerId: share.ownerId,
        ownerName: owner.fullName,
        ownerInitials: owner.avatarInitials,
        share,
        settings,
        outfitCount: outfits.length,
        total: outfits.reduce((sum, detail) => sum + detail.total, 0),
        updatedAt: outfits[0]?.outfit.updatedAt ?? share.createdAt,
        canOpen,
        canChat: canOpen,
      }]
    })
    .sort((a, b) => b.share.createdAt.localeCompare(a.share.createdAt))
}

export function selectWardrobeOutfits(database: DemoDatabase, ownerId: string): OutfitDetail[] {
  return database.outfits
    .filter(outfit => outfit.ownerId === ownerId)
    .flatMap(outfit => {
      const detail = selectOutfitDetail(database, outfit.id)
      return detail ? [detail] : []
    })
    .sort((a, b) => b.outfit.updatedAt.localeCompare(a.outfit.updatedAt))
}

export function selectSharedWardrobeByOwner(database: DemoDatabase, ownerId: string, viewerEmail: string): SharedWardrobeSummary | null {
  return selectSharedWardrobesForEmail(database, viewerEmail).find(item => item.ownerId === ownerId) ?? null
}

export function selectPublicOutfitByToken(database: DemoDatabase, token: string): OutfitDetail | null {
  const outfit = database.outfits.find(item => item.publicToken === token && item.visibility === 'public')
  return outfit ? selectOutfitDetail(database, outfit.id) : null
}

export function selectPublicWardrobeByToken(database: DemoDatabase, token: string): PublicWardrobeDetail | null {
  const link = database.wardrobePublicLinks.find(item => item.token === token && item.active)
  if (!link) return null
  const settings = getWardrobeSettings(database, link.ownerId)
  if (settings.visibility !== 'public') return null

  const owner = database.users.find(user => user.id === link.ownerId)
  const outfits = selectWardrobeOutfits(database, link.ownerId)

  if (!owner || outfits.length === 0) return null

  return {
    link,
    ownerName: owner.fullName,
    outfits,
  }
}

export function canViewSharedOutfit(database: DemoDatabase, outfitId: string, email: string): boolean {
  const detail = selectOutfitDetail(database, outfitId)
  if (detail && canViewSharedWardrobe(database, detail.outfit.ownerId, email)) return true

  return database.outfitShares.some(
    share => share.outfitId === outfitId && share.active && share.viewerEmail.toLowerCase() === email.toLowerCase(),
  )
}
