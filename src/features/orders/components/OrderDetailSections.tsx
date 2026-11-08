import { useRef, useState } from 'react'
import { paymentApi, paymentErrorMessage } from '@/features/payments/api/paymentClient'
import type { OrderResponse } from '@/features/payments/api/types'
import { orderStatusLabel } from '../model/orderStatus'

export default function OrderDetailSections({ order, onRefresh }: { order: OrderResponse; onRefresh: () => void }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const locked = useRef(false)
  const cancellation = order.cancellation_request
  const eligible = ['PLACED', 'PENDING_PAYMENT'].includes(order.order_status) && !cancellation && !submitted
  async function submit() {
    if (locked.current || reason.trim().length < 5 || reason.trim().length > 500) return
    locked.current = true; setBusy(true); setError('')
    try { await paymentApi.requestCancellation(order.order_id, reason.trim()); setSubmitted(true); setOpen(false); onRefresh() }
    catch (failure) { setError(paymentErrorMessage(failure)) }
    finally { locked.current = false; setBusy(false) }
  }
  const labels: Record<string, string> = { PENDING: 'Đang chờ duyệt', APPROVED: 'Đã chấp thuận', REJECTED: 'Đã từ chối' }
  return <div className="mx-auto grid max-w-6xl gap-5 px-5 pb-10 sm:px-8">
    <section className="rounded-2xl border border-[#E3E2E2] bg-white p-6"><h2 className="font-display text-2xl">Lịch sử trạng thái</h2>{order.history?.length ? <ol className="mt-4 grid gap-3">{order.history.map(entry => <li key={entry.history_id} className="border-l-2 border-[#C4C7C7] pl-4"><span className="font-semibold">{orderStatusLabel(entry.to_status)}</span><span className="ml-3 text-sm text-secondary">{entry.changed_at ? new Date(entry.changed_at).toLocaleString('vi-VN') : ''}</span>{entry.reason && <p className="text-sm text-secondary">{entry.reason}</p>}</li>)}</ol> : <p className="mt-3 text-sm text-secondary">Chưa có lịch sử trạng thái.</p>}</section>
    <section className="rounded-2xl border border-[#E3E2E2] bg-white p-6"><h2 className="font-display text-2xl">Yêu cầu hủy đơn</h2>
      {cancellation ? <div className="mt-3 text-sm"><p>Trạng thái yêu cầu: {labels[cancellation.request_status] ?? 'Đang cập nhật'}</p><p className="mt-2">Lý do: {cancellation.reason}</p>{cancellation.decision_reason && <p className="mt-2">Phản hồi: {cancellation.decision_reason}</p>}</div> : submitted ? <p role="status" className="mt-3 text-sm">Đã gửi yêu cầu hủy. Vui lòng chờ xét duyệt.</p> : eligible ? <div className="mt-4">{!open ? <button className="rounded-lg border px-4 py-3 font-semibold" onClick={() => setOpen(true)}>Yêu cầu hủy đơn</button> : <div className="grid gap-3"><label className="grid gap-2 text-sm">Lý do hủy đơn<textarea value={reason} onChange={event => setReason(event.target.value)} maxLength={500} className="min-h-24 rounded-lg border p-3" /></label><p className="text-sm text-secondary">Nhập từ 5 đến 500 ký tự. Yêu cầu cần được xét duyệt.</p><div className="flex gap-3"><button disabled={busy || reason.trim().length < 5} onClick={() => void submit()} className="rounded-lg bg-black px-4 py-3 text-white disabled:opacity-50">Gửi yêu cầu hủy</button><button disabled={busy} onClick={() => setOpen(false)}>Đóng</button></div></div>}</div> : <p className="mt-3 text-sm text-secondary">Đơn hàng hiện không đủ điều kiện gửi yêu cầu hủy.</p>}
      {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}
    </section>
  </div>
}
