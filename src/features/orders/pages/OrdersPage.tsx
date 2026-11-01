import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { useDemoStore } from '@/app/store/DemoStoreProvider'
import { useAuth } from '@/features/auth'

import { OrderCard } from '../components/OrderCard'
import { selectOrdersForUser } from '../model/orderSelectors'

export function OrdersPage() {
  const { state } = useDemoStore()
  const { currentUser } = useAuth()

  if (!currentUser) return null

  const orders = selectOrdersForUser(state, currentUser.id)

  return (
    <section className="mx-auto grid max-w-[var(--container-wide)] gap-8 px-5 py-8 md:px-8 md:py-12">
      <div>
        <h1 className="font-display text-4xl font-semibold leading-tight text-[#222222]">Đơn hàng</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6F6B67]">
          Theo dõi trạng thái, sản phẩm, địa chỉ nhận hàng và thanh toán của các đơn đã đặt.
        </p>
      </div>

      {orders.length > 0 ? (
        <div className="grid gap-4">
          {orders.map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      ) : (
        <section className="rounded-lg border border-dashed border-[#D8D0C6] bg-white p-8">
          <h2 className="font-display text-2xl font-semibold text-[#222222]">Bạn chưa có đơn hàng</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6F6B67]">
            Khi thanh toán thành công, đơn hàng sẽ xuất hiện tại đây cùng lịch sử trạng thái.
          </p>
          <Link
            to={ROUTES.shop}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#684B5A] px-4 text-sm font-semibold text-white"
          >
            Mua sắm ngay
          </Link>
        </section>
      )}
    </section>
  )
}
