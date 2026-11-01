import type { DemoDatabase } from '@/app/store/types'
import type { AiConversation } from '@/entities/ai/model/types'
import type { Outfit } from '@/entities/outfit/model/types'
import type { Product, ProductVariant } from '@/entities/product/model/types'
import { selectOutfitDetail, type OutfitItemDetail } from '@/features/wardrobe/model/outfitSelectors'

import { appendAssistantMessage, ASSISTANT_INTRO } from './aiConversation'

export type OutfitChangeProposal =
  | {
      id: string
      type: 'add-item'
      productId: string
      variantId: string
      productName: string
      reason: string
    }
  | {
      id: string
      type: 'replace-item'
      targetItemId: string
      targetProductName: string
      productId: string
      variantId: string
      productName: string
      reason: string
    }

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function nowId(prefix: string) {
  return `${prefix}-${Date.now()}`
}

function activeDefaultVariant(product: Product): ProductVariant | undefined {
  const activeVariants = product.variants.filter(variant => variant.active)
  return activeVariants.find(variant => variant.images.some(image => image.isPrimary)) ?? activeVariants[0]
}

function productMatchesText(product: Product, text: string) {
  const terms = [product.name, product.brand, product.material, product.fit, product.pattern, ...product.tags]
    .map(normalize)
    .filter(Boolean)

  return terms.some(term => text.includes(term) || term.includes(text))
}

function targetCategoryFromText(text: string) {
  if (text.includes('ao khoac') || text.includes('khoac') || text.includes('blazer')) return 'outerwear'
  if (text.includes('chan vay') || text.includes('vay')) return 'skirts'
  if (text.includes('quan')) return 'pants'
  if (text.includes('so mi') || text.includes('blouse') || text.includes('ao')) return 'tops'
  if (text.includes('dam')) return 'dresses'
  return null
}

function findTargetItem(items: OutfitItemDetail[], text: string) {
  return (
    items.find(item => productMatchesText(item.product, text)) ??
    items.find(item => text.includes(normalize(item.product.categoryId))) ??
    items[0]
  )
}

function findCandidateProduct(
  database: DemoDatabase,
  categoryId: string | null,
  excludedProductIds: Set<string>,
  text: string,
) {
  const activeProducts = database.products.filter(product => product.active && activeDefaultVariant(product))
  const preferred = activeProducts.find(
    product =>
      !excludedProductIds.has(product.id) &&
      (!categoryId || product.categoryId === categoryId) &&
      productMatchesText(product, text),
  )
  if (preferred) return preferred

  return activeProducts.find(
    product => !excludedProductIds.has(product.id) && (!categoryId || product.categoryId === categoryId),
  )
}

export function createEditConversation(
  database: DemoDatabase,
  ownerId: string,
  outfitId: string,
): AiConversation {
  const now = new Date().toISOString()
  const detail = selectOutfitDetail(database, outfitId)
  const itemNames = detail?.items.map(item => item.product.name).join(', ') ?? 'outfit hiện tại'

  return {
    id: nowId(`ai-edit-${outfitId}`),
    ownerId,
    outfitId,
    mode: 'edit',
    messages: [
      {
        id: nowId('ai-edit-assistant'),
        role: 'assistant',
        body: `${ASSISTANT_INTRO} Mình đã đọc outfit hiện tại gồm: ${itemNames}.`,
        createdAt: now,
      },
    ],
    requirement: {},
    createdAt: now,
    updatedAt: now,
  }
}

export function proposeOutfitChange(
  database: DemoDatabase,
  conversation: AiConversation,
): OutfitChangeProposal | null {
  if (!conversation.outfitId) return null

  const detail = selectOutfitDetail(database, conversation.outfitId)
  if (!detail) return null

  const latestUserMessage = [...conversation.messages].reverse().find(message => message.role === 'user')?.body ?? ''
  const text = normalize(latestUserMessage)
  const categoryId = targetCategoryFromText(text)
  const excludedProductIds = new Set(detail.items.map(item => item.product.id))

  if (text.includes('thay') || text.includes('doi')) {
    const targetItem = findTargetItem(detail.items, text)
    const candidate = findCandidateProduct(database, targetItem?.product.categoryId ?? categoryId, excludedProductIds, text)
    const variant = candidate ? activeDefaultVariant(candidate) : undefined
    if (!targetItem || !candidate || !variant) return null

    return {
      id: nowId('proposal-replace'),
      type: 'replace-item',
      targetItemId: targetItem.item.id,
      targetProductName: targetItem.product.name,
      productId: candidate.id,
      variantId: variant.id,
      productName: candidate.name,
      reason: `Đề xuất thay ${targetItem.product.name} bằng ${candidate.name}`,
    }
  }

  const candidate = findCandidateProduct(database, categoryId, excludedProductIds, text)
  const variant = candidate ? activeDefaultVariant(candidate) : undefined
  if (!candidate || !variant) return null

  return {
    id: nowId('proposal-add'),
    type: 'add-item',
    productId: candidate.id,
    variantId: variant.id,
    productName: candidate.name,
    reason: `Đề xuất thêm ${candidate.name}`,
  }
}

export function proposalReply(conversation: AiConversation, proposal: OutfitChangeProposal | null, now: string) {
  return appendAssistantMessage(
    conversation,
    proposal ? proposal.reason : 'Mình chưa tìm được thay đổi phù hợp từ catalog hiện tại.',
    now,
  )
}

export function applyOutfitChange(outfit: Outfit, proposal: OutfitChangeProposal, now: string): Outfit {
  if (proposal.type === 'add-item') {
    return {
      ...outfit,
      items: [
        ...outfit.items,
        {
          id: `outfit-ai-added-${Date.parse(now)}`,
          productId: proposal.productId,
          variantId: proposal.variantId,
          addedBy: 'ai',
          note: proposal.reason,
        },
      ],
      updatedAt: now,
    }
  }

  return {
    ...outfit,
    items: outfit.items.map(item =>
      item.id === proposal.targetItemId
        ? {
            ...item,
            productId: proposal.productId,
            variantId: proposal.variantId,
            addedBy: 'ai',
            note: proposal.reason,
          }
        : item,
    ),
    updatedAt: now,
  }
}
