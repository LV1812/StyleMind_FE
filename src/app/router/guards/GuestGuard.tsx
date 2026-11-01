import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { useAuth } from '@/features/auth'

interface GuestGuardProps {
  children: ReactNode
}

export function GuestGuard({ children }: GuestGuardProps) {
  const { currentUser, isInitializing } = useAuth()

  if (isInitializing) return <p className="px-5 py-12 text-center text-sm text-[#6F6B67]" role="status">Đang kiểm tra phiên đăng nhập…</p>

  if (currentUser) return <Navigate to={currentUser.role === 'admin' ? ROUTES.admin : ROUTES.shop} replace />

  return children
}
