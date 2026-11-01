import { formatCurrency } from '@/shared/lib/formatCurrency'
import type { CartLineDetail } from '@/features/cart'

interface OrderItemsSectionProps {
  details: CartLineDetail[]
}

export function OrderItemsSection({ details }: OrderItemsSectionProps) {
  return (
    <section className="grid gap-4 rounded-lg bg-[#FDFCFA] p-5 shadow-[0_14px_30px_rgba(58,54,50,0.08)]">
      <h2 className="font-display text-2xl font-semibold text-[#222222]">Sản phẩm</h2>
      <div className="grid gap-3">
        {details.map(detail => (
          <article key={detail.line.id} className="grid grid-cols-[72px_minmax(0,1fr)] gap-3">
            <div className="overflow-hidden rounded-lg bg-[#EEE8E1]">
              {detail.image && <img src={detail.image.url} alt={detail.image.alt} className="aspect-square w-full object-cover" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[#222222]">{detail.product.name}</h3>
              <p className="mt-1 text-xs font-semibold text-[#6F6B67]">
                {detail.variant.color} / {detail.variant.size} x {detail.quantity}
              </p>
              <p className="mt-2 text-sm font-bold text-[#684B5A]">{formatCurrency(detail.lineTotal)}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
