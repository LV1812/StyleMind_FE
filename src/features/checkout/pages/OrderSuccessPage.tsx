import { Link, useParams } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { useDemoStore } from '@/app/store/DemoStoreProvider'
import { formatCurrency } from '@/shared/lib/formatCurrency'
import { EmptyState } from '@/shared/ui'
import type { Order } from '@/entities/order/model/types'

import { CHECKOUT_LATEST_ORDER_KEY } from '../data/checkoutRepository'

const paymentLabel = {
  cod: 'Thanh toán khi nhận hàng',
  vietqr: 'VietQR',
}

function readLatestOrder(orderId?: string): Order | null {
  const raw = window.sessionStorage.getItem(CHECKOUT_LATEST_ORDER_KEY)
  if (!raw) return null

  try {
    const order = JSON.parse(raw) as Order
    return order.id === orderId ? order : null
  } catch {
    return null
  }
}

export function OrderSuccessPage() {
  const { orderId } = useParams()
  const { state } = useDemoStore()
  const order = state.orders.find(item => item.id === orderId) ?? readLatestOrder(orderId)

  if (!order) {
    return (
      <div className="mx-auto max-w-[var(--container-wide)] px-5 py-12 md:px-8">
        <EmptyState title="Không tìm thấy đơn hàng" description="Đơn hàng có thể chưa được tạo hoặc đường dẫn chưa đúng." />
      </div>
    )
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-6 px-5 py-12 md:px-8">
      <section className="rounded-lg bg-[#FDFCFA] p-6 shadow-[0_18px_36px_rgba(58,54,50,0.08)]">
        <p className="text-sm font-semibold text-[#48755A]">Đơn hàng đã được ghi nhận</p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-[#222222]">
          Đặt hàng thành công
        </h1>
        <dl className="mt-6 grid gap-3 text-sm">
          <InfoRow label="Mã đơn" value={order.id} />
          <InfoRow label="Tổng thanh toán" value={formatCurrency(order.total)} />
          <InfoRow label="Phương thức" value={paymentLabel[order.paymentMethod]} />
        </dl>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to={`/orders/${order.id}`}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#684B5A] px-4 text-sm font-semibold text-white transition hover:bg-[#593f4d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A] focus-visible:ring-offset-2"
          >
            Xem chi tiết đơn hàng
          </Link>
          <Link
            to={ROUTES.shop}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#EEE8E1] px-4 text-sm font-semibold text-[#222222] transition hover:bg-[#E4DCD2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A] focus-visible:ring-offset-2"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </section>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#EEE8E1] pb-3 last:border-b-0 last:pb-0">
      <dt className="font-semibold text-[#6F6B67]">{label}</dt>
      <dd className="font-bold text-[#222222]">{value}</dd>
    </div>
  )
}
