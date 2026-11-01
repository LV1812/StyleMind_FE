import { Link } from 'react-router-dom'

import type { DemoDatabase } from '@/app/store/types'
import type { OutfitItemDetail } from '@/features/wardrobe/model/outfitSelectors'
import { formatCurrency } from '@/shared/lib/formatCurrency'

interface OutfitItemCardProps {
  database: DemoDatabase
  item: OutfitItemDetail
  onVariantChange: (itemId: string, variantId: string) => void
  onRemove: (itemId: string) => void
  onAddToCart: (item: OutfitItemDetail) => void
}

export function OutfitItemCard({ database, item, onVariantChange, onRemove, onAddToCart }: OutfitItemCardProps) {
  const activeVariants = database.products
    .find(product => product.id === item.product.id)
    ?.variants.filter(variant => variant.active) ?? []

  return (
    <article className="overflow-hidden rounded-lg border border-[#E3DAD0] bg-white shadow-sm">
      <Link to={`/products/${item.product.id}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A]">
        {item.image && <img src={item.image.url} alt={item.image.alt} className="aspect-[4/5] w-full object-cover" />}
        <div className="p-4">
          <h2 className="font-semibold text-[#222222]">{item.product.name}</h2>
          <p className="mt-1 text-sm text-[#6F6B67]">
            {item.variant.color} · {item.variant.size}
          </p>
          <p className="mt-3 font-semibold text-[#222222]">{formatCurrency(item.price)}</p>
        </div>
      </Link>
      <div className="grid gap-3 border-t border-[#EEE8E1] p-4">
        <label className="grid gap-2 text-sm font-semibold text-[#3A3632]">
          Đổi phiên bản {item.product.name}
          <select
            value={item.variant.id}
            onChange={event => onVariantChange(item.item.id, event.target.value)}
            className="min-h-10 rounded-lg border border-[#D8D0C6] bg-white px-3 text-sm font-semibold text-[#222222] outline-none focus:border-[#684B5A] focus:ring-2 focus:ring-[#684B5A]/20"
          >
            {activeVariants.map(variant => (
              <option key={variant.id} value={variant.id}>
                {variant.color} · {variant.size}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#684B5A] px-3 text-sm font-semibold text-white"
            onClick={() => onAddToCart(item)}
          >
            Thêm {item.product.name} vào giỏ
          </button>
          <button
            type="button"
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#FCEAEA] px-3 text-sm font-semibold text-[#A94B4B]"
            onClick={() => onRemove(item.item.id)}
          >
            Xóa món {item.product.name}
          </button>
        </div>
      </div>
    </article>
  )
}
