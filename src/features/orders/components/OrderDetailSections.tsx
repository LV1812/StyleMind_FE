import { useEffect, useRef, useState } from 'react'
import { paymentApi, paymentErrorMessage } from '@/features/payments/api/paymentClient'
import type { OrderResponse } from '@/features/payments/api/types'
import { orderStatusLabel } from '../model/orderStatus'

const historyNotes: Record<string, string> = {
  'Order created': 'Đơn hàng đã được tạo.',
  'COD payment attempt created; payment not collected': 'Thanh toán khi nhận hàng.',
  'Cancellation approved': 'Cửa hàng đã duyệt yêu cầu hủy.',
}

export default function OrderDetailSections({ order, onRefresh, onCancelled }: { order: OrderResponse; onRefresh: () => void; onCancelled?: (order: OrderResponse) => void }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [cancelled, setCancelled] = useState(false)
  const [requestSent, setRequestSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const locked = useRef(false)
  useEffect(() => { setOpen(false); setReason(''); setCancelled(false); setRequestSent(false); setError('') }, [order.order_id])
  const cancellation = order.cancellation_request
  const isCancelled = cancelled || order.order_status === 'CANCELLED'
  const isPending = requestSent || cancellation?.request_status === 'PENDING'
  const cancellable = ['PLACED', 'PENDING_PAYMENT', 'PAID', 'PROCESSING'].includes(order.order_status)
  const direct = order.confirmation_state === 'UNCONFIRMED' && order.payment_method === 'COD' && ['PLACED', 'PENDING_PAYMENT'].includes(order.order_status)
  async function submit() {
    if (locked.current || reason.trim().length < 5 || reason.trim().length > 500) return
    locked.current = true; setBusy(true); setError('')
    try {
      if (direct) {
        const result = await paymentApi.cancelOrder(order.order_id, reason.trim())
        if (result.order_status !== 'CANCELLED') throw new Error('Cancellation not confirmed')
        setCancelled(true); onCancelled?.(result)
      } else {
        const result = await paymentApi.requestCancellation(order.order_id, reason.trim())
        if (!result || typeof result !== 'object' || !('request_status' in result) || result.request_status !== 'PENDING') throw new Error('Request not confirmed')
        setRequestSent(true)
      }
      setOpen(false); onRefresh()
    } catch (failure) { setError(paymentErrorMessage(failure)) }
    finally { locked.current = false; setBusy(false) }
  }
  const labels: Record<string, string> = { PENDING: 'Đang chờ duyệt', APPROVED: 'Đã chấp thuận', REJECTED: 'Đã từ chối' }
  return <div className="mx-auto grid max-w-6xl gap-5 px-5 pb-10 sm:px-8">
    <section className="rounded-3xl border border-sand bg-white p-6 sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-secondary">Theo dõi đơn hàng</p><h2 className="mt-2 font-display text-2xl">Lịch sử trạng thái</h2></div><span className="rounded-full bg-[#F5F2EE] px-3 py-1.5 text-xs font-semibold text-secondary">{orderStatusLabel(order.order_status)}</span></div>{order.history?.length ? <ol className="mt-6 grid">{order.history.map((entry, index) => <li key={entry.history_id} className="relative grid grid-cols-[20px_minmax(0,1fr)] gap-3 pb-5 last:pb-0"><span aria-hidden="true" className="relative flex justify-center"><span className={`relative z-10 mt-1 h-3 w-3 rounded-full ${index === order.history.length - 1 ? 'bg-[#325f48] ring-4 ring-[#e8f2eb]' : 'bg-[#b9b5ae]'}`} />{index < order.history.length - 1 && <span className="absolute bottom-0 top-2 w-px bg-[#ddd9d3]" />}</span><div className="min-w-0"><div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"><span className="text-sm font-semibold text-[#222222]">{orderStatusLabel(entry.to_status)}</span><time className="text-xs text-secondary" dateTime={entry.changed_at || undefined}>{entry.changed_at ? new Date(entry.changed_at).toLocaleString('vi-VN') : ''}</time></div>{entry.reason && <p className="mt-1 text-sm leading-6 text-secondary">{historyNotes[entry.reason] ?? entry.reason}</p>}</div></li>)}</ol> : <p className="mt-4 text-sm text-secondary">Chưa có lịch sử trạng thái.</p>}</section>
    <section className="rounded-2xl border border-[#E3E2E2] bg-white p-6"><h2 className="font-display text-2xl">Hủy đơn hàng</h2>
      {isCancelled ? <div role="status" className="mt-3 text-sm"><p>Đơn hàng đã được hủy.</p>{cancellation?.refund_status === 'PENDING_REFUND' && <p className="mt-3 rounded-lg bg-warning-bg p-3 text-warning-ink">Đang chờ cửa hàng hoàn tiền bằng chuyển khoản. Cửa hàng đã ghi nhận khoản tiền cần hoàn cho đơn này.</p>}</div> : <>
      {cancellation && <div className="mt-4 rounded-xl bg-[#F8F6F3] p-4 text-sm"><p className="font-semibold">Yêu cầu trước đó: {labels[cancellation.request_status] ?? 'Đang cập nhật'}</p><p className="mt-2">Lý do: {cancellation.reason}</p>{cancellation.decision_reason && <p className="mt-2">Phản hồi từ cửa hàng: {cancellation.decision_reason}</p>}</div>}
      {requestSent && <p role="status" className="mt-3 text-sm">Yêu cầu hủy đã được gửi và đang chờ cửa hàng duyệt.</p>}
      {order.order_status === 'SHIPPED' ? <p className="mt-3 text-sm text-secondary">Đơn hàng đang giao không thể hủy.</p> : !cancellable ? <p className="mt-3 text-sm text-secondary">Đơn hàng hiện không đủ điều kiện hủy.</p> : isPending && !direct ? null : <div className="mt-4">
        <p className="mb-4 text-sm leading-6 text-secondary">{direct ? 'Đơn chưa được xác nhận và chưa thanh toán. Đơn sẽ được hủy nếu còn đủ điều kiện.' : 'Yêu cầu sẽ được gửi đến cửa hàng để xem xét. Đơn chưa được hủy cho đến khi có xác nhận.'}</p>
        {!open ? <button type="button" className="rounded-lg border px-4 py-3 font-semibold" onClick={() => setOpen(true)}>{direct ? 'Hủy đơn hàng' : 'Yêu cầu hủy đơn'}</button> : <div className="grid gap-3 rounded-xl border border-[#E3E2E2] bg-[#FBF9F9] p-4"><label className="grid gap-2 text-sm font-semibold">Lý do hủy đơn<textarea value={reason} onChange={event => setReason(event.target.value)} maxLength={500} placeholder="Cho cửa hàng biết lý do bạn muốn hủy đơn" className="min-h-24 rounded-lg border bg-white p-3 font-normal" /></label><p className="text-sm text-secondary">Nhập từ 5 đến 500 ký tự.</p>{order.payment_method === 'SEPAY_VIETQR' && <p className="rounded-lg bg-warning-bg p-3 text-sm text-warning-ink">Nếu bạn đã chuyển khoản, giao dịch cần được đối soát. Hệ thống hiện chưa tự hoàn tiền.</p>}<div className="flex flex-wrap gap-3"><button type="button" disabled={busy || reason.trim().length < 5} onClick={() => void submit()} className="rounded-lg bg-black px-4 py-3 text-white disabled:opacity-50">{busy ? 'Đang xử lý…' : direct ? 'Xác nhận hủy đơn' : 'Gửi yêu cầu hủy'}</button><button type="button" disabled={busy} onClick={() => setOpen(false)} className="rounded-lg border px-4 py-3">Đóng</button></div></div>}
      </div>}</>}
      {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}
    </section>
  </div>
}

