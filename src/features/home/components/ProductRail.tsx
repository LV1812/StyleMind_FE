import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import type { Product } from '@/entities/product/model/types'
import { formatCurrency } from '@/shared/lib/formatCurrency'
import { ProductCardImage } from '@/features/catalog/components/ProductCardImage'

interface ProductRailProps {
  title: string
  products: Product[]
}

function productPath(productId: string) {
  return ROUTES.product.replace(':productId', productId)
}

function getPrimaryImage(product: Product) {
  const activeVariants = product.variants.filter(variant => variant.active)
  return activeVariants.flatMap(variant => variant.images).find(image => image.isPrimary) ?? activeVariants[0]?.images[0]
}

export function ProductRail({ title, products }: ProductRailProps) {
  return (
    <section className="bg-[#F7F4F1] px-5 py-12 md:px-8">
      <div className="mx-auto max-w-[var(--container-wide)]">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-semibold text-[#222222]">{title}</h2>
          <Link to={ROUTES.shop} className="text-sm font-semibold text-[#805B41] transition-colors hover:text-[#503A2B] hover:underline">
            Xem tất cả
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(0, 4).map(product => {
            const primaryImage = getPrimaryImage(product)
            const colors = Array.from(new Set(product.variants.filter(variant => variant.active).map(variant => variant.color)))
            return (
              <article key={product.id} className="overflow-hidden rounded-[24px] bg-[#FFFFFF] shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
                <Link to={productPath(product.id)} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1B1B]">
                  <ProductCardImage src={primaryImage?.url} alt={primaryImage?.alt ?? product.name} />
                  <div className="p-4">
                    <p className="text-xs font-semibold text-[#5E5F5D]">{product.brand}</p>
                    <h3 className="mt-1 text-base font-semibold text-[#222222]">{product.name}</h3>
                    <p className="mt-2 text-sm font-semibold text-[#1C1B1B]">{formatCurrency(product.basePrice)}</p>
                    <p className="mt-2 text-xs text-[#5E5F5D]">{colors.join(' · ')}</p>
                  </div>
                </Link>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
