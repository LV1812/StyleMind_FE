import { commerceApi } from '@/api/commerce'
import type { CommerceProduct } from '@/api/commerce.types'

export async function loadAllCommerceProducts(): Promise<CommerceProduct[]> {
  const first = await commerceApi.products.list({ page: 0, size: 100 })
  if (first.total_pages <= 1) return first.items

  const remaining = await Promise.all(
    Array.from({ length: first.total_pages - 1 }, (_, index) =>
      commerceApi.products.list({ page: index + 1, size: 100 }),
    ),
  )
  return [first, ...remaining].flatMap(page => page.items)
}
