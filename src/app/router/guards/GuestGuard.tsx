import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { useDemoStore } from '@/app/store/DemoStoreProvider'

interface GuestGuardProps {
  children: ReactNode
}

export function GuestGuard({ children }: GuestGuardProps) {
  const { state } = useDemoStore()
  const currentUser = state.users.find(user => user.id === state.session?.userId && user.status === 'active') ?? null

  if (currentUser) return <Navigate to={currentUser.role === 'admin' ? ROUTES.admin : ROUTES.shop} replace />

  return children
}
