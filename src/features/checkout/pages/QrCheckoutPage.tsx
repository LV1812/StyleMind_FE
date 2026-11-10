import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { paymentApi, paymentErrorMessage } from '@/features/payments/api/paymentClient'
import type { PaymentAttempt, QrCheckout } from '@/features/payments/api/types'
import { rememberOrder } from '@/features/payments/model/orderReferences'
import { loadAccountDraft, saveAccountDraft } from '../model/accountCheckout'
import { loadGuestDraft, saveGuestDraft } from '../model/guestCheckout'
import { readGuestSessionKey } from '@/features/cart/model/guestSession'
import { guestCheckoutApi } from '../data/guestCheckoutApi'
import { formatCurrency } from '@/shared/lib/formatCurrency'
import { ROUTES } from '@/app/router/routes'
import { Button } from '@/shared/ui'

export default function QrCheckoutPage({ guest = false }: { guest?: boolean }) {
  const { checkoutId = '' } = useParams()
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [checkout, setCheckout] = useState<QrCheckout | null>(null)
  const [attempt, setAttempt] = useState<PaymentAttempt | null>(null)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [now, setNow] = useState(Date.now())
  const closed = useRef(false)
  const owner = currentUser?.id ?? ''
  const guestKey = guest ? readGuestSessionKey() : null

  useEffect(() => {
    const controller = new AbortController()
    closed.current = false
    const refresh = async () => {
      try {
        const state = guest ? await guestCheckoutApi.getQr(guestKey, checkoutId, controller.signal) : await paymentApi.getQrCheckout(checkoutId, { signal: controller.signal })
        if (controller.signal.aborted) return
        // Keep monitoring a closed checkout for late payment without restoring a stale QR.
        if (closed.current) {
          if (state.status === 'RECONCILIATION_REQUIRED') setCheckout(state)
          return
        }
        setCheckout(state)
        if (state.status === 'ORDER_CREATED') {
          closed.current = true
          if (guest) {
            rememberOrder({ orderId: state.checkoutId, owner: 'guest' })
            saveGuestDraft({ ...loadGuestDraft(), qrCheckoutId: undefined, orderId: state.checkoutId })
            navigate(`/guest/orders/${encodeURIComponent(state.checkoutId)}`, { replace: true })
          } else {
            rememberOrder({ orderId: state.checkoutId, owner: 'account', accountId: owner })
            const old = loadAccountDraft(owner)
            saveAccountDraft(owner, { ...old, qrCheckoutId: undefined, orderId: state.checkoutId })
            navigate(ROUTES.paymentOrder.replace(':orderId', encodeURIComponent(state.checkoutId)), { replace: true })
          }
        } else if (['CANCELLED', 'EXPIRED', 'RECONCILIATION_REQUIRED'].includes(state.status)) {
          closed.current = true
          setAttempt(null)
          if (state.status === 'CANCELLED' || state.status === 'EXPIRED') {
            if (guest) saveGuestDraft({ checkoutKey: crypto.randomUUID(), address: { recipient_name: '', recipient_phone: '', address_line: '' }, method: 'cod' })
            else saveAccountDraft(owner, { checkoutKey: crypto.randomUUID(), addressId: '', method: 'COD' })
          }
        }
      } catch (failure) { if (!controller.signal.aborted && !closed.current) setError(paymentErrorMessage(failure)) }
    }
    void refresh()
    void (guest ? guestCheckoutApi.qrAttempt(guestKey, checkoutId, controller.signal) : paymentApi.getQrAttempt(checkoutId, { signal: controller.signal })).then(value => {
      if (!controller.signal.aborted && !closed.current) setAttempt(value)
    }).catch(failure => { if (!controller.signal.aborted && !closed.current) { setError(paymentErrorMessage(failure)); void refresh() } })
    const poll = setInterval(() => { setNow(Date.now()); void refresh() }, 3000)
    return () => { controller.abort(); clearInterval(poll) }
  }, [checkoutId, owner, navigate, guest, guestKey])

  const cancel = async () => {
    if (cancelling || closed.current) return
    setCancelling(true); setError('')
    try {
      const state = guest ? await guestCheckoutApi.cancelQr(guestKey, checkoutId) : await paymentApi.cancelQrCheckout(checkoutId)
      closed.current = true; setCheckout(state); setAttempt(null)
      if (guest) saveGuestDraft({ checkoutKey: crypto.randomUUID(), address: { recipient_name: '', recipient_phone: '', address_line: '' }, method: 'cod' })
      else saveAccountDraft(owner, { checkoutKey: crypto.randomUUID(), addressId: '', method: 'COD' })
    } catch (failure) {
      setError(paymentErrorMessage(failure))
      try { const state = guest ? await guestCheckoutApi.getQr(guestKey, checkoutId) : await paymentApi.getQrCheckout(checkoutId); setCheckout(state) } catch { /* Keep the uncertain result visible. */ }
    } finally { setCancelling(false) }
  }
  const expired = checkout?.status === 'EXPIRED' || (checkout != null && new Date(checkout.expiresAt).getTime() <= now)
  const seconds = checkout ? Math.max(0, Math.floor((new Date(checkout.expiresAt).getTime() - now) / 1000)) : null
  const waiting = !closed.current && !expired

  return <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
    <Link className="text-sm underline" to={ROUTES.shop}>← Trở về cửa hàng</Link>
    <header className="mb-7 mt-7"><p className="text-xs font-bold uppercase tracking-widest text-secondary">Thanh toán an toàn</p><h1 className="mt-2 font-display text-4xl">Thanh toán VietQR</h1><p className="mt-3 text-sm text-secondary">Đơn hàng được tạo sau khi hệ thống xác nhận đã nhận tiền.</p></header>
    {error && <p role="alert" className="mb-5 rounded-xl bg-error-bg p-4 text-sm text-error">{error}</p>}
    <div className="grid gap-5 md:grid-cols-[minmax(0,1.5fr)_minmax(240px,1fr)]">
      <section className="rounded-3xl border border-sand bg-white p-6 text-center sm:p-9">
        <p className="text-sm text-secondary">Số tiền cần thanh toán</p><p className="mt-2 font-display text-4xl">{checkout ? formatCurrency(checkout.totalVnd) : '—'}</p>
        {waiting && attempt?.qrPayload ? <img className="mx-auto my-6 w-full max-w-60 rounded-xl" src={attempt.qrPayload} alt="Mã VietQR để thanh toán" /> : <div className="mx-auto my-6 grid min-h-48 max-w-60 place-content-center rounded-xl bg-ivory p-5 text-sm text-secondary">{waiting ? 'Đang tạo mã thanh toán…' : 'Mã thanh toán không còn hiệu lực.'}</div>}
        {waiting && <p className="text-sm text-secondary">Thời gian giữ hàng còn lại: {seconds === null ? '—' : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`}</p>}
        {waiting && <Button variant="secondary" className="mt-6 w-full" disabled={cancelling} onClick={() => void cancel()}>{cancelling ? 'Đang hủy…' : 'Hủy thanh toán'}</Button>}
        {!waiting && <p role="status" className="mt-4 text-sm text-secondary">{checkout?.status === 'CANCELLED' ? 'Thanh toán đã được hủy.' : checkout?.status === 'RECONCILIATION_REQUIRED' ? 'Giao dịch đang được cửa hàng đối soát.' : 'Phiên thanh toán đã hết hạn.'}</p>}
      </section>
      <aside className="rounded-3xl border border-sand bg-white p-6"><h2 className="font-display text-2xl">Thông tin chuyển khoản</h2><p className="mt-3 text-sm leading-6 text-secondary">Quét mã bằng ứng dụng ngân hàng và giữ nguyên số tiền, nội dung chuyển khoản.</p><p className="mt-6 text-xs text-secondary">Nội dung chuyển khoản</p><p className="mt-2 break-all font-semibold">{attempt?.transferContent ?? 'Đang chuẩn bị…'}</p><p className="mt-6 text-xs leading-5 text-secondary">Trạng thái tự cập nhật khi hệ thống nhận được xác nhận. Nếu đã chuyển tiền, vui lòng không chuyển lại.</p></aside>
    </div>
  </main>
}
