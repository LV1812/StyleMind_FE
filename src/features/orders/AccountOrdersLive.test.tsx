import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import AccountOrdersPage from './pages/AccountOrdersPage'

const mocks = vi.hoisted(() => ({ list: vi.fn() }))
vi.mock('@/features/payments/api/paymentClient', () => ({ paymentApi: { listOrders: mocks.list }, paymentErrorMessage: () => 'Không tải được đơn hàng' }))
vi.mock('@/features/auth', () => ({ useAuth: () => ({ currentUser: { id: 'user' } }) }))

it('loads real account orders and filters using server status', async () => {
  mocks.list.mockResolvedValue({ items: [{ order_id: '123', order_number: 'SM001', order_status: 'SHIPPED', accepted_total_vnd: 120000, placed_at: '2026-01-01T00:00:00Z' }], page: 0, total_pages: 1, total_elements: 1 })
  render(<MemoryRouter><AccountOrdersPage /></MemoryRouter>)
  expect(await screen.findByText('SM001')).toBeInTheDocument()
  expect(screen.getAllByText('Đang giao hàng').length).toBeGreaterThan(0)
  fireEvent.change(screen.getByLabelText('Lọc trạng thái đơn'), { target: { value: 'SHIPPED' } })
  await waitFor(() => expect(mocks.list).toHaveBeenLastCalledWith({ page: 0, size: 10, status: 'SHIPPED' }, expect.any(Object)))
})
