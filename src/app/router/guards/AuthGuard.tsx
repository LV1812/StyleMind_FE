import { useEffect, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { useDemoStore } from '@/app/store/DemoStoreProvider'
import type { UserRole } from '@/entities/user/model/types'

interface AuthGuardProps {
  children: ReactNode
  roles?: UserRole[]
  requireCart?: boolean
}

export function AuthGuard({ children, roles, requireCart = false }: AuthGuardProps) {
  const location = useLocation()
  const { state, dispatch } = useDemoStore()
  const currentUser = state.users.find(user => user.id === state.session?.userId && user.status === 'active') ?? null

  useEffect(() => {
    if (state.session && !currentUser) dispatch({ type: 'session/loggedOut' })
  }, [currentUser, dispatch, state.session])

  if (!currentUser) return <Navigate to={ROUTES.login} replace state={{ from: location }} />

  if (roles && !roles.includes(currentUser.role)) {
    return <Navigate to={currentUser.role === 'admin' ? ROUTES.admin : ROUTES.shop} replace />
  }

  if (requireCart && state.cartLines.length === 0) {
    return <Navigate to={ROUTES.cart} replace />
  }

  return children
}
