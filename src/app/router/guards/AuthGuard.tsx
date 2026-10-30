import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { useDemoStore } from '@/app/store/DemoStoreProvider'
import { useAuth } from '@/features/auth'
import type { UserRole } from '@/entities/user/model/types'

interface AuthGuardProps {
  children: ReactNode
  roles?: UserRole[]
  requireCart?: boolean
}

export function AuthGuard({ children, roles, requireCart = false }: AuthGuardProps) {
  const location = useLocation()
  const { state } = useDemoStore()
  const { currentUser, isInitializing } = useAuth()

  if (isInitializing) return <p className="px-5 py-12 text-center text-sm text-[#6F6B67]" role="status">Đang kiểm tra phiên đăng nhập…</p>

  if (!currentUser) return <Navigate to={ROUTES.login} replace state={{ from: location }} />

  if (roles && !roles.includes(currentUser.role)) {
    return <Navigate to={currentUser.role === 'admin' ? ROUTES.admin : ROUTES.shop} replace />
  }

  if (requireCart && state.cartLines.length === 0) {
    return <Navigate to={ROUTES.cart} replace />
  }

  return children
}
