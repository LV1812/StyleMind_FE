import { commerceApi } from '@/api/commerce'
import type { OrderResponse } from '@/api/commerce.types'

export async function loadAdminOrders(): Promise<{ items: OrderResponse[]; total: number }> {
  const first = await commerceApi.orders.listAdmin({ page: 0, size: 100 })
  const items = [...first.items]
  for (let page = 1; page < first.total_pages; page++) {
    const next = await commerceApi.orders.listAdmin({ page, size: 100 })
    items.push(...next.items)
  }
  return { items, total: first.total_elements }
}
