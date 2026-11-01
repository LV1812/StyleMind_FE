import type { Product, ProductImage, ProductSize, ProductVariant } from '@/entities/product/model/types'

const SIZE_ORDER: ProductSize[] = ['XS', 'S', 'M', 'L', 'XL']

export interface ProductSelectionInput {
  color?: string | null
  size?: ProductSize | null
}

export interface ProductColorOption {
  color: string
  colorHex: string
  available: boolean
}

export interface ProductSizeOption {
  size: ProductSize
  stock: number
  available: boolean
}

export interface ProductSelection {
  selectedColor: string
  selectedSize: ProductSize | null
  variant: ProductVariant | null
  displayVariant: ProductVariant | null
  images: ProductImage[]
  price: number
  stock: number
  canPurchase: boolean
  error?: string
  colorOptions: ProductColorOption[]
  sizeOptions: ProductSizeOption[]
}

function activeVariants(product: Product) {
  return product.variants.filter(variant => variant.active)
}

function uniqueColorOptions(variants: ProductVariant[]): ProductColorOption[] {
  const options = new Map<string, ProductColorOption>()

  variants.forEach(variant => {
    const current = options.get(variant.color)
    options.set(variant.color, {
      color: variant.color,
      colorHex: variant.colorHex,
      available: Boolean(current?.available || variant.active),
    })
  })

  return Array.from(options.values())
}

function colorImages(variants: ProductVariant[]) {
  return variants
    .flatMap(variant => variant.images)
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.order - b.order)
}

function sizeOptions(variants: ProductVariant[]): ProductSizeOption[] {
  const options = new Map<ProductSize, ProductSizeOption>()

  variants.forEach(variant => {
    const current = options.get(variant.size)
    options.set(variant.size, {
      size: variant.size,
      stock: Math.max(current?.stock ?? 0, variant.stock),
      available: Boolean(current?.available || variant.active),
    })
  })

  return Array.from(options.values()).sort((a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size))
}

function variantPrice(product: Product, variant: ProductVariant | null) {
  return variant?.priceOverride ?? product.basePrice
}

export function getProductSelection(product: Product, selection: ProductSelectionInput = {}): ProductSelection {
  const variants = activeVariants(product)
  const fallbackVariant = variants[0] ?? null
  const selectedColor = selection.color ?? fallbackVariant?.color ?? ''
  const variantsByColor = variants.filter(variant => variant.color === selectedColor)
  const requestedVariant = selection.size
    ? variantsByColor.find(variant => variant.size === selection.size) ?? null
    : null
  const displayVariant = requestedVariant ?? variantsByColor[0] ?? fallbackVariant
  const images = colorImages(variantsByColor.length ? variantsByColor : variants)
  const canPurchase = Boolean(requestedVariant?.active)

  return {
    selectedColor,
    selectedSize: selection.size ?? null,
    variant: requestedVariant,
    displayVariant,
    images,
    price: variantPrice(product, displayVariant),
    stock: requestedVariant?.stock ?? displayVariant?.stock ?? 0,
    canPurchase,
    error: selection.size && !canPurchase ? 'Phiên bản này hiện chưa thể mua' : undefined,
    colorOptions: uniqueColorOptions(variants),
    sizeOptions: sizeOptions(variantsByColor),
  }
}
