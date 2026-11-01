import { selectAdminDashboard, selectAdminOrders } from '@/features/admin/model/adminSelectors'
import { orderStatusLabel, paymentMethodLabel } from '@/features/admin/model/adminLabels'
import type { DemoDatabase } from '@/app/store/types'
import { formatCurrency } from '@/shared/lib/formatCurrency'
import { formatDate } from '@/shared/lib/formatDate'

import { MetricCard, StatusBadge } from './AdminCommon'

interface AdminOverviewPanelProps {
  database: DemoDatabase
}

export function AdminOverviewPanel({ database }: AdminOverviewPanelProps) {
  const summary = selectAdminDashboard(database)
  const recentOrders = selectAdminOrders(database, {}).slice(0, 5)

  return (
    <section className="grid gap-6">
      <div>
        <p className="text-sm font-semibold text-[#684B5A]">Bảng quản trị StyleMind</p>
        <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-[#222222] md:text-4xl">
          Tổng quan quản trị
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6F6B67]">
          Theo dõi vận hành cửa hàng, yêu cầu khách hàng và hiệu quả tủ đồ AI trong cùng dữ liệu demo.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Người dùng" value={summary.totalUsers} helper="Bao gồm khách hàng và quản trị viên" />
        <MetricCard label="Sản phẩm" value={summary.totalProducts} helper="Chỉ nhóm quần áo nữ" />
        <MetricCard label="Đơn hàng" value={summary.totalOrders} helper="Tính từ dữ liệu demo hiện tại" />
        <MetricCard label="Doanh thu" value={formatCurrency(summary.totalRevenue)} helper="Không tính đơn đã hủy" />
        <MetricCard label="Yêu cầu cần duyệt" value={summary.pendingRequestCount} helper="Hủy đơn và đổi/trả" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <section className="rounded-lg bg-white p-4 shadow-[0_10px_28px_rgba(58,54,50,0.07)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold text-[#222222]">Đơn gần đây</h2>
            <StatusBadge tone={summary.pendingRequestCount > 0 ? 'warning' : 'success'}>
              {summary.pendingRequestCount} yêu cầu chờ
            </StatusBadge>
          </div>
          <div className="mt-4 grid gap-3">
            {recentOrders.length === 0 ? (
              <p className="rounded-lg bg-[#FAF8F5] p-4 text-sm text-[#6F6B67]">Chưa có đơn hàng nào trong demo.</p>
            ) : (
              recentOrders.map(order => (
                <article key={order.id} className="grid gap-3 rounded-lg border border-[#E3DAD0] p-3 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <p className="font-semibold text-[#222222]">{order.id}</p>
                    <p className="mt-1 text-sm text-[#6F6B67]">
                      {order.customerName} · {formatDate(order.createdAt)} · {paymentMethodLabel[order.paymentMethod]}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    <StatusBadge tone={order.status === 'cancelled' ? 'danger' : order.status === 'completed' ? 'success' : 'accent'}>
                      {orderStatusLabel[order.status]}
                    </StatusBadge>
                    <span className="text-sm font-semibold tabular-nums text-[#222222]">{formatCurrency(order.total)}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-lg bg-white p-4 shadow-[0_10px_28px_rgba(58,54,50,0.07)]">
          <h2 className="font-display text-2xl font-semibold text-[#222222]">Phân tích AI</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-[#6F6B67]">Bộ phối hiện có</dt>
              <dd className="font-semibold text-[#222222]">{summary.ai.outfitsTotal}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[#6F6B67]">Tạo bằng AI</dt>
              <dd className="font-semibold text-[#222222]">{summary.ai.aiOutfits}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[#6F6B67]">Tạo thủ công</dt>
              <dd className="font-semibold text-[#222222]">{summary.ai.manualOutfits}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[#6F6B67]">Lượt tạo bằng AI</dt>
              <dd className="font-semibold text-[#222222]">{summary.ai.generatedOutfits}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[#6F6B67]">Sản phẩm AI thêm vào giỏ</dt>
              <dd className="font-semibold text-[#222222]">{summary.ai.aiAddedToCart}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[#6F6B67]">Đơn từ gợi ý AI</dt>
              <dd className="font-semibold text-[#222222]">{summary.ai.aiOrderCount}</dd>
            </div>
          </dl>
        </section>
      </div>
    </section>
  )
}
