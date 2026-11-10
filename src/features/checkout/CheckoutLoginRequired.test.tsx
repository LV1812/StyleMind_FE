import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import CheckoutPage from './pages/CheckoutPage'

vi.mock('@/features/auth', () => ({ useAuth: () => ({ currentUser: null, isInitializing: false }) }))
vi.mock('./pages/GuestCheckoutPage', () => ({ default: () => <p>Đặt hàng khách</p> }))
vi.mock('./pages/AccountCheckoutPage', () => ({ default: () => <p>Đặt hàng tài khoản</p> }))
function Login() {
  const location = useLocation()
  return <p>Đăng nhập trước khi đặt hàng; quay lại {(location.state as { from?: { pathname?: string } })?.from?.pathname}</p>
}
it('đưa khách về đăng nhập và trở lại giỏ hàng để chọn lại sau khi gộp giỏ', async () => {
  render(<MemoryRouter initialEntries={['/checkout']}><Routes>
    <Route path="/checkout" element={<CheckoutPage />} />
    <Route path="/login" element={<Login />} />
  </Routes></MemoryRouter>)
  expect(await screen.findByText(/Đăng nhập trước khi đặt hàng; quay lại \/cart/)).toBeInTheDocument()
  expect(screen.queryByText('Đặt hàng khách')).not.toBeInTheDocument()
})
