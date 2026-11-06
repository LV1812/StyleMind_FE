import type { Product, ProductCategory, ProductSize } from '@/entities/product/model/types'
import { COMMERCE_GATEWAY, commerceRequest } from '@/shared/api/commerceApi'

export interface CatalogProductResponse {
  product_id: string
  category_id: string
  category_name: string
  brand_name: string | null
  name: string
  description: string | null
  product_status: string
  variants: Array<{
    variant_id: string
    size: string
    color: string
    material: string | null
    unit_price_vnd: number
    variant_status: string
    available_quantity: number
    images: Array<{ image_id: string; image_url: string; alt_text: string | null; display_order: number; is_primary: boolean }>
  }>
}

export function catalogProduct(raw: CatalogProductResponse): Product {
  return {
    id: raw.product_id, categoryId: raw.category_id, name: raw.name, brand: raw.brand_name ?? '',
    description: raw.description ?? '', basePrice: Math.min(...raw.variants.map(variant => variant.unit_price_vnd), Number.MAX_SAFE_INTEGER),
    material: raw.variants[0]?.material ?? '', fit: '', pattern: '', styleIds: [], occasionIds: [], tags: [],
    active: raw.product_status === 'ACTIVE', featured: false, createdAt: '',
    variants: raw.variants.map(variant => ({
      id: variant.variant_id, color: variant.color, colorHex: '#D8D0C6', size: variant.size as ProductSize,
      stock: variant.available_quantity, priceOverride: variant.unit_price_vnd, active: variant.variant_status === 'ACTIVE',
      images: variant.images.map(image => ({
        id: image.image_id, url: image.image_url.startsWith('/api/') ? `${COMMERCE_GATEWAY}/commerce${image.image_url}` : image.image_url,
        alt: image.alt_text ?? raw.name, isPrimary: image.is_primary, order: image.display_order,
      })),
    })),
  }
}

export async function loadCommerceCatalog(signal?: AbortSignal): Promise<{ products: Product[]; categories: ProductCategory[] }> {
  const products: Product[] = []
  const categories = new Map<string, ProductCategory>()
  let page = 0
  let totalPages = 1
  do {
    const response = await commerceRequest<{ items: CatalogProductResponse[]; total_pages: number }>(`/products?page=${page}&size=100`, { signal })
    for (const raw of response.items) {
      products.push(catalogProduct(raw))
      categories.set(raw.category_id, { id: raw.category_id, label: raw.category_name, description: '', active: true, order: categories.size })
    }
    totalPages = response.total_pages
    page++
  } while (page < totalPages)
  return { products, categories: [...categories.values()] }
}
