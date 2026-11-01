import type { DemoDatabase } from '@/app/store/types'
import type { OutfitRecommendation, OutfitRequirement } from '@/entities/ai/model/types'
import type { Product, ProductVariant } from '@/entities/product/model/types'

export interface RecommendOutfitInput {
  ownerId: string
  requirement: OutfitRequirement
}

interface Candidate {
  product: Product
  variant: ProductVariant
  score: number
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

function scoreProduct(product: Product, variant: ProductVariant, requirement: OutfitRequirement) {
  let score = 0
  const normalizedStyle = normalize(requirement.style ?? '')
  const normalizedOccasion = normalize(requirement.occasion ?? '')
  const preferredColors = (requirement.preferredColors ?? []).map(normalize)
  const excludedColors = (requirement.excludedColors ?? []).map(normalize)
  const categoryMatches = requirement.desiredCategories?.length
    ? requirement.desiredCategories.includes(product.categoryId)
    : true

  if (!categoryMatches) score -= 4
  if (normalizedStyle && product.styleIds.some(style => normalize(style).includes(normalizedStyle))) score += 3
  if (normalizedOccasion && product.occasionIds.some(occasion => normalize(occasion).includes(normalizedOccasion))) score += 3
  if (preferredColors.some(color => normalize(variant.color).includes(color))) score += 2
  if (excludedColors.some(color => normalize(variant.color).includes(color))) score -= 10
  if (requirement.budget && (variant.priceOverride ?? product.basePrice) > requirement.budget) score -= 3
  if (product.featured) score += 1

  return score
}

function activeCandidates(database: DemoDatabase, requirement: OutfitRequirement): Candidate[] {
  const desiredCategories = requirement.desiredCategories ?? []

  return database.products
    .filter(product => product.active)
    .filter(product => desiredCategories.length === 0 || desiredCategories.includes(product.categoryId))
    .flatMap(product =>
      product.variants
        .filter(variant => variant.active)
        .map(variant => ({
          product,
          variant,
          score: scoreProduct(product, variant, requirement),
        })),
    )
}

export function recommendOutfit(database: DemoDatabase, input: RecommendOutfitInput): OutfitRecommendation {
  const seenCategories = new Set<string>()
  const items = activeCandidates(database, input.requirement)
    .sort((a, b) => b.score - a.score || Number(b.product.featured) - Number(a.product.featured) || a.product.name.localeCompare(b.product.name, 'vi'))
    .filter(candidate => {
      if (seenCategories.has(candidate.product.categoryId)) return false
      seenCategories.add(candidate.product.categoryId)
      return true
    })
    .slice(0, 3)
    .map((candidate, index) => {
      const price = candidate.variant.priceOverride ?? candidate.product.basePrice
      const image = candidate.variant.images.find(item => item.isPrimary) ?? candidate.variant.images[0]

      return {
        id: `rec-${candidate.product.id}-${candidate.variant.id}`,
        productId: candidate.product.id,
        variantId: candidate.variant.id,
        name: candidate.product.name,
        color: candidate.variant.color,
        size: candidate.variant.size,
        price,
        imageUrl: image?.url ?? '',
        reason: index === 0 ? 'Món chính phù hợp với yêu cầu' : 'Bổ sung để outfit cân bằng hơn',
      }
    })

  return {
    id: `rec-${input.ownerId}-${Date.now()}`,
    items,
    total: items.reduce((sum, item) => sum + item.price, 0),
    explanation: 'Gợi ý này chỉ dùng sản phẩm đang hoạt động trong catalog StyleMind.',
  }
}
