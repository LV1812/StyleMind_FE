export type OutfitSource = 'manual' | 'ai'
export type OutfitVisibility = 'private' | 'public'

export interface OutfitItem {
  id: string
  productId: string
  variantId: string
  addedBy: 'owner' | 'ai'
  note?: string
}

export interface Outfit {
  id: string
  ownerId: string
  name: string
  description?: string
  source: OutfitSource
  items: OutfitItem[]
  visibility: OutfitVisibility
  publicToken?: string
  createdAt: string
  updatedAt: string
}
