# Shared layouts

## src/app/layouts/CustomerLayout.tsx

```tsx
import { Outlet } from 'react-router-dom'

import { CustomerHeader } from './components/CustomerHeader'
import { MobileNavigation } from './components/MobileNavigation'

export function CustomerLayout() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#222222]">
      <CustomerHeader />
      <main id="main-content" className="pb-[calc(4rem+var(--safe-bottom))] md:pb-0" tabIndex={-1}>
        <Outlet />
      </main>
      <MobileNavigation />
    </div>
  )
}

```

## src/app/layouts/components/CustomerHeader.tsx

```tsx
import { Bell, LayoutDashboard, LogOut, MessageCircle, ShoppingBag, UserRound } from 'lucide-react'
import { type ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { useDemoStore } from '@/app/store/DemoStoreProvider'
import { useAuth } from '@/features/auth'
import { selectUnreadNotificationCount } from '@/features/notifications/model/notificationSelectors'

const navItems = [
  { to: ROUTES.home, label: 'Trang chủ' },
  { to: ROUTES.shop, label: 'Cửa hàng' },
  { to: ROUTES.wardrobes, label: 'Tủ đồ' },
  { to: '/friends', label: 'Bạn bè' },
  { to: ROUTES.orders, label: 'Đơn hàng' },
]

export function CustomerHeader() {
  const navigate = useNavigate()
  const { state } = useDemoStore()
  const { currentUser, logout } = useAuth()
  const cartCount = state.cartLines.reduce((total, line) => total + line.quantity, 0)
  const currentUserId = state.session?.userId ?? currentUser?.id ?? 'usr-customer-01'
  const unreadCount = selectUnreadNotificationCount(state, currentUserId)
  const visibleNavItems = currentUser?.role === 'admin' ? [...navItems, { to: ROUTES.admin, label: 'Quản trị' }] : navItems

  const handleLogout = () => {
    logout()
    navigate(ROUTES.login, { replace: true })
  }

  return (
    <header className="sticky top-0 z-[var(--z-sticky)] border-b border-[#EEE8E1] bg-[#FAF8F5]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[var(--container-wide)] items-center gap-5 px-5 md:px-8">
        <Link to={ROUTES.home} className="flex flex-none items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A]">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#684B5A] font-display text-sm font-semibold text-white">S</span>
          <span className="font-display text-xl font-semibold text-[#222222]">StyleMind</span>
        </Link>
        <nav aria-label="Điều hướng chính" className="hidden items-center gap-1 md:flex">
          {visibleNavItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === ROUTES.home}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A] ${
                  isActive ? 'bg-[#F4E7E8] text-[#684B5A]' : 'text-[#6F6B67] hover:bg-[#EEE8E1] hover:text-[#222222]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <HeaderIconLink to={ROUTES.notifications} label={`Thông báo (${unreadCount} chưa đọc)`} count={unreadCount}>
            <Bell size={18} aria-hidden="true" />
          </HeaderIconLink>
          <HeaderIconLink to={ROUTES.messages} label="Tin nhắn">
            <MessageCircle size={18} aria-hidden="true" />
          </HeaderIconLink>
          <HeaderIconLink to={ROUTES.cart} label={`Giỏ hàng (${cartCount} sản phẩm)`} count={cartCount}>
            <ShoppingBag size={18} aria-hidden="true" />
          </HeaderIconLink>
          <HeaderIconLink to={ROUTES.account} label="Tài khoản">
            <UserRound size={18} aria-hidden="true" />
          </HeaderIconLink>
          {currentUser && (
            <HeaderIconButton label="Đăng xuất" onClick={handleLogout}>
              <LogOut size={18} aria-hidden="true" />
            </HeaderIconButton>
          )}
        </div>
        {currentUser?.role === 'admin' && (
          <Link
            to={ROUTES.admin}
            aria-label="Về trang quản trị"
            title="Về trang quản trị"
            className="ml-auto inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#D8D0C6] px-3 text-sm font-semibold text-[#684B5A] transition hover:bg-[#F4E7E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A] md:hidden"
          >
            <LayoutDashboard size={17} aria-hidden="true" />
            <span>Quản trị</span>
          </Link>
        )}
        {currentUser && (
          <HeaderIconButton
            label="Đăng xuất khỏi tài khoản"
            className={`${currentUser.role === 'admin' ? '' : 'ml-auto'} md:ml-auto lg:hidden`}
            onClick={handleLogout}
          >
            <LogOut size={18} aria-hidden="true" />
          </HeaderIconButton>
        )}
      </div>
    </header>
  )
}

function HeaderIconLink({ to, label, count, children }: { to: string; label: string; count?: number; children: ReactNode }) {
  return (
    <Link
      to={to}
      aria-label={label}
      className="relative inline-grid h-10 w-10 place-items-center rounded-lg text-[#3A3632] transition hover:bg-[#EEE8E1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A]"
    >
      {children}
      {Boolean(count) && (
        <span className="absolute right-1 top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-[#684B5A] px-1 text-[10px] font-bold leading-none text-white">
          {count}
        </span>
      )}
    </Link>
  )
}

function HeaderIconButton({
  label,
  className = '',
  children,
  onClick,
}: {
  label: string
  className?: string
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`relative inline-grid h-10 w-10 place-items-center rounded-lg text-[#3A3632] transition hover:bg-[#EEE8E1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A] ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

```

## src/app/layouts/components/MobileNavigation.tsx

```tsx
import { Home, MessageCircle, Shirt, ShoppingBag, Store, UserRound, UsersRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'

const mobileItems = [
  { to: ROUTES.home, label: 'Trang chủ', icon: Home },
  { to: ROUTES.shop, label: 'Cửa hàng', icon: Store },
  { to: ROUTES.wardrobes, label: 'Tủ đồ', icon: Shirt },
  { to: '/friends', label: 'Bạn bè', icon: UsersRound },
  { to: ROUTES.messages, label: 'Tin nhắn', icon: MessageCircle },
  { to: ROUTES.cart, label: 'Giỏ hàng', icon: ShoppingBag },
  { to: ROUTES.account, label: 'Tài khoản', icon: UserRound },
]

export function MobileNavigation() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[var(--z-sticky)] border-t border-[#EEE8E1] bg-[#FAF8F5]/95 pb-[var(--safe-bottom)] backdrop-blur-md md:hidden"
      aria-label="Điều hướng di động"
    >
      <div className="grid grid-cols-7">
        {mobileItems.map(item => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === ROUTES.home}
              className={({ isActive }) =>
                `grid min-h-14 place-items-center gap-0.5 px-1 py-2 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A] ${
                  isActive ? 'text-[#684B5A]' : 'text-[#6F6B67]'
                }`
              }
            >
              <Icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

```

## src/features/auth/components/AuthLayout.tsx

```tsx
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

import { ROUTES } from '@/app/router/routes'

interface AuthLayoutProps {
  title: string
  description: string
  children: ReactNode
}

export function AuthLayout({ title, description, children }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-[#FAF8F5] px-5 py-10 text-[#222222]">
      <div className="mx-auto grid min-h-[calc(100dvh-80px)] max-w-6xl gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-center">
        <section className="hidden md:block">
          <Link to={ROUTES.home} className="inline-flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A]">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#684B5A] font-display text-base font-semibold text-white">S</span>
            <span className="font-display text-2xl font-semibold">StyleMind</span>
          </Link>
          <p className="mt-10 max-w-xl font-display text-5xl font-semibold leading-tight">{title}</p>
          <p className="mt-5 max-w-lg text-base leading-7 text-[#6F6B67]">{description}</p>
        </section>
        <section className="mx-auto w-full max-w-md rounded-lg bg-[#FDFCFA] p-6 shadow-[0_24px_60px_rgba(58,54,50,0.10)]">
          <div className="mb-6 md:hidden">
            <Link to={ROUTES.home} className="font-display text-xl font-semibold text-[#222222]">
              StyleMind
            </Link>
          </div>
          {children}
        </section>
      </div>
    </main>
  )
}

```
