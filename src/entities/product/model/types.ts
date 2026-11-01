export type ProductSize = 'XS' | 'S' | 'M' | 'L' | 'XL'

export interface ProductImage {
  id: string
  url: string
  alt: string
  isPrimary: boolean
  order: number
}

export interface ProductVariant {
  id: string
  color: string
  colorHex: string
  size: ProductSize
  stock: number
  priceOverride?: number
  images: ProductImage[]
  active: boolean
}

export interface ProductCategory {
  id: string
  label: string
  description: string
  active: boolean
  order: number
}

export interface Product {
  id: string
  categoryId: string
  name: string
  brand: string
  description: string
  basePrice: number
  material: string
  fit: string
  pattern: string
  styleIds: string[]
  occasionIds: string[]
  tags: string[]
  variants: ProductVariant[]
  active: boolean
  featured: boolean
  createdAt: string
}

export interface FashionMetadataOption {
  id: string
  label: string
  active: boolean
}

export interface FashionMetadata {
  styles: FashionMetadataOption[]
  occasions: FashionMetadataOption[]
  colors: FashionMetadataOption[]
  materials: FashionMetadataOption[]
  fits: FashionMetadataOption[]
  patterns: FashionMetadataOption[]
}

export interface CompatibilityRule {
  id: string
  sourceType: string
  targetType: string
  score: number
  note: string
  active: boolean
}
