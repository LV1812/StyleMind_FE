import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PaymentApiError } from './api/paymentApi'
import PaymentPage from './pages/PaymentPage'
import AdminPaymentsPage from './pages/AdminPaymentsPage'
import { PAYMENT_POLL_WINDOW_MS } from './model/useOrderPayment'
vi.mock('@/features/auth', () => ({ useAuth: () => ({ currentUser: { id: 'account-1' }, isInitializing: false }) }))

const api = vi.hoisted(() => ({
  getOrder: vi.fn(), getOrderPaymentAttempt: vi.fn(), confirmCodCollection: vi.fn(), listPaymentExceptions: vi.fn(),
}))
vi.mock('./api/paymentClient', async importOriginal => ({
  ...await importOriginal<typeof import('./api/paymentClient')>(),
  paymentApi: api,
}))

const id = '00000000-0000-4000-8000-000000000001'
const order = { order_id: id, order_number: 'ORDER-001', order_status: 'PENDING_PAYMENT', payment_method: 'SEPAY_VIETQR', accepted_total_vnd: 125000 }
const attempt = { id: '00000000-0000-4000-8000-000000000002', orderId: id, method: 'SEPAY_VIETQR', amountVnd: 125000, status: 'PENDING', reference: 'SMDEMO', transferContent: 'SMDEMO', expiresAt: '2099-01-01T00:00:00Z', qrPayload: 'https://example.test/bank-qr.png' }

function customer(path = '/payments/' + id) {
  return render(<MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/payments" element={<PaymentPage />} />
    <Route path="/payments/:orderId" element={<PaymentPage />} />
  </Routes></MemoryRouter>)
}
function admin() {
  return render(<MemoryRouter><AdminPaymentsPage /></MemoryRouter>)
}
function fillCollection() {
  fireEvent.change(screen.getByLabelText('Mã khoản thanh toán COD'), { target: { value: attempt.id } })
  fireEvent.change(screen.getByLabelText('Số tiền đã thu (VND)'), { target: { value: '125000' } })
  fireEvent.click(screen.getByRole('checkbox'))
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  vi.clearAllMocks()
  api.getOrder.mockResolvedValue(order)
  api.getOrderPaymentAttempt.mockResolvedValue(attempt)
  api.listPaymentExceptions.mockResolvedValue({ items: [], limit: 20, offset: 0 })
  api.confirmCodCollection.mockResolvedValue({ ...attempt, method: 'COD', status: 'PAID' })
})
afterEach(() => { vi.useRealTimers() })

describe('Live customer Payment page', () => {
  it('bounds polling and leaves manual GET available without declaring failure', async () => {
    vi.useFakeTimers()
    await act(async () => { customer() })
    await act(async () => { await vi.advanceTimersByTimeAsync(PAYMENT_POLL_WINDOW_MS) })
    expect(screen.getByRole('status')).toHaveTextContent('không có nghĩa giao dịch thất bại')
    const count = api.getOrder.mock.calls.length
    await act(async () => { await vi.advanceTimersByTimeAsync(30000) })
    expect(api.getOrder).toHaveBeenCalledTimes(count)
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra trạng thái đơn' }))
    await act(async () => {})
    expect(api.getOrder).toHaveBeenCalledTimes(count + 1)
    expect(api.getOrderPaymentAttempt).toHaveBeenCalledTimes(1)
  })

  it.each(['CANCELLED', 'EXCEPTION'])('stops instructions and polling for attempt %s', async status => {
    vi.useFakeTimers()
    api.getOrderPaymentAttempt.mockResolvedValue({ ...attempt, status })
    await act(async () => { customer() })
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    await act(async () => { await vi.advanceTimersByTimeAsync(15000) })
    expect(api.getOrder).toHaveBeenCalledTimes(1)
  })

  it('uses warning styling when the payment requires review', async () => {
    api.getOrderPaymentAttempt.mockResolvedValue({ ...attempt, status: 'EXCEPTION' })
    customer()
    const title = await screen.findByRole('heading', { name: 'Thanh toán cần kiểm tra' })
    expect(title.previousElementSibling).toHaveClass('bg-warning-bg')
    expect(title.previousElementSibling).not.toHaveClass('bg-success-bg')
  })

  it('reads Order again when an attempt reports PAID', async () => {
    api.getOrder.mockResolvedValueOnce(order).mockResolvedValue({ ...order, order_status: 'PAID' })
    api.getOrderPaymentAttempt.mockResolvedValue({ ...attempt, status: 'PAID' })
    customer()
    expect(await screen.findByText('Máy chủ đã xác nhận thanh toán.')).toBeInTheDocument()
    expect(api.getOrder).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('handles ORDER_NOT_PAYABLE by reading Order, without another recovery', async () => {
    api.getOrder.mockResolvedValueOnce(order).mockResolvedValue({ ...order, order_status: 'PAID' })
    api.getOrderPaymentAttempt.mockRejectedValue(new PaymentApiError(409, { code: 'ORDER_NOT_PAYABLE' }))
    customer()
    expect(await screen.findByText('Máy chủ đã xác nhận thanh toán.')).toBeInTheDocument()
    expect(api.getOrder).toHaveBeenCalledTimes(2)
    expect(api.getOrderPaymentAttempt).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
  it('opens without a cart and does not make requests until a real Order ID is supplied', () => {
    customer('/payments')
    expect(screen.getByLabelText('Mã đơn hàng')).toBeInTheDocument()
    expect(api.getOrder).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('Mã đơn hàng'), { target: { value: 'ORD-demo' } })
    fireEvent.click(screen.getByRole('button', { name: 'Mở thanh toán' }))
    expect(screen.getByRole('alert')).toHaveTextContent('UUID')
    expect(api.getOrder).not.toHaveBeenCalled()
  })

  it('renders the backend QR URL and only confirms payment after a paid Order response', async () => {
    customer()
    const image = await screen.findByRole('img', { name: 'Mã QR chuyển khoản ngân hàng' })
    expect(image).toHaveAttribute('src', attempt.qrPayload)
    expect(screen.getByText('SMDEMO')).toBeInTheDocument()
    expect(screen.queryByText('Máy chủ đã xác nhận thanh toán.')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra trạng thái đơn' }))
    await waitFor(() => expect(api.getOrder).toHaveBeenCalledTimes(2))
    expect(screen.queryByText('Máy chủ đã xác nhận thanh toán.')).not.toBeInTheDocument()
    api.getOrder.mockResolvedValue({ ...order, order_status: 'PAID' })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Kiểm tra trạng thái đơn' })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra trạng thái đơn' }))
    expect(await screen.findByText('Máy chủ đã xác nhận thanh toán.')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(api.confirmCodCollection).not.toHaveBeenCalled()
  })

  it('does not recover or create an attempt for an already-paid Order', async () => {
    api.getOrder.mockResolvedValue({ ...order, order_status: 'PAID' })
    customer()
    expect(await screen.findByText('Máy chủ đã xác nhận thanh toán.')).toBeInTheDocument()
    expect(api.getOrderPaymentAttempt).not.toHaveBeenCalled()
  })

  it('hides expired QR without offering a fresh QR and can still read Order status', async () => {
    api.getOrderPaymentAttempt.mockResolvedValue({ ...attempt, expiresAt: '2000-01-01T00:00:00Z' })
    customer()
    expect(await screen.findByText(/Mã QR đã hết hạn/)).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Tạo mã/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Kiểm tra trạng thái đơn' })).toBeEnabled()
  })

  it('does not treat COD PLACED as paid or render a bank QR', async () => {
    api.getOrder.mockResolvedValue({ ...order, payment_method: 'COD', order_status: 'PLACED' })
    api.getOrderPaymentAttempt.mockResolvedValue({ ...attempt, method: 'COD', qrPayload: null, expiresAt: null })
    customer()
    expect(await screen.findByText(/Trạng thái đặt đơn không xác nhận đã thu tiền/)).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(api.confirmCodCollection).not.toHaveBeenCalled()
  })

  it.each([401, 403, 404])('shows HTTP %s without exposing a QR or claiming payment', async status => {
    api.getOrder.mockRejectedValue(new PaymentApiError(status, {}))
    customer()
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(api.getOrderPaymentAttempt).not.toHaveBeenCalled()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('reports an image failure without making another attempt', async () => {
    customer()
    fireEvent.error(await screen.findByRole('img'))
    expect(screen.getByRole('alert')).toHaveTextContent('Không tải được ảnh QR')
    expect(api.getOrderPaymentAttempt).toHaveBeenCalledTimes(1)
  })

  it('polls using GET only and stops on unmount', async () => {
    vi.useFakeTimers()
    let view!: ReturnType<typeof customer>
    await act(async () => { view = customer() })
    expect(screen.getByRole('img')).toBeInTheDocument()
    await act(async () => { await vi.advanceTimersByTimeAsync(5000) })
    expect(api.getOrder).toHaveBeenCalledTimes(2)
    const signal = api.getOrder.mock.calls[1][1].signal as AbortSignal
    view.unmount()
    expect(signal.aborted).toBe(true)
    await act(async () => { await vi.advanceTimersByTimeAsync(15000) })
    expect(api.getOrder).toHaveBeenCalledTimes(2)
    expect(api.getOrderPaymentAttempt).toHaveBeenCalledTimes(1)
  })
})

describe('Admin Payment page', () => {
  it('requires actual receipt attestation, collects once and prevents repeating the same attempt', async () => {
    admin()
    await screen.findByText('Không có lỗi thanh toán.')
    expect(screen.getByRole('button', { name: 'Ghi nhận thu COD' })).toBeDisabled()
    fillCollection()
    fireEvent.click(screen.getByRole('button', { name: 'Ghi nhận thu COD' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Đã ghi nhận thu COD')
    expect(api.confirmCodCollection).toHaveBeenCalledWith({ payment_attempt_id: attempt.id, collected_amount_vnd: 125000 })
    expect(screen.getByRole('button', { name: 'Ghi nhận thu COD' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Mã khoản thanh toán COD'), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText('Mã khoản thanh toán COD'), { target: { value: attempt.id } })
    expect(screen.getByRole('button', { name: 'Ghi nhận thu COD' })).toBeDisabled()
    expect(api.confirmCodCollection).toHaveBeenCalledTimes(1)
  })

  it('does not blindly retry after an uncertain collection result', async () => {
    api.confirmCodCollection.mockRejectedValue(new TypeError('Network failure'))
    admin()
    fillCollection()
    fireEvent.click(screen.getByRole('button', { name: 'Ghi nhận thu COD' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('cần đối soát')
    expect(screen.getByRole('button', { name: 'Ghi nhận thu COD' })).toBeDisabled()
    expect(api.confirmCodCollection).toHaveBeenCalledTimes(1)
  })

  it('shows denied exception access and never exposes a resolve/refund action', async () => {
    api.listPaymentExceptions.mockRejectedValue(new PaymentApiError(403, {}))
    admin()
    expect(await screen.findByRole('alert')).toHaveTextContent('không có quyền')
    expect(screen.queryByRole('button', { name: /Hoàn tiền|Resolve/ })).not.toBeInTheDocument()
  })

  it('loads the selected exception filter', async () => {
    admin()
    await screen.findByText('Không có lỗi thanh toán.')
    fireEvent.change(screen.getByLabelText('Trạng thái đối soát'), { target: { value: 'OPEN' } })
    fireEvent.click(screen.getByRole('button', { name: 'Tải danh sách' }))
    await waitFor(() => expect(api.listPaymentExceptions).toHaveBeenLastCalledWith(
      { status: 'OPEN', limit: 20, offset: 0 }, expect.objectContaining({ signal: expect.any(AbortSignal) }),
    ))
  })
})
