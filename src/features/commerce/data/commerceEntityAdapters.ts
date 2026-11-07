import type { CartLine } from '@/entities/cart/model/types'
import type { CancellationRequest, Order, OrderStatus } from '@/entities/order/model/types'
import type { Product, ProductCategory, ProductSize } from '@/entities/product/model/types'
import type {
  CartResponse,
  CancellationRequestResponse,
  CatalogReference,
  CommerceProduct,
  OrderResponse,
  ProductVariant as CommerceVariant,
} from '@/api/commerce.types'

const sizes = new Set<ProductSize>(['XS', 'S', 'M', 'L', 'XL'])

const namedColors: Record<string, string> = {
  black: '#222222',
  white: '#f7f5ef',
  red: '#9f3f45',
  blue: '#496781',
  green: '#58705a',
  beige: '#d8c5aa',
  brown: '#76584a',
  gray: '#918d88',
  grey: '#918d88',
  pink: '#d6a6ad',
  navy: '#26384c',
}

function colorHex(value: string | null): string {
  const color = (value || '').trim().toLowerCase()
  const known = Object.entries(namedColors).find(([name]) => color.includes(name))
  if (known) return known[1]
  let hash = 0
  for (const character of color) hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  return `hsl(${hash % 360} 28% 55%)`
}

function productSize(value: string | null): ProductSize {
  const normalized = value?.toUpperCase() as ProductSize | undefined
  return normalized && sizes.has(normalized) ? normalized : 'M'
}

function variantImage(variant: CommerceVariant) {
  return [...variant.images]
    .sort((left, right) => Number(right.is_primary) - Number(left.is_primary) || left.display_order - right.display_order)
    .map(image => ({
      id: image.image_id,
      url: image.image_url,
      alt: image.alt_text || variant.sku,
      isPrimary: image.is_primary,
      order: image.display_order,
    }))
}

export function commerceProductToEntity(product: CommerceProduct): Product {
  const prices = product.variants.map(variant => variant.unit_price_vnd)
  return {
    id: product.product_id,
    categoryId: product.category_id,
    name: product.name,
    brand: product.brand_name,
    description: product.description || '',
    basePrice: prices.length ? Math.min(...prices) : 0,
    material: product.variants.find(variant => variant.material)?.material || '',
    fit: 'Tiêu chuẩn',
    pattern: '',
    styleIds: [],
    occasionIds: [],
    tags: [product.category_name, product.brand_name, product.demographic_segment || ''].filter(Boolean),
    variants: product.variants.map(variant => ({
      id: variant.variant_id,
      color: variant.color || 'Mặc định',
      colorHex: colorHex(variant.color),
      size: productSize(variant.size),
      stock: variant.available_quantity,
      priceOverride: variant.unit_price_vnd,
      images: variantImage(variant),
      active: variant.variant_status === 'ACTIVE',
    })),
    active: product.product_status === 'ACTIVE',
    featured: false,
    createdAt: new Date(0).toISOString(),
  }
}

export function commerceCategoryToEntity(category: CatalogReference, order: number): ProductCategory {
  return {
    id: category.id,
    label: category.name,
    description: category.slug,
    active: category.is_active,
    order,
  }
}

export function commerceCartToEntities(cart: CartResponse, products: Product[]): CartLine[] {
  const productByVariant = new Map(products.flatMap(product => product.variants.map(variant => [variant.id, product.id] as const)))
  return cart.items.map(item => ({
    id: item.cart_item_id,
    productId: productByVariant.get(item.variant_id) || item.variant_id,
    variantId: item.variant_id,
    quantity: item.quantity,
    source: 'shop',
  }))
}

const statusMap: Record<string, OrderStatus> = {
  PENDING_PAYMENT: 'payment_pending',
  PLACED: 'confirmed',
  PAID: 'paid',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

export function commerceOrderToEntity(order: OrderResponse): Order {
  return {
    id: order.order_id,
    userId: order.customer_id,
    status: statusMap[order.order_status] ?? 'pending',
    paymentMethod: order.payment_method === 'COD' ? 'cod' : 'vietqr',
    paymentStatus: 'unknown',
    paymentReference: order.order_number,
    items: order.items.map(item => ({
      productId: item.variant_id,
      variantId: item.variant_id,
      name: item.product_name_snapshot,
      brand: item.brand_name_snapshot,
      color: item.color_snapshot || '',
      size: item.size_snapshot || '',
      quantity: item.quantity,
      unitPrice: item.unit_price_vnd,
      lineTotal: item.line_total_vnd,
      imageUrl: item.image_url_snapshot || '',
    })),
    shippingAddress: {
      id: order.address.source_address_id,
      recipientName: order.address.recipient_name,
      phone: order.address.recipient_phone,
      line1: order.address.address_line,
      ward: '',
      district: '',
      province: '',
    },
    subtotal: order.accepted_total_vnd,
    discount: 0,
    shipping: 0,
    total: order.accepted_total_vnd,
    createdAt: order.placed_at || new Date().toISOString(),
    timeline: order.history.map(entry => ({ id: entry.history_id, label: entry.to_status, at: entry.changed_at })),
  }
}

export function commerceCancellationToEntity(request: CancellationRequestResponse): CancellationRequest {
  const status: CancellationRequest['status'] = request.request_status === 'APPROVED'
    ? 'approved'
    : request.request_status === 'REJECTED'
      ? 'rejected'
      : 'submitted'
  return {
    id: request.cancellation_request_id,
    orderId: request.order_id,
    userId: request.requested_by_user_id,
    reason: request.reason,
    status,
    createdAt: request.requested_at,
    reviewedBy: request.reviewed_by_user_id || undefined,
    reviewedAt: request.reviewed_at || undefined,
    adminNote: request.decision_reason || undefined,
  }
}
