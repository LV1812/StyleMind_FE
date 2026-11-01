import type { DemoDatabase } from '@/app/store/types'
import type { CartLine } from '@/entities/cart/model/types'
import type { Product, ProductImage, ProductVariant } from '@/entities/product/model/types'

export interface CartLineDetail {
  line: CartLine
  product: Product
  variant: ProductVariant
  image: ProductImage | null
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface CartTotalsOptions {
  discountCode?: string
}

export interface CartTotals {
  subtotal: number
  discount: number
  shipping: number
  total: number
  itemCount: number
  orphanLineIds: string[]
}

function findProductAndVariant(database: DemoDatabase, line: CartLine) {
  const product = database.products.find(item => item.id === line.productId && item.active)
  const variant = product?.variants.find(item => item.id === line.variantId && item.active)

  return product && variant ? { product, variant } : null
}

function primaryVariantImage(variant: ProductVariant) {
  return variant.images.find(image => image.isPrimary) ?? variant.images[0] ?? null
}

export function selectCartDetails(database: DemoDatabase): CartLineDetail[] {
  return database.cartLines
    .map(line => {
      const result = findProductAndVariant(database, line)
      if (!result) return null

      const quantity = line.quantity
      if (quantity <= 0) return null

      const unitPrice = result.variant.priceOverride ?? result.product.basePrice

      return {
        line,
        product: result.product,
        variant: result.variant,
        image: primaryVariantImage(result.variant),
        quantity,
        unitPrice,
        lineTotal: unitPrice * quantity,
      }
    })
    .filter(Boolean) as CartLineDetail[]
}

export function selectCartOrphanLineIds(database: DemoDatabase): string[] {
  return database.cartLines
    .filter(line => !findProductAndVariant(database, line))
    .map(line => line.id)
}

export function selectCartTotals(database: DemoDatabase, options: CartTotalsOptions = {}): CartTotals {
  const details = selectCartDetails(database)
  const subtotal = details.reduce((sum, line) => sum + line.lineTotal, 0)
  const discount = options.discountCode?.trim().toUpperCase() === 'STYLE10'
    ? Math.min(Math.round(subtotal * 0.1), 200_000)
    : 0
  const shipping = subtotal === 0 ? 0 : subtotal >= 1_500_000 ? 0 : 30_000

  return {
    subtotal,
    discount,
    shipping,
    total: subtotal - discount + shipping,
    itemCount: details.reduce((sum, line) => sum + line.quantity, 0),
    orphanLineIds: selectCartOrphanLineIds(database),
  }
}
