import { Link, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'

import { ROUTES } from '@/app/router/routes'
import type { AdminSection } from '@/features/admin/model/adminTypes'
import { Button } from '@/shared/ui'

interface AdminShellProps {
  activeSection: AdminSection
  adminName: string
  adminEmail: string
  onLogout: () => void
  children: ReactNode
}

const navItems: { id: AdminSection; label: string }[] = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'products', label: 'Sản phẩm' },
  { id: 'categories', label: 'Danh mục' },
  { id: 'orders', label: 'Đơn hàng' },
  { id: 'requests', label: 'Yêu cầu' },
  { id: 'customers', label: 'Khách hàng' },
  { id: 'ai', label: 'AI' },
]

export function AdminShell({ activeSection, adminName, adminEmail, onLogout, children }: AdminShellProps) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#F5F2EE] text-[#222222] lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="border-b border-[#E3DAD0] bg-[#25211F] px-4 py-4 text-white lg:min-h-screen lg:border-b-0 lg:border-r lg:border-[#3A3632]">
        <Link to="/admin" className="inline-flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A5B0]">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#F4E7E8] font-display text-xl font-semibold text-[#684B5A]">
            S
          </span>
          <span>
            <span className="block font-display text-xl font-semibold">StyleMind</span>
            <span className="block text-xs font-semibold text-white/55">Quản trị</span>
          </span>
        </Link>

        <nav className="mt-6 grid gap-1" aria-label="Khu vực quản trị">
          {navItems.map(item => {
            const active = item.id === activeSection
            const to = item.id === 'overview' ? '/admin' : `/admin?section=${item.id}`

            return (
              <Link
                key={item.id}
                to={to}
                className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A5B0] ${
                  active ? 'bg-[#F4E7E8] text-[#684B5A]' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-[var(--z-sticky)] border-b border-[#E3DAD0] bg-[#FDFCFA]/95 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold text-[#8A8179]">Đăng nhập với quyền quản trị viên</p>
              <p className="mt-1 text-sm font-semibold text-[#222222]">
                {adminName} · {adminEmail}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => navigate(ROUTES.shop)}>
                Xem cửa hàng
              </Button>
              <Button type="button" variant="ghost" onClick={onLogout}>
                Đăng xuất
              </Button>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 md:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
