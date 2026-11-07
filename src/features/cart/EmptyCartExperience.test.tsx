import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import GuestCartPage from './pages/GuestCartPage'

vi.mock('@/features/cart/model/AccountCommerceProvider', () => ({ useActiveCommerce: () => ({ cart: { items: [], total_vnd: 0 }, cartLoading: false, cartError: '', busy: false, products: [], refreshCart: vi.fn() }) }))
vi.mock('@/app/store/DemoStoreProvider', () => ({ useDemoStore: () => ({ state: { cartLines: [] } }) }))

it('offers a prominent link to the shop when the cart is empty', () => {
  render(<MemoryRouter><GuestCartPage /></MemoryRouter>)
  expect(screen.getByRole('heading', { name: 'Giỏ hàng của bạn đang trống' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Bắt đầu mua sắm/ })).toHaveAttribute('href', '/shop')
})
