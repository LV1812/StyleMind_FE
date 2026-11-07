import { Bell, CircleDollarSign, Package, ShoppingCart, Users, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

interface SummaryCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  to?: string
  note?: string
}

function SummaryCard({ label, value, icon: Icon, to, note }: SummaryCardProps) {
  const content = <><div className="flex items-start justify-between gap-4"><span className="text-sm text-secondary">{label}</span><Icon size={19} aria-hidden="true" /></div><p className="mt-5 font-display text-3xl">{value}</p>{note && <p className="mt-2 text-xs text-secondary">{note}</p>}</>
  const styles = 'block min-w-0 rounded-xl border border-[#E3E2E2] bg-white p-5'
  return to ? <Link to={to} className={`${styles} transition hover:border-[#999]`}>{content}</Link> : <div className={styles}>{content}</div>
}

export function AdminOverviewLive({ productCount, orderCount, loading }: { productCount: number | null; orderCount: number | null; loading: boolean }) {
  return <section className="space-y-8">
    <header><h1 className="font-display text-4xl">Tổng quan quản trị</h1><p className="mt-2 text-sm text-secondary">Theo dõi hoạt động cửa hàng và quản lý dữ liệu.</p></header>

    <section aria-labelledby="admin-orders-heading" className="space-y-4">
      <h2 id="admin-orders-heading" className="font-display text-2xl">Đơn hàng &amp; doanh thu</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Tổng đơn hàng" value={loading ? '…' : orderCount ?? '—'} icon={ShoppingCart} to="/admin?section=orders" note="Xem đơn hàng →" />
        <SummaryCard label="Doanh thu" value="—" icon={CircleDollarSign} note="Số liệu tổng hợp chưa được hỗ trợ." />
      </div>
    </section>

    <section aria-labelledby="admin-store-heading" className="space-y-4">
      <h2 id="admin-store-heading" className="font-display text-2xl">Cửa hàng &amp; người dùng</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Sản phẩm đang hiển thị" value={loading ? '…' : productCount ?? '—'} icon={Package} to="/admin?section=products" note="Xem sản phẩm →" />
        <SummaryCard label="Khách hàng" value="—" icon={Users} to="/admin?section=customers" note="Xem tài khoản →" />
        <SummaryCard label="Thông báo" value="—" icon={Bell} to="/admin?section=notifications" note="Chưa hỗ trợ danh sách thông báo." />
      </div>
    </section>
  </section>
}
