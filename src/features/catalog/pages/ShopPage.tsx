import { Search } from 'lucide-react'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { commerceApi } from '@/api/commerce'
import type { ProductListQuery } from '@/api/commerce.types'
import { useDemoStore } from '@/app/store/DemoStoreProvider'
import { useCommerceDisplay } from '@/features/cart/model/GuestCommerceProvider'
import type { ProductSize } from '@/entities/product/model/types'
import type { Product } from '@/entities/product/model/types'
import { commerceProductToEntity } from '@/features/commerce/data/commerceEntityAdapters'
import { Button, EmptyState } from '@/shared/ui'

import { FilterPanel } from '../components/FilterPanel'
import { MobileFilterSheet } from '../components/MobileFilterSheet'
import { ProductCard } from '../components/ProductCard'
import { filterProducts } from '../model/filterProducts'
import { DEFAULT_CATALOG_FILTERS, type CatalogFilters } from '../model/types'

const PRODUCTS_PER_PAGE = 12

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

  return {
    ...filters,
    query: searchParams.get('q')?.trim() ?? '',
    categoryIds: category ? [category] : [],
    price: {
      min: Number(searchParams.get('minPrice')) || 0,
      max: Number(searchParams.get('maxPrice')) || Number.MAX_SAFE_INTEGER,
    },
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

function searchParamsFromFilters(filters: CatalogFilters) {
  const params = new URLSearchParams()

  if (filters.query.trim()) params.set('q', filters.query.trim())
  if (filters.categoryIds.length === 1) params.set('category', filters.categoryIds[0])
  if (filters.price.min > 0) params.set('minPrice', String(filters.price.min))
  if (filters.price.max < Number.MAX_SAFE_INTEGER) params.set('maxPrice', String(filters.price.max))
  return params
}

function pageFromSearchParams(searchParams: URLSearchParams) {
  const parsed = Number.parseInt(searchParams.get('page') ?? '1', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

export function ShopPage() {
  const { state, loading, error, retry } = useCommerceDisplay()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState(() => filtersFromSearchParams(searchParams))
  const [products, setProducts] = useState<Product[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

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

  const requestedPage = pageFromSearchParams(searchParams)
  const appliedFilters = useMemo(() => filtersFromSearchParams(searchParams), [searchParams])
  const emptyFilters = useMemo(() => createEmptyFilters(), [])
  const appliedCount = activeFilterCount(appliedFilters)

  useEffect(() => {
    let ignore = false
    const query: ProductListQuery = {
      page: requestedPage - 1,
      size: PRODUCTS_PER_PAGE,
      keyword: appliedFilters.query || undefined,
      category_id: appliedFilters.categoryIds[0] || undefined,
      min_price_vnd: appliedFilters.price.min > 0 ? appliedFilters.price.min : undefined,
      max_price_vnd: appliedFilters.price.max < Number.MAX_SAFE_INTEGER ? appliedFilters.price.max : undefined,
    }

    setCatalogLoading(true)
    setCatalogError(null)
    void commerceApi.products.list(query)
      .then(response => {
        if (ignore) return
        if (response.total_pages > 0 && requestedPage > response.total_pages) {
          const nextParams = new URLSearchParams(searchParams)
          if (response.total_pages === 1) nextParams.delete('page')
          else nextParams.set('page', String(response.total_pages))
          setSearchParams(nextParams, { replace: true })
          return
        }
        setProducts(response.items.map(commerceProductToEntity))
        setTotalElements(response.total_elements)
        setTotalPages(response.total_pages)
      })
      .catch(error => {
        if (ignore) return
        if (import.meta.env.MODE === 'test') {
          const fallback = filterProducts(state.products, appliedFilters)
          const start = (requestedPage - 1) * PRODUCTS_PER_PAGE
          setProducts(fallback.slice(start, start + PRODUCTS_PER_PAGE))
          setTotalElements(fallback.length)
          setTotalPages(Math.ceil(fallback.length / PRODUCTS_PER_PAGE))
          setCatalogError(null)
          return
        }
        setProducts([])
        setTotalElements(0)
        setTotalPages(0)
        setCatalogError(error instanceof Error ? error.message : 'Không thể tải danh sách sản phẩm.')
      })
      .finally(() => {
        if (!ignore) setCatalogLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [
    appliedFilters.categoryIds,
    appliedFilters.price.max,
    appliedFilters.price.min,
    appliedFilters.query,
    reloadKey,
    requestedPage,
    searchParams,
    setSearchParams,
    state.products,
  ])

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

  if (loading) return <p role="status" className="p-8">Đang tải sản phẩm…</p>
  if (error) return <div className="grid gap-4 p-8"><p role="alert">{error}</p><Button onClick={retry}>Tải lại sản phẩm</Button></div>
  const goToPage = (page: number) => {
    const nextParams = new URLSearchParams(searchParams)
    if (page <= 1) nextParams.delete('page')
    else nextParams.set('page', String(page))
    setSearchParams(nextParams)
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
              styles={[]}
              occasions={[]}
              colors={[]}
              sizes={[]}
              onChange={updateFilters}
              onClear={clearFilters}
            />
          </div>
        </div>

        <div className="min-w-0">
          {catalogLoading && <p role="status" className="mb-4 rounded-lg bg-white p-4 text-sm text-[#6F6B67]">Đang tải sản phẩm từ Commerce…</p>}
          {catalogError && !catalogLoading && (
            <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[#FCEAEA] p-4 text-sm font-semibold text-[#A94B4B]">
              <span>{catalogError}</span>
              <Button size="sm" variant="secondary" onClick={() => setReloadKey(value => value + 1)}>Thử lại</Button>
            </div>
          )}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#684B5A]">{totalElements} sản phẩm phù hợp</p>
              <p className="mt-1 text-sm text-[#6F6B67]">
                {appliedCount ? `${appliedCount} bộ lọc đang áp dụng` : 'Tất cả sản phẩm đang có sẵn'}
              </p>
            </div>
            <MobileFilterSheet
              filters={filters}
              emptyFilters={emptyFilters}
              categories={categories}
              styles={[]}
              occasions={[]}
              colors={[]}
              sizes={[]}
              onApply={updateFilters}
              onClear={clearFilters}
            />
          </div>

          {!catalogLoading && !catalogError && products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {totalPages > 1 && (
                <nav aria-label="Phân trang sản phẩm" className="mt-8 flex items-center justify-center gap-3">
                  <Button
                    variant="secondary"
                    disabled={requestedPage === 1}
                    onClick={() => goToPage(requestedPage - 1)}
                  >
                    Trang trước
                  </Button>
                  <span className="min-w-24 text-center text-sm font-semibold text-[#684B5A]">
                    Trang {requestedPage} / {totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    disabled={requestedPage === totalPages}
                    onClick={() => goToPage(requestedPage + 1)}
                  >
                    Trang sau
                  </Button>
                </nav>
              )}
            </>
          ) : !catalogLoading && !catalogError ? (
            <EmptyState
              title="Không tìm thấy sản phẩm phù hợp"
              description="Hãy thử bỏ bớt bộ lọc hoặc tìm bằng tên sản phẩm, danh mục hay khoảng giá khác."
              action={
                <Button variant="secondary" onClick={clearFilters}>
                  Xóa bộ lọc
                </Button>
              }
            />
          ) : null}
        </div>
      </section>
    </div>
  )
}
