import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { useAccountCommerce } from '@/features/cart/model/AccountCommerceProvider'
import { identityApi, identityErrorMessage, type IdentityAddress, type Province, type Ward } from '@/shared/api/identityApi'
import { AddressForm, type AddressFormValue } from '@/features/account/components/AddressForm'
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
  const [addingAddress, setAddingAddress] = useState(false)
  const [addressSaving, setAddressSaving] = useState(false)
  const [addressError, setAddressError] = useState('')
  const [provinces, setProvinces] = useState<Province[]>([])
  const [wards, setWards] = useState<Ward[]>([])
  const [wardLoading, setWardLoading] = useState(false)
  const wardRequest = useRef(0)
  const addressLock = useRef(false)
  const locked = useRef(false)
  const lifetime = useRef<AbortController | null>(null)
  const update = (value: typeof draft) => { saveAccountDraft(owner, value); setDraft(value) }
  useEffect(() => {
    const controller = new AbortController()
    lifetime.current = controller
    setPrices(null); setReady(false)
    const selection = draft.selection
    const priceRequest = selection?.kind === 'selected' ? paymentApi.previewSelection({ cart_item_ids: selection.cart_item_ids }, { signal: controller.signal })
      : selection?.kind === 'buy-now' ? paymentApi.previewBuyNow({ variant_id: selection.variant_id, quantity: selection.quantity }, { signal: controller.signal })
      : paymentApi.getPrices({ signal: controller.signal })
    void priceRequest.then(value => { if (!controller.signal.aborted) setPrices(value) })
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
  useEffect(() => { if (draft.qrCheckoutId) navigate(`/checkout/qr/${encodeURIComponent(draft.qrCheckoutId)}`, { replace: true }) }, [draft.qrCheckoutId, navigate])
  const selected = addresses.find(address => address.address_id === draft.addressId) ?? addresses.find(address => address.is_default) ?? addresses[0]
  const submit = async () => {
    const controller = lifetime.current
    if (locked.current || addingAddress || addressLock.current || draft.orderId || !controller || controller.signal.aborted) return
    if (!draft.submitted && (!prices?.items.length || !selected || !addressesReady)) return
    locked.current = true; setBusy(true); setError('')
    const body = draft.submitted ?? { checkout_key: draft.checkoutKey, shipping_address_id: selected.address_id, payment_method: draft.method }
    const qrSelection = draft.selection ?? (prices ? { kind: 'selected' as const, cart_item_ids: prices.items.map(item => item.cart_item_id) } : undefined)
    const submitted = { ...draft, submitted: body, ...(body.payment_method === 'SEPAY_VIETQR' ? { selection: qrSelection } : {}) }
    update(submitted)
    try {
      if (body.payment_method === 'SEPAY_VIETQR') {
        if (!qrSelection) throw new Error('Chưa có sản phẩm để thanh toán.')
        const checkout = qrSelection.kind === 'buy-now'
          ? await paymentApi.prepareQrBuyNow({ ...body, variant_id: qrSelection.variant_id, quantity: qrSelection.quantity })
          : await paymentApi.prepareQrSelection({ ...body, cart_item_ids: qrSelection.cart_item_ids })
        saveAccountDraft(owner, { ...submitted, qrCheckoutId: checkout.checkoutId })
        if (!controller.signal.aborted) navigate(`/checkout/qr/${encodeURIComponent(checkout.checkoutId)}`, { replace: true })
        return
      }
      const order = draft.selection?.kind === 'selected' ? await paymentApi.checkoutSelection({ ...body, cart_item_ids: draft.selection.cart_item_ids })
        : draft.selection?.kind === 'buy-now' ? await paymentApi.checkoutBuyNow({ ...body, variant_id: draft.selection.variant_id, quantity: draft.selection.quantity })
        : await paymentApi.checkout(body)
      if (!order.order_id) throw new Error('Không nhận được mã đơn hàng; kết quả chưa xác định.')
      rememberOrder({ orderId: order.order_id, owner: 'account', accountId: owner })
      saveAccountDraft(owner, { ...submitted, orderId: order.order_id })
      if (controller.signal.aborted) return
      setDraft({ ...submitted, orderId: order.order_id })
      void cart.refreshCart().catch(() => undefined)
      navigate(ROUTES.paymentOrder.replace(':orderId', encodeURIComponent(order.order_id)), { replace: true })
    } catch (failure) {
      if (controller.signal.aborted) return
      if (failure instanceof PaymentApiError && failure.code === 'DUPLICATE_CHECKOUT') {
        try {
          if (body.payment_method === 'SEPAY_VIETQR') {
            const checkout = await paymentApi.recoverQrCheckout(draft.checkoutKey)
            saveAccountDraft(owner, { ...submitted, qrCheckoutId: checkout.checkoutId })
            if (!controller.signal.aborted) navigate(`/checkout/qr/${encodeURIComponent(checkout.checkoutId)}`, { replace: true })
            return
          }
          const recovered = await paymentApi.recoverCheckout(draft.checkoutKey)
          if (!recovered.order_id) throw new Error('Missing order id')
          rememberOrder({ orderId: recovered.order_id, owner: 'account', accountId: owner })
          saveAccountDraft(owner, { ...submitted, orderId: recovered.order_id })
          if (!controller.signal.aborted) { setDraft({ ...submitted, orderId: recovered.order_id }); void cart.refreshCart().catch(() => undefined); navigate(ROUTES.paymentOrder.replace(':orderId', encodeURIComponent(recovered.order_id)), { replace: true }) }
        } catch { if (!controller.signal.aborted) setError('Chưa tìm thấy kết quả lần đặt này. Hãy chờ rồi thử lại cùng yêu cầu.') }
        return
      }
      if (failure instanceof PaymentApiError && failure.status === 400) update({ ...draft, submitted: undefined })
      if (failure instanceof PaymentApiError && ['EMPTY_CART', 'INSUFFICIENT_STOCK', 'INVALID_CART_ITEM'].includes(failure.code)) {
        void cart.refreshCart().catch(() => undefined)
        setVersion(value => value + 1)
        update({ ...draft, submitted: undefined })
      }
      setError(paymentErrorMessage(failure))
    } finally { if (!controller.signal.aborted) { locked.current = false; setBusy(false) } }
  }
  const openAddressForm = () => {
    setAddingAddress(true); setAddressError(''); setWards([]); setProvinces([])
    const controller = lifetime.current
    void identityApi.listProvinces().then(result => { if (!controller?.signal.aborted) setProvinces(result.provinces) })
      .catch(() => { if (!controller?.signal.aborted) setAddressError('Không tải được danh sách tỉnh/thành. Bạn vẫn có thể nhập địa chỉ đầy đủ.') })
  }
  const changeProvince = (code: string) => {
    const requestId = ++wardRequest.current
    const controller = lifetime.current
    setWards([]); setWardLoading(Boolean(code))
    if (!code) return
    void identityApi.listWards(code).then(result => {
      if (requestId === wardRequest.current && !controller?.signal.aborted) setWards(result.wards)
    }).catch(() => {
      if (requestId === wardRequest.current && !controller?.signal.aborted) setAddressError('Không tải được phường/xã. Bạn vẫn có thể nhập địa chỉ đầy đủ.')
    }).finally(() => { if (requestId === wardRequest.current && !controller?.signal.aborted) setWardLoading(false) })
  }
  const createAddress = async (value: AddressFormValue) => {
    const controller = lifetime.current
    if (addressLock.current || !controller || controller.signal.aborted) return
    addressLock.current = true; setAddressSaving(true); setAddressError('')
    try {
      const created = await identityApi.createAddress({ label: value.label.trim() || null, recipient_name: value.recipientName.trim(), recipient_phone: value.recipientPhone.trim(), address_line: value.addressLine.trim(), ward_code: value.wardCode ?? null })
      if (controller.signal.aborted) return
      setAddresses(current => [...current.filter(address => address.address_id !== created.address_id), created])
      update({ ...draft, addressId: created.address_id })
      setAddingAddress(false)
    } catch (failure) {
      if (!controller.signal.aborted) setAddressError(identityErrorMessage(failure, 'Không thể lưu địa chỉ.'))
    } finally { addressLock.current = false; if (!controller.signal.aborted) setAddressSaving(false) }
  }
  return <div className="mx-auto grid max-w-[1440px] items-start gap-6 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)] lg:gap-10 lg:px-16 lg:py-14">
    <header className="border-b border-[#E3E2E2] pb-6 lg:col-span-2"><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-secondary">Thanh toán</p><h1 className="font-display text-4xl font-semibold">Hoàn tất đơn hàng</h1><p className="mt-2 text-sm text-secondary">Kiểm tra địa chỉ, phương thức thanh toán và thông tin đơn hàng.</p></header>
    {busy && <section role="status" className="rounded-2xl border border-[#E3E2E2] bg-white p-6 text-center lg:col-span-2"><p className="font-display text-2xl">Đang xử lý đơn hàng</p><p className="mt-2 text-sm text-secondary">Vui lòng chờ trong khi hệ thống xác nhận yêu cầu.</p></section>}
    <fieldset disabled={busy || addressSaving || Boolean(draft.submitted)} className="grid min-w-0 gap-4 rounded-xl border border-[#E3E2E2] bg-white p-5 sm:p-7">
      <h2 className="font-display text-2xl font-semibold">Địa chỉ giao hàng</h2>
      <Link to={ROUTES.addresses} className="text-sm text-accent underline">Quản lý địa chỉ</Link>
      {!addressesReady ? <p>Đang tải địa chỉ…</p> : selected ? <>
        <label className="grid gap-2 text-sm">Chọn địa chỉ<select className="min-h-11 rounded-lg border border-sand bg-white px-3" value={selected.address_id} onChange={event => update({ ...draft, addressId: event.target.value })}>
          {addresses.map(address => <option key={address.address_id} value={address.address_id}>{address.recipient_name} — {address.address_line}</option>)}
        </select></label><p className="rounded-lg bg-[#FBF9F9] p-4 text-sm leading-6 text-secondary">{selected.recipient_name}<br />{selected.recipient_phone}<br />{selected.address_line}</p>
      </> : <p>Vui lòng thêm địa chỉ giao hàng trước khi đặt đơn.</p>}
      {addressesReady && !addingAddress && <Button type="button" variant="secondary" onClick={openAddressForm}>Thêm địa chỉ mới</Button>}
      {addingAddress && <div className="grid gap-3">{addressError && <p role="alert" className="rounded-lg bg-error-bg p-3 text-sm text-error">{addressError}</p>}<AddressForm provinces={provinces} wards={wards} wardLoading={wardLoading} saving={addressSaving} onProvinceChange={changeProvince} onCancel={() => { wardRequest.current++; setAddingAddress(false); setAddressError('') }} onSubmit={createAddress} /></div>}
      <PaymentMethodSection value={draft.method === 'COD' ? 'cod' : 'vietqr'} onChange={method => update({ ...draft, method: method === 'cod' ? 'COD' : 'SEPAY_VIETQR' })} />
    </fieldset>
    <section className="grid min-w-0 gap-4 rounded-xl border border-[#E3E2E2] bg-white p-5 sm:p-7 lg:sticky lg:top-28" aria-label="Giá hiện tại">
      <h2 className="font-display text-2xl font-semibold">Giá hiện tại</h2>
      {prices?.items.map(item => <div key={item.cart_item_id} className="flex justify-between gap-3 text-sm"><span className="min-w-0 break-words">{item.product_name} × {item.quantity}</span><span className="shrink-0 font-medium">{formatCurrency(item.line_total_vnd)}</span></div>)}
      {prices && <p className="border-t border-[#E3E2E2] pt-4 font-bold text-accent">Tổng tiền: {formatCurrency(prices.total_vnd)}</p>}
      <Button variant="secondary" disabled={busy || addingAddress} onClick={() => setVersion(value => value + 1)}>Tải lại giá và địa chỉ</Button>
    </section>
    {draft.submitted && <p role="status">Thử lại sẽ dùng nguyên dữ liệu và mã checkout đã gửi để tránh tạo trùng đơn.</p>}
    {error && <p role="alert" className="rounded-xl bg-error-bg p-4 text-sm text-error">{error}</p>}
    <Button className="lg:col-span-2" loading={busy} disabled={addingAddress || addressSaving || Boolean(draft.orderId) || (!draft.submitted && (!prices?.items.length || !selected || !addressesReady))} onClick={() => void submit()}>{draft.submitted ? 'Thử lại đặt hàng' : 'Đặt hàng'}</Button>
    <Link to={ROUTES.cart} className="text-accent underline">Quay lại giỏ hàng</Link>
  </div>
}
