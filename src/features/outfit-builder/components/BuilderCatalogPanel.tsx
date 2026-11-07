import type { Product, ProductVariant } from '@/entities/product/model/types'
import { formatCurrency } from '@/shared/lib/formatCurrency'
import { Plus, Shirt } from 'lucide-react'

interface BuilderCatalogPanelProps {
  products: Product[]
  search: string
  onSearchChange: (value: string) => void
  onAddVariant: (productId: string, variantId: string) => void
}

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function getActiveVariants(product: Product) {
  return product.variants.filter(variant => variant.active)
}

function getDefaultVariant(product: Product): ProductVariant | undefined {
  const activeVariants = getActiveVariants(product)
  return activeVariants.find(variant => variant.images.some(image => image.isPrimary)) ?? activeVariants[0]
}

function matchesSearch(product: Product, query: string) {
  const normalizedQuery = normalizeSearch(query.trim())
  if (!normalizedQuery) return true

  const searchable = normalizeSearch(
    [product.name, product.brand, product.material, product.fit, product.pattern, ...product.tags].join(' '),
  )

  return searchable.includes(normalizedQuery)
}

export function BuilderCatalogPanel({ products, search, onSearchChange, onAddVariant }: BuilderCatalogPanelProps) {
  const visibleProducts = products
    .filter(product => product.active && getActiveVariants(product).length > 0)
    .filter(product => matchesSearch(product, search))

  return (
    <section className="grid min-h-0 min-w-0 gap-5 rounded-xl border border-[#E3E2E2] bg-white p-5 md:p-7">
      <div>
        <h2 className="font-display text-2xl font-semibold text-[#222222]">Catalog sản phẩm</h2>
        <p className="mt-2 text-sm leading-6 text-[#5E5F5D]">
          Chọn các món đang hoạt động để ghép outfit riêng của bạn.
        </p>
      </div>

      <label className="grid gap-2 text-sm font-semibold text-[#3A3632]">
        Tìm sản phẩm cho outfit
        <input
          value={search}
          onChange={event => onSearchChange(event.target.value)}
          className="min-h-11 rounded-lg border border-[#C4C7C7] bg-white px-3 text-sm font-medium text-[#222222] outline-none transition focus:border-[#1C1B1B] focus:ring-2 focus:ring-[#1C1B1B]/20"
          placeholder="Nhập tên, chất liệu hoặc phong cách"
        />
      </label>

      {visibleProducts.length === 0 ? (
        <div className="rounded-lg bg-[#FBF9F9] px-4 py-6 text-sm font-medium text-[#5E5F5D]">
          Không có sản phẩm phù hợp.
        </div>
      ) : (
        <div className="grid gap-3">
          {visibleProducts.map(product => {
            const activeVariants = getActiveVariants(product)
            const defaultVariant = getDefaultVariant(product)
            const image = defaultVariant?.images.find(item => item.isPrimary) ?? defaultVariant?.images[0]

            return (
              <article
                key={product.id}
                className="grid min-w-0 grid-cols-[80px_minmax(0,1fr)] gap-4 rounded-lg border border-[#E3E2E2] bg-white p-3 sm:grid-cols-[96px_minmax(0,1fr)]"
              >
                {image ? (
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="aspect-[4/5] w-full rounded-md object-cover sm:w-24"
                  />
                ) : <div className="grid aspect-[4/5] place-items-center rounded-md bg-[#F5F3F3] text-[#C4C7C7]"><Shirt size={28} aria-hidden="true" /></div>}
                <div className="grid min-w-0 gap-3">
                  <div>
                    <h3 className="break-words font-semibold text-[#222222]">{product.name}</h3>
                    <p className="mt-1 text-sm text-[#5E5F5D]">{product.brand}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#5E5F5D]">
                      <span className="rounded-md bg-white px-2 py-1">{activeVariants.length} phiên bản</span>
                      <span className="rounded-md bg-white px-2 py-1">{product.fit}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="font-semibold text-[#222222]">{formatCurrency(product.basePrice)}</span>
                    <button
                      type="button"
                      className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#1C1B1B] px-3 text-sm font-semibold text-white transition hover:bg-[#563E4A] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1B1B]/30"
                      onClick={() => defaultVariant && onAddVariant(product.id, defaultVariant.id)}
                    >
                      <Plus size={15} aria-hidden="true" /> Thêm {product.name}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
