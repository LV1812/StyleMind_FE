import { Link } from 'react-router-dom'

import type { DemoDatabase } from '@/app/store/types'
import type { OutfitRecommendation } from '@/entities/ai/model/types'
import { formatCurrency } from '@/shared/lib/formatCurrency'

interface AiRecommendationPanelProps {
  database: DemoDatabase
  recommendation?: OutfitRecommendation
  outfitName: string
  error?: string
  onNameChange: (value: string) => void
  onSave: () => void
}

export function AiRecommendationPanel({
  database,
  recommendation,
  outfitName,
  error,
  onNameChange,
  onSave,
}: AiRecommendationPanelProps) {
  if (!recommendation) {
    return (
      <section className="rounded-lg border border-dashed border-[#D8D0C6] bg-white p-5">
        <h2 className="font-display text-2xl font-semibold text-[#222222]">Gợi ý outfit</h2>
        <p className="mt-2 text-sm leading-6 text-[#6F6B67]">
          Gửi yêu cầu đầu tiên để AI chọn sản phẩm thật trong catalog StyleMind.
        </p>
      </section>
    )
  }

  return (
    <section
      aria-label="Gợi ý outfit từ AI"
      className="grid gap-5 rounded-lg border border-[#E3DAD0] bg-white p-5 shadow-sm"
    >
      <div>
        <h2 className="font-display text-2xl font-semibold text-[#222222]">Gợi ý outfit từ AI</h2>
        <p className="mt-2 text-sm leading-6 text-[#6F6B67]">{recommendation.explanation}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {recommendation.items.map(item => {
          const product = database.products.find(candidate => candidate.id === item.productId)
          const variant = product?.variants.find(candidate => candidate.id === item.variantId)
          const image = variant?.images.find(candidate => candidate.isPrimary) ?? variant?.images[0]
          if (!product || !variant) return null

          return (
            <Link
              key={item.id}
              to={`/products/${product.id}`}
              className="overflow-hidden rounded-lg border border-[#EEE8E1] bg-[#FFFDFC] transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A]"
            >
              {image && <img src={image.url} alt={image.alt} className="aspect-[4/5] w-full object-cover" />}
              <div className="p-4">
                <h3 className="font-semibold text-[#222222]">{product.name}</h3>
                <p className="mt-1 text-sm text-[#6F6B67]">
                  {variant.color} · {variant.size}
                </p>
                <p className="mt-3 text-sm leading-6 text-[#6F6B67]">{item.reason}</p>
                <p className="mt-3 font-semibold text-[#222222]">{formatCurrency(item.price)}</p>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="rounded-lg bg-[#FAF8F5] p-4">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="font-medium text-[#6F6B67]">Tổng gợi ý</span>
          <span className="font-semibold text-[#222222]">{formatCurrency(recommendation.total)}</span>
        </div>
        <label className="mt-4 grid gap-2 text-sm font-semibold text-[#3A3632]">
          Tên outfit AI
          <input
            value={outfitName}
            onChange={event => onNameChange(event.target.value)}
            aria-describedby={error ? 'ai-outfit-name-error' : undefined}
            className="min-h-11 rounded-lg border border-[#D8D0C6] bg-white px-3 text-sm font-medium text-[#222222] outline-none transition focus:border-[#684B5A] focus:ring-2 focus:ring-[#684B5A]/20"
            placeholder="Ví dụ: Outfit AI đi chơi"
          />
        </label>
        {error && (
          <p id="ai-outfit-name-error" className="mt-2 text-xs font-medium text-[#A94B4B]">
            {error}
          </p>
        )}
        <button
          type="button"
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#684B5A] px-4 text-sm font-semibold text-white transition hover:bg-[#563E4A] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A]/30"
          onClick={onSave}
        >
          Lưu outfit AI
        </button>
      </div>
    </section>
  )
}
