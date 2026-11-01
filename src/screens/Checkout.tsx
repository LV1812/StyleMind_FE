import { useState, useEffect } from 'react'
import type { AppState } from '../types'
import Money from '../components/ui/Money'
import Button from '../components/ui/Button'
import { formatVND } from '../data/mockData'
import { commerceApi } from '../api/commerce'
import type { OrderResponse, PaymentAttempt } from '../api/commerce.types'
import { CommerceApiError } from '../api/http'

type CheckoutStep = 'address' | 'payment' | 'transfer' | 'confirmed'

interface Props {
  onNavigate: (screen: string, opts?: any) => void
  app?: AppState
}

export default function Checkout({ onNavigate, app }: Props) {
  const [step, setStep] = useState<CheckoutStep>('address')
  const [payMethod, setPayMethod] = useState<'qr' | 'cod'>('qr')
  const [qrStatus, setQrStatus] = useState<'waiting' | 'received' | 'expired'>('waiting')
  const [countdown, setCountdown] = useState(600) // 10 minutes
  const [shippingAddressId, setShippingAddressId] = useState(
    () => window.localStorage.getItem('stylemind_default_shipping_address_id') || '',
  )
  const [createdOrder, setCreatedOrder] = useState<OrderResponse | null>(null)
  const [paymentAttempt, setPaymentAttempt] = useState<PaymentAttempt | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const items = app?.cartItems || []
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0) || 2540000
  const shipping = subtotal >= 2000000 ? 0 : 30000
  const total = subtotal + shipping

  useEffect(() => {
    if (step !== 'transfer' || qrStatus !== 'waiting') return

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setQrStatus('expired')
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    const poll = createdOrder
      ? setInterval(() => {
          void commerceApi.orders.get(createdOrder.order_id).then(order => {
            if (order.order_status === 'PAID') {
              setCreatedOrder(order)
              setQrStatus('received')
              setStep('confirmed')
              if (app?.setCartCount) app.setCartCount(0)
            }
          }).catch(() => undefined)
        }, 3000)
      : undefined

    return () => {
      clearInterval(timer)
      if (poll) clearInterval(poll)
    }
  }, [step, qrStatus, createdOrder?.order_id])

  const placeOrder = async () => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(shippingAddressId)) {
      setCheckoutError('Vui lòng chọn hoặc nhập mã UUID của địa chỉ giao hàng đã lưu.')
      return
    }
    setSubmitting(true)
    setCheckoutError(null)
    try {
      window.localStorage.setItem('stylemind_default_shipping_address_id', shippingAddressId)
      const order = await commerceApi.orders.checkout({
        checkout_key: `web-${window.crypto.randomUUID()}`,
        shipping_address_id: shippingAddressId,
        payment_method: payMethod === 'cod' ? 'COD' : 'SEPAY_VIETQR',
      })
      setCreatedOrder(order)
      if (payMethod === 'cod') {
        setStep('confirmed')
        if (app?.setCartCount) app.setCartCount(0)
      } else {
        setStep('transfer')
      }
    } catch (requestError) {
      setCheckoutError(
        requestError instanceof CommerceApiError ? requestError.message : 'Không thể tạo đơn hàng.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const recoverPayment = async () => {
    if (!createdOrder) return
    setSubmitting(true)
    setCheckoutError(null)
    try {
      setPaymentAttempt(await commerceApi.orders.recoverPayment(createdOrder.order_id))
      setCountdown(600)
      setQrStatus('waiting')
    } catch (requestError) {
      setCheckoutError(
        requestError instanceof CommerceApiError
          ? requestError.message
          : 'Không thể tạo lại thông tin thanh toán.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const mins = Math.floor(countdown / 60)
  const secs = countdown % 60

  const stepsList: { key: CheckoutStep; label: string }[] = [
    { key: 'address', label: "1. Giao hàng" },
    { key: 'payment', label: "2. Thanh toán" },
    { key: 'transfer', label: "3. Xác nhận" },
    { key: 'confirmed', label: "4. Hoàn tất" },
  ]

  return (
    <div style={{ background: "var(--color-ivory)", minHeight: '100vh' }}>
      {/* Checkout Steps Progress */}
      <div className="px-6 md:px-16 pt-10 pb-6 border-b border-sand">
        <h1 className="font-display text-3xl sm:text-4xl font-light text-charcoal mb-6">
          Thanh toán
        </h1>

        <div className="flex items-center gap-2 max-w-xl" role="navigation" aria-label="Tiến trình thanh toán">
          {stepsList.map((s, i) => {
            const stepOrder: CheckoutStep[] = ['address', 'payment', 'transfer', 'confirmed']
            const currentIdx = stepOrder.indexOf(step)
            const isCompleted = i < currentIdx
            const isActive = s.key === step

            return (
              <div key={s.key} className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted
                        ? 'bg-success text-on-accent'
                        : isActive
                        ? 'bg-accent text-on-accent'
                        : 'bg-sand text-muted'
                    }`}
                  >
                    {isCompleted ? '✓' : i + 1}
                  </span>
                  <span
                    className={`text-xs hidden sm:inline font-medium ${
                      isActive ? 'text-accent font-semibold' : 'text-secondary'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < stepsList.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 ${
                      i < currentIdx ? 'bg-success' : 'bg-sand'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="px-6 md:px-16 py-8 pb-24 max-w-5xl">
        {checkoutError && step !== 'payment' && (
          <div className="mb-5 p-3 rounded-xl bg-error-bg text-error text-xs" role="alert">{checkoutError}</div>
        )}
        {/* STEP 1: Shipping Address */}
        {step === 'address' && (
          <div className="grid md:grid-cols-[1fr_360px] gap-8 items-start">
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-surface border border-sand shadow-2xs space-y-4">
                <h2 className="font-display text-xl font-light text-charcoal">
                  Địa chỉ nhận hàng
                </h2>
                <div className="p-4 rounded-2xl bg-ivory border border-accent relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-charcoal">Nguyễn Thị Lan</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-success-bg text-success">
                      Mặc định
                    </span>
                  </div>
                  <p className="text-xs text-secondary leading-relaxed">
                    47 Đường Trần Thái Tông, Phường Dịch Vọng Hậu, Quận Cầu Giấy, TP. Hà Nội
                  </p>
                  <p className="text-xs text-secondary mt-1">Điện thoại: 0901 234 567</p>
                </div>
                <div>
                  <label htmlFor="shipping-address-id" className="text-xs font-semibold text-secondary block mb-1.5">
                    Mã địa chỉ đã lưu
                  </label>
                  <input
                    id="shipping-address-id"
                    value={shippingAddressId}
                    onChange={event => setShippingAddressId(event.target.value.trim())}
                    placeholder="UUID địa chỉ từ hồ sơ của bạn"
                    className="w-full px-3 py-2.5 rounded-xl border border-sand-dark bg-surface text-xs text-charcoal outline-none focus:border-accent"
                  />
                  <p className="text-[11px] text-muted mt-1">
                    Commerce sẽ xác minh địa chỉ này với Identity trước khi tạo đơn.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => onNavigate('cart')}
                >
                  ← Về giỏ hàng
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1"
                  onClick={() => {
                    setCheckoutError(null)
                    if (shippingAddressId) setStep('payment')
                    else setCheckoutError('Vui lòng nhập mã địa chỉ giao hàng đã lưu.')
                  }}
                >
                  Chọn phương thức thanh toán →
                </Button>
              </div>
            </div>

            {/* Mini Summary */}
            <div className="p-6 rounded-3xl bg-surface border border-sand space-y-4">
              <h3 className="text-sm font-semibold text-charcoal uppercase tracking-wider">
                Thông tin đơn hàng
              </h3>
              <div className="space-y-2 text-xs text-secondary pt-2 border-t border-sand">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <Money amount={subtotal} className="text-charcoal" />
                </div>
                <div className="flex justify-between">
                  <span>Phí vận chuyển</span>
                  <span>{shipping === 0 ? "Miễn phí" : formatVND(shipping)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-charcoal pt-2 border-t border-sand">
                  <span>Tổng cộng</span>
                  <Money amount={total} className="text-accent" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Payment Method */}
        {step === 'payment' && (
          <div className="grid md:grid-cols-[1fr_360px] gap-8 items-start">
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-surface border border-sand shadow-2xs space-y-4">
                <h2 className="font-display text-xl font-light text-charcoal">
                  Chọn phương thức thanh toán
                </h2>

                <div
                  onClick={() => setPayMethod('qr')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    payMethod === 'qr'
                      ? 'border-accent bg-blush/40 ring-1 ring-accent'
                      : 'border-sand bg-surface hover:bg-ivory'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📱</span>
                    <div>
                      <p className="text-sm font-semibold text-charcoal">
                        Chuyển khoản qua mã VietQR
                      </p>
                      <p className="text-xs text-secondary">
                        Quét mã bằng ứng dụng ngân hàng của bạn. SePay sẽ tự động xác nhận khi nhận được tiền.
                      </p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    checked={payMethod === 'qr'}
                    onChange={() => setPayMethod('qr')}
                    aria-label="Chuyển khoản qua mã VietQR"
                  />
                </div>

                <div
                  onClick={() => setPayMethod('cod')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    payMethod === 'cod'
                      ? 'border-accent bg-blush/40 ring-1 ring-accent'
                      : 'border-sand bg-surface hover:bg-ivory'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📦</span>
                    <div>
                      <p className="text-sm font-semibold text-charcoal">
                        Thanh toán khi nhận hàng (COD)
                      </p>
                      <p className="text-xs text-secondary">
                        Thanh toán tiền mặt khi nhận hàng. Được kiểm tra hàng trước khi nhận.
                      </p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    checked={payMethod === 'cod'}
                    onChange={() => setPayMethod('cod')}
                    aria-label="Thanh toán khi nhận hàng"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setStep('address')}
                >
                  ← Quay lại
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1"
                  onClick={() => void placeOrder()}
                  disabled={submitting}
                >
                  {submitting ? 'Đang tạo đơn...' : payMethod === 'qr' ? "Tạo đơn VietQR →" : "Xác nhận đặt hàng (COD) →"}
                </Button>
                {checkoutError && <p className="text-xs text-error" role="alert">{checkoutError}</p>}
              </div>
            </div>

            {/* Mini Summary */}
            <div className="p-6 rounded-3xl bg-surface border border-sand space-y-4">
              <h3 className="text-sm font-semibold text-charcoal uppercase tracking-wider">
                Thông tin đơn hàng
              </h3>
              <div className="space-y-2 text-xs text-secondary pt-2 border-t border-sand">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <Money amount={subtotal} className="text-charcoal" />
                </div>
                <div className="flex justify-between">
                  <span>Phí vận chuyển</span>
                  <span>{shipping === 0 ? "Miễn phí" : formatVND(shipping)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-charcoal pt-2 border-t border-sand">
                  <span>Tổng cộng</span>
                  <Money amount={total} className="text-accent" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: VietQR Payment Step (Product Principle 77: No 'I already paid' button!) */}
        {step === 'transfer' && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="p-8 rounded-3xl bg-surface border border-sand shadow-md text-center">
              <span className="text-xs uppercase tracking-widest font-bold text-rose block mb-1">
                Chuyển khoản qua mã VietQR
              </span>
              <h2 className="font-display text-2xl font-light text-charcoal mb-1">
                Quét mã bằng ứng dụng ngân hàng
              </h2>
              <p className="text-xs text-secondary mb-6">
                Quét mã và chuyển đúng số tiền, nội dung hiển thị bên dưới. Giữ trang này mở để nhận kết quả thanh toán.
              </p>

              {/* Realistic QR Code Graphic */}
              <div className="w-56 h-56 mx-auto mb-6 p-4 rounded-3xl bg-ivory border-2 border-accent/20 flex flex-col items-center justify-center relative shadow-inner">
                {qrStatus === 'waiting' && (
                  <div className="grid grid-cols-5 gap-2 w-full h-full p-2">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div
                        key={i}
                        className="rounded-sm"
                        style={{
                          backgroundColor:
                            i % 2 === 0 || i % 7 === 0 || i === 12 ? "var(--color-charcoal)" : "var(--color-sand)",
                        }}
                      />
                    ))}
                  </div>
                )}
                {qrStatus === 'received' && (
                  <div className="flex flex-col items-center justify-center gap-2 fade-in">
                    <span className="w-14 h-14 rounded-full bg-success text-on-accent flex items-center justify-center text-2xl font-bold">
                      ✓
                    </span>
                    <span className="text-xs font-bold text-success">Đã xác nhận thanh toán</span>
                  </div>
                )}
              </div>

              {/* Total Amount & Reference */}
              <div className="mb-6">
                <Money amount={createdOrder?.accepted_total_vnd || total} className="text-3xl font-bold text-accent" />
                <p className="text-xs text-muted mt-1">Số tiền cần chuyển</p>
              </div>

              {/* Transfer Details Matrix */}
              <div className="p-4 rounded-2xl bg-ivory border border-sand space-y-2.5 text-xs text-left mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-secondary">Ngân hàng thụ hưởng</span>
                  <strong className="text-charcoal">MB Bank (Ngân hàng Quân Đội)</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-secondary">Số tài khoản</span>
                  <strong className="text-charcoal font-mono text-sm">0389 2049 1928</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-secondary">Chủ tài khoản</span>
                  <strong className="text-charcoal">STYLEMIND VIETNAM CO.</strong>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-sand">
                  <span className="text-secondary">Nội dung chuyển khoản</span>
                  <strong className="text-accent font-mono text-sm">
                    {paymentAttempt?.transferContent || paymentAttempt?.reference || createdOrder?.order_number}
                  </strong>
                </div>
                {paymentAttempt?.qrPayload && (
                  <div className="pt-2 border-t border-sand break-all">
                    <span className="text-secondary block mb-1">Dữ liệu VietQR</span>
                    <code className="text-[10px] text-charcoal">{paymentAttempt.qrPayload}</code>
                  </div>
                )}
              </div>

              {/* Live Status Signal (Principle 77: strictly system-reported) */}
              {qrStatus === 'waiting' && (
                <div className="p-4 rounded-2xl bg-warning-bg border border-warning/30 flex items-center justify-center gap-3">
                  <span className="w-4 h-4 border-2 border-warning border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-semibold text-warning">
                    Đang chờ thanh toán · Mã QR hết hạn sau {mins}:{secs < 10 ? `0${secs}` : secs}
                  </span>
                </div>
              )}

              {qrStatus === 'received' && (
                <div className="p-4 rounded-2xl bg-success-bg border border-success/30 flex items-center justify-center gap-2">
                  <span className="text-success font-bold">✓</span>
                  <span className="text-xs font-semibold text-success">
                    Đã nhận được thanh toán. Đang hoàn tất đơn hàng...
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-center">
              {!paymentAttempt && createdOrder && (
                <button
                  type="button"
                  onClick={() => void recoverPayment()}
                  disabled={submitting}
                  className="text-xs text-accent hover:underline mr-5 disabled:opacity-50"
                >
                  {submitting ? 'Đang tạo...' : 'Tạo lại thông tin thanh toán'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setStep('payment')}
                className="text-xs text-secondary hover:text-charcoal underline"
              >
                Hủy và chọn phương thức thanh toán khác
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Order Confirmed */}
        {step === 'confirmed' && (
          <div className="max-w-lg mx-auto text-center p-8 rounded-3xl bg-surface border border-sand shadow-lg space-y-6 fade-in">
            <div className="w-16 h-16 rounded-full bg-success-bg text-success flex items-center justify-center text-2xl font-bold mx-auto">
              ✓
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest font-semibold text-rose">
                Đặt hàng thành công
              </span>
              <h2 className="font-display text-3xl font-light text-charcoal mt-1 mb-2">
                Cảm ơn Lan!
              </h2>
              <p className="text-xs sm:text-sm text-secondary leading-relaxed">
                Đơn hàng <strong>#{createdOrder?.order_number}</strong> đã được tạo thành công. Bạn có thể theo dõi trạng thái trong mục đơn hàng.
              </p>
            </div>

            {/* Timeline preview */}
            <div className="p-4 rounded-2xl bg-ivory border border-sand text-xs text-left space-y-2">
              <div className="flex justify-between font-semibold text-success">
                <span>Trạng thái</span>
                <span>Đã xác nhận và đang xử lý</span>
              </div>
              <div className="flex justify-between text-secondary">
                <span>Dự kiến giao</span>
                <span>22/09/2026</span>
              </div>
              <div className="flex justify-between text-secondary">
                <span>Đơn vị vận chuyển</span>
                <span>Giao Hàng Nhanh (GHN)</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Button
                variant="primary"
                fullWidth
                size="md"
                onClick={() => onNavigate('orders')}
              >
                Theo dõi đơn hàng
              </Button>
              <Button
                variant="outline"
                fullWidth
                size="md"
                onClick={() => onNavigate('home')}
              >
                Về trang chủ
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
