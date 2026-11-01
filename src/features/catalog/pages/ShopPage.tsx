import { Search } from 'lucide-react'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useDemoStore } from '@/app/store/DemoStoreProvider'
import type { ProductSize } from '@/entities/product/model/types'
import { Button, EmptyState } from '@/shared/ui'

import { FilterPanel } from '../components/FilterPanel'
import { MobileFilterSheet } from '../components/MobileFilterSheet'
import { ProductCard } from '../components/ProductCard'
import { filterProducts } from '../model/filterProducts'
import { DEFAULT_CATALOG_FILTERS, type CatalogFilters, type CatalogSort } from '../model/types'

const SORT_OPTIONS: CatalogSort[] = ['featured', 'newest', 'price-asc', 'price-desc']
const SIZE_OPTIONS: ProductSize[] = ['XS', 'S', 'M', 'L', 'XL']

function createEmptyFilters(): CatalogFilters {
  return {
    ...DEFAULT_CATALOG_FILTERS,
    categoryIds: [],
    colors: [],
    sizes: [],
    styles: [],
    occasions: [],
    price: { ...DEFAULT_CATALOG_FILTERS.price },
  }
}

function filtersFromSearchParams(searchParams: URLSearchParams): CatalogFilters {
  const filters = createEmptyFilters()
  const category = searchParams.get('category')
  const sort = searchParams.get('sort')

  return {
    ...filters,
    query: searchParams.get('q')?.trim() ?? '',
    categoryIds: category ? [category] : [],
    sort: SORT_OPTIONS.includes(sort as CatalogSort) ? (sort as CatalogSort) : filters.sort,
  }
}

function activeFilterCount(filters: CatalogFilters) {
  return (
    (filters.query.trim() ? 1 : 0) +
    filters.categoryIds.length +
    filters.colors.length +
    filters.sizes.length +
    filters.styles.length +
    filters.occasions.length +
    (filters.price.min > 0 ? 1 : 0) +
    (filters.price.max < Number.MAX_SAFE_INTEGER ? 1 : 0)
  )
}

function uniqueAvailableColors(products: ReturnType<typeof useDemoStore>['state']['products']) {
  const colors = new Set<string>()

  products.forEach(product => {
    product.variants.forEach(variant => {
      if (variant.active) colors.add(variant.color)
    })
  })

  return Array.from(colors).sort((a, b) => a.localeCompare(b, 'vi'))
}

function searchParamsFromFilters(filters: CatalogFilters) {
  const params = new URLSearchParams()

  if (filters.query.trim()) params.set('q', filters.query.trim())
  if (filters.categoryIds.length === 1) params.set('category', filters.categoryIds[0])
  if (filters.sort !== DEFAULT_CATALOG_FILTERS.sort) params.set('sort', filters.sort)

  return params
}

export function ShopPage() {
  const { state } = useDemoStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState(() => filtersFromSearchParams(searchParams))

  useEffect(() => {
    setFilters(filtersFromSearchParams(searchParams))
  }, [searchParams])

  const categories = useMemo(
    () =>
      state.categories
        .filter(category => category.active)
        .sort((a, b) => a.order - b.order)
        .map(category => ({ id: category.id, label: category.label })),
    [state.categories],
  )

  const styles = useMemo(
    () => state.fashionMetadata.styles.filter(style => style.active).map(style => ({ id: style.id, label: style.label })),
    [state.fashionMetadata.styles],
  )

  const occasions = useMemo(
    () => state.fashionMetadata.occasions.filter(occasion => occasion.active).map(occasion => ({ id: occasion.id, label: occasion.label })),
    [state.fashionMetadata.occasions],
  )

  const colors = useMemo(() => uniqueAvailableColors(state.products), [state.products])
  const products = useMemo(() => filterProducts(state.products, filters), [filters, state.products])
  const emptyFilters = useMemo(() => createEmptyFilters(), [])
  const appliedCount = activeFilterCount(filters)

  const updateFilters = (nextFilters: CatalogFilters) => {
    setFilters(nextFilters)
    setSearchParams(searchParamsFromFilters(nextFilters), { replace: true })
  }

  const clearFilters = () => {
    const nextFilters = createEmptyFilters()
    setFilters(nextFilters)
    setSearchParams({}, { replace: true })
  }

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    updateFilters({ ...filters, query: filters.query.trim() })
  }

  return (
    <div className="bg-[#FAF8F5]">
      <section className="border-b border-[#EEE8E1] bg-[#FDFCFA]">
        <div className="mx-auto grid max-w-[var(--container-wide)] gap-8 px-5 py-10 md:px-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.55fr)] lg:items-end">
          <div>
            <p className="text-sm font-semibold text-[#684B5A]">Cửa hàng StyleMind</p>
            <h1 className="mt-3 max-w-3xl break-words font-display text-3xl font-semibold leading-tight text-[#222222] sm:text-4xl md:text-6xl">
              Chọn món dễ mặc cho tủ đồ hằng ngày
            </h1>
          </div>
          <form onSubmit={handleSearch} className="rounded-lg bg-[#FAF8F5] p-3 shadow-[0_16px_38px_rgba(58,54,50,0.08)]">
            <label htmlFor="shop-search" className="sr-only">
              Tìm trong cửa hàng
            </label>
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Search aria-hidden="true" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9D9894]" />
                <input
                  id="shop-search"
                  value={filters.query}
                  onChange={event => setFilters({ ...filters, query: event.target.value })}
                  placeholder="Tìm áo, đầm, blazer"
                  className="h-11 w-full rounded-lg border border-[#D8D0C6] bg-white pl-10 pr-3 text-sm font-semibold text-[#222222] outline-none transition focus:border-[#684B5A] focus:ring-2 focus:ring-[#684B5A]/20"
                />
              </div>
              <Button type="submit">Tìm</Button>
            </div>
          </form>
        </div>
      </section>

      <section className="mx-auto grid max-w-[var(--container-wide)] gap-8 px-5 py-8 md:px-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="hidden lg:block">
          <div className="sticky top-24 rounded-lg bg-[#FDFCFA] p-5 shadow-[0_18px_36px_rgba(58,54,50,0.08)]">
            <FilterPanel
              filters={filters}
              categories={categories}
              styles={styles}
              occasions={occasions}
              colors={colors}
              sizes={SIZE_OPTIONS}
              onChange={updateFilters}
              onClear={clearFilters}
            />
          </div>
        </div>

        <div className="min-w-0">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#684B5A]">{products.length} sản phẩm phù hợp</p>
              <p className="mt-1 text-sm text-[#6F6B67]">
                {appliedCount ? `${appliedCount} bộ lọc đang áp dụng` : 'Tất cả sản phẩm đang có sẵn'}
              </p>
            </div>
            <MobileFilterSheet
              filters={filters}
              emptyFilters={emptyFilters}
              categories={categories}
              styles={styles}
              occasions={occasions}
              colors={colors}
              sizes={SIZE_OPTIONS}
              onApply={updateFilters}
              onClear={clearFilters}
            />
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Không tìm thấy sản phẩm phù hợp"
              description="Hãy thử bỏ bớt bộ lọc hoặc tìm bằng tên danh mục, màu sắc hay dịp sử dụng khác."
              action={
                <Button variant="secondary" onClick={clearFilters}>
                  Xóa bộ lọc
                </Button>
              }
            />
          )}
        </div>
      </section>
    </div>
  )
}
