import { useEffect, useState } from 'react'
import type { AppState, Product } from '../types'
import PageHeader from '../components/ui/PageHeader'
import Money from '../components/ui/Money'
import { UnavailableBadge } from '../components/ui/Badges'
import EmptyState from '../components/ui/EmptyState'
import { commerceApi } from '../api/commerce'
import { commerceProductToUi } from '../api/commerce.adapters'
import { CommerceApiError } from '../api/http'

const categories = ["Tất cả", "Áo", "Quần và chân váy", "Áo khoác", "Đầm", "Giày dép", "Túi xách", "Phụ kiện"]
const sortOptions = ["Phù hợp với bạn", "Dễ phối với đồ đã có", "Giá: Thấp đến cao", "Giá: Cao đến thấp"]

interface Props {
  onNavigate: (screen: string, opts?: any) => void
  app?: AppState
}

export default function Shop({ onNavigate }: Props) {
  const [activeCategory, setActiveCategory] = useState("Tất cả")
  const [sort, setSort] = useState("Phù hợp với bạn")
  const [search, setSearch] = useState('')
  const [favorited, setFavorited] = useState<Set<string>>(new Set(['p1']))
  const [products, setProducts] = useState<Product[]>([])
  const [categoryOptions, setCategoryOptions] = useState<string[]>(categories)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCatalog = async () => {
    setLoading(true)
    setError(null)
    try {
      const [productPage, categoryList] = await Promise.all([
        commerceApi.products.list({ page: 0, size: 100 }),
        commerceApi.categories.list(),
      ])
      setProducts(productPage.items.map(commerceProductToUi))
      setCategoryOptions([categories[0], ...categoryList.items.map(category => category.name)])
    } catch (requestError) {
      setError(
        requestError instanceof CommerceApiError
          ? requestError.message
          : 'Không thể tải danh mục sản phẩm. Vui lòng thử lại.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCatalog()
  }, [])

  const toggleFav = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setFavorited(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filtered = products
    .filter(p => {
      const matchCat =
        activeCategory === "Tất cả" ||
        p.category.toLowerCase() === activeCategory.toLowerCase() ||
        p.tags.some(t => t.toLowerCase() === activeCategory.toLowerCase())
      const matchSearch =
        search.trim() === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.brand.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })
    .sort((a, b) => {
      if (sort === "Giá: Thấp đến cao") return a.price - b.price
      if (sort === "Giá: Cao đến thấp") return b.price - a.price
      if (sort === "Dễ phối với đồ đã có") return b.wardrobeMatches - a.wardrobeMatches
      return 0
    })

  return (
    <div style={{ background: "var(--color-ivory)", minHeight: '100vh' }}>
      <PageHeader
        category="Mua sắm theo phong cách của bạn"
        title="Bộ sưu tập"
        subtitle="Khám phá những món dễ mặc, dễ phối cùng quần áo bạn đã có."
        actions={
          <div className="flex items-center gap-3">
            <label htmlFor="shop-sort" className="sr-only">Sắp xếp sản phẩm</label>
            <select
              id="shop-sort"
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="text-xs px-4 py-2.5 rounded-full border border-sand-dark bg-surface text-charcoal outline-none focus:border-accent"
            >
              {sortOptions.map(opt => (
                <option key={opt} value={opt}>
                  Sắp xếp: {opt}
                </option>
              ))}
            </select>
          </div>
        }
      />

      {/* Category Tabs */}
      <div className="px-6 md:px-16 border-b border-sand" role="tablist" aria-label="Danh mục sản phẩm">
        <div className="flex gap-2 overflow-x-auto pb-0" style={{ scrollbarWidth: 'none' }}>
          {categoryOptions.map(cat => {
            const isSelected = activeCategory === cat
            return (
              <button
                key={cat}
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveCategory(cat)}
                className={`flex-none px-5 py-3.5 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isSelected
                    ? 'border-accent text-accent font-semibold'
                    : 'border-transparent text-secondary hover:text-charcoal'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="px-6 md:px-16 py-8 pb-24">
        {loading ? (
          <div className="py-20 text-center text-sm text-secondary" role="status">Đang tải sản phẩm...</div>
        ) : error ? (
          <EmptyState
            title="Không thể tải cửa hàng"
            description={error}
            primaryAction={{ label: 'Thử lại', onClick: () => void loadCatalog() }}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Không tìm thấy sản phẩm"
            description="Chưa có sản phẩm phù hợp. Bạn thử chọn danh mục khác hoặc đặt lại bộ lọc nhé."
            primaryAction={{
              label: "Đặt lại bộ lọc",
              onClick: () => {
                setActiveCategory("Tất cả")
                setSearch('')
              },
            }}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map(product => {
              const isFav = favorited.has(product.id)
              const isOutOfStock = product.inStock === false

              return (
                <div
                  key={product.id}
                  onClick={() => onNavigate('product-detail', { productId: product.id })}
                  className={`group rounded-2xl bg-surface border overflow-hidden p-3.5 flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                    isOutOfStock
                      ? 'border-sand-dark opacity-85 hover:border-muted'
                      : 'border-sand hover:border-accent/40 hover:shadow-md'
                  }`}
                >
                  <div>
                    {/* Thumbnail */}
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-sand mb-3">
                      <img
                        src={product.image}
                        alt={product.name}
                        className={`w-full h-full object-cover transition-transform duration-500 ${
                          isOutOfStock ? 'grayscale-[30%]' : 'group-hover:scale-103'
                        }`}
                      />

                      {/* Wishlist Button */}
                      <button
                        type="button"
                        onClick={e => toggleFav(product.id, e)}
                        aria-label={isFav ? `Xóa ${product.name} khỏi danh sách yêu thích` : `Thêm ${product.name} vào danh sách yêu thích`}
                        className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-surface/90 backdrop-blur-xs flex items-center justify-center text-sm shadow-xs transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        <span style={{ color: isFav ? "var(--color-error)" : "var(--color-muted)" }}>
                          {isFav ? '♥' : '♡'}
                        </span>
                      </button>

                      {/* Status badge: either Out of Stock or Wardrobe matches */}
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1">
                        {isOutOfStock ? (
                          <UnavailableBadge reason="Hết hàng" />
                        ) : (
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-ivory/92 backdrop-blur-xs text-success border border-success/25 shadow-2xs truncate">
                            ✓ {product.wardrobeMatches} món trong tủ có thể phối cùng
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="px-1">
                      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-semibold text-rose mb-1">
                        <span>{product.brand}</span>
                        <span className="text-secondary normal-case tracking-normal">{product.fit === 'Cỡ duy nhất' ? product.fit : `Dáng ${product.fit.toLocaleLowerCase('vi-VN')}`}</span>
                      </div>

                      <h3 className="font-sans text-sm font-medium text-charcoal truncate mb-1" title={product.name}>
                        {product.name}
                      </h3>

                      <div className="flex items-center justify-between pt-1">
                        <Money amount={product.price} className="text-sm font-semibold text-charcoal" />

                        {/* Color swatches with visible title */}
                        <div className="flex gap-1" aria-label={`Màu có sẵn cho ${product.name}`}>
                          {product.colors.map(c => (
                            <div
                              key={c.name}
                              className="w-3.5 h-3.5 rounded-full border border-overlay/15"
                              style={{ backgroundColor: c.hex }}
                              title={c.name}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Card Footer */}
                  <div className="pt-3 mt-2 border-t border-sand px-1 flex items-center justify-between text-xs text-secondary">
                    <span>
                      {isOutOfStock ? (
                        <span className="text-error font-medium">Tạm hết hàng</span>
                      ) : (
                        <span>Cỡ có sẵn: {product.availableSizes.join(', ')}</span>
                      )}
                    </span>
                    <span className="text-accent font-medium group-hover:underline">
                      Xem →
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
