import { ArrowRight } from 'lucide-react'

import { formatCurrency } from '@/shared/lib/formatCurrency'
import { Button, TextField } from '@/shared/ui'

import type { CartTotals } from '../model/cartSelectors'

interface CartSummaryProps {
  totals: CartTotals
  discountCode: string
  onDiscountCodeChange: (value: string) => void
  onCheckout: () => void
}

export function CartSummary({ totals, discountCode, onDiscountCodeChange, onCheckout }: CartSummaryProps) {
  return (
    <aside className="grid gap-5 rounded-lg bg-[#FDFCFA] p-5 shadow-[0_18px_36px_rgba(58,54,50,0.08)]">
      <div>
        <h2 className="font-display text-2xl font-semibold text-[#222222]">Tóm tắt đơn hàng</h2>
        <p className="mt-1 text-sm font-semibold text-[#6F6B67]">{totals.itemCount} sản phẩm trong giỏ</p>
      </div>

      <TextField
        label="Mã giảm giá"
        value={discountCode}
        onChange={event => onDiscountCodeChange(event.target.value)}
        placeholder="STYLE10"
      />

      <dl className="grid gap-3 text-sm">
        <SummaryRow label="Tạm tính" value={formatCurrency(totals.subtotal)} />
        <SummaryRow label="Giảm giá" value={`-${formatCurrency(totals.discount)}`} muted={totals.discount === 0} />
        <SummaryRow label="Vận chuyển" value={totals.shipping === 0 ? 'Miễn phí' : formatCurrency(totals.shipping)} />
        <div className="mt-2 flex items-center justify-between border-t border-[#EEE8E1] pt-4">
          <dt className="text-base font-bold text-[#222222]">Tổng cộng</dt>
          <dd className="text-xl font-bold text-[#684B5A]">{formatCurrency(totals.total)}</dd>
        </div>
      </dl>

      <Button icon={<ArrowRight size={18} aria-hidden="true" />} onClick={onCheckout}>
        Tiến hành thanh toán
      </Button>
    </aside>
  )
}

function SummaryRow({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="font-semibold text-[#6F6B67]">{label}</dt>
      <dd className={`font-bold ${muted ? 'text-[#9D9894]' : 'text-[#222222]'}`}>{value}</dd>
    </div>
  )
}
