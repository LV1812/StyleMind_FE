import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import { PaymentApiError } from '@/features/payments/api/paymentApi'
import { beginAccountSelection } from './model/accountSelection'
import AccountCheckoutPage from './pages/AccountCheckoutPage'

const mocks = vi.hoisted(() => ({ preview: vi.fn(), checkout: vi.fn(), recover: vi.fn(), addresses: vi.fn(), refresh: vi.fn() }))
vi.mock('@/features/auth', () => ({ useAuth: () => ({ currentUser: { id: 'account' } }) }))
vi.mock('@/features/cart/model/AccountCommerceProvider', () => ({ useAccountCommerce: () => ({ refreshCart: mocks.refresh }) }))
vi.mock('@/shared/api/identityApi', () => ({ identityApi: { listAddresses: mocks.addresses } }))
vi.mock('@/features/payments/api/paymentClient', () => ({ paymentApi: { previewSelection: mocks.preview, checkoutSelection: mocks.checkout, recoverCheckout: mocks.recover }, paymentErrorMessage: () => 'Lỗi thanh toán' }))

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); vi.clearAllMocks() })
it('recovers the same account order after a duplicate checkout response', async () => {
  beginAccountSelection('account', { kind: 'selected', cart_item_ids: ['item'] })
  mocks.preview.mockResolvedValue({ items: [{ cart_item_id: 'item', product_name: 'Áo', quantity: 1, line_total_vnd: 100 }], total_vnd: 100 })
  mocks.addresses.mockResolvedValue({ addresses: [{ address_id: 'address', recipient_name: 'An', recipient_phone: '123', address_line: 'Hà Nội', is_default: true }] })
  mocks.checkout.mockRejectedValue(new PaymentApiError(409, { code: 'DUPLICATE_CHECKOUT' }))
  mocks.recover.mockResolvedValue({ order_id: 'order' })
  mocks.refresh.mockResolvedValue({})
  render(<MemoryRouter initialEntries={['/checkout']}><Routes><Route path="/checkout" element={<AccountCheckoutPage />} /><Route path="/payments/:orderId" element={<p>Đơn đã khôi phục</p>} /></Routes></MemoryRouter>)
  await waitFor(() => expect(screen.getByRole('button', { name: 'Đặt hàng' })).toBeEnabled())
  await userEvent.setup().click(screen.getByRole('button', { name: 'Đặt hàng' }))
  expect(await screen.findByText('Đơn đã khôi phục')).toBeInTheDocument()
  expect(mocks.checkout).toHaveBeenCalledWith(expect.objectContaining({ cart_item_ids: ['item'] }))
  expect(mocks.recover).toHaveBeenCalledWith(expect.any(String))
})
