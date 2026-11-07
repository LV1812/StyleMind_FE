import { beforeEach, expect, it, vi } from 'vitest'
import { commerceApi } from '@/api/commerce'
import { loadAdminOrders } from './loadAdminOrders'

vi.mock('@/api/commerce', () => ({ commerceApi: { orders: { listAdmin: vi.fn() } } }))
beforeEach(() => vi.resetAllMocks())

it('loads all order pages and keeps the server total', async () => {
  vi.mocked(commerceApi.orders.listAdmin)
    .mockResolvedValueOnce({ items: [{ order_id: 'one' } as never], page: 0, size: 100, total_elements: 101, total_pages: 2 })
    .mockResolvedValueOnce({ items: [{ order_id: 'two' } as never], page: 1, size: 100, total_elements: 101, total_pages: 2 })
  const result = await loadAdminOrders()
  expect(commerceApi.orders.listAdmin).toHaveBeenNthCalledWith(1, { page: 0, size: 100 })
  expect(commerceApi.orders.listAdmin).toHaveBeenNthCalledWith(2, { page: 1, size: 100 })
  expect(result.items.map(order => order.order_id)).toEqual(['one', 'two'])
  expect(result.total).toBe(101)
})

it('propagates an error when any page fails instead of returning partial data', async () => {
  vi.mocked(commerceApi.orders.listAdmin)
    .mockResolvedValueOnce({ items: [], page: 0, size: 100, total_elements: 101, total_pages: 2 })
    .mockRejectedValueOnce(new Error('Không tải được trang đơn hàng'))
  await expect(loadAdminOrders()).rejects.toThrow('Không tải được trang đơn hàng')
})
