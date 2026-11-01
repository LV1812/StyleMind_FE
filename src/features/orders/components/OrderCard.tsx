import { Link } from 'react-router-dom'

import type { Order } from '@/entities/order/model/types'
import { formatCurrency } from '@/shared/lib/formatCurrency'
import { formatDate } from '@/shared/lib/formatDate'

export const orderStatusLabel: Record<string, string> = {
  pending: 'Chờ xử lý',
  payment_pending: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  confirmed: 'Đã xác nhận',
  processing: 'Đang chuẩn bị',
  shipped: 'Đang giao',
  completed: 'Hoàn tất',
  cancelled: 'Đã hủy',
}

export function OrderCard({ order }: { order: Order }) {
  return (
    <Link
      to={`/orders/${order.id}`}
      className="rounded-lg border border-[#E3DAD0] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A]"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#222222]">Đơn {order.id}</h2>
          <p className="mt-1 text-sm text-[#6F6B67]">{formatDate(order.createdAt)}</p>
        </div>
        <span className="w-fit rounded-full bg-[#F4E7E8] px-3 py-1 text-xs font-semibold text-[#684B5A]">
          {orderStatusLabel[order.status] ?? order.status}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#3A3632]">
        <span>{order.items.length} sản phẩm</span>
        <span>{formatCurrency(order.total)}</span>
        <span>{order.shippingAddress.province}</span>
      </div>
    </Link>
  )
}
