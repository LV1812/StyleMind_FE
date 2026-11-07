import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import { createDemoSeed } from '@/app/data/demoSeed'
import { ToastProvider } from '@/shared/ui'
import { AdminPage } from './AdminPage'

const mocks = vi.hoisted(() => ({ load: vi.fn(), categories: vi.fn(), orders: vi.fn(), dispatch: vi.fn() }))
vi.mock('@/features/commerce/data/loadCommerceProducts', () => ({ loadAllCommerceProducts: mocks.load }))
vi.mock('@/api/commerce', () => ({ commerceApi: { categories: { listAdmin: mocks.categories }, orders: { listAdmin: mocks.orders } } }))
vi.mock('@/features/auth', () => ({ useAuth: () => ({ currentUser: { id: 'admin', role: 'admin', fullName: 'Admin', email: 'admin@example.test' }, logout: vi.fn() }) }))
vi.mock('@/app/store/DemoStoreProvider', () => ({ useDemoStore: () => ({ state: { ...createDemoSeed(), products: [], categories: [] }, dispatch: mocks.dispatch }) }))

it('offers retry and avoids showing an empty product list when loading fails', async () => {
  mocks.load.mockReset().mockRejectedValueOnce(new Error('Không tải được dữ liệu')).mockResolvedValue([])
  mocks.categories.mockResolvedValue({ items: [] })
  mocks.orders.mockResolvedValue({ items: [], total_elements: 0 })
  render(<MemoryRouter initialEntries={['/admin?section=products']}><ToastProvider><AdminPage /></ToastProvider></MemoryRouter>)
  expect(await screen.findByRole('alert')).toHaveTextContent('Không tải được dữ liệu')
  expect(screen.queryByText('Không có sản phẩm phù hợp.')).not.toBeInTheDocument()
  await userEvent.setup().click(screen.getByRole('button', { name: 'Thử tải lại' }))
  expect(await screen.findByText('Không có sản phẩm phù hợp.')).toBeInTheDocument()
  expect(mocks.load).toHaveBeenCalledTimes(2)
})
