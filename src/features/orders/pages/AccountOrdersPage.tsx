import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { ROUTES } from '@/app/router/routes'
import { readOrderReferences } from '@/features/payments/model/orderReferences'

export default function AccountOrdersPage() {
  const { currentUser } = useAuth()
  const records = readOrderReferences().filter(item => item.owner === 'account' && item.accountId === currentUser?.id)
  return <section className="mx-auto grid max-w-3xl gap-5 px-5 py-8">
    <h1 className="font-display text-4xl font-semibold">Đơn hàng</h1>
    <p className="text-sm leading-6 text-secondary">Các mã đơn đã mở hoặc đặt bằng tài khoản này trên trình duyệt hiện tại. Mở đơn để tải trạng thái mới nhất từ hệ thống.</p>
    {records.length ? records.map(item => <Link key={item.orderId} className="break-all rounded-xl border border-sand bg-white p-4 text-sm font-medium text-accent" to={ROUTES.orderDetail.replace(':orderId', encodeURIComponent(item.orderId))}>Xem đơn {item.orderId}</Link>) : <p>Chưa lưu mã đơn nào trên trình duyệt này.</p>}
    <Link to={ROUTES.payments} className="text-accent underline">Tìm đơn bằng mã đơn hàng</Link>
    <Link to={ROUTES.shop} className="text-accent underline">Tiếp tục mua sắm</Link>
  </section>
}
