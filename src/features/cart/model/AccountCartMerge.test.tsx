import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import AccountCommerceProvider, { useAccountCommerce } from './AccountCommerceProvider'

const mocks = vi.hoisted(() => ({ merge: vi.fn(), getCart: vi.fn() }))
vi.mock('@/features/auth', () => ({ useAuth: () => ({ currentUser: { id: 'customer' }, isInitializing: false }) }))
vi.mock('@/features/payments/api/paymentClient', () => ({ paymentApi: { mergeGuestCart: mocks.merge, getCart: mocks.getCart }, paymentErrorMessage: () => 'Lỗi giỏ hàng' }))
vi.mock('./GuestCommerceProvider', () => ({ useGuestCommerce: () => ({}) }))
const cart = { cart_id: 'cart', cart_status: 'ACTIVE', items: [], total_vnd: 0 }
function Consumer() { const value = useAccountCommerce(); return <div>{value.cartError || value.cart.cart_id}</div> }
afterEach(() => { window.localStorage.clear(); window.sessionStorage.clear(); vi.clearAllMocks() })

it('merges the guest cart after login while keeping the key for past guest orders', async () => {
  window.localStorage.setItem('guest_session_key', 'guest-123')
  mocks.merge.mockResolvedValue(cart)
  render(<AccountCommerceProvider><Consumer /></AccountCommerceProvider>)
  await screen.findByText('cart')
  expect(mocks.merge).toHaveBeenCalledWith('guest-123')
  expect(window.localStorage.getItem('guest_session_key')).toBe('guest-123')
})

it('keeps the guest cart key when merge fails', async () => {
  window.localStorage.setItem('guest_session_key', 'guest-123')
  mocks.merge.mockRejectedValue(new Error('conflict'))
  render(<AccountCommerceProvider><Consumer /></AccountCommerceProvider>)
  await waitFor(() => expect(screen.getByText(/Chưa thể gộp giỏ khách/)).toBeInTheDocument())
  expect(window.localStorage.getItem('guest_session_key')).toBe('guest-123')
})
