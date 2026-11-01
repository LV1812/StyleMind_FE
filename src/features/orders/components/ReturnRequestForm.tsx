import { useState } from 'react'

import type { OrderItemSnapshot } from '@/entities/order/model/types'

interface ReturnRequestFormProps {
  items: OrderItemSnapshot[]
  submitted: boolean
  onSubmit: (reason: string, selectedVariantIds: string[]) => void
}

export function ReturnRequestForm({ items, submitted, onSubmit }: ReturnRequestFormProps) {
  const [reason, setReason] = useState('')
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([])

  if (submitted) {
    return (
      <section className="rounded-lg border border-[#E3DAD0] bg-white p-5 shadow-sm">
        <h2 className="font-display text-xl font-semibold text-[#222222]">Yêu cầu trả hàng</h2>
        <p className="mt-3 text-sm font-semibold text-[#2F7D4E]">Đã gửi yêu cầu trả hàng</p>
      </section>
    )
  }

  const toggleVariant = (variantId: string) => {
    setSelectedVariantIds(current =>
      current.includes(variantId) ? current.filter(item => item !== variantId) : [...current, variantId],
    )
  }

  return (
    <section className="rounded-lg border border-[#E3DAD0] bg-white p-5 shadow-sm">
      <h2 className="font-display text-xl font-semibold text-[#222222]">Yêu cầu trả hàng</h2>
      <div className="mt-4 grid gap-2">
        {items.map(item => (
          <label key={item.variantId} className="flex items-center gap-3 rounded-lg bg-[#FAF8F5] p-3 text-sm font-semibold text-[#3A3632]">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#684B5A]"
              checked={selectedVariantIds.includes(item.variantId)}
              onChange={() => toggleVariant(item.variantId)}
            />
            {item.name} · {item.color} · {item.size}
          </label>
        ))}
      </div>
      <label className="mt-4 grid gap-2 text-sm font-semibold text-[#3A3632]">
        Lý do trả hàng
        <textarea
          value={reason}
          onChange={event => setReason(event.target.value)}
          className="min-h-24 rounded-lg border border-[#D8D0C6] bg-white px-3 py-2 text-sm font-medium text-[#222222] outline-none focus:border-[#684B5A] focus:ring-2 focus:ring-[#684B5A]/20"
        />
      </label>
      <button
        type="button"
        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#684B5A] px-4 text-sm font-semibold text-white disabled:opacity-60"
        disabled={!reason.trim() || selectedVariantIds.length === 0}
        onClick={() => onSubmit(reason.trim(), selectedVariantIds)}
      >
        Gửi yêu cầu trả hàng
      </button>
    </section>
  )
}
