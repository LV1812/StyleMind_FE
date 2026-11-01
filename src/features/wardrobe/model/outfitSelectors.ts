import type { DemoDatabase } from '@/app/store/types'
import type { Product, ProductImage, ProductVariant } from '@/entities/product/model/types'
import type { Outfit, OutfitItem } from '@/entities/outfit/model/types'

export interface OutfitItemDetail {
  item: OutfitItem
  product: Product
  variant: ProductVariant
  image: ProductImage | null
  price: number
}

export interface UnavailableOutfitItemDetail {
  item: OutfitItem
  product: Product | null
  variant: ProductVariant | null
  name: string
  reason: string
}

export interface OutfitDetail {
  outfit: Outfit
  items: OutfitItemDetail[]
  unavailableItems: UnavailableOutfitItemDetail[]
  total: number
}

function primaryVariantImage(variant: ProductVariant) {
  return variant.images.find(image => image.isPrimary) ?? variant.images[0] ?? null
}

export function selectOwnedOutfits(database: DemoDatabase, userId: string): Outfit[] {
  return [...database.outfits]
    .filter(outfit => outfit.ownerId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function selectOutfitDetail(database: DemoDatabase, outfitId: string): OutfitDetail | null {
  const outfit = database.outfits.find(item => item.id === outfitId)
  if (!outfit) return null

  const items = outfit.items
    .map(item => {
      const product = database.products.find(candidate => candidate.id === item.productId)
      const variant = product?.variants.find(candidate => candidate.id === item.variantId)
      if (!product?.active || !variant?.active) return null
      if (!product || !variant) return null

      return {
        item,
        product,
        variant,
        image: primaryVariantImage(variant),
        price: variant.priceOverride ?? product.basePrice,
      }
    })
    .filter(Boolean) as OutfitItemDetail[]
  const unavailableItems = outfit.items
    .map(item => {
      const product = database.products.find(candidate => candidate.id === item.productId) ?? null
      const variant = product?.variants.find(candidate => candidate.id === item.variantId) ?? null
      if (product?.active && variant?.active) return null

      const name = product?.name ?? item.productId
      const reason = !product || !product.active
        ? 'Sản phẩm này hiện không thể thêm vào giỏ'
        : 'Phiên bản này hiện không thể thêm vào giỏ'

      return {
        item,
        product,
        variant,
        name,
        reason,
      }
    })
    .filter(Boolean) as UnavailableOutfitItemDetail[]

  return {
    outfit,
    items,
    unavailableItems,
    total: items.reduce((sum, item) => sum + item.price, 0),
  }
}
