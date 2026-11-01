import { useEffect, useState } from 'react'
import type { AppState } from '../types'
import { formatVND } from '../data/mockData'
import { commerceApi } from '../api/commerce'
import type { CommerceProduct } from '../api/commerce.types'

type AdminSection = 'dashboard' | 'orders' | 'products' | 'returns' | 'users' | 'ai-knowledge' | 'notifications' | 'audit'

function fmt(n: number) { return formatVND(n) }

const navItems: { key: AdminSection; label: string; icon: string }[] = [
  { key: 'dashboard', label: "Tổng quan", icon: '▣' },
  { key: 'orders', label: "Đơn hàng", icon: '□' },
  { key: 'products', label: "Sản phẩm", icon: '◈' },
  { key: 'returns', label: "Đổi trả và hoàn tiền", icon: '↩' },
  { key: 'users', label: "Người dùng", icon: '○' },
  { key: 'ai-knowledge', label: "Kho kiến thức AI", icon: '✦' },
  { key: 'notifications', label: "Thông báo", icon: '◎' },
  { key: 'audit', label: "Nhật ký hoạt động", icon: '◷' },
]

const fallbackOrders = [
  { id: 'SM2409200001', customer: "Nguyễn Thị Lan", status: 'SHIPPED', payment: 'SePay', total: 2_780_000, date: "20/09", items: 2 },
  { id: 'SM2409190007', customer: "Trần Phương Anh", status: 'PENDING', payment: 'COD', total: 1_890_000, date: "19/09", items: 1 },
  { id: 'SM2409180003', customer: "Lê Thị Hoa", status: 'PAID', payment: 'SePay', total: 4_380_000, date: "18/09", items: 3 },
  { id: 'SM2409170009', customer: "Phạm Mỹ Linh", status: 'COMPLETED', payment: 'SePay', total: 990_000, date: "17/09", items: 1 },
  { id: 'SM2409160002', customer: "Võ Thùy Linh", status: 'CANCELLED', payment: 'COD', total: 1_290_000, date: "16/09", items: 1 },
]

function statusBadge(status: string) {
  const map: Record<string, { color: string; bg: string; label: string }> = {
    PENDING_PAYMENT: { color: "var(--color-warning)", bg: "var(--color-warning-bg)", label: "Chờ thanh toán" },
    PLACED: { color: "var(--color-accent)", bg: "var(--color-blush)", label: "Đã xác nhận" },
    PENDING: { color: "var(--color-warning)", bg: "var(--color-warning-bg)", label: "Chờ xử lý" },
    PAYMENT_PENDING: { color: "var(--color-warning)", bg: "var(--color-warning-bg)", label: "Chờ thanh toán" },
    PAID: { color: "var(--color-accent)", bg: "var(--color-blush)", label: "Đã thanh toán" },
    CONFIRMED: { color: "var(--color-accent)", bg: "var(--color-blush)", label: "Đã xác nhận" },
    SHIPPED: { color: "var(--color-success)", bg: "var(--color-success-bg)", label: "Đã gửi hàng" },
    COMPLETED: { color: "var(--color-success)", bg: "var(--color-success-bg)", label: "Hoàn tất" },
    CANCELLED: { color: "var(--color-error)", bg: "var(--color-error-bg)", label: "Đã hủy" },
    FAILED: { color: "var(--color-error)", bg: "var(--color-error-bg)", label: "Thất bại" },
  }
  const s = map[status] || { color: "var(--color-muted)", bg: "var(--color-sand)", label: status }
  return <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: s.bg, color: s.color }}>{s.label}</span>
}

const knowledgeSources = [
  { id: 1, title: "Báo cáo xu hướng màu sắc xuân hè 2026", type: "Văn bản", status: "Đã duyệt", concepts: 14, date: "15/09" },
  { id: 2, title: "Hướng dẫn thương hiệu StyleMind phiên bản 3", type: 'URL', status: "Chờ duyệt", concepts: 8, date: "18/09" },
  { id: 3, title: "Quy tắc phối áo blazer linen", type: "Văn bản", status: "Bản nháp", concepts: 6, date: "20/09" },
  { id: 4, title: "Thời tiết và thời trang Đà Lạt", type: 'URL', status: "Từ chối", concepts: 3, date: "14/09" },
]

function knowledgeBadge(status: string) {
  const map: Record<string, { color: string; bg: string }> = {
    "Đã duyệt": { color: "var(--color-success)", bg: "var(--color-success-bg)" },
    "Chờ duyệt": { color: "var(--color-warning)", bg: "var(--color-warning-bg)" },
    "Bản nháp": { color: "var(--color-muted)", bg: "var(--color-sand)" },
    "Từ chối": { color: "var(--color-error)", bg: "var(--color-error-bg)" },
  }
  const s = map[status] || { color: "var(--color-muted)", bg: "var(--color-sand)" }
  return <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: s.bg, color: s.color }}>{status}</span>
}

interface Props {
  onNavigate: (screen: string, opts?: any) => void
  app?: AppState
}

export default function Admin({ onNavigate }: Props) {
  const [section, setSection] = useState<AdminSection>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [orders, setOrders] = useState(fallbackOrders)
  const [products, setProducts] = useState<CommerceProduct[]>([])
  const [commerceError, setCommerceError] = useState<string | null>(null)

  useEffect(() => {
    const loadCommerceAdmin = async () => {
      try {
        const [orderPage, productPage] = await Promise.all([
          commerceApi.orders.listAdmin({ page: 0, size: 100 }),
          commerceApi.products.list({ page: 0, size: 100 }),
        ])
        setOrders(orderPage.items.map(order => ({
          id: order.order_number,
          customer: order.customer_id,
          status: order.order_status,
          payment: order.payment_method === 'COD' ? 'COD' : 'SePay',
          total: order.accepted_total_vnd,
          date: order.placed_at ? new Date(order.placed_at).toLocaleDateString('vi-VN') : '-',
          items: order.items.length,
        })))
        setProducts(productPage.items)
      } catch (error) {
        setCommerceError(error instanceof Error ? error.message : 'Không thể tải dữ liệu Commerce.')
      }
    }
    void loadCommerceAdmin()
  }, [])

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--color-canvas)", fontFamily: 'var(--font-sans)' }}>
      {/* Sidebar */}
      <aside className="w-60 border-r flex-none flex flex-col" style={{ borderColor: "var(--color-divider)", background: "var(--color-surface-soft)" }}>
        {/* Logo */}
        <div className="px-5 py-5 border-b" style={{ borderColor: "var(--color-divider)" }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--color-accent)" }}>
              <span className="text-on-accent text-xs font-bold">S</span>
            </div>
            <div>
              <p className="font-display text-base font-semibold" style={{ color: "var(--color-charcoal)" }}>StyleMind</p>
              <p className="text-xs" style={{ color: "var(--color-muted)" }}>Trang quản trị</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => setSection(item.key)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left mb-0.5 transition-all"
              style={{
                background: section === item.key ? "var(--color-blush)" : 'transparent',
                color: section === item.key ? "var(--color-accent)" : "var(--color-secondary)",
              }}
            >
              <span className="text-sm w-5 text-center">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
              {item.key === 'returns' && (
                <span className="ml-auto text-xs px-1.5 py-0.5 rounded font-bold" style={{ background: "var(--color-blush)", color: "var(--color-accent)" }}>3</span>
              )}
            </button>
          ))}
        </nav>

        <div className="border-t p-4" style={{ borderColor: "var(--color-divider)" }}>
          <button onClick={() => onNavigate('home')} className="w-full text-left text-xs" style={{ color: "var(--color-muted)" }}>
            ← Về cửa hàng
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {/* Topbar */}
        <div className="sticky top-0 z-10 px-8 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--color-divider)", background: "var(--color-surface-soft)" }}>
          <h1 className="font-display text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>
            {navItems.find(n => n.key === section)?.label}
          </h1>
          <div className="flex items-center gap-3">
            <div className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "var(--color-sand)", color: "var(--color-secondary)" }}>
              Quản trị viên — Lan N.
            </div>
          </div>
        </div>

        <div className="p-8">
          {commerceError && (
            <div className="mb-5 p-3 rounded-xl text-xs" style={{ background: "var(--color-error-bg)", color: "var(--color-error)" }} role="alert">
              {commerceError}
            </div>
          )}
          {/* Dashboard */}
          {section === 'dashboard' && (
            <div className="fade-in">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Doanh thu (tháng 9)", value: fmt(87_400_000), trend: '+12%', color: "var(--color-success)" },
                  { label: "Đơn hàng hôm nay", value: '14', trend: "+3 so với hôm qua", color: "var(--color-accent)" },
                  { label: "Đơn chờ thanh toán", value: '5', trend: "2 SePay · 3 COD", color: "var(--color-warning)" },
                  { label: "Yêu cầu đổi trả chờ duyệt", value: '3', trend: "Cần xử lý", color: "var(--color-error)" },
                ].map(stat => (
                  <div key={stat.label} className="rounded-2xl p-5 border" style={{ borderColor: "var(--color-divider)", background: "var(--color-surface-soft)" }}>
                    <p className="text-xs mb-3" style={{ color: "var(--color-muted)" }}>{stat.label}</p>
                    <p className="font-display text-2xl font-semibold mb-1" style={{ color: stat.color }}>{stat.value}</p>
                    <p className="text-xs" style={{ color: "var(--color-muted)" }}>{stat.trend}</p>
                  </div>
                ))}
              </div>

              {/* Payment breakdown */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="rounded-2xl border p-5" style={{ borderColor: "var(--color-divider)", background: "var(--color-surface-soft)" }}>
                  <p className="text-sm font-semibold mb-4" style={{ color: "var(--color-charcoal)" }}>Thống kê thanh toán</p>
                  <div className="space-y-3">
                    {[
                      { label: "SePay — Hoàn tất", value: fmt(62_400_000), color: "var(--color-success)", pct: 71 },
                      { label: "COD — Hoàn tất", value: fmt(18_200_000), color: "var(--color-accent)", pct: 21 },
                      { label: "SePay — Chờ xử lý", value: fmt(4_300_000), color: "var(--color-warning)", pct: 5 },
                      { label: "Đã hoàn tiền", value: fmt(2_500_000), color: "var(--color-error)", pct: 3 },
                    ].map(item => (
                      <div key={item.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span style={{ color: "var(--color-secondary)" }}>{item.label}</span>
                          <span style={{ color: "var(--color-ink)", fontWeight: 500 }}>{item.value}</span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: "var(--color-sand)" }}>
                          <div className="h-1.5 rounded-full" style={{ width: `${item.pct}%`, background: item.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border p-5" style={{ borderColor: "var(--color-divider)", background: "var(--color-surface-soft)" }}>
                  <p className="text-sm font-semibold mb-4" style={{ color: "var(--color-charcoal)" }}>Hiệu quả AI</p>
                  <div className="space-y-3">
                    {[
                      { label: "Lượt tư vấn AI hôm nay", value: '143' },
                      { label: "Bộ đồ đã tạo", value: '312' },
                      { label: "Lượt thêm vào giỏ từ tư vấn AI", value: '28' },
                      { label: "Tỷ lệ mua sau tư vấn AI", value: '18.5%' },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between text-sm">
                        <span style={{ color: "var(--color-secondary)" }}>{item.label}</span>
                        <span style={{ color: "var(--color-accent)", fontWeight: 600 }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--color-divider)" }}>
                <div className="px-5 py-3.5 border-b flex items-center justify-between" style={{ borderColor: "var(--color-divider)", background: "var(--color-surface-soft)" }}>
                  <p className="text-sm font-semibold" style={{ color: "var(--color-charcoal)" }}>Đơn hàng gần đây</p>
                  <button onClick={() => setSection('orders')} className="text-xs" style={{ color: "var(--color-accent)" }}>Xem tất cả →</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: "var(--color-canvas)" }}>
                        {["Mã đơn hàng", "Khách hàng", "Trạng thái", "Thanh toán", "Sản phẩm", "Tổng cộng"].map(h => (
                          <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order, i) => (
                        <tr key={order.id} className="border-t hover:bg-ivory transition-all cursor-pointer" style={{ borderColor: "var(--color-divider)" }} onClick={() => setSection('orders')}>
                          <td className="px-5 py-3.5 font-mono text-xs" style={{ color: "var(--color-accent)" }}>#{order.id}</td>
                          <td className="px-5 py-3.5 font-medium" style={{ color: "var(--color-charcoal)" }}>{order.customer}</td>
                          <td className="px-5 py-3.5">{statusBadge(order.status)}</td>
                          <td className="px-5 py-3.5 text-xs" style={{ color: "var(--color-secondary)" }}>{order.payment}</td>
                          <td className="px-5 py-3.5 text-xs" style={{ color: "var(--color-secondary)" }}>{order.items}</td>
                          <td className="px-5 py-3.5 font-semibold" style={{ color: "var(--color-ink)" }}>{fmt(order.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Orders */}
          {section === 'orders' && (
            <div className="fade-in">
              <div className="flex gap-3 mb-6">
                <input placeholder="Tìm theo mã đơn hoặc khách hàng..." className="flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: "var(--color-sand-dark)", background: "var(--color-surface-soft)", fontFamily: 'var(--font-sans)' }} />
                <select className="px-4 py-2.5 rounded-xl border text-sm appearance-none" style={{ borderColor: "var(--color-sand-dark)", background: "var(--color-surface-soft)", fontFamily: 'var(--font-sans)' }}>
                  <option>Tất cả trạng thái</option>
                  <option>Chờ xử lý</option>
                  <option>Đã gửi hàng</option>
                  <option>Hoàn tất</option>
                </select>
              </div>
              <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--color-divider)" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "var(--color-canvas)" }}>
                      {["Mã đơn hàng", "Khách hàng", "Ngày đặt", "Trạng thái", "Thanh toán", "Tổng cộng", "Thao tác"].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.id} className="border-t hover:bg-ivory transition-all" style={{ borderColor: "var(--color-divider)" }}>
                        <td className="px-5 py-3.5 font-mono text-xs" style={{ color: "var(--color-accent)" }}>#{order.id}</td>
                        <td className="px-5 py-3.5 font-medium" style={{ color: "var(--color-charcoal)" }}>{order.customer}</td>
                        <td className="px-5 py-3.5 text-xs" style={{ color: "var(--color-muted)" }}>{order.date}</td>
                        <td className="px-5 py-3.5">{statusBadge(order.status)}</td>
                        <td className="px-5 py-3.5 text-xs" style={{ color: "var(--color-secondary)" }}>{order.payment}</td>
                        <td className="px-5 py-3.5 font-semibold" style={{ color: "var(--color-ink)" }}>{fmt(order.total)}</td>
                        <td className="px-5 py-3.5">
                          <button className="text-xs font-medium" style={{ color: "var(--color-accent)" }}>Xem →</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Products */}
          {section === 'products' && (
            <div className="fade-in rounded-2xl border overflow-hidden" style={{ borderColor: "var(--color-divider)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--color-canvas)" }}>
                    {['Sản phẩm', 'Danh mục', 'Thương hiệu', 'Trạng thái', 'Biến thể'].map(header => (
                      <th key={header} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.product_id} className="border-t" style={{ borderColor: "var(--color-divider)" }}>
                      <td className="px-5 py-3.5 font-medium" style={{ color: "var(--color-charcoal)" }}>{product.name}</td>
                      <td className="px-5 py-3.5 text-xs" style={{ color: "var(--color-secondary)" }}>{product.category_name}</td>
                      <td className="px-5 py-3.5 text-xs" style={{ color: "var(--color-secondary)" }}>{product.brand_name}</td>
                      <td className="px-5 py-3.5">{statusBadge(product.product_status)}</td>
                      <td className="px-5 py-3.5 text-xs" style={{ color: "var(--color-secondary)" }}>{product.variants.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {products.length === 0 && <p className="p-8 text-center text-sm" style={{ color: "var(--color-muted)" }}>Chưa có sản phẩm.</p>}
            </div>
          )}

          {/* AI Knowledge */}
          {section === 'ai-knowledge' && (
            <div className="fade-in">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm mb-1" style={{ color: "var(--color-muted)" }}>Quản lý nguồn kiến thức cho hệ thống tư vấn thời trang StyleMind.</p>
                </div>
                <button className="px-4 py-2.5 rounded-full text-sm font-semibold" style={{ background: "var(--color-accent)", color: "var(--color-ivory)" }}>
                  + Thêm nguồn
                </button>
              </div>

              {/* Review queue alert */}
              <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl mb-6" style={{ background: "var(--color-warning-bg)" }}>
                <span style={{ color: "var(--color-warning)" }}>⚠</span>
                <p className="text-sm" style={{ color: "var(--color-warning)" }}>
                  <strong>1 nguồn</strong> đang chờ duyệt để sử dụng cho tư vấn AI.
                </p>
                <button className="ml-auto text-xs font-semibold underline" style={{ color: "var(--color-warning)" }}>Duyệt ngay</button>
              </div>

              <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--color-divider)" }}>
                <div className="px-5 py-3.5 border-b" style={{ borderColor: "var(--color-divider)", background: "var(--color-surface-soft)" }}>
                  <p className="text-sm font-semibold" style={{ color: "var(--color-charcoal)" }}>Nguồn kiến thức</p>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "var(--color-canvas)" }}>
                      {["Tiêu đề", "Loại", "Trạng thái", "Chủ đề", "Ngày thêm", "Thao tác"].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {knowledgeSources.map(src => (
                      <tr key={src.id} className="border-t hover:bg-ivory transition-all" style={{ borderColor: "var(--color-divider)" }}>
                        <td className="px-5 py-3.5 font-medium" style={{ color: "var(--color-charcoal)" }}>{src.title}</td>
                        <td className="px-5 py-3.5 text-xs" style={{ color: "var(--color-muted)" }}>{src.type}</td>
                        <td className="px-5 py-3.5">{knowledgeBadge(src.status)}</td>
                        <td className="px-5 py-3.5 text-xs" style={{ color: "var(--color-secondary)" }}>{src.concepts}</td>
                        <td className="px-5 py-3.5 text-xs" style={{ color: "var(--color-muted)" }}>{src.date}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex gap-2">
                            <button className="text-xs" style={{ color: "var(--color-accent)" }}>Xem xét</button>
                            {src.status === "Chờ duyệt" && (
                              <button className="text-xs font-semibold" style={{ color: "var(--color-success)" }}>Phê duyệt</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Returns */}
          {section === 'returns' && (
            <div className="fade-in">
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { label: "Chờ duyệt", value: '3', color: "var(--color-warning)", bg: "var(--color-warning-bg)" },
                  { label: "Đã duyệt — Chờ nhận lại hàng", value: '2', color: "var(--color-accent)", bg: "var(--color-blush)" },
                  { label: "Chờ hoàn tiền", value: '1', color: "var(--color-success)", bg: "var(--color-success-bg)" },
                ].map(s => (
                  <div key={s.label} className="rounded-2xl p-5 border" style={{ borderColor: "var(--color-divider)", background: s.bg }}>
                    <p className="font-display text-2xl font-semibold mb-1" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-xs" style={{ color: s.color }}>{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--color-divider)" }}>
                <div className="px-5 py-3.5 border-b" style={{ borderColor: "var(--color-divider)", background: "var(--color-surface-soft)" }}>
                  <p className="text-sm font-semibold" style={{ color: "var(--color-charcoal)" }}>Yêu cầu đổi trả</p>
                </div>
                {[
                  { id: 'RT001', customer: "Nguyễn Thị Lan", item: "Áo blazer linen trắng ngà", reason: "Sai kích cỡ", status: "Chờ duyệt", date: "20/09" },
                  { id: 'RT002', customer: "Phạm Mỹ Linh", item: "Áo lụa — Be mộc", reason: "Vấn đề chất lượng", status: "Đã duyệt", date: "18/09" },
                  { id: 'RT003', customer: "Lê Thị Hoa", item: "Chân váy midi xếp ly", reason: "Không còn nhu cầu", status: "Từ chối", date: "15/09" },
                ].map(r => (
                  <div key={r.id} className="flex items-center gap-4 px-5 py-4 border-t" style={{ borderColor: "var(--color-divider)" }}>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: "var(--color-charcoal)" }}>{r.customer} — {r.item}</p>
                      <p className="text-xs" style={{ color: "var(--color-muted)" }}>#{r.id} · {r.reason} · {r.date}</p>
                    </div>
                    {knowledgeBadge(r.status === "Chờ duyệt" ? "Chờ duyệt" : r.status === "Đã duyệt" ? "Đã duyệt" : "Từ chối")}
                    <button className="text-xs font-medium" style={{ color: "var(--color-accent)" }}>Xem →</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generic placeholder for other sections */}
          {!['dashboard', 'orders', 'products', 'ai-knowledge', 'returns'].includes(section) && (
            <div className="py-16 text-center fade-in">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "var(--color-sand)" }}>
                <span className="text-2xl" style={{ color: "var(--color-muted)" }}>
                  {navItems.find(n => n.key === section)?.icon}
                </span>
              </div>
              <p className="font-display text-xl font-light mb-2" style={{ color: "var(--color-charcoal)" }}>{navItems.find(n => n.key === section)?.label}</p>
              <p className="text-sm" style={{ color: "var(--color-muted)" }}>Nội dung đang được cập nhật.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
