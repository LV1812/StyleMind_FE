import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { ROUTES } from '@/app/router/routes'
import { readOrderReferences } from '@/features/payments/model/orderReferences'
import { ArrowRight, PackageSearch } from 'lucide-react'

export default function AccountOrdersPage() {
  const { currentUser } = useAuth()
  const records = readOrderReferences().filter(item => item.owner === 'account' && item.accountId === currentUser?.id)
  return <section className="mx-auto max-w-5xl px-5 py-10 md:px-8 md:py-12">
    <header className="border-b border-[#E3E2E2] pb-7">
      <p className="text-sm font-medium text-[#5E5F5D]">Tài khoản của tôi</p>
      <h1 className="mt-2 font-display text-4xl font-semibold">Đơn hàng</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-secondary">Các mã đơn đã mở hoặc đặt bằng tài khoản này trên trình duyệt hiện tại. Mở đơn để tải trạng thái mới nhất từ hệ thống.</p>
    </header>
    <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
      <h2 className="font-display text-2xl font-semibold">Đơn hàng đã lưu</h2>
      <Link to={ROUTES.payments} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#C4C7C7] px-4 text-sm font-semibold hover:bg-[#F4F4F3]"><PackageSearch size={17} /> Tìm đơn bằng mã đơn hàng</Link>
    </div>
    {records.length ? <div className="mt-5 grid gap-4">{records.map(item => <Link key={item.orderId} aria-label={`Xem đơn ${item.orderId}`} className="group flex items-center justify-between gap-4 rounded-lg border border-[#E3E2E2] bg-white p-5 hover:border-[#777]" to={ROUTES.orderDetail.replace(':orderId', encodeURIComponent(item.orderId))}><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-secondary">Mã đơn hàng</p><p className="mt-2 break-all text-sm font-medium">{item.orderId}</p></div><span className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold">Xem đơn <ArrowRight size={16} /></span></Link>)}</div> : <div className="mt-5 rounded-lg border border-dashed border-[#C4C7C7] bg-white px-6 py-12 text-center"><PackageSearch className="mx-auto text-secondary" size={28} /><p className="mt-4 font-medium">Chưa lưu mã đơn nào trên trình duyệt này.</p><p className="mt-2 text-sm text-secondary">Bạn có thể tìm đơn bằng mã đơn hàng hoặc tiếp tục mua sắm.</p></div>}
    <Link to={ROUTES.shop} className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">Tiếp tục mua sắm</Link>
  </section>
}
