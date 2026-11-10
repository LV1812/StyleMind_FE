import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import OrderDetailSections from './components/OrderDetailSections'
import type { OrderResponse } from '@/features/payments/api/types'
const api = vi.hoisted(() => ({ cancelOrder: vi.fn(), requestCancellation: vi.fn() }))
vi.mock('@/features/payments/api/paymentClient', () => ({ paymentApi: api, paymentErrorMessage: () => 'Không thể xử lý' }))
beforeEach(() => vi.clearAllMocks())
it('hiển thị khoản chờ hoàn tiền sau khi duyệt hủy QR', () => {
  render(<OrderDetailSections order={order({ order_status: 'CANCELLED', payment_method: 'SEPAY_VIETQR', cancellation_request: { request_status: 'APPROVED', refund_status: 'PENDING_REFUND' } })} onRefresh={vi.fn()} />)
  expect(screen.getByText(/Đang chờ cửa hàng hoàn tiền bằng chuyển khoản/)).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /hủy đơn/i })).not.toBeInTheDocument()
})
const order = (extra: object) => ({ order_id: 'order', order_status: 'PLACED', payment_method: 'COD', confirmation_state: 'UNCONFIRMED', history: [], cancellation_request: null, ...extra }) as unknown as OrderResponse
it('gửi yêu cầu duyệt đối với đơn đã xác nhận', async () => {
  api.requestCancellation.mockResolvedValue({ request_status: 'PENDING' })
  const refresh = vi.fn()
  render(<OrderDetailSections order={order({ confirmation_state: 'CONFIRMED' })} onRefresh={refresh} />)
  fireEvent.click(screen.getByRole('button', { name: 'Yêu cầu hủy đơn' }))
  fireEvent.change(screen.getByLabelText('Lý do hủy đơn'), { target: { value: 'Thay đổi kế hoạch' } })
  fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu hủy' }))
  await waitFor(() => expect(api.requestCancellation).toHaveBeenCalledWith('order', 'Thay đổi kế hoạch'))
  expect(refresh).toHaveBeenCalled()
})
it('không cho gửi yêu cầu khi đang giao', () => {
  render(<OrderDetailSections order={order({ order_status: 'SHIPPED' })} onRefresh={vi.fn()} />)
  expect(screen.getByText(/đang giao không thể hủy/i)).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /hủy đơn/i })).not.toBeInTheDocument()
})
it('không gửi thêm khi đã có yêu cầu chờ duyệt', () => {
  render(<OrderDetailSections order={order({ confirmation_state: 'CONFIRMED', cancellation_request: { request_status: 'PENDING', reason: 'Không cần nữa' } })} onRefresh={vi.fn()} />)
  expect(screen.getByText(/đang chờ duyệt/i)).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /yêu cầu hủy đơn/i })).not.toBeInTheDocument()
})

