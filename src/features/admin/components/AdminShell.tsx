import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ClipboardList,
  LayoutDashboard,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  ShoppingBag,
  Sparkles,
  Store,
  Tags,
  LogOut,
  UsersRound,
} from 'lucide-react'

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

const navItems = [
  { id: 'overview', label: 'Tổng quan', Icon: LayoutDashboard },
  { id: 'products', label: 'Sản phẩm', Icon: Package },
  { id: 'categories', label: 'Danh mục', Icon: Tags },
  { id: 'orders', label: 'Đơn hàng', Icon: ShoppingBag },
  { id: 'requests', label: 'Yêu cầu', Icon: ClipboardList },
  { id: 'customers', label: 'Khách hàng', Icon: UsersRound },
  { id: 'ai', label: 'AI', Icon: Sparkles },
] satisfies { id: AdminSection; label: string; Icon: typeof LayoutDashboard }[]

export function AdminShell({ activeSection, adminName, adminEmail, onLogout, children }: AdminShellProps) {
  const navigate = useNavigate()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem('stylemind-admin-sidebar-collapsed') === 'true'
    } catch {
      return false
    }
  })

  function toggleSidebar() {
    setIsSidebarCollapsed(collapsed => {
      const nextCollapsed = !collapsed
      try {
        window.localStorage.setItem('stylemind-admin-sidebar-collapsed', String(nextCollapsed))
      } catch {
        // Keep the control usable when browser storage is unavailable.
      }
      return nextCollapsed
    })
  }

  return (
    <div
      className={`min-h-screen bg-[#F5F2EE] text-[#222222] transition-[grid-template-columns] duration-200 motion-reduce:transition-none lg:grid ${
        isSidebarCollapsed ? 'lg:grid-cols-[76px_minmax(0,1fr)]' : 'lg:grid-cols-[260px_minmax(0,1fr)]'
      }`}
    >
      <aside
        className={`border-b border-[#E3DAD0] bg-[#25211F] px-4 py-4 text-white lg:sticky lg:top-0 lg:h-screen lg:self-start lg:overflow-y-auto lg:border-b-0 lg:border-r lg:border-[#3A3632] ${
          isSidebarCollapsed ? 'lg:px-3' : ''
        }`}
      >
        <div className={`flex items-center justify-between gap-2 ${isSidebarCollapsed ? 'lg:flex-col lg:justify-center' : ''}`}>
          <Link
            to="/admin"
            aria-label="StyleMind, về tổng quan quản trị"
            className={`inline-flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A5B0] ${
              isSidebarCollapsed ? 'lg:justify-center' : ''
            }`}
          >
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#F4E7E8] font-display text-xl font-semibold text-[#684B5A]">
              S
            </span>
            <span className={isSidebarCollapsed ? 'lg:hidden' : ''}>
              <span className="block font-display text-xl font-semibold">StyleMind</span>
              <span className="block text-sm font-semibold text-white/55">Quản trị</span>
            </span>
          </Link>

          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={isSidebarCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
            aria-expanded={!isSidebarCollapsed}
            aria-controls="admin-navigation"
            title={isSidebarCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
            className="hidden h-10 w-10 shrink-0 place-items-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A5B0] lg:grid"
          >
            {isSidebarCollapsed ? <PanelLeftOpen aria-hidden="true" size={18} /> : <PanelLeftClose aria-hidden="true" size={18} />}
          </button>
        </div>

        <nav
          id="admin-navigation"
          className={`-mx-4 mt-4 flex min-w-0 gap-1 overflow-x-auto overscroll-x-contain px-4 py-1 lg:mx-0 lg:mt-6 lg:grid lg:overflow-visible lg:px-0 lg:py-0 ${
            isSidebarCollapsed ? 'lg:mt-4' : ''
          }`}
          aria-label="Khu vực quản trị"
        >
          {navItems.map(item => {
            const active = item.id === activeSection
            const to = item.id === 'overview' ? '/admin' : `/admin?section=${item.id}`
            const Icon = item.Icon

            return (
              <Link
                key={item.id}
                to={to}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                title={isSidebarCollapsed ? item.label : undefined}
                className={`inline-flex min-h-11 shrink-0 items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-light ${
                  active ? 'bg-blush text-accent active:bg-blush-dark' : 'text-white/85 hover:bg-white/10 hover:text-white active:bg-white/15'
                } ${isSidebarCollapsed ? 'lg:justify-center lg:px-0 lg:py-3' : ''}`}
              >
                <Icon aria-hidden="true" size={18} className="shrink-0" />
                <span className={isSidebarCollapsed ? 'lg:sr-only' : ''}>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-[var(--z-sticky)] border-b border-[#E3DAD0] bg-[#FDFCFA]/95 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-secondary">Tài khoản quản trị</p>
              <p className="mt-1 text-sm font-semibold text-charcoal">
                {adminName} · {adminEmail}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" icon={<Store aria-hidden="true" size={16} />} onClick={() => navigate(ROUTES.shop)}>
                Xem cửa hàng
              </Button>
              <Button
                type="button"
                variant="soft"
                icon={<LogOut aria-hidden="true" size={16} />}
                onClick={onLogout}
              >
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
