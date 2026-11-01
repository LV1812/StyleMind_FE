import type { OrderTimelineItem } from '@/entities/order/model/types'
import { formatDate } from '@/shared/lib/formatDate'

export function OrderTimeline({ items }: { items: OrderTimelineItem[] }) {
  return (
    <section className="rounded-lg border border-[#E3DAD0] bg-white p-5 shadow-sm">
      <h2 className="font-display text-xl font-semibold text-[#222222]">Lịch sử trạng thái</h2>
      <ol className="mt-5 grid gap-4">
        {items.map(item => (
          <li key={item.id} className="grid grid-cols-[12px_minmax(0,1fr)] gap-3">
            <span className="mt-1 h-3 w-3 rounded-full bg-[#684B5A]" />
            <span>
              <span className="block text-sm font-semibold text-[#222222]">{item.label}</span>
              <span className="mt-1 block text-xs font-semibold text-[#8A8179]">{formatDate(item.at)}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
