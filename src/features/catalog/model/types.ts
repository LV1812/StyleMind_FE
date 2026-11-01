import type { ProductSize } from '@/entities/product/model/types'

export type CatalogSort = 'featured' | 'newest' | 'price-asc' | 'price-desc'

export interface CatalogFilters {
  query: string
  categoryIds: string[]
  colors: string[]
  sizes: ProductSize[]
  styles: string[]
  occasions: string[]
  price: {
    min: number
    max: number
  }
  sort: CatalogSort
}

export const DEFAULT_CATALOG_FILTERS: CatalogFilters = {
  query: '',
  categoryIds: [],
  colors: [],
  sizes: [],
  styles: [],
  occasions: [],
  price: { min: 0, max: Number.MAX_SAFE_INTEGER },
  sort: 'featured',
}
