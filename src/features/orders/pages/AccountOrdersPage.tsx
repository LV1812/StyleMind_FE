import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/app/router/routes'
import { paymentApi, paymentErrorMessage } from '@/features/payments/api/paymentClient'
import type { OrderResponse } from '@/features/payments/api/types'
import { formatCurrency } from '@/shared/lib/formatCurrency'
import { orderStatusLabel, orderStatusLabels } from '../model/orderStatus'

export default function AccountOrdersPage() {
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)
  const [version, setVersion] = useState(0)
  const [data, setData] = useState<{ items: OrderResponse[]; total_pages: number; total_elements: number } | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setError(''); setData(null)
    void paymentApi.listOrders({ page, size: 10, ...(status ? { status } : {}) }, { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) setData(result) })
      .catch(failure => { if (!controller.signal.aborted) setError(paymentErrorMessage(failure)) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [status, page, version])
  return <section className="mx-auto max-w-5xl px-5 py-10 md:px-8 md:py-12">
    <header className="border-b border-[#E3E2E2] pb-7"><p className="text-sm text-secondary">Tài khoản của tôi</p><h1 className="mt-2 font-display text-4xl font-semibold">Đơn hàng</h1><p className="mt-3 text-sm text-secondary">Theo dõi các đơn hàng của bạn.</p></header>
    <div className="mt-7 flex flex-wrap items-center justify-between gap-4"><h2 className="font-display text-2xl font-semibold">Đơn hàng của tôi</h2><label className="grid gap-1 text-sm">Lọc trạng thái đơn<select aria-label="Lọc trạng thái đơn" value={status} onChange={event => { setStatus(event.target.value); setPage(0) }} className="min-h-11 rounded-lg border border-[#C4C7C7] bg-white px-3"><option value="">Tất cả trạng thái</option>{Object.entries(orderStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
    {loading && <p role="status" className="mt-5">Đang tải đơn hàng…</p>}
    {error && <div role="alert" className="mt-5 rounded-lg bg-red-50 p-4">{error} <button className="underline" onClick={() => setVersion(v => v + 1)}>Thử lại</button></div>}
    {data && !data.items.length && <p className="mt-5 rounded-lg border bg-white p-8 text-center">Chưa có đơn hàng phù hợp.</p>}
    <div className="mt-5 grid gap-4">{data?.items.map(order => <Link key={order.order_id} to={ROUTES.orderDetail.replace(':orderId', encodeURIComponent(order.order_id))} className="grid gap-2 rounded-xl border border-[#E3E2E2] bg-white p-5 hover:border-[#777] sm:grid-cols-2"><span className="font-semibold">{order.order_number}</span><span className="sm:text-right">{orderStatusLabel(order.order_status)}</span><span className="text-sm text-secondary">{order.placed_at ? new Date(order.placed_at).toLocaleDateString('vi-VN') : 'Chưa có ngày đặt'}</span><span className="font-semibold sm:text-right">{formatCurrency(order.accepted_total_vnd)}</span></Link>)}</div>
    {data && data.total_pages > 1 && <nav aria-label="Phân trang đơn hàng" className="mt-6 flex items-center gap-3"><button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="rounded border px-3 py-2 disabled:opacity-40">Trang trước</button><span>Trang {page + 1} / {data.total_pages}</span><button disabled={page + 1 >= data.total_pages} onClick={() => setPage(p => p + 1)} className="rounded border px-3 py-2 disabled:opacity-40">Trang sau</button></nav>}
    <Link to={ROUTES.shop} className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold underline">Tiếp tục mua sắm</Link>
  </section>
}
