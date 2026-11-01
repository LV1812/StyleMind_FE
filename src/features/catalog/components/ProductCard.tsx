import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import type { Product } from '@/entities/product/model/types'
import { formatCurrency } from '@/shared/lib/formatCurrency'

interface ProductCardProps {
  product: Product
}

function productPath(productId: string) {
  return ROUTES.product.replace(':productId', productId)
}

function getPrimaryImage(product: Product) {
  return product.variants.flatMap(variant => variant.images).find(image => image.isPrimary) ?? product.variants[0]?.images[0]
}

export function ProductCard({ product }: ProductCardProps) {
  const image = getPrimaryImage(product)
  const colors = Array.from(new Map(product.variants.map(variant => [variant.color, variant.colorHex])).entries())

  return (
    <article className="min-w-0 overflow-hidden rounded-lg bg-[#FDFCFA] shadow-[0_16px_34px_rgba(58,54,50,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(58,54,50,0.12)]">
      <Link to={productPath(product.id)} className="block min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A]">
        <div className="overflow-hidden bg-[#EEE8E1]">
          <img src={image?.url} alt={image?.alt ?? product.name} className="block aspect-[4/5] w-full min-w-0 object-cover" />
        </div>
        <div className="p-4">
          <p className="text-xs font-semibold text-[#9D9894]">{product.brand}</p>
          <h2 className="mt-1 break-words text-base font-semibold text-[#222222]">{product.name}</h2>
          <p className="mt-2 text-sm font-semibold text-[#684B5A]">{formatCurrency(product.basePrice)}</p>
          <div className="mt-3 flex gap-1.5" aria-label={`Màu của ${product.name}`}>
            {colors.slice(0, 5).map(([color, hex]) => (
              <span key={color} title={color} className="h-4 w-4 rounded-full border border-[#D8D0C6]" style={{ backgroundColor: hex }} />
            ))}
          </div>
        </div>
      </Link>
    </article>
  )
}
