import type { Product } from '@/entities/product/model/types'

import type { CatalogFilters } from './types'

const CATEGORY_LABELS: Record<string, string> = {
  tops: 'Áo',
  pants: 'Quần',
  skirts: 'Chân váy',
  dresses: 'Đầm',
  outerwear: 'Áo khoác',
}

const STYLE_LABELS: Record<string, string> = {
  minimal: 'Tối giản',
  feminine: 'Nữ tính',
  classic: 'Thanh lịch',
  casual: 'Năng động',
  relaxed: 'Thoải mái',
  evening: 'Buổi tối',
}

const OCCASION_LABELS: Record<string, string> = {
  work: 'Đi làm',
  weekend: 'Cuối tuần',
  date: 'Hẹn hò',
  party: 'Tiệc nhẹ',
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

function includesText(fields: string[], query: string) {
  const normalizedQuery = normalize(query)
  if (!normalizedQuery) return true
  return fields.some(field => normalize(field).includes(normalizedQuery))
}

function matchesVariantFilters(product: Product, filters: CatalogFilters) {
  const variants = product.variants.filter(variant => variant.active)
  if (filters.colors.length === 0 && filters.sizes.length === 0) return variants.length > 0

  return variants.some(variant => {
    const colorMatches = filters.colors.length === 0 || filters.colors.includes(variant.color)
    const sizeMatches = filters.sizes.length === 0 || filters.sizes.includes(variant.size)
    return colorMatches && sizeMatches
  })
}

function searchFields(product: Product) {
  return [
    product.name,
    product.brand,
    product.material,
    product.fit,
    product.pattern,
    CATEGORY_LABELS[product.categoryId] ?? product.categoryId,
    ...product.styleIds.map(style => STYLE_LABELS[style] ?? style),
    ...product.occasionIds.map(occasion => OCCASION_LABELS[occasion] ?? occasion),
    ...product.tags,
  ]
}

export function filterProducts(products: Product[], filters: CatalogFilters): Product[] {
  const result = products.filter(product => {
    if (!product.active) return false
    if (!includesText(searchFields(product), filters.query)) return false
    if (filters.categoryIds.length > 0 && !filters.categoryIds.includes(product.categoryId)) return false
    if (filters.styles.length > 0 && !filters.styles.some(style => product.styleIds.includes(style))) return false
    if (filters.occasions.length > 0 && !filters.occasions.some(occasion => product.occasionIds.includes(occasion))) return false
    if (product.basePrice < filters.price.min || product.basePrice > filters.price.max) return false
    return matchesVariantFilters(product, filters)
  })

  return [...result].sort((a, b) => {
    if (filters.sort === 'newest') return b.createdAt.localeCompare(a.createdAt)
    if (filters.sort === 'price-asc') return a.basePrice - b.basePrice
    if (filters.sort === 'price-desc') return b.basePrice - a.basePrice
    return Number(b.featured) - Number(a.featured) || b.createdAt.localeCompare(a.createdAt)
  })
}
