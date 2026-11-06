import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { useAccountCommerce } from '@/features/cart/model/AccountCommerceProvider'
import { identityApi, type IdentityAddress } from '@/shared/api/identityApi'
import { paymentApi, paymentErrorMessage } from '@/features/payments/api/paymentClient'
import { PaymentApiError } from '@/features/payments/api/paymentApi'
import { rememberOrder } from '@/features/payments/model/orderReferences'
import { ROUTES } from '@/app/router/routes'
import { Button } from '@/shared/ui'
import { formatCurrency } from '@/shared/lib/formatCurrency'
import type { GuestPrices } from '../data/guestCheckoutApi'
import { loadAccountDraft, saveAccountDraft } from '../model/accountCheckout'
import { PaymentMethodSection } from '../components/PaymentMethodSection'

export default function AccountCheckoutPage() {
  const { currentUser } = useAuth()
  const owner = currentUser!.id
  const navigate = useNavigate()
  const cart = useAccountCommerce()
  const [draft, setDraft] = useState(() => loadAccountDraft(owner))
  const [addresses, setAddresses] = useState<IdentityAddress[]>([])
  const [addressesReady, setReady] = useState(false)
  const [prices, setPrices] = useState<GuestPrices | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [version, setVersion] = useState(0)
  const locked = useRef(false)
  const lifetime = useRef<AbortController | null>(null)
  const update = (value: typeof draft) => { saveAccountDraft(owner, value); setDraft(value) }
  useEffect(() => {
    const controller = new AbortController()
    lifetime.current = controller
    setPrices(null); setReady(false)
    void paymentApi.getPrices({ signal: controller.signal }).then(value => { if (!controller.signal.aborted) setPrices(value) })
      .catch(failure => {
        if (!controller.signal.aborted) setError(paymentErrorMessage(failure))
        if (failure instanceof PaymentApiError && failure.code === 'EMPTY_CART') void cart.refreshCart().catch(() => undefined)
      })
    void identityApi.listAddresses().then(value => {
      if (controller.signal.aborted) return
      setAddresses(value.addresses); setReady(true)
    }).catch(failure => { if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Không tải được địa chỉ.') })
    return () => controller.abort()
  }, [owner, version])
  useEffect(() => { if (draft.orderId) navigate(ROUTES.paymentOrder.replace(':orderId', encodeURIComponent(draft.orderId)), { replace: true }) }, [draft.orderId, navigate])
  const selected = addresses.find(address => address.address_id === draft.addressId) ?? addresses.find(address => address.is_default) ?? addresses[0]
  const submit = async () => {
    const controller = lifetime.current
    if (locked.current || draft.orderId || !controller || controller.signal.aborted) return
    if (!draft.submitted && (!prices?.items.length || !selected || !addressesReady)) return
    locked.current = true; setBusy(true); setError('')
    const body = draft.submitted ?? { checkout_key: draft.checkoutKey, shipping_address_id: selected.address_id, payment_method: draft.method }
    const submitted = { ...draft, submitted: body }
    update(submitted)
    try {
      const order = await paymentApi.checkout(body)
      if (!order.order_id) throw new Error('Không nhận được mã đơn hàng; kết quả chưa xác định.')
      rememberOrder({ orderId: order.order_id, owner: 'account', accountId: owner })
      saveAccountDraft(owner, { ...submitted, orderId: order.order_id })
      if (controller.signal.aborted) return
      setDraft({ ...submitted, orderId: order.order_id })
      void cart.refreshCart().catch(() => undefined)
      navigate(ROUTES.paymentOrder.replace(':orderId', encodeURIComponent(order.order_id)), { replace: true })
    } catch (failure) {
      if (controller.signal.aborted) return
      if (failure instanceof PaymentApiError && failure.status === 400) update({ ...draft, submitted: undefined })
      if (failure instanceof PaymentApiError && ['EMPTY_CART', 'INSUFFICIENT_STOCK'].includes(failure.code)) {
        void cart.refreshCart().catch(() => undefined)
        setVersion(value => value + 1)
        update({ ...draft, submitted: undefined })
      }
      setError(paymentErrorMessage(failure))
    } finally { if (!controller.signal.aborted) { locked.current = false; setBusy(false) } }
  }
  return <div className="mx-auto grid max-w-3xl gap-5 px-5 py-8">
    <h1 className="font-display text-4xl font-semibold">Hoàn tất đơn hàng</h1>
    <fieldset disabled={busy || Boolean(draft.submitted)} className="grid gap-4 rounded-2xl border border-sand bg-white p-5">
      <h2 className="text-lg font-semibold">Địa chỉ giao hàng</h2>
      <Link to={ROUTES.addresses} className="text-sm text-accent underline">Quản lý địa chỉ</Link>
      {!addressesReady ? <p>Đang tải địa chỉ…</p> : selected ? <>
        <label className="grid gap-2 text-sm">Chọn địa chỉ<select className="min-h-11 rounded-lg border border-sand bg-white px-3" value={selected.address_id} onChange={event => update({ ...draft, addressId: event.target.value })}>
          {addresses.map(address => <option key={address.address_id} value={address.address_id}>{address.recipient_name} — {address.address_line}</option>)}
        </select></label><p className="text-sm leading-6 text-secondary">{selected.recipient_name}<br />{selected.recipient_phone}<br />{selected.address_line}</p>
      </> : <p>Vui lòng thêm địa chỉ giao hàng trước khi đặt đơn.</p>}
      <PaymentMethodSection value={draft.method === 'COD' ? 'cod' : 'vietqr'} onChange={method => update({ ...draft, method: method === 'cod' ? 'COD' : 'SEPAY_VIETQR' })} />
    </fieldset>
    <section className="grid gap-3 rounded-2xl border border-sand bg-white p-5" aria-label="Giá hiện tại">
      <h2 className="text-lg font-semibold">Giá hiện tại</h2>
      {prices?.items.map(item => <p key={item.cart_item_id}>{item.product_name} × {item.quantity} — {formatCurrency(item.line_total_vnd)}</p>)}
      {prices && <p className="font-bold text-accent">Tổng tiền: {formatCurrency(prices.total_vnd)}</p>}
      <Button variant="secondary" disabled={busy} onClick={() => setVersion(value => value + 1)}>Tải lại giá và địa chỉ</Button>
    </section>
    {draft.submitted && <p role="status">Thử lại sẽ dùng nguyên dữ liệu và mã checkout đã gửi để tránh tạo trùng đơn.</p>}
    {error && <p role="alert" className="rounded-xl bg-error-bg p-4 text-sm text-error">{error}</p>}
    <Button loading={busy} disabled={Boolean(draft.orderId) || (!draft.submitted && (!prices?.items.length || !selected || !addressesReady))} onClick={() => void submit()}>{draft.submitted ? 'Thử lại đặt hàng' : 'Đặt hàng'}</Button>
    <Link to={ROUTES.cart} className="text-accent underline">Quay lại giỏ hàng</Link>
  </div>
}
