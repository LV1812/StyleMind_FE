import type { Outfit } from '@/entities/outfit/model/types'

export interface OutfitDraftItem {
  id: string
  productId: string
  variantId: string
}

export interface OutfitDraft {
  ownerId: string
  name: string
  items: OutfitDraftItem[]
}

export interface OutfitDraftErrors {
  name?: string
  items?: string
}

export function createManualOutfitDraft(ownerId: string): OutfitDraft {
  return {
    ownerId,
    name: '',
    items: [],
  }
}

export function createDraftItem(productId: string, variantId: string, index: number): OutfitDraftItem {
  return {
    id: `draft-item-${productId}-${variantId}-${index}`,
    productId,
    variantId,
  }
}

export function validateOutfitDraft(draft: OutfitDraft): OutfitDraftErrors {
  const errors: OutfitDraftErrors = {}

  if (!draft.name.trim()) {
    errors.name = 'Vui lòng nhập tên outfit'
  }

  if (draft.items.length === 0) {
    errors.items = 'Vui lòng thêm ít nhất một món'
  }

  return errors
}

export function draftToOutfit(draft: OutfitDraft, now: string): Outfit {
  const parsedTime = Date.parse(now)
  const stamp = Number.isFinite(parsedTime) ? parsedTime : Date.now()

  return {
    id: `outfit-manual-${stamp}`,
    ownerId: draft.ownerId,
    name: draft.name.trim(),
    source: 'manual',
    visibility: 'private',
    items: draft.items.map((item, index) => ({
      id: `outfit-item-${stamp}-${index + 1}`,
      productId: item.productId,
      variantId: item.variantId,
      addedBy: 'owner',
    })),
    createdAt: now,
    updatedAt: now,
  }
}
