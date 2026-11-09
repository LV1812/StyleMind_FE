import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import GuestCartPage from './pages/GuestCartPage'
vi.mock('@/features/auth', () => ({ useAuth: () => ({ currentUser: null }) }))

vi.mock('@/api/commerce', () => ({ commerceApi: { products: { lookupVariants: vi.fn().mockResolvedValue({ items: [] }) } } }))
vi.mock('@/features/cart/model/AccountCommerceProvider', () => ({ useActiveCommerce: () => ({
  cart: { items: [{ cart_item_id: 'item', variant_id: 'variant', product_name: 'Áo', quantity: 1, line_total_vnd: 100 }], total_vnd: 100 },
  cartLoading: false, cartError: '', busy: false, products: [], refreshCart: vi.fn(),
}) }))
vi.mock('@/app/store/DemoStoreProvider', () => ({ useDemoStore: () => ({ state: { cartLines: [] } }) }))

it('shows unavailable items and prevents checkout after an authoritative lookup', async () => {
  render(<MemoryRouter><GuestCartPage /></MemoryRouter>)
  expect(await screen.findByText('Hết hàng')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Tiến hành thanh toán' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Xóa Áo' })).toBeEnabled()
})
