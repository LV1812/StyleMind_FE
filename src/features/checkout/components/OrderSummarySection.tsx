import { formatCurrency } from '@/shared/lib/formatCurrency'
import { Button, TextField } from '@/shared/ui'
import type { CartTotals } from '@/features/cart'

interface OrderSummarySectionProps {
  totals: CartTotals
  discountCode: string
  onDiscountCodeChange: (value: string) => void
  submitting: boolean
  disabled: boolean
  submitLabel: string
  onSubmit: () => void
}

export function OrderSummarySection({
  totals,
  discountCode,
  onDiscountCodeChange,
  submitting,
  disabled,
  submitLabel,
  onSubmit,
}: OrderSummarySectionProps) {
  return (
    <aside className="grid gap-5 rounded-lg bg-[#FDFCFA] p-5 shadow-[0_18px_36px_rgba(58,54,50,0.08)]">
      <h2 className="font-display text-2xl font-semibold text-[#222222]">Tổng thanh toán</h2>
      <TextField label="Mã giảm giá" value={discountCode} onChange={event => onDiscountCodeChange(event.target.value)} placeholder="STYLE10" />
      <dl className="grid gap-3 text-sm">
        <SummaryRow label="Tạm tính" value={formatCurrency(totals.subtotal)} />
        <SummaryRow label="Giảm giá" value={`-${formatCurrency(totals.discount)}`} />
        <SummaryRow label="Vận chuyển" value={totals.shipping === 0 ? 'Miễn phí' : formatCurrency(totals.shipping)} />
        <div className="mt-2 flex items-center justify-between border-t border-[#EEE8E1] pt-4">
          <dt className="font-bold text-[#222222]">Tổng cộng</dt>
          <dd className="text-xl font-bold text-[#684B5A]">{formatCurrency(totals.total)}</dd>
        </div>
      </dl>
      <Button loading={submitting} disabled={disabled} onClick={onSubmit}>
        {submitLabel}
      </Button>
    </aside>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="font-semibold text-[#6F6B67]">{label}</dt>
      <dd className="font-bold text-[#222222]">{value}</dd>
    </div>
  )
}
