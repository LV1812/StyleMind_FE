import type { DemoDatabase } from '@/app/store/types'
import type { OrderStatus, PaymentMethod, PaymentStatus } from '@/entities/order/model/types'

import type {
  AdminCustomerFilters,
  AdminCustomerRow,
  AdminDashboardSummary,
  AdminOrderFilters,
  AdminOrderRow,
  AdminProductFilters,
  AdminProductRow,
  AdminRequestSummary,
} from './adminTypes'

function includesText(value: string, query?: string) {
  if (!query?.trim()) return true
  return value.toLowerCase().includes(query.trim().toLowerCase())
}

function primaryImageUrl(product: DemoDatabase['products'][number]) {
  return product.variants.flatMap(variant => variant.images).find(image => image.isPrimary)?.url ?? product.variants[0]?.images[0]?.url ?? null
}

export function selectAdminDashboard(database: DemoDatabase): AdminDashboardSummary {
  const orderStatusCounts = new Map<OrderStatus, number>()
  const paymentCounts = new Map<string, { method: PaymentMethod; status: PaymentStatus; count: number }>()

  for (const order of database.orders) {
    orderStatusCounts.set(order.status, (orderStatusCounts.get(order.status) ?? 0) + 1)
    const paymentKey = `${order.paymentMethod}-${order.paymentStatus}`
    const current = paymentCounts.get(paymentKey)
    paymentCounts.set(paymentKey, {
      method: order.paymentMethod,
      status: order.paymentStatus,
      count: (current?.count ?? 0) + 1,
    })
  }

  const pendingCancellation = database.cancellationRequests.filter(request => request.status === 'submitted').length
  const pendingReturns = database.returnRequests.filter(request => request.status === 'submitted' || request.status === 'reviewing').length
  const aiOutfits = database.outfits.filter(outfit => outfit.source === 'ai').length
  const manualOutfits = database.outfits.filter(outfit => outfit.source === 'manual').length

  return {
    totalUsers: database.users.length,
    totalProducts: database.products.length,
    totalOrders: database.orders.length,
    totalRevenue: database.orders
      .filter(order => order.status !== 'cancelled')
      .reduce((sum, order) => sum + order.total, 0),
    pendingRequestCount: pendingCancellation + pendingReturns,
    orderStatusCounts: Array.from(orderStatusCounts, ([status, count]) => ({ status, count })),
    paymentCounts: Array.from(paymentCounts.values()),
    ai: {
      outfitsTotal: database.outfits.length || database.aiMetrics.wardrobeCount,
      aiOutfits,
      manualOutfits,
      generatedOutfits: database.aiMetrics.generatedOutfits,
      aiAddedToCart: database.aiMetrics.aiAddedToCart,
      aiOrderCount: database.aiMetrics.aiOrderCount,
      emailShares: database.wardrobeShares.filter(share => share.active).length || database.outfitShares.filter(share => share.active).length,
      publicOutfits: database.wardrobeSettings.filter(settings => settings.visibility === 'public').length || database.outfits.filter(outfit => outfit.visibility === 'public').length,
    },
  }
}

export function selectAdminProducts(database: DemoDatabase, filters: AdminProductFilters = {}): AdminProductRow[] {
  const categoryLabels = new Map(database.categories.map(category => [category.id, category.label]))

  return database.products
    .filter(product => includesText(`${product.id} ${product.name} ${product.brand}`, filters.query))
    .filter(product => !filters.categoryId || filters.categoryId === 'all' || product.categoryId === filters.categoryId)
    .filter(product => filters.status === undefined || filters.status === 'all' || (filters.status === 'active' ? product.active : !product.active))
    .map(product => {
      const colors = Array.from(new Map(product.variants.map(variant => [variant.color, { color: variant.color, colorHex: variant.colorHex }])).values())

      return {
        id: product.id,
        name: product.name,
        brand: product.brand,
        categoryLabel: categoryLabels.get(product.categoryId) ?? 'Chưa phân loại',
        basePrice: product.basePrice,
        active: product.active,
        imageUrl: primaryImageUrl(product),
        variantCount: product.variants.length,
        colors,
        variants: product.variants.map(variant => ({
          id: variant.id,
          color: variant.color,
          colorHex: variant.colorHex,
          size: variant.size,
          active: variant.active,
          price: variant.priceOverride ?? product.basePrice,
        })),
      }
    })
}

export function selectAdminOrders(database: DemoDatabase, filters: AdminOrderFilters = {}): AdminOrderRow[] {
  const users = new Map(database.users.map(user => [user.id, user.fullName]))

  return database.orders
    .filter(order => includesText(`${order.id} ${users.get(order.userId) ?? ''}`, filters.query))
    .filter(order => !filters.status || filters.status === 'all' || order.status === filters.status)
    .filter(order => !filters.paymentMethod || filters.paymentMethod === 'all' || order.paymentMethod === filters.paymentMethod)
    .map(order => ({
      id: order.id,
      customerName: users.get(order.userId) ?? 'Khách hàng',
      createdAt: order.createdAt,
      total: order.total,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    }))
}

export function selectAdminRequests(database: DemoDatabase): AdminRequestSummary {
  return {
    cancellationCount: database.cancellationRequests.length,
    returnCount: database.returnRequests.length,
    pendingCount:
      database.cancellationRequests.filter(request => request.status === 'submitted').length +
      database.returnRequests.filter(request => request.status === 'submitted' || request.status === 'reviewing').length,
  }
}

export function selectAdminCustomers(database: DemoDatabase, filters: AdminCustomerFilters = {}): AdminCustomerRow[] {
  return database.users
    .filter(user => includesText(`${user.fullName} ${user.email}`, filters.query))
    .filter(user => !filters.role || filters.role === 'all' || user.role === filters.role)
    .filter(user => !filters.status || filters.status === 'all' || user.status === filters.status)
    .map(user => ({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
      orderCount: database.orders.filter(order => order.userId === user.id).length,
      outfitCount: database.outfits.filter(outfit => outfit.ownerId === user.id).length,
      heightCm: user.heightCm,
      weightKg: user.weightKg,
    }))
}
