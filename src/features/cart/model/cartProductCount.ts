import type { Product } from '@/entities/product/model/types'
import type { GuestCartItem } from '../data/guestCartApi'

export function countCartProducts(items: GuestCartItem[], products: Product[]): number {
  const productByVariant = new Map(products.flatMap(product => product.variants.map(variant => [variant.id, product.id] as const)))
  return new Set(items.map(item => productByVariant.get(item.variant_id) ?? `variant:${item.variant_id}`)).size
}
