import { describe, expect, it } from 'vitest'

import { createDemoSeed } from '@/app/data/demoSeed'
import { selectAdminDashboard } from '@/features/admin/model/adminSelectors'

import { demoReducer, normalizeDemoDatabase } from './demoReducer'

describe('demoReducer', () => {
  it('keeps cart quantity when product and variant are active', () => {
    const state = createDemoSeed()
    const next = demoReducer(state, {
      type: 'cart/lineAdded',
      payload: { productId: 'prd-blouse-01', variantId: 'var-blouse-white-m', quantity: 999, source: 'shop' },
    })

    expect(next.cartLines[0]?.quantity).toBe(999)
  })

  it('clears a session whose user no longer exists', () => {
    const state = { ...createDemoSeed(), session: { userId: 'missing-user', persistent: true } }

    expect(normalizeDemoDatabase(state).session).toBeNull()
  })

  it('prevents an admin from locking the current admin account', () => {
    const state = { ...createDemoSeed(), session: { userId: 'usr-admin-01', persistent: true } }
    const next = demoReducer(state, {
      type: 'admin/userStatusChanged',
      payload: { userId: 'usr-admin-01', status: 'locked', actorId: 'usr-admin-01' },
    })

    expect(next.users.find(user => user.id === 'usr-admin-01')?.status).toBe('active')
  })

  it('toggles products and variants for customer eligibility', () => {
    const state = demoReducer(createDemoSeed(), {
      type: 'cart/lineAdded',
      payload: { productId: 'prd-blouse-01', variantId: 'var-blouse-white-m', quantity: 2, source: 'shop' },
    })

    const productInactive = demoReducer(state, {
      type: 'admin/productStatusChanged',
      payload: { productId: 'prd-blouse-01', active: false },
    })

    expect(productInactive.products.find(product => product.id === 'prd-blouse-01')?.active).toBe(false)
    expect(productInactive.cartLines).toHaveLength(0)

    const withCartAgain = demoReducer(createDemoSeed(), {
      type: 'cart/lineAdded',
      payload: { productId: 'prd-blouse-01', variantId: 'var-blouse-white-m', quantity: 1, source: 'shop' },
    })
    const variantInactive = demoReducer(withCartAgain, {
      type: 'admin/variantStatusChanged',
      payload: { productId: 'prd-blouse-01', variantId: 'var-blouse-white-m', active: false },
    })

    const variant = variantInactive.products
      .find(product => product.id === 'prd-blouse-01')
      ?.variants.find(item => item.id === 'var-blouse-white-m')
    expect(variant?.active).toBe(false)
    expect(variantInactive.cartLines).toHaveLength(0)
  })

  it('reviews a cancellation request and notifies the customer', () => {
    const state = createDemoSeed()
    const request = state.cancellationRequests[0]

    const next = demoReducer(state, {
      type: 'admin/cancellationReviewed',
      payload: {
        requestId: request.id,
        decision: 'approved',
        reviewerId: 'usr-admin-01',
        reviewedAt: '2026-10-05T07:00:00.000Z',
        note: 'Đủ điều kiện hủy trước khi xử lý',
      },
    })

    const reviewedRequest = next.cancellationRequests.find(item => item.id === request.id)
    const order = next.orders.find(item => item.id === request.orderId)
    const notification = next.notifications.find(item => item.link === `/orders/${request.orderId}` && item.title.includes('hủy'))

    expect(reviewedRequest).toMatchObject({
      status: 'approved',
      reviewedBy: 'usr-admin-01',
      reviewedAt: '2026-10-05T07:00:00.000Z',
      adminNote: 'Đủ điều kiện hủy trước khi xử lý',
    })
    expect(order?.status).toBe('cancelled')
    expect(order?.timeline.at(-1)?.label).toContain('hủy')
    expect(notification).toMatchObject({ userId: request.userId, type: 'order', read: false })
  })

  it('reviews a return request and records refund state', () => {
    const state = createDemoSeed()
    const request = state.returnRequests[0]

    const next = demoReducer(state, {
      type: 'admin/returnReviewed',
      payload: {
        requestId: request.id,
        decision: 'refunded',
        reviewerId: 'usr-admin-01',
        reviewedAt: '2026-10-05T08:00:00.000Z',
        note: 'Đã hoàn tiền qua phương thức thanh toán ban đầu',
      },
    })

    const reviewedRequest = next.returnRequests.find(item => item.id === request.id)
    const notification = next.notifications.find(item => item.link === `/orders/${request.orderId}` && item.title.includes('hoàn tiền'))

    expect(reviewedRequest).toMatchObject({
      status: 'refunded',
      reviewedBy: 'usr-admin-01',
      reviewedAt: '2026-10-05T08:00:00.000Z',
      adminNote: 'Đã hoàn tiền qua phương thức thanh toán ban đầu',
    })
    expect(notification).toMatchObject({ userId: request.userId, type: 'order', read: false })
  })

  it('marks payment paid when an admin moves an order to paid', () => {
    const state = {
      ...createDemoSeed(),
      orders: createDemoSeed().orders.map(order =>
        order.id === 'ORD-ADM-1001' ? { ...order, status: 'payment_pending' as const, paymentStatus: 'pending' as const } : order,
      ),
    }

    const next = demoReducer(state, {
      type: 'admin/orderStatusChanged',
      payload: { orderId: 'ORD-ADM-1001', status: 'paid', at: '2026-10-05T09:00:00.000Z' },
    })

    expect(next.orders.find(order => order.id === 'ORD-ADM-1001')).toMatchObject({
      status: 'paid',
      paymentStatus: 'paid',
    })
  })

  it('summarizes admin dashboard metrics from the demo database', () => {
    const summary = selectAdminDashboard(createDemoSeed())

    expect(summary.totalUsers).toBe(3)
    expect(summary.totalProducts).toBeGreaterThanOrEqual(12)
    expect(summary.totalOrders).toBeGreaterThanOrEqual(2)
    expect(summary.totalRevenue).toBeGreaterThan(0)
    expect(summary.pendingRequestCount).toBeGreaterThanOrEqual(2)
    expect(summary.ai.outfitsTotal).toBeGreaterThan(0)
  })
})
