import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/app/router/routes'
import { useDemoStore } from '@/app/store/DemoStoreProvider'
import { Button, EmptyState, Modal } from '@/shared/ui'
import { formatCurrency } from '@/shared/lib/formatCurrency'
import { GUEST_LATEST_ORDER } from '@/features/checkout/model/guestCheckout'
import { useActiveCommerce } from '../model/AccountCommerceProvider'
import { CartLineItem } from '../components/CartLineItem'
import type { GuestCartItem } from '../data/guestCartApi'

export default function GuestCartPage() {
  const guest = useActiveCommerce()
  const { state } = useDemoStore()
  const [removing, setRemoving] = useState<GuestCartItem | null>(null)
  const latest = window.localStorage.getItem(GUEST_LATEST_ORDER)
  const legacyCart = state.cartLines.some(line => !/^[\da-f-]{36}$/i.test(line.variantId))
  return <div className="mx-auto grid max-w-[var(--container-wide)] gap-5 px-5 py-8 md:px-8">
    <h1 className="font-display text-4xl font-semibold">Giỏ hàng</h1>
    {latest && <Link className="text-[#684B5A] underline" to={ROUTES.guestOrder.replace(':orderId', encodeURIComponent(latest))}>Xem đơn hàng khách gần nhất</Link>}
    {legacyCart && <p className="rounded-lg bg-amber-50 p-3 text-amber-900">Giỏ hàng cũ chứa sản phẩm mẫu chưa được lưu trên hệ thống. Vui lòng chọn lại sản phẩm trong cửa hàng để mua hàng thật.</p>}
    {guest.cartError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{guest.cartError}</p>}
    <Button variant="secondary" disabled={guest.busy || guest.cartLoading} onClick={() => void guest.refreshCart().catch(() => undefined)}>Tải lại giỏ hàng</Button>
    {guest.cartLoading ? <p role="status">Đang tải giỏ hàng…</p> : guest.cart.items.length === 0 ? <EmptyState title="Giỏ hàng của bạn đang trống" description="Chọn sản phẩm từ cửa hàng để bắt đầu." action={<Link to={ROUTES.shop} className="text-[#684B5A] underline">Bắt đầu mua sắm</Link>} /> : <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <fieldset disabled={guest.busy} className="grid gap-4">
        {guest.cart.items.map(item => {
          const product = guest.products.find(product => product.variants.some(variant => variant.id === item.variant_id))
          const variant = product?.variants.find(variant => variant.id === item.variant_id)
          if (!product || !variant) return <article key={item.cart_item_id} className="grid gap-3 rounded-lg bg-white p-5">
            <p>{item.product_name} × {item.quantity} — {formatCurrency(item.line_total_vnd)}</p>
            <Button variant="danger" onClick={() => setRemoving(item)}>Xóa {item.product_name}</Button>
          </article>
          return <CartLineItem key={item.cart_item_id} detail={{
            line: { id: item.cart_item_id, productId: product.id, variantId: variant.id, quantity: item.quantity, source: 'shop' },
            product, variant, image: variant.images.find(image => image.isPrimary) ?? variant.images[0] ?? null,
            quantity: item.quantity, unitPrice: item.unit_price_vnd, lineTotal: item.line_total_vnd,
          }} onQuantityChange={quantity => void guest.updateItem(item.cart_item_id, quantity).catch(() => undefined)} onRemove={() => setRemoving(item)} />
        })}
      </fieldset>
      <aside className="grid content-start gap-5 rounded-lg bg-white p-5">
        <h2 className="font-display text-2xl font-semibold">Tổng thanh toán</h2>
        <p className="text-xl font-bold text-[#684B5A]">{formatCurrency(guest.cart.total_vnd)}</p>
        {guest.busy || guest.cartError ? <Button disabled>Tiến hành thanh toán</Button> : <Link to={ROUTES.checkout} className="rounded-lg bg-[#684B5A] px-4 py-3 text-center font-semibold text-white">Tiến hành thanh toán</Link>}
      </aside>
    </div>}
    <Modal open={Boolean(removing)} title="Xóa sản phẩm khỏi giỏ?" onClose={() => { if (!guest.busy) setRemoving(null) }} footer={<>
      <Button variant="ghost" disabled={guest.busy} onClick={() => setRemoving(null)}>Giữ lại</Button>
      <Button variant="danger" loading={guest.busy} onClick={() => { if (removing) void guest.removeItem(removing.cart_item_id).then(() => setRemoving(null)).catch(() => undefined) }}>Xóa sản phẩm</Button>
    </>}><p>{removing?.product_name}</p></Modal>
  </div>
}
