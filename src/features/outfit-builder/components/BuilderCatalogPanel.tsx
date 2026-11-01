import type { Product, ProductVariant } from '@/entities/product/model/types'
import { formatCurrency } from '@/shared/lib/formatCurrency'

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
    <section className="grid min-h-0 gap-4 rounded-lg border border-[#E3DAD0] bg-white p-4 shadow-sm md:p-5">
      <div>
        <h2 className="font-display text-2xl font-semibold text-[#222222]">Catalog sản phẩm</h2>
        <p className="mt-2 text-sm leading-6 text-[#6F6B67]">
          Chọn các món đang hoạt động để ghép outfit riêng của bạn.
        </p>
      </div>

      <label className="grid gap-2 text-sm font-semibold text-[#3A3632]">
        Tìm sản phẩm cho outfit
        <input
          value={search}
          onChange={event => onSearchChange(event.target.value)}
          className="min-h-11 rounded-lg border border-[#D8D0C6] bg-white px-3 text-sm font-medium text-[#222222] outline-none transition focus:border-[#684B5A] focus:ring-2 focus:ring-[#684B5A]/20"
          placeholder="Nhập tên, chất liệu hoặc phong cách"
        />
      </label>

      {visibleProducts.length === 0 ? (
        <div className="rounded-lg bg-[#FAF8F5] px-4 py-6 text-sm font-medium text-[#6F6B67]">
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
                className="grid gap-3 rounded-lg bg-[#FAF8F5] p-3 sm:grid-cols-[96px_minmax(0,1fr)]"
              >
                {image && (
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="aspect-[4/5] w-full rounded-md object-cover sm:w-24"
                  />
                )}
                <div className="grid gap-3">
                  <div>
                    <h3 className="font-semibold text-[#222222]">{product.name}</h3>
                    <p className="mt-1 text-sm text-[#6F6B67]">{product.brand}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#6F6B67]">
                      <span className="rounded-md bg-white px-2 py-1">{activeVariants.length} phiên bản</span>
                      <span className="rounded-md bg-white px-2 py-1">{product.fit}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="font-semibold text-[#222222]">{formatCurrency(product.basePrice)}</span>
                    <button
                      type="button"
                      className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#684B5A] px-3 text-sm font-semibold text-white transition hover:bg-[#563E4A] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A]/30"
                      onClick={() => defaultVariant && onAddVariant(product.id, defaultVariant.id)}
                    >
                      Thêm {product.name}
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
