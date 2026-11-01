import type { PaymentMethod } from '@/entities/order/model/types'

interface PaymentMethodSectionProps {
  value: PaymentMethod
  onChange: (method: PaymentMethod) => void
}

export function PaymentMethodSection({ value, onChange }: PaymentMethodSectionProps) {
  return (
    <section className="grid gap-4 rounded-lg bg-[#FDFCFA] p-5 shadow-[0_14px_30px_rgba(58,54,50,0.08)]">
      <h2 className="font-display text-2xl font-semibold text-[#222222]">Phương thức thanh toán</h2>
      <div className="grid gap-3">
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#D8D0C6] bg-white p-4 text-sm font-semibold text-[#3A3632] transition hover:border-[#8B6475]">
          <input
            type="radio"
            name="payment-method"
            aria-label="Thanh toán khi nhận hàng"
            checked={value === 'cod'}
            onChange={() => onChange('cod')}
            className="mt-1 h-4 w-4 accent-[#684B5A]"
          />
          <span>
            <span className="block text-[#222222]">Thanh toán khi nhận hàng</span>
            <span className="mt-1 block text-xs text-[#6F6B67]">Thanh toán bằng tiền mặt khi đơn được giao tới bạn.</span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#D8D0C6] bg-white p-4 text-sm font-semibold text-[#3A3632] transition hover:border-[#8B6475]">
          <input
            type="radio"
            name="payment-method"
            aria-label="VietQR"
            checked={value === 'vietqr'}
            onChange={() => onChange('vietqr')}
            className="mt-1 h-4 w-4 accent-[#684B5A]"
          />
          <span>
            <span className="block text-[#222222]">VietQR</span>
            <span className="mt-1 block text-xs text-[#6F6B67]">Quét mã QR và xác minh thanh toán trong ứng dụng.</span>
          </span>
        </label>
      </div>
    </section>
  )
}
