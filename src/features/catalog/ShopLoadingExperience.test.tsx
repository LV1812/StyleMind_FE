import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import { ToastProvider } from '@/shared/ui'
import { ShopPage } from './pages/ShopPage'

vi.mock('@/features/cart/model/GuestCommerceProvider', () => ({ useCommerceDisplay: () => ({ state: { categories: [], products: [] }, loading: false, error: '', retry: vi.fn() }) }))
vi.mock('@/app/store/DemoStoreProvider', () => ({ useDemoStore: () => ({ state: { products: [] } }) }))
vi.mock('@/api/commerce', () => ({ commerceApi: { products: { list: () => new Promise(() => {}) } } }))

it('keeps a product grid placeholder while results are loading', () => {
  render(<MemoryRouter><ToastProvider><ShopPage /></ToastProvider></MemoryRouter>)
  expect(screen.getByText(/Đang tải sản phẩm/)).toHaveAttribute('role', 'status')
  expect(screen.getByTestId('shop-loading-grid')).toBeInTheDocument()
  expect(screen.queryByText('Không tìm thấy sản phẩm phù hợp')).not.toBeInTheDocument()
})
