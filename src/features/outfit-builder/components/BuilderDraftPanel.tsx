import type { Product, ProductVariant } from '@/entities/product/model/types'
import { formatCurrency } from '@/shared/lib/formatCurrency'

import type { OutfitDraft, OutfitDraftErrors } from '../model/draftOutfit'

interface BuilderDraftPanelProps {
  draft: OutfitDraft
  products: Product[]
  errors: OutfitDraftErrors
  onNameChange: (value: string) => void
  onVariantChange: (itemId: string, variantId: string) => void
  onRemoveItem: (itemId: string) => void
  onSave: () => void
}

interface DraftItemDetail {
  id: string
  product: Product
  variant: ProductVariant
  activeVariants: ProductVariant[]
  price: number
}

function resolveDraftItems(draft: OutfitDraft, products: Product[]): DraftItemDetail[] {
  return draft.items.flatMap(item => {
    const product = products.find(candidate => candidate.id === item.productId && candidate.active)
    if (!product) return []

    const activeVariants = product.variants.filter(variant => variant.active)
    const variant = activeVariants.find(candidate => candidate.id === item.variantId)
    if (!variant) return []

    return [
      {
        id: item.id,
        product,
        variant,
        activeVariants,
        price: variant.priceOverride ?? product.basePrice,
      },
    ]
  })
}

export function BuilderDraftPanel({
  draft,
  products,
  errors,
  onNameChange,
  onVariantChange,
  onRemoveItem,
  onSave,
}: BuilderDraftPanelProps) {
  const items = resolveDraftItems(draft, products)
  const total = items.reduce((sum, item) => sum + item.price, 0)

  return (
    <section
      aria-label="Outfit đang tạo"
      className="grid h-fit gap-5 rounded-lg border border-[#E3DAD0] bg-white p-4 shadow-sm md:p-5"
    >
      <div>
        <h2 className="font-display text-2xl font-semibold text-[#222222]">Outfit đang tạo</h2>
        <p className="mt-2 text-sm leading-6 text-[#6F6B67]">
          Đặt tên, kiểm tra phiên bản từng món rồi lưu vào tủ đồ.
        </p>
      </div>

      <label className="grid gap-2 text-sm font-semibold text-[#3A3632]">
        Tên outfit
        <input
          value={draft.name}
          onChange={event => onNameChange(event.target.value)}
          className="min-h-11 rounded-lg border border-[#D8D0C6] bg-white px-3 text-sm font-medium text-[#222222] outline-none transition focus:border-[#684B5A] focus:ring-2 focus:ring-[#684B5A]/20"
          placeholder="Ví dụ: Outfit đi chơi"
        />
        {errors.name && <span className="text-xs font-medium text-[#A94B4B]">{errors.name}</span>}
      </label>

      <div className="grid gap-3">
        {items.length === 0 ? (
          <div className="rounded-lg bg-[#FAF8F5] px-4 py-6 text-sm font-medium text-[#6F6B67]">
            Chưa có món nào trong outfit
          </div>
        ) : (
          items.map(item => (
            <article key={item.id} className="rounded-lg bg-[#FAF8F5] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-[#222222]">{item.product.name}</h3>
                  <p className="mt-1 text-sm text-[#6F6B67]">
                    {item.variant.color} · {item.variant.size}
                  </p>
                </div>
                <span
                  className="h-6 w-6 flex-none rounded-full border border-[#D8D0C6]"
                  style={{ backgroundColor: item.variant.colorHex }}
                  aria-hidden="true"
                />
              </div>

              <label className="mt-4 grid gap-2 text-sm font-semibold text-[#3A3632]">
                Đổi phiên bản draft {item.product.name}
                <select
                  value={item.variant.id}
                  onChange={event => onVariantChange(item.id, event.target.value)}
                  className="min-h-10 rounded-lg border border-[#D8D0C6] bg-white px-3 text-sm font-semibold text-[#222222] outline-none focus:border-[#684B5A] focus:ring-2 focus:ring-[#684B5A]/20"
                >
                  {item.activeVariants.map(variant => (
                    <option key={variant.id} value={variant.id} aria-label={`${variant.color} ${variant.size}`}>
                      Size {variant.size}
                    </option>
                  ))}
                </select>
              </label>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-semibold text-[#222222]">{formatCurrency(item.price)}</span>
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#FCEAEA] px-3 text-sm font-semibold text-[#A94B4B] transition hover:bg-[#F7D8D8] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A94B4B]/30"
                  onClick={() => onRemoveItem(item.id)}
                >
                  Xóa {item.product.name} khỏi draft
                </button>
              </div>
            </article>
          ))
        )}
        {errors.items && <span className="text-xs font-medium text-[#A94B4B]">{errors.items}</span>}
      </div>

      <div className="rounded-lg bg-[#EEE8E1] p-4">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="font-medium text-[#6F6B67]">Tạm tính</span>
          <span className="font-semibold text-[#222222]">{formatCurrency(total)}</span>
        </div>
        <button
          type="button"
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#684B5A] px-4 text-sm font-semibold text-white transition hover:bg-[#563E4A] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A]/30"
          onClick={onSave}
        >
          Lưu outfit
        </button>
      </div>
    </section>
  )
}
