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
      className="fixed inset-x-0 bottom-0 z-[var(--z-sticky)] border-t border-[#EFEDED] bg-[#FBF9F9]/95 pb-[var(--safe-bottom)] backdrop-blur-md lg:hidden"
      aria-label="Điều hướng di động"
    >
      <div className="grid auto-cols-[minmax(64px,1fr)] grid-flow-col overflow-x-auto overscroll-x-contain">
        {mobileItems.map(item => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === ROUTES.home}
              className={({ isActive }) =>
                `grid min-h-14 place-items-center gap-0.5 whitespace-nowrap px-1 py-2 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1C1B1B] ${
                  isActive ? 'text-[#1C1B1B]' : 'text-[#5E5F5D]'
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
