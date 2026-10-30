import { useState } from 'react'
import { ArrowRight, ArrowUpRight, Banknote, ClipboardList, Package, ShoppingCart, Sparkles, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { OrderStatus } from '@/entities/order/model/types'
import { selectAdminDashboard, selectAdminOrders } from '@/features/admin/model/adminSelectors'
import type { AdminOrderRow } from '@/features/admin/model/adminTypes'
import { orderStatusLabel, paymentMethodLabel } from '@/features/admin/model/adminLabels'
import type { DemoDatabase } from '@/app/store/types'
import { formatCurrency } from '@/shared/lib/formatCurrency'
import { formatDate } from '@/shared/lib/formatDate'

import { MetricCard, StatusBadge } from './AdminCommon'

interface AdminOverviewPanelProps {
  database: DemoDatabase
}

const reportingPeriods = [
  { value: '7d', label: '7 ngày gần đây' },
  { value: '30d', label: '30 ngày gần đây' },
  { value: 'all', label: 'Toàn bộ dữ liệu demo' },
] as const

type ReportingPeriod = (typeof reportingPeriods)[number]['value']

const orderStatusTone: Record<OrderStatus, 'accent' | 'danger' | 'success' | 'warning'> = {
  pending: 'warning',
  payment_pending: 'warning',
  paid: 'success',
  confirmed: 'accent',
  processing: 'accent',
  shipped: 'accent',
  completed: 'success',
  cancelled: 'danger',
}

function filterOrdersByPeriod(orders: AdminOrderRow[], period: ReportingPeriod): AdminOrderRow[] {
  if (period === 'all') return orders

  const now = Date.now()
  const days = period === '7d' ? 7 : 30
  const cutoff = now - days * 24 * 60 * 60 * 1000

  return orders.filter(order => {
    const createdAt = Date.parse(order.createdAt)
    return Number.isFinite(createdAt) && createdAt >= cutoff && createdAt <= now
  })
}

function getOrderStatusBreakdown(orders: AdminOrderRow[]) {
  const counts = new Map<OrderStatus, number>()

  for (const order of orders) {
    counts.set(order.status, (counts.get(order.status) ?? 0) + 1)
  }

  return (Object.entries(orderStatusLabel) as [OrderStatus, string][])
    .map(([status, label]) => ({ status, label, count: counts.get(status) ?? 0 }))
    .filter(item => item.count > 0)
}

export function AdminOverviewPanel({ database }: AdminOverviewPanelProps) {
  const summary = selectAdminDashboard(database)
  const [reportingPeriod, setReportingPeriod] = useState<ReportingPeriod>('all')
  const allOrders = selectAdminOrders(database, {}).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  const periodOrders = filterOrdersByPeriod(allOrders, reportingPeriod)
  const recentOrders = periodOrders.slice(0, 5)
  const orderStatusBreakdown = getOrderStatusBreakdown(periodOrders)
  const periodRevenue = periodOrders.reduce((total, order) => total + (order.status === 'cancelled' ? 0 : order.total), 0)
  const selectedPeriodLabel = reportingPeriods.find(period => period.value === reportingPeriod)?.label ?? 'dữ liệu demo'

  return (
    <section className="grid gap-8">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.82fr)] lg:items-end">
        <div className="grid gap-2">
          <h1 className="text-balance font-sans text-3xl font-semibold leading-tight tracking-tight text-charcoal md:text-4xl">
            Tổng quan quản trị
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-secondary">
            Theo dõi đơn hàng, yêu cầu khách hàng và hoạt động gợi ý trang phục bằng AI trong dữ liệu demo.
          </p>
        </div>

        <Link
          to="/admin?section=requests"
          aria-label={`Mở danh sách yêu cầu hủy đơn và đổi trả. ${summary.pendingRequestCount} yêu cầu chưa hoàn tất.`}
          className="group flex min-h-[72px] items-center justify-between gap-4 rounded-xl border border-blush-dark bg-blush px-4 py-3 text-accent transition-colors hover:bg-blush-dark active:bg-blush-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/75">
              <ClipboardList aria-hidden="true" size={20} strokeWidth={1.8} />
            </span>
            <span className="min-w-0">
              <span className="block font-semibold">Yêu cầu chưa hoàn tất</span>
              <span className="mt-0.5 block text-sm leading-5 text-accent">
                {summary.pendingRequestCount > 0
                  ? 'Mở danh sách để xem và xử lý yêu cầu'
                  : 'Hiện không có yêu cầu nào cần xử lý'}
              </span>
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <span className="text-2xl font-semibold tabular-nums" aria-hidden="true">
              {summary.pendingRequestCount}
            </span>
            <ArrowUpRight aria-hidden="true" className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" size={18} />
          </span>
        </Link>
      </div>

      <section aria-labelledby="admin-store-metrics-heading" className="grid gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="admin-store-metrics-heading" className="text-sm font-semibold text-ink">Chỉ số cửa hàng</h2>
          <label className="flex min-h-11 flex-wrap items-center gap-2 text-sm font-semibold text-ink">
            Kỳ thống kê
            <select
              aria-label="Kỳ thống kê đơn hàng và doanh thu"
              value={reportingPeriod}
              onChange={event => setReportingPeriod(event.currentTarget.value as ReportingPeriod)}
              className="min-h-11 rounded-lg border border-sand-dark bg-white px-3 text-sm font-medium text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              {reportingPeriods.map(period => (
                <option key={period.value} value={period.value}>{period.label}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={UsersRound} tone="accent" label="Người dùng" value={summary.totalUsers} helper="Khách hàng và quản trị viên" />
          <MetricCard icon={Package} tone="ai" label="Sản phẩm" value={summary.totalProducts} helper="Tổng số trong dữ liệu demo" />
          <MetricCard icon={ShoppingCart} tone="success" label="Đơn hàng trong kỳ" value={periodOrders.length} helper="Theo kỳ thống kê đã chọn" />
          <MetricCard icon={Banknote} tone="warning" label="Doanh thu trong kỳ" value={formatCurrency(periodRevenue)} helper="Không tính đơn đã hủy" />
        </div>
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <div className="grid content-start gap-5">
          <section aria-labelledby="admin-recent-orders-heading" className="rounded-xl border border-sand-dark/70 bg-white p-4 shadow-[0_10px_28px_rgba(58,54,50,0.07)] md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="admin-recent-orders-heading" className="text-balance text-xl font-semibold tracking-tight text-charcoal">Đơn hàng gần đây</h2>
              <Link
                to="/admin?section=orders"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-accent transition-colors hover:bg-blush active:bg-blush focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                Xem tất cả đơn hàng
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </div>
            <div className="mt-4 grid gap-3">
              {recentOrders.length === 0 ? (
                <p className="rounded-lg bg-ivory p-4 text-sm text-secondary">
                  {reportingPeriod === 'all'
                    ? 'Chưa có đơn hàng nào trong dữ liệu demo.'
                    : `Chưa có đơn hàng nào trong ${selectedPeriodLabel}.`}
                </p>
              ) : (
                recentOrders.map(order => (
                  <article key={order.id} className="grid gap-3 rounded-lg border border-sand-dark bg-ivory/50 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-charcoal">{order.id}</p>
                      <p className="mt-1 text-sm leading-5 text-secondary">
                        {order.customerName} · {formatDate(order.createdAt)} · {paymentMethodLabel[order.paymentMethod]}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      <StatusBadge tone={orderStatusTone[order.status]}>
                        {orderStatusLabel[order.status]}
                      </StatusBadge>
                      <span className="text-sm font-semibold tabular-nums text-charcoal">{formatCurrency(order.total)}</span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section aria-labelledby="admin-order-status-heading" className="rounded-xl border border-sand-dark/70 bg-white p-4 shadow-[0_10px_28px_rgba(58,54,50,0.07)] md:p-5">
            <div className="border-b border-sand-dark/70 pb-3">
              <h2 id="admin-order-status-heading" className="text-xl font-semibold tracking-tight text-charcoal">Trạng thái đơn hàng</h2>
              <p className="mt-1 text-sm text-secondary">Trong {selectedPeriodLabel.toLowerCase()}.</p>
            </div>
            {orderStatusBreakdown.length === 0 ? (
              <p className="mt-4 rounded-lg bg-ivory p-4 text-sm text-secondary">Chưa có đơn hàng trong kỳ này.</p>
            ) : (
              <ul className="mt-1 divide-y divide-sand-dark/60">
                {orderStatusBreakdown.map(item => {
                  const percentage = Math.round((item.count / periodOrders.length) * 100)

                  return (
                    <li key={item.status} className="py-3 first:pt-3 last:pb-1">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-charcoal">{item.label}</span>
                        <span className="min-w-9 rounded-md border border-sand-dark/70 bg-ivory px-2 py-1 text-center font-semibold tabular-nums text-charcoal">
                          {item.count}
                        </span>
                      </div>
                      <div
                        className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand"
                        role="progressbar"
                        aria-label={`Tỷ lệ đơn hàng ${item.label}`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={percentage}
                      >
                        <div className="h-full rounded-full bg-accent-mid" style={{ width: `${percentage}%` }} />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>

        <section aria-labelledby="admin-ai-summary-heading" className="rounded-xl border border-sand-dark/70 bg-white p-4 shadow-[0_10px_28px_rgba(58,54,50,0.07)] md:p-5">
          <div className="flex items-start gap-3 border-b border-sand-dark/70 pb-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-ai-light text-ai-purple">
              <Sparkles aria-hidden="true" size={19} strokeWidth={1.9} />
            </span>
            <div>
              <h2 id="admin-ai-summary-heading" className="text-balance text-xl font-semibold tracking-tight text-charcoal">Bộ phối và gợi ý AI</h2>
              <p className="mt-1 text-sm text-secondary">Tổng hợp từ toàn bộ dữ liệu demo.</p>
            </div>
          </div>
          <dl className="mt-1 divide-y divide-sand-dark/60 text-sm">
            <div className="flex items-center justify-between gap-3 py-3 first:pt-4">
              <dt className="text-secondary">Bộ phối hiện có</dt>
              <dd className="min-w-9 rounded-md border border-sand-dark/70 bg-ivory px-2 py-1 text-right font-semibold tabular-nums text-charcoal">{summary.ai.outfitsTotal}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-3">
              <dt className="text-secondary">Bộ phối tạo bằng AI</dt>
              <dd className="min-w-9 rounded-md border border-sand-dark/70 bg-ivory px-2 py-1 text-right font-semibold tabular-nums text-charcoal">{summary.ai.aiOutfits}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-3">
              <dt className="text-secondary">Bộ phối tạo thủ công</dt>
              <dd className="min-w-9 rounded-md border border-sand-dark/70 bg-ivory px-2 py-1 text-right font-semibold tabular-nums text-charcoal">{summary.ai.manualOutfits}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-3">
              <dt className="text-secondary">Lượt tạo bộ phối bằng AI</dt>
              <dd className="min-w-9 rounded-md border border-sand-dark/70 bg-ivory px-2 py-1 text-right font-semibold tabular-nums text-charcoal">{summary.ai.generatedOutfits}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-3">
              <dt className="text-secondary">Sản phẩm thêm vào giỏ từ gợi ý AI</dt>
              <dd className="min-w-9 rounded-md border border-sand-dark/70 bg-ivory px-2 py-1 text-right font-semibold tabular-nums text-charcoal">{summary.ai.aiAddedToCart}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-3 last:pb-0">
              <dt className="text-secondary">Đơn hàng từ gợi ý AI</dt>
              <dd className="min-w-9 rounded-md border border-sand-dark/70 bg-ivory px-2 py-1 text-right font-semibold tabular-nums text-charcoal">{summary.ai.aiOrderCount}</dd>
            </div>
          </dl>
        </section>
      </div>
    </section>
  )
}
