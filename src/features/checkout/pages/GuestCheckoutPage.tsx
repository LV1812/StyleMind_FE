import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ensureGuestSessionKey, readGuestSessionKey } from "@/features/cart/model/guestSession"
import { rememberOrder } from '@/features/payments/model/orderReferences'
import { useGuestCommerce } from '@/features/cart/model/GuestCommerceProvider'
import { Button, TextField } from "@/shared/ui"
import { formatCurrency } from "@/shared/lib/formatCurrency"
import { PaymentApiError } from "@/features/payments/api/paymentApi"
import { PaymentMethodSection } from "../components/PaymentMethodSection"
import {
  guestCheckoutApi,
  guestErrorMessage,
  type GuestPrices,
  type GuestShippingAddress,
} from "../data/guestCheckoutApi"
import {
  GUEST_LATEST_ORDER,
  loadGuestDraft,
  saveGuestDraft,
  trimGuestAddress,
  validateGuestAddress,
} from "../model/guestCheckout"

export default function GuestCheckoutPage() {
  const guest = useGuestCommerce()
  const navigate = useNavigate()
  const [draft, setDraft] = useState(loadGuestDraft)
  const [key] = useState(() => draft.submitted || draft.recoveryRequired || draft.orderId ? readGuestSessionKey() : ensureGuestSessionKey())
  const [prices, setPrices] = useState<GuestPrices | null>(null)
  const [error, setError] = useState("")
  const [errors, setErrors] =
    useState<Partial<Record<keyof GuestShippingAddress, string>>>({})
  const [busy, setBusy] = useState(false)
  const [priceVersion, setPriceVersion] = useState(0)
  const inFlight = useRef(false)
  const mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])

  useEffect(() => {
    const controller = new AbortController()
    setPrices(null)
    void guestCheckoutApi
      .prices(key, controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) {
          setPrices(value)
          setError("")
        }
      })
      .catch((failure) => {
        if (!controller.signal.aborted) setError(guestErrorMessage(failure))
        if (failure instanceof PaymentApiError && failure.code === 'EMPTY_CART') void guest.refreshCart().catch(() => undefined)
      })
    return () => controller.abort()
  }, [key, priceVersion])

  useEffect(() => {
    if (draft.orderId)
      navigate("/guest/orders/" + encodeURIComponent(draft.orderId), {
        replace: true,
      })
  }, [draft.orderId, navigate])

  const update = (next: typeof draft) => {
    saveGuestDraft(next)
    setDraft(next)
  }
  const submit = async () => {
    if (inFlight.current || !key || draft.orderId || (draft.recoveryRequired && !draft.submitted) || (!prices && !draft.submitted))
      return
    const address = trimGuestAddress(draft.address)
    const validation = validateGuestAddress(address)
    setErrors(validation)
    if (Object.keys(validation).length) return
    inFlight.current = true
    setBusy(true)
    setError("")
    try {
      const body = draft.submitted ?? {
        checkout_key: draft.checkoutKey,
        payment_method:
          draft.method === "cod" ? "COD" as const : "SEPAY_VIETQR" as const,
        shipping_address: address,
      }
      const pending = { ...draft, address, submitted: body }
      update(pending)
      const order = await guestCheckoutApi.createOrder(key, body)
      if (!order.order_id) throw new Error("Missing order id")
      // Persist before clearing the cart or navigating, so refresh cannot submit a new order.
      window.localStorage.setItem(GUEST_LATEST_ORDER, order.order_id)
      rememberOrder({ orderId: order.order_id, owner: 'guest' })
      update({ ...pending, orderId: order.order_id })
      void guest.refreshCart().catch(() => undefined)
      if (mounted.current) navigate("/guest/orders/" + encodeURIComponent(order.order_id), {
        replace: true,
      })
    } catch (failure) {
      if (!mounted.current) return
      if (failure instanceof PaymentApiError && failure.status === 400)
        update({ ...draft, address, submitted: undefined, recoveryRequired: false })
      if (failure instanceof PaymentApiError && ['EMPTY_CART', 'INSUFFICIENT_STOCK'].includes(failure.code ?? '')) {
        update({ ...draft, address, submitted: undefined, recoveryRequired: false })
        void guest.refreshCart().catch(() => undefined)
        setPriceVersion(value => value + 1)
      }
      setError(guestErrorMessage(failure))
    } finally {
      inFlight.current = false
      if (mounted.current) setBusy(false)
    }
  }

  return (
    <main className="mx-auto grid max-w-3xl gap-5 px-5 py-8">
      <h1 className="font-display text-3xl font-semibold">
        Thanh toán không cần đăng nhập
      </h1>
      <form
        className="grid gap-5"
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
      >
        <fieldset
          disabled={busy || Boolean(draft.submitted)}
          className="grid gap-4 rounded-lg bg-white p-5"
        >
          <legend className="font-semibold">Thông tin giao hàng</legend>
          {([
            ["recipient_name", "Tên người nhận", 100, "name"],
            ["recipient_phone", "Số điện thoại", 64, "tel"],
            ["address_line", "Địa chỉ giao hàng đầy đủ", 500, "street-address"],
          ] as const).map(([field, label, limit, autoComplete]) => (
            <TextField
              key={field}
              label={label}
              required
              autoComplete={autoComplete}
              type={field === "recipient_phone" ? "tel" : "text"}
              value={draft.address[field]}
              error={errors[field]}
              onChange={(event) =>
                update({
                  ...draft,
                  address: { ...draft.address, [field]: event.target.value },
                })
              }
            />
          ))}
          <PaymentMethodSection
            value={draft.method}
            onChange={(method) => update({ ...draft, method })}
          />
        </fieldset>
        <section
          className="grid gap-3 rounded-lg bg-white p-5"
          aria-label="Giá hiện tại"
        >
          <h2 className="font-semibold">Giá hiện tại</h2>
          {prices?.items.map((item) => {
            return (
              <p key={item.variant_id}>
                {item.product_name} × {item.quantity} — {formatCurrency(item.unit_price_vnd)}/sản phẩm
              </p>
            )
          })}
          {prices ? (
            <p>
              Tổng tiền: {formatCurrency(prices.total_vnd)}
            </p>
          ) : (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPriceVersion((value) => value + 1)}
            >
              Tải lại giá hiện tại
            </Button>
          )}
        </section>
        {draft.submitted && (
          <p role="status">
            Đã gửi yêu cầu. Thử lại sẽ dùng nguyên thông tin và mã checkout để
            tránh tạo trùng đơn.
          </p>
        )}
        {draft.recoveryRequired && !draft.submitted && <p role="alert">Phiên nhập thông tin trước đã đóng và kết quả đặt hàng chưa rõ. Không tạo đơn mới. Hãy kiểm tra đơn đã lưu hoặc liên hệ hỗ trợ.</p>}
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">
            {error}
          </p>
        )}
        <Button
          type="submit"
          loading={busy}
          disabled={
            busy || !key || (draft.recoveryRequired && !draft.submitted) || (!prices?.items.length && !draft.submitted) || Boolean(draft.orderId)
          }
        >
          {draft.submitted ? "Thử lại đặt hàng" : "Đặt hàng"}
        </Button>
      </form>
      <Link to="/cart" className="underline">
        Quay lại giỏ hàng
      </Link>
    </main>
  )
}
