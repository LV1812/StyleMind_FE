import type { DemoDatabase } from '@/app/store/types'
import type { CancellationRequest, Order, ReturnRequest } from '@/entities/order/model/types'

export interface OrderDetail {
  order: Order
  cancellationRequest: CancellationRequest | null
  returnRequests: ReturnRequest[]
}

export function selectOrdersForUser(database: DemoDatabase, userId: string): Order[] {
  return [...database.orders]
    .filter(order => order.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function selectOrderDetail(database: DemoDatabase, userId: string, orderId: string): OrderDetail | null {
  const order = database.orders.find(item => item.id === orderId && item.userId === userId)
  if (!order) return null

  return {
    order,
    cancellationRequest: database.cancellationRequests.find(request => request.orderId === order.id) ?? null,
    returnRequests: database.returnRequests.filter(request => request.orderId === order.id),
  }
}
