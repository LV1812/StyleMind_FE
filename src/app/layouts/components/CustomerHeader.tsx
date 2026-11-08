import { Bell, LayoutDashboard, LogOut, MessageCircle, ShoppingBag, UserRound } from 'lucide-react'
import { type ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { useDemoStore } from '@/app/store/DemoStoreProvider'
import { useAuth } from '@/features/auth'
import { selectUnreadNotificationCount } from '@/features/notifications/model/notificationSelectors'
import { useActiveCommerce } from '@/features/cart/model/AccountCommerceProvider'
import { countCartProducts } from '@/features/cart/model/cartProductCount'
import { apiMode } from '@/shared/api/http'

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
  const guest = useActiveCommerce()
  const cartCount = countCartProducts(guest.cart.items, guest.products)
  const currentUserId = state.session?.userId ?? currentUser?.id ?? 'usr-customer-01'
  const unreadCount = selectUnreadNotificationCount(state, currentUserId)
  const visibleNavItems = currentUser?.role === 'admin' ? [...navItems, { to: ROUTES.admin, label: 'Quản trị' }] : navItems

  const handleLogout = () => {
    logout()
    navigate(ROUTES.login, { replace: true })
  }

  return (
    <header className="sticky top-0 z-[var(--z-sticky)] border-b border-[#EFEDED] bg-[#FBF9F9]/95 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-[var(--container-wide)] items-center gap-5 px-5 md:px-8 lg:px-12">
        <Link to={ROUTES.home} className="flex flex-none items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1B1B]">
          <span className="font-display text-3xl text-[#222222]">StyleMind</span>
        </Link>
        <nav aria-label="Điều hướng chính" className="hidden items-center gap-1 lg:flex">
          {visibleNavItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === ROUTES.home}
              className={({ isActive }) =>
                `border-b-2 px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1B1B] ${
                  isActive ? 'border-[#1C1B1B] text-[#1C1B1B]' : 'border-transparent text-[#5E5F5D] hover:text-[#222222]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-2 md:flex">
          <HeaderIconLink to={ROUTES.notifications} label={apiMode() ? 'Thông báo' : `Thông báo (${unreadCount} chưa đọc)`} count={apiMode() ? 0 : unreadCount}>
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
            className="ml-auto inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#C4C7C7] px-3 text-sm font-semibold text-[#1C1B1B] transition hover:bg-[#E9E8E7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1B1B] lg:hidden"
          >
            <LayoutDashboard size={17} aria-hidden="true" />
            <span>Quản trị</span>
          </Link>
        )}
        {currentUser && (
          <HeaderIconButton
            label="Đăng xuất khỏi tài khoản"
            className={`${currentUser.role === 'admin' ? '' : 'ml-auto'} md:hidden`}
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
      className="relative inline-grid h-10 w-10 place-items-center rounded-lg text-[#3A3632] transition hover:bg-[#EFEDED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1B1B]"
    >
      {children}
      {Boolean(count) && (
        <span className="absolute right-1 top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-[#1C1B1B] px-1 text-[10px] font-bold leading-none text-white">
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
      className={`relative inline-grid h-10 w-10 place-items-center rounded-lg text-[#3A3632] transition hover:bg-[#EFEDED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1B1B] ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
