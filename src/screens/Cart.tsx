import React from 'react'
import type { AppState } from '../types'
import Money from '../components/ui/Money'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'

interface Props {
  onNavigate: (screen: string, opts?: any) => void
  cartCount?: number
  setCartCount?: (n: number | ((prev: number) => number)) => void
  app?: AppState
}

export default function Cart({ onNavigate, app }: Props) {
  const items = app?.cartItems || []
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0)
  const shipping = subtotal >= 2000000 || subtotal === 0 ? 0 : 30000
  const total = subtotal + shipping

  if (items.length === 0) {
    return (
      <div style={{ background: "var(--color-ivory)", minHeight: '100vh' }}>
        <EmptyState
          icon="🛍"
          title="Giỏ hàng của bạn đang trống"
          description="StyleMind gợi ý những món giúp hoàn thiện trang phục từ đồ bạn đã có. Hãy hỏi trợ lý AI hoặc khám phá bộ sưu tập để tìm món đồ phù hợp tiếp theo."
          primaryAction={{
            label: "✦ Hỏi trợ lý StyleMind",
            onClick: () => onNavigate('ai-stylist'),
          }}
          secondaryAction={{
            label: "Khám phá bộ sưu tập",
            onClick: () => onNavigate('shop'),
          }}
        />
      </div>
    )
  }

  return (
    <div style={{ background: "var(--color-ivory)", minHeight: '100vh' }}>
      <div className="px-6 md:px-16 pt-10 pb-6">
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-light text-charcoal mb-1">
          Giỏ hàng
        </h1>
        <p className="text-sm text-secondary">
          {items.reduce((sum, i) => sum + i.qty, 0)} món bạn đã chọn
        </p>
      </div>

      <div className="px-6 md:px-16 pb-24 grid lg:grid-cols-[1fr_380px] gap-10 items-start">
        {/* Cart Items List */}
        <div className="space-y-4">
          {/* AI Outfit Synergy Banner */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-blush border border-accent/20">
            <span className="text-accent text-base" aria-hidden="true">✦</span>
            <div className="flex-1">
              <p className="text-xs sm:text-sm text-accent">
                Bạn đã chọn các món này từ gợi ý <strong>Bộ đồ du lịch Đà Lạt</strong>.
              </p>
            </div>
            <button
              onClick={() => onNavigate('outfit-result')}
              className="text-xs font-semibold text-accent underline hover:opacity-80 flex-none"
            >
              Xem trang phục →
            </button>
          </div>

          {items.map(item => (
            <div
              key={item.id}
              className="p-4 sm:p-5 rounded-3xl bg-surface border border-sand shadow-2xs flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
            >
              <div className="flex gap-4 items-center">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-24 sm:w-24 sm:h-28 rounded-2xl object-cover bg-sand border border-sand flex-none"
                />
                <div>
                  {item.aiRec && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blush text-accent mb-1 inline-block">
                      ✦ {item.aiRec}
                    </span>
                  )}
                  <p className="text-xs font-semibold uppercase tracking-wider text-rose">
                    {item.brand}
                  </p>
                  <h3 className="font-sans text-sm sm:text-base font-medium text-charcoal mb-1">
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-secondary mb-2">
                    <span>Cỡ: <strong className="text-charcoal">{item.size}</strong></span>
                    <span>Màu: <strong className="text-charcoal">{item.color}</strong></span>
                  </div>
                  <Money amount={item.price} className="text-sm font-semibold text-charcoal" />
                </div>
              </div>

              {/* Quantity controls & Remove */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4 pt-3 sm:pt-0 border-t sm:border-0 border-sand">
                <div className="flex items-center border border-sand-dark rounded-full overflow-hidden bg-ivory">
                  <button
                    type="button"
                    onClick={() => app?.updateCartQty(item.id, -1)}
                    aria-label={`Giảm số lượng ${item.name}`}
                    className="w-8 h-8 flex items-center justify-center text-sm text-secondary hover:bg-sand transition-colors"
                  >
                    –
                  </button>
                  <span className="w-8 text-center text-xs font-semibold text-charcoal" aria-label={`Số lượng: ${item.qty}`}>
                    {item.qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => app?.updateCartQty(item.id, 1)}
                    aria-label={`Tăng số lượng ${item.name}`}
                    className="w-8 h-8 flex items-center justify-center text-sm text-secondary hover:bg-sand transition-colors"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => app?.removeFromCart(item.id)}
                  aria-label={`Xóa ${item.name} khỏi giỏ hàng`}
                  className="text-xs text-muted hover:text-error underline"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Sidebar */}
        <aside className="p-6 md:p-8 rounded-3xl bg-surface border border-sand shadow-xs space-y-6 sticky top-24">
          <div>
            <h2 className="font-display text-2xl font-light text-charcoal mb-1">
              Tóm tắt đơn hàng
            </h2>
            <p className="text-xs text-secondary">Kiểm tra sản phẩm, kích cỡ và số lượng trước khi thanh toán.</p>
          </div>

          <div className="space-y-3 pt-4 border-t border-sand text-sm">
            <div className="flex justify-between text-secondary">
              <span>Tạm tính</span>
              <Money amount={subtotal} className="text-charcoal font-semibold" />
            </div>
            <div className="flex justify-between text-secondary">
              <span>Giao hàng tiêu chuẩn (Việt Nam)</span>
              <span>{shipping === 0 ? <span className="text-success font-semibold">Miễn phí</span> : <Money amount={shipping} />}</span>
            </div>
            {subtotal < 2000000 && (
              <p className="text-[11px] text-warning bg-warning-bg p-2 rounded-lg">
                Mua thêm <Money amount={2000000 - subtotal} /> nữa để được miễn phí vận chuyển.
              </p>
            )}
            <div className="flex justify-between text-base font-semibold text-charcoal pt-3 border-t border-sand">
              <span>Tổng cộng</span>
              <Money amount={total} className="text-xl text-accent" />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              variant="primary"
              fullWidth
              size="lg"
              onClick={() => onNavigate('checkout')}
              icon={<span>💳</span>}
            >
              Tiến hành thanh toán
            </Button>
            <Button
              variant="outline"
              fullWidth
              size="md"
              onClick={() => onNavigate('shop')}
            >
              Tiếp tục mua sắm
            </Button>
          </div>
        </aside>
      </div>
    </div>
  )
}
