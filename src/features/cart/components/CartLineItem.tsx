import { Minus, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { formatCurrency } from '@/shared/lib/formatCurrency'

import type { CartLineDetail } from '../model/cartSelectors'

interface CartLineItemProps {
  detail: CartLineDetail
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
}

function productPath(productId: string) {
  return ROUTES.product.replace(':productId', productId)
}

export function CartLineItem({ detail, onQuantityChange, onRemove }: CartLineItemProps) {
  return (
    <article className="grid gap-4 rounded-lg bg-[#FDFCFA] p-4 shadow-[0_14px_30px_rgba(58,54,50,0.08)] sm:grid-cols-[108px_minmax(0,1fr)]">
      <Link to={productPath(detail.product.id)} className="overflow-hidden rounded-lg bg-[#EEE8E1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A]">
        {detail.image && <img src={detail.image.url} alt={detail.image.alt} className="aspect-square w-full object-cover" />}
      </Link>
      <div className="grid gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#9D9894]">{detail.product.brand}</p>
            <Link to={productPath(detail.product.id)} className="mt-1 block text-base font-bold text-[#222222] hover:text-[#684B5A]">
              {detail.product.name}
            </Link>
            <p className="mt-2 text-sm font-semibold text-[#6F6B67]">
              {detail.variant.color} / {detail.variant.size}
            </p>
          </div>
          <button
            type="button"
            aria-label={`Xóa ${detail.product.name}`}
            title={`Xóa ${detail.product.name}`}
            onClick={onRemove}
            className="inline-grid h-10 w-10 flex-none place-items-center rounded-lg text-[#A94B4B] transition hover:bg-[#FCEAEA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A94B4B]"
          >
            <Trash2 size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold text-[#684B5A]">{formatCurrency(detail.unitPrice)}</p>
          <div className="inline-flex items-center rounded-lg border border-[#D8D0C6] bg-white">
            <button
              type="button"
              aria-label={`Giảm số lượng ${detail.product.name}`}
              onClick={() => onQuantityChange(Math.max(1, detail.quantity - 1))}
              className="grid h-10 w-10 place-items-center text-[#3A3632] transition hover:bg-[#EEE8E1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A]"
            >
              <Minus size={15} aria-hidden="true" />
            </button>
            <output className="grid h-10 min-w-12 place-items-center border-x border-[#D8D0C6] px-3 text-sm font-bold text-[#222222]">
              {detail.quantity}
            </output>
            <button
              type="button"
              aria-label={`Tăng số lượng ${detail.product.name}`}
              onClick={() => onQuantityChange(detail.quantity + 1)}
              className="grid h-10 w-10 place-items-center text-[#3A3632] transition hover:bg-[#EEE8E1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A]"
            >
              <Plus size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
        <p className="text-right text-sm font-semibold text-[#3A3632]">Tạm tính {formatCurrency(detail.lineTotal)}</p>
      </div>
    </article>
  )
}
