import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { useAuth } from '@/features/auth'
import { intendedPathFromState } from '@/features/auth/model/redirect'

interface GuestGuardProps {
  children: ReactNode
}

export function GuestGuard({ children }: GuestGuardProps) {
  const { currentUser, isInitializing } = useAuth()
  const location = useLocation()

  if (isInitializing) return <p className="px-5 py-12 text-center text-sm text-[#6F6B67]" role="status">Đang kiểm tra phiên đăng nhập…</p>

  if (currentUser) {
    // Logging in flips currentUser before the login page navigates, so honour the intended page here too.
    const intended = currentUser.role === 'admin' ? null : intendedPathFromState(location.state)
    return <Navigate to={currentUser.role === 'admin' ? ROUTES.admin : intended ?? ROUTES.shop} replace />
  }

  return children
}
