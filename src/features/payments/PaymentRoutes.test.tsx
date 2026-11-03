import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthGuard } from '@/app/router/guards/AuthGuard'
import { appRoutes } from '@/app/router/AppRouter'
import { ROUTES } from '@/app/router/routes'

const auth = vi.hoisted(() => ({ currentUser: null as { role: 'customer' | 'admin' } | null, isInitializing: false }))
vi.mock('@/features/auth', () => ({
  useAuth: () => auth,
  LoginPage: () => null, RegisterPage: () => null, VerifyOtpPage: () => null,
  ForgotPasswordPage: () => null, ResetPasswordPage: () => null,
}))
vi.mock('@/app/store/DemoStoreProvider', () => ({
  useDemoStore: () => ({ state: { cartLines: [] } }),
}))

beforeEach(() => { auth.currentUser = null })

describe('Payment route authorization', () => {
  it('registers customer and admin payment routes', () => {
    const layout = appRoutes.find(route => route.path === '/')
    expect(layout?.children?.some(route => route.path === 'payments')).toBe(true)
    expect(layout?.children?.some(route => route.path === 'payments/:orderId')).toBe(true)
    expect(appRoutes.some(route => route.path === ROUTES.adminPayments)).toBe(true)
  })

  it('requires login before showing a payment page', async () => {
    render(<MemoryRouter initialEntries={['/payments']}><Routes>
      <Route path="/payments" element={<AuthGuard><p>Protected payment</p></AuthGuard>} />
      <Route path="/login" element={<p>Login required</p>} />
    </Routes></MemoryRouter>)
    expect(await screen.findByText('Login required')).toBeInTheDocument()
    expect(screen.queryByText('Protected payment')).not.toBeInTheDocument()
  })

  it('denies customers entry to Admin Payment', async () => {
    auth.currentUser = { role: 'customer' }
    render(<MemoryRouter initialEntries={['/admin/payments']}><Routes>
      <Route path="/admin/payments" element={<AuthGuard roles={['admin']}><p>Admin Payment</p></AuthGuard>} />
      <Route path="/shop" element={<p>Customer shop</p>} />
    </Routes></MemoryRouter>)
    expect(await screen.findByText('Customer shop')).toBeInTheDocument()
    expect(screen.queryByText('Admin Payment')).not.toBeInTheDocument()
  })

  it('allows an Admin to enter Admin Payment', () => {
    auth.currentUser = { role: 'admin' }
    render(<MemoryRouter><AuthGuard roles={['admin']}><p>Admin Payment</p></AuthGuard></MemoryRouter>)
    expect(screen.getByText('Admin Payment')).toBeInTheDocument()
  })
})
