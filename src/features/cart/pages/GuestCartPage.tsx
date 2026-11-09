import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTES } from '@/app/router/routes'
import { useDemoStore } from '@/app/store/DemoStoreProvider'
import { Button, Modal } from '@/shared/ui'
import { formatCurrency } from '@/shared/lib/formatCurrency'
import { GUEST_LATEST_ORDER } from '@/features/checkout/model/guestCheckout'
import { useActiveCommerce } from '../model/AccountCommerceProvider'
import { CartLineItem } from '../components/CartLineItem'
import type { GuestCartItem } from '../data/guestCartApi'
import { ArrowRight, RefreshCw, ShoppingBag } from 'lucide-react'
import { commerceApi } from '@/api/commerce'
import { unavailableVariants } from '../model/cartAvailability'
import { useAuth } from '@/features/auth'
import { beginAccountSelection } from '@/features/checkout/model/accountSelection'
import { beginGuestSelection } from '@/features/checkout/model/guestSelection'

export default function GuestCartPage() {
  const guest = useActiveCommerce()
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [selectedIds, setSelectedIds] = useState<string[] | null>(null)
  const [selectionError, setSelectionError] = useState('')
  const { state } = useDemoStore()
  const [removing, setRemoving] = useState<GuestCartItem | null>(null)
  const [availability, setAvailability] = useState<{ unavailable: string[]; loading: boolean; error: boolean }>({ unavailable: [], loading: false, error: false })
  const [availabilityVersion, setAvailabilityVersion] = useState(0)
  const variantIdsKey = [...new Set(guest.cart.items.map(item => item.variant_id))].join(',')
  useEffect(() => {
    let cancelled = false
    const ids = variantIdsKey ? variantIdsKey.split(',') : []
    if (!ids.length) { setAvailability({ unavailable: [], loading: false, error: false }); return }
    setAvailability({ unavailable: [], loading: true, error: false })
    const batches = Array.from({ length: Math.ceil(ids.length / 100) }, (_, index) => ids.slice(index * 100, index * 100 + 100))
    void Promise.all(batches.map(batch => commerceApi.products.lookupVariants(batch)))
      .then(results => { if (!cancelled) setAvailability({ unavailable: unavailableVariants(ids, results.flatMap(result => result.items)), loading: false, error: false }) })
      .catch(() => { if (!cancelled) setAvailability({ unavailable: [], loading: false, error: true }) })
    return () => { cancelled = true }
  }, [variantIdsKey, availabilityVersion])
  const latest = window.localStorage.getItem(GUEST_LATEST_ORDER)
  const legacyCart = state.cartLines.some(line => !/^[\da-f-]{36}$/i.test(line.variantId))
  const selected = guest.cart.items.filter(item => (selectedIds === null || selectedIds.includes(item.cart_item_id)) && !availability.unavailable.includes(item.variant_id))
  return <div className="mx-auto grid max-w-[var(--container-wide)] gap-6 px-6 py-10 md:px-16">
    <div className="border-b border-[#E3E2E2] pb-6"><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#735C00]">StyleMind</p><h1 className="font-display text-4xl font-semibold">Giỏ hàng</h1></div>
    {latest && <Link className="text-[#1C1B1B] underline" to={ROUTES.guestOrder.replace(':orderId', encodeURIComponent(latest))}>Xem đơn hàng khách gần nhất</Link>}
    {legacyCart && <p className="rounded-lg bg-amber-50 p-3 text-amber-900">Giỏ hàng cũ chứa sản phẩm mẫu chưa được lưu trên hệ thống. Vui lòng chọn lại sản phẩm trong cửa hàng để mua hàng thật.</p>}
    {guest.cartError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{guest.cartError}</p>}
    {selectionError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{selectionError}</p>}
    {availability.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">Chưa kiểm tra được tình trạng sản phẩm. Vui lòng tải lại giỏ hàng.</p>}
    <Button className="w-fit" variant="ghost" icon={<RefreshCw size={16} aria-hidden="true" />} disabled={guest.busy || guest.cartLoading} onClick={() => { setAvailabilityVersion(version => version + 1); void guest.refreshCart().catch(() => undefined) }}>Tải lại giỏ hàng</Button>
    {guest.cartLoading ? <p role="status">Đang tải giỏ hàng…</p> : guest.cart.items.length === 0 ? <div className="mx-auto grid w-full max-w-xl justify-items-center gap-4 rounded-3xl border border-[#E3E2E2] bg-white px-6 py-12 text-center sm:py-16"><span className="grid h-16 w-16 place-items-center rounded-full bg-[#F5F3F3] text-[#5E5F5D]"><ShoppingBag size={28} aria-hidden="true" /></span><h2 className="font-display text-3xl font-semibold">Giỏ hàng của bạn đang trống</h2><p className="text-sm leading-6 text-[#5E5F5D]">Chọn sản phẩm từ cửa hàng để bắt đầu.</p><Link to={ROUTES.shop} className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#1C1B1B] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#444746] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1B1B] focus-visible:ring-offset-2">Bắt đầu mua sắm <ArrowRight size={16} aria-hidden="true" /></Link></div> : <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <fieldset disabled={guest.busy} className="grid gap-4">
        <legend className="mb-4 font-display text-2xl font-semibold">Sản phẩm trong giỏ ({guest.cart.items.length})</legend>
        {guest.cart.items.map(item => {
          const product = guest.products.find(product => product.variants.some(variant => variant.id === item.variant_id))
          const variant = product?.variants.find(variant => variant.id === item.variant_id)
          const unavailable = availability.unavailable.includes(item.variant_id)
          const checkbox = <label className="flex items-center gap-2 p-3 text-sm"><input type="checkbox" aria-label={`Chọn ${item.product_name} ${item.color ?? ''} ${item.size ?? ''}`.trim()} disabled={unavailable} checked={selected.some(line => line.cart_item_id === item.cart_item_id)} onChange={event => {
            const initial = selected.map(line => line.cart_item_id)
            setSelectedIds(event.target.checked ? [...initial, item.cart_item_id] : initial.filter(id => id !== item.cart_item_id))
          }} />Chọn sản phẩm này</label>
          if (!product || !variant) return <article key={item.cart_item_id} className="grid gap-3 rounded-lg bg-white p-5">
            {checkbox}
            <p>{item.product_name} × {item.quantity} — {formatCurrency(item.line_total_vnd)}</p>
            {unavailable && <p className="font-semibold text-red-700">Hết hàng</p>}
            <Button variant="danger" onClick={() => setRemoving(item)}>Xóa {item.product_name}</Button>
          </article>
          return <div key={item.cart_item_id}>{checkbox}{unavailable && <p className="px-4 pt-3 font-semibold text-red-700">Hết hàng</p>}<CartLineItem detail={{
            line: { id: item.cart_item_id, productId: product.id, variantId: variant.id, quantity: item.quantity, source: 'shop' },
            product, variant, image: variant.images.find(image => image.isPrimary) ?? variant.images[0] ?? null,
            quantity: item.quantity, unitPrice: item.unit_price_vnd, lineTotal: item.line_total_vnd,
          }} unavailable={unavailable} onQuantityChange={quantity => void guest.updateItem(item.cart_item_id, quantity).catch(() => undefined)} onRemove={() => setRemoving(item)} /></div>
        })}
      </fieldset>
      <aside className="grid content-start gap-5 rounded-2xl border border-[#E3E2E2] bg-white p-6 shadow-sm lg:sticky lg:top-28">
        <h2 className="font-display text-2xl font-semibold">Tóm tắt đơn hàng</h2>
        <div className="flex items-center justify-between gap-4 border-t border-[#E3E2E2] pt-5"><span className="text-sm text-secondary">Tạm tính</span><p className="text-xl font-bold text-[#1C1B1B]">{formatCurrency(selected.reduce((sum, item) => sum + item.line_total_vnd, 0))}</p></div>
        <Button disabled={Boolean(guest.busy || guest.cartError || availability.loading || availability.error || !selected.length)} onClick={() => {
          const choice = { kind: 'selected' as const, cart_item_ids: selected.map(item => item.cart_item_id) }
          const started = currentUser ? beginAccountSelection(currentUser.id, choice) : beginGuestSelection(choice)
          if (!started) { setSelectionError('Có yêu cầu đặt hàng trước đó chưa rõ kết quả. Vui lòng kiểm tra đơn trước khi tạo lần mới.'); return }
          navigate(ROUTES.checkout)
        }}>Tiến hành thanh toán</Button>
      </aside>
    </div>}
    <Modal open={Boolean(removing)} title="Xóa sản phẩm khỏi giỏ?" onClose={() => { if (!guest.busy) setRemoving(null) }} footer={<>
      <Button variant="ghost" disabled={guest.busy} onClick={() => setRemoving(null)}>Giữ lại</Button>
      <Button variant="danger" loading={guest.busy} onClick={() => { if (removing) void guest.removeItem(removing.cart_item_id).then(() => setRemoving(null)).catch(() => undefined) }}>Xóa sản phẩm</Button>
    </>}><p>{removing?.product_name}</p></Modal>
  </div>
}
