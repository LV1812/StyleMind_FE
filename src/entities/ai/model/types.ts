import type { ProductSize } from '@/entities/product/model/types'

export interface OutfitRequirement {
  occasion?: string
  style?: string
  preferredColors?: string[]
  excludedColors?: string[]
  budget?: number
  desiredCategories?: string[]
  fit?: string
  additionalNotes?: string
}

export interface AiMessage {
  id: string
  role: 'assistant' | 'user'
  body: string
  createdAt: string
}

export interface OutfitRecommendationItem {
  id: string
  productId: string
  variantId: string
  name: string
  color: string
  size: ProductSize
  price: number
  imageUrl: string
  reason: string
}

export interface OutfitRecommendation {
  id: string
  items: OutfitRecommendationItem[]
  total: number
  explanation: string
}

export interface AiConversation {
  id: string
  ownerId: string
  outfitId?: string
  mode: 'create' | 'edit'
  messages: AiMessage[]
  requirement: OutfitRequirement
  recommendation?: OutfitRecommendation
  createdAt: string
  updatedAt: string
}
