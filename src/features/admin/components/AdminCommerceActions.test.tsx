import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'

import { createDemoSeed } from '@/app/data/demoSeed'
import { ToastProvider } from '@/shared/ui'
import { commerceApi } from '@/api/commerce'
import { AdminCategoriesPanel } from './AdminCategoriesPanel'
import { AdminOrdersPanel } from './AdminOrdersPanel'

vi.mock('@/api/commerce', () => ({
  commerceApi: {
    categories: { create: vi.fn(), replace: vi.fn() },
    orders: { updateStatus: vi.fn() },
  },
}))

beforeEach(() => vi.resetAllMocks())

it('sends a new category to Commerce and only stores the returned category', async () => {
  const user = userEvent.setup()
  const dispatch = vi.fn()
  vi.mocked(commerceApi.categories.create).mockResolvedValue({ id: 'server-id', name: 'Áo dài', slug: 'ao-dai', is_active: true })
  render(<ToastProvider><AdminCategoriesPanel database={createDemoSeed()} dispatch={dispatch} /></ToastProvider>)
  await user.click(screen.getByRole('button', { name: 'Thêm danh mục' }))
  await user.type(screen.getByLabelText('ID danh mục'), 'ao-dai')
  await user.type(screen.getByLabelText('Tên danh mục'), 'Áo dài')
  await user.click(screen.getByRole('button', { name: 'Lưu danh mục' }))
  await waitFor(() => expect(commerceApi.categories.create).toHaveBeenCalledWith({ name: 'Áo dài', slug: 'ao-dai', is_active: true }))
  expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'admin/categoryUpserted', payload: expect.objectContaining({ id: 'server-id', label: 'Áo dài' }) }))
})

it('does not update local order state when Commerce rejects an update', async () => {
  const user = userEvent.setup()
  const dispatch = vi.fn()
  vi.mocked(commerceApi.orders.updateStatus).mockRejectedValue(new Error('Không thể cập nhật đơn'))
  render(<MemoryRouter><ToastProvider><AdminOrdersPanel database={createDemoSeed()} dispatch={dispatch} /></ToastProvider></MemoryRouter>)
  const row = screen.getByText('ORD-ADM-1001').closest('tr')
  if (!row) throw new Error('Không tìm thấy dòng đơn hàng')
  await user.click(within(row).getByRole('button', { name: 'Xác nhận đơn' }))
  expect(await screen.findByText('Không thể cập nhật đơn')).toBeInTheDocument()
  expect(commerceApi.orders.updateStatus).toHaveBeenCalledWith('ORD-ADM-1001', 'PLACED')
  expect(dispatch).not.toHaveBeenCalled()
})

it('opens order details as a page and returns to the order list', async () => {
  const user = userEvent.setup()
  render(<MemoryRouter><ToastProvider><AdminOrdersPanel database={createDemoSeed()} dispatch={vi.fn()} /></ToastProvider></MemoryRouter>)
  const row = screen.getByText('ORD-ADM-1001').closest('tr')
  if (!row) throw new Error('Không tìm thấy dòng đơn hàng')
  await user.click(within(row).getByRole('button', { name: 'Chi tiết' }))
  expect(screen.getByRole('heading', { name: /Chi tiết đơn ORD-ADM-1001/ })).toBeInTheDocument()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByText('Nguyễn Thiên An')).toBeInTheDocument()
  expect(screen.getByText('Phương thức thanh toán')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Quay lại danh sách đơn hàng' }))
  expect(screen.getByRole('heading', { name: 'Quản lý đơn hàng' })).toBeInTheDocument()
})

it('shows a placeholder if an order item image cannot be loaded', async () => {
  const user = userEvent.setup()
  render(<MemoryRouter><ToastProvider><AdminOrdersPanel database={createDemoSeed()} dispatch={vi.fn()} /></ToastProvider></MemoryRouter>)
  const row = screen.getByText('ORD-ADM-1001').closest('tr')
  if (!row) throw new Error('Không tìm thấy dòng đơn hàng')
  await user.click(within(row).getByRole('button', { name: 'Chi tiết' }))
  fireEvent.error(screen.getByRole('img', { name: 'Áo blouse cổ vuông' }))
  expect(screen.getByText('Chưa có ảnh')).toBeInTheDocument()
})

it('labels the unit price and line total for multiple items in an order', async () => {
  const user = userEvent.setup()
  const database = createDemoSeed()
  database.orders[0].items[0].quantity = 2
  render(<MemoryRouter><ToastProvider><AdminOrdersPanel database={database} dispatch={vi.fn()} /></ToastProvider></MemoryRouter>)
  const row = screen.getByText('ORD-ADM-1001').closest('tr')
  if (!row) throw new Error('Không tìm thấy dòng đơn hàng')
  await user.click(within(row).getByRole('button', { name: 'Chi tiết' }))
  expect(screen.getByText(/Đơn giá:/)).toBeInTheDocument()
  expect(screen.getByText(/Thành tiền:/)).toHaveTextContent('1.240.000')
})
