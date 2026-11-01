export interface OutfitShare {
  id: string
  outfitId: string
  ownerId: string
  viewerEmail: string
  permission: 'view'
  active: boolean
  createdAt: string
}

export type WardrobeVisibility = 'private' | 'protected' | 'public'

export interface WardrobeSettings {
  ownerId: string
  visibility: WardrobeVisibility
  publicToken?: string
  updatedAt: string
}

export interface WardrobeShare {
  id: string
  ownerId: string
  viewerEmail: string
  permission: 'view'
  active: boolean
  createdAt: string
  revokedAt?: string
}

export interface WardrobePublicLink {
  id: string
  ownerId: string
  token: string
  active: boolean
  createdAt: string
  disabledAt?: string
}
