import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import GuestCartPage from './pages/GuestCartPage'
import { loadAccountDraft } from '@/features/checkout/model/accountCheckout'

vi.mock('@/api/commerce', () => ({ commerceApi: { products: { lookupVariants: vi.fn().mockResolvedValue({ items: [{ variant_id: 'v1', available_quantity: 5 }, { variant_id: 'v2', available_quantity: 5 }] }) } } }))
vi.mock('@/features/auth', () => ({ useAuth: () => ({ currentUser: { id: 'user' } }) }))
vi.mock('@/features/cart/model/AccountCommerceProvider', () => ({ useActiveCommerce: () => ({
  cart: { items: [{ cart_item_id: 'i1', variant_id: 'v1', product_name: 'Áo', quantity: 1, line_total_vnd: 100 }, { cart_item_id: 'i2', variant_id: 'v2', product_name: 'Quần', quantity: 1, line_total_vnd: 200 }], total_vnd: 300 },
  cartLoading: false, cartError: '', busy: false, products: [], refreshCart: vi.fn(),
}) }))
vi.mock('@/app/store/DemoStoreProvider', () => ({ useDemoStore: () => ({ state: { cartLines: [] } }) }))
beforeEach(() => { localStorage.clear(); sessionStorage.clear() })

it('submits only the items the customer selected into the checkout draft', async () => {
  const user = userEvent.setup()
  render(<MemoryRouter><GuestCartPage /></MemoryRouter>)
  await waitFor(() => expect(screen.getByRole('button', { name: 'Tiến hành thanh toán' })).toBeEnabled())
  await user.click(screen.getByRole('checkbox', { name: /Chọn Quần/ }))
  await user.click(screen.getByRole('button', { name: 'Tiến hành thanh toán' }))
  expect(loadAccountDraft('user').selection).toEqual({ kind: 'selected', cart_item_ids: ['i1'] })
})
