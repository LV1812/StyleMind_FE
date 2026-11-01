import { Home, MessageCircle, Shirt, ShoppingBag, Store, UserRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'

const mobileItems = [
  { to: ROUTES.home, label: 'Trang chủ', icon: Home },
  { to: ROUTES.shop, label: 'Cửa hàng', icon: Store },
  { to: ROUTES.wardrobes, label: 'Tủ đồ', icon: Shirt },
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
      <div className="grid grid-cols-6">
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
