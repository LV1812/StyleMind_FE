import type { CartItem, Order, Product } from '../types'
import type { CartResponse, CommerceProduct, OrderResponse, ProductVariant } from './commerce.types'

const FALLBACK_IMAGE =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="100%" height="100%" fill="#eee7df"/><text x="50%" y="50%" text-anchor="middle" fill="#7d6e66" font-family="sans-serif" font-size="28">StyleMind</text></svg>',
  )

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

function colorHex(color: string): string {
  const normalized = color.trim().toLowerCase()
  const known = Object.entries(namedColors).find(([name]) => normalized.includes(name))
  if (known) return known[1]

  let hash = 0
  for (const char of normalized) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return `hsl(${hash % 360} 28% 55%)`
}

function primaryImage(variant?: ProductVariant): string {
  if (!variant) return FALLBACK_IMAGE
  return (
    variant.images.find(image => image.is_primary)?.image_url ||
    [...variant.images].sort((a, b) => a.display_order - b.display_order)[0]?.image_url ||
    FALLBACK_IMAGE
  )
}

export function commerceProductToUi(product: CommerceProduct): Product {
  const activeVariants = product.variants.filter(variant => variant.variant_status === 'ACTIVE')
  const variants = activeVariants.length ? activeVariants : product.variants
  const images = Array.from(new Set(variants.flatMap(variant => variant.images.map(image => image.image_url))))
  const colors = Array.from(new Set(variants.map(variant => variant.color).filter(Boolean))) as string[]
  const sizes = Array.from(new Set(variants.map(variant => variant.size).filter(Boolean))) as string[]
  const availableSizes = Array.from(
    new Set(
      activeVariants
        .filter(variant => variant.available_quantity > 0)
        .map(variant => variant.size)
        .filter(Boolean),
    ),
  ) as string[]
  const first = variants[0]

  const prices = variants.map(variant => variant.unit_price_vnd)
  return {
    id: product.product_id,
    name: product.name,
    brand: product.brand_name,
    price: prices.length ? Math.min(...prices) : 0,
    image: images[0] || primaryImage(first),
    images: images.length ? images : [primaryImage(first)],
    colors: colors.length
      ? colors.map(color => ({ name: color, hex: colorHex(color) }))
      : [{ name: 'Mặc định', hex: '#c8bbb1' }],
    sizes: sizes.length ? sizes : ['Một cỡ'],
    availableSizes: availableSizes.length ? availableSizes : activeVariants.length ? ['Một cỡ'] : [],
    category: product.category_name,
    material: first?.material || 'Không có thông tin',
    fit: 'Tiêu chuẩn',
    description: product.description || 'Chưa có mô tả sản phẩm.',
    wardrobeMatches: 0,
    aiHint: '',
    recommendedSize: availableSizes[0] || sizes[0] || 'Một cỡ',
    recommendedSizeReason: 'Hãy đối chiếu với số đo và cỡ bạn thường mặc.',
    tags: [product.category_name, product.demographic_segment || ''].filter(Boolean),
    inStock: activeVariants.some(variant => variant.available_quantity > 0),
    variants: product.variants.map(variant => ({
      id: variant.variant_id,
      size: variant.size || 'Một cỡ',
      color: variant.color || 'Mặc định',
      material: variant.material || '',
      price: variant.unit_price_vnd,
      availableQuantity: variant.available_quantity,
      active: variant.variant_status === 'ACTIVE',
      image: primaryImage(variant),
    })),
  }
}

export function orderResponseToUi(order: OrderResponse): Order {
  const statusMap: Record<string, Order['status']> = {
    PENDING_PAYMENT: 'PAYMENT_PENDING',
    PLACED: 'CONFIRMED',
    PAID: 'PAID',
    PROCESSING: 'CONFIRMED',
    SHIPPED: 'SHIPPED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
  }
  const status = statusMap[order.order_status] || 'PENDING'
  const statusLabels: Record<Order['status'], string> = {
    PENDING: 'Đã tạo',
    PAYMENT_PENDING: 'Chờ thanh toán',
    PAID: 'Đã thanh toán',
    CONFIRMED: 'Đã xác nhận',
    SHIPPED: 'Đang giao hàng',
    COMPLETED: 'Hoàn tất',
    CANCELLED: 'Đã hủy',
    REFUNDED: 'Đã hoàn tiền',
  }
  const timeline = order.history.map((entry, index) => ({
    status: entry.to_status,
    date: new Date(entry.changed_at).toLocaleString('vi-VN'),
    done: index < order.history.length - 1,
    active: index === order.history.length - 1,
  }))

  return {
    id: order.order_number,
    apiId: order.order_id,
    apiStatus: order.order_status,
    date: order.placed_at ? new Date(order.placed_at).toLocaleDateString('vi-VN') : 'Chưa xác nhận',
    status,
    statusLabel: statusLabels[status],
    items: order.items.map(item => ({
      id: item.order_item_id,
      productId: item.variant_id,
      name: item.product_name_snapshot,
      brand: item.brand_name_snapshot,
      size: item.size_snapshot || 'Một cỡ',
      color: item.color_snapshot || 'Mặc định',
      qty: item.quantity,
      price: item.unit_price_vnd,
      image: item.image_url_snapshot || FALLBACK_IMAGE,
    })),
    subtotal: order.accepted_total_vnd,
    shipping: 0,
    total: order.accepted_total_vnd,
    paymentMethod: order.payment_method === 'COD' ? 'COD' : 'SePay',
    address: order.address.address_line,
    timeline: timeline.length
      ? timeline
      : [{ status: order.order_status, date: '', done: false, active: true }],
  }
}

export function cartResponseToUi(cart: CartResponse, variants: ProductVariant[] = []): CartItem[] {
  const byId = new Map(variants.map(variant => [variant.variant_id, variant]))
  return cart.items.map(item => {
    const variant = byId.get(item.variant_id)
    return {
      id: item.cart_item_id,
      variantId: item.variant_id,
      productId: variant?.product_id || item.variant_id,
      name: item.product_name,
      brand: item.brand_name,
      size: item.size || 'Một cỡ',
      color: item.color || 'Mặc định',
      price: item.unit_price_vnd,
      qty: item.quantity,
      image: primaryImage(variant),
      available: !variant || (variant.variant_status === 'ACTIVE' && variant.available_quantity >= item.quantity),
    }
  })
}
