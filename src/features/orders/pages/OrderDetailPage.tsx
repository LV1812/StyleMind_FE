import { Link, useParams } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { useDemoStore } from '@/app/store/DemoStoreProvider'
import { useAuth } from '@/features/auth'
import { formatCurrency } from '@/shared/lib/formatCurrency'
import { formatDate } from '@/shared/lib/formatDate'

import { CancellationRequestForm } from '../components/CancellationRequestForm'
import { orderStatusLabel } from '../components/OrderCard'
import { OrderTimeline } from '../components/OrderTimeline'
import { ReturnRequestForm } from '../components/ReturnRequestForm'
import { selectOrderDetail } from '../model/orderSelectors'

const cancellableStatuses = new Set(['pending', 'payment_pending', 'paid', 'confirmed'])
const returnableStatuses = new Set(['shipped', 'completed'])

export function OrderDetailPage() {
  const { orderId } = useParams()
  const { state, dispatch } = useDemoStore()
  const { currentUser } = useAuth()

  if (!currentUser) return null

  const detail = orderId ? selectOrderDetail(state, currentUser.id, orderId) : null

  if (!detail) {
    return (
      <section className="mx-auto max-w-[var(--container-wide)] px-5 py-10 md:px-8">
        <Link to={ROUTES.orders} className="text-sm font-semibold text-[#684B5A] hover:underline">
          Đơn hàng
        </Link>
        <h1 className="mt-4 font-display text-4xl font-semibold text-[#222222]">Không tìm thấy đơn hàng</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[#6F6B67]">
          Đơn hàng này không thuộc tài khoản hiện tại hoặc đã bị thay đổi đường dẫn.
        </p>
      </section>
    )
  }

  const { order } = detail
  const canCancel = cancellableStatuses.has(order.status)
  const canReturn = returnableStatuses.has(order.status)

  const submitCancellation = (reason: string) => {
    dispatch({
      type: 'cancellation/submitted',
      payload: {
        id: `cancel-${order.id}-${Date.now()}`,
        orderId: order.id,
        userId: currentUser.id,
        reason,
        status: 'submitted',
        createdAt: new Date().toISOString(),
      },
    })
  }

  const submitReturn = (reason: string, selectedVariantIds: string[]) => {
    dispatch({
      type: 'return/submitted',
      payload: {
        id: `return-${order.id}-${Date.now()}`,
        orderId: order.id,
        userId: currentUser.id,
        reason,
        items: order.items
          .filter(item => selectedVariantIds.includes(item.variantId))
          .map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        status: 'submitted',
        createdAt: new Date().toISOString(),
      },
    })
  }

  return (
    <section className="mx-auto grid max-w-[var(--container-wide)] gap-8 px-5 py-8 md:px-8 md:py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Link to={ROUTES.orders} className="text-sm font-semibold text-[#684B5A] hover:underline">
            Đơn hàng
          </Link>
          <h1 className="mt-2 font-display text-4xl font-semibold text-[#222222]">Đơn {order.id}</h1>
          <p className="mt-3 text-sm text-[#6F6B67]">Ngày đặt {formatDate(order.createdAt)}</p>
        </div>
        <span className="w-fit rounded-full bg-[#F4E7E8] px-3 py-1 text-xs font-semibold text-[#684B5A]">
          {orderStatusLabel[order.status] ?? order.status}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-4">
          <section className="rounded-lg border border-[#E3DAD0] bg-white p-5 shadow-sm">
            <h2 className="font-display text-2xl font-semibold text-[#222222]">Sản phẩm</h2>
            <div className="mt-5 grid gap-4">
              {order.items.map(item => (
                <article key={`${item.productId}-${item.variantId}`} className="flex gap-4">
                  <img src={item.imageUrl} alt={item.name} className="h-20 w-16 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-[#222222]">{item.name}</h3>
                    <p className="mt-1 text-sm text-[#6F6B67]">
                      {item.brand} · {item.color} · {item.size} · x{item.quantity}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#222222]">{formatCurrency(item.unitPrice)}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
          <OrderTimeline items={order.timeline} />
        </div>

        <aside className="grid h-fit gap-4">
          <section className="rounded-lg border border-[#E3DAD0] bg-white p-5 shadow-sm">
            <h2 className="font-display text-xl font-semibold text-[#222222]">Giao hàng</h2>
            <p className="mt-3 text-sm leading-6 text-[#3A3632]">
              {order.shippingAddress.recipientName} · {order.shippingAddress.phone}
              <br />
              {order.shippingAddress.line1}, {order.shippingAddress.ward}, {order.shippingAddress.district}, {order.shippingAddress.province}
            </p>
          </section>
          <section className="rounded-lg border border-[#E3DAD0] bg-white p-5 shadow-sm">
            <h2 className="font-display text-xl font-semibold text-[#222222]">Thanh toán</h2>
            <p className="mt-3 text-sm text-[#6F6B67]">{order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : 'VietQR'}</p>
            <p className="mt-2 text-2xl font-semibold text-[#222222]">{formatCurrency(order.total)}</p>
          </section>
          {canCancel && (
            <CancellationRequestForm submitted={Boolean(detail.cancellationRequest)} onSubmit={submitCancellation} />
          )}
          {canReturn && (
            <ReturnRequestForm
              items={order.items}
              submitted={detail.returnRequests.length > 0}
              onSubmit={submitReturn}
            />
          )}
        </aside>
      </div>
    </section>
  )
}
