import type { DemoDatabase } from '@/app/store/types'
import type { Address, AddressSnapshot } from '@/entities/address/model/types'
import type { Order, PaymentMethod, PaymentStatus } from '@/entities/order/model/types'
import { selectCartDetails, selectCartTotals } from '@/features/cart'

import type { QrSession } from '../model/checkoutMachine'

export type { QrSession } from '../model/checkoutMachine'

export const CHECKOUT_QR_SESSION_KEY = 'stylemind.checkout.qr-session'
export const CHECKOUT_LATEST_ORDER_KEY = 'stylemind.checkout.latest-order'

export interface PlaceOrderInput {
  database: DemoDatabase
  userId: string
  addressId: string
  discountCode?: string
  now?: string
}

export interface CreateQrInput extends PlaceOrderInput {}

function yyyymmdd(date: Date) {
  return date.toISOString().slice(0, 10).replace(/-/g, '')
}

function nextOrderId(database: DemoDatabase, now: string) {
  const prefix = `ORD-${yyyymmdd(new Date(now))}`
  const sequence = database.orders.filter(order => order.id.startsWith(prefix)).length + 1
  return `${prefix}-${String(sequence).padStart(3, '0')}`
}

function addressSnapshot(address: Address): AddressSnapshot {
  const { userId: _userId, isDefault: _isDefault, ...snapshot } = address
  return snapshot
}

function findAddress(database: DemoDatabase, userId: string, addressId: string) {
  return database.addresses.find(address => address.id === addressId && address.userId === userId)
}

function createOrder(
  input: PlaceOrderInput,
  payment: { method: PaymentMethod; status: PaymentStatus; reference: string | null; orderStatus?: Order['status'] },
): Order {
  const now = input.now ?? new Date().toISOString()
  const address = findAddress(input.database, input.userId, input.addressId)
  const details = selectCartDetails(input.database)
  const totals = selectCartTotals(input.database, { discountCode: input.discountCode })

  if (!address) throw new Error('Không tìm thấy địa chỉ giao hàng')
  if (details.length === 0) throw new Error('Giỏ hàng của bạn đang trống')

  return {
    id: nextOrderId(input.database, now),
    userId: input.userId,
    status: payment.orderStatus ?? (payment.method === 'vietqr' ? 'paid' : 'pending'),
    paymentMethod: payment.method,
    paymentStatus: payment.status,
    paymentReference: payment.reference,
    items: details.map(detail => ({
      productId: detail.product.id,
      variantId: detail.variant.id,
      name: detail.product.name,
      brand: detail.product.brand,
      color: detail.variant.color,
      size: detail.variant.size,
      quantity: detail.quantity,
      unitPrice: detail.unitPrice,
      imageUrl: detail.image?.url ?? '',
    })),
    shippingAddress: addressSnapshot(address),
    subtotal: totals.subtotal,
    discount: totals.discount,
    shipping: totals.shipping,
    total: totals.total,
    createdAt: now,
    timeline: [
      {
        id: `timeline-${payment.method}-${now}`,
        label: payment.method === 'vietqr' ? 'Đang chờ thanh toán VietQR' : 'Đã tạo đơn COD',
        at: now,
      },
    ],
  }
}

export async function placeCodOrder(input: PlaceOrderInput): Promise<Order> {
  return createOrder(input, { method: 'cod', status: 'pending', reference: null })
}

export async function createQrSession(input: CreateQrInput): Promise<QrSession> {
  const now = new Date(input.now ?? new Date().toISOString())
  const totals = selectCartTotals(input.database, { discountCode: input.discountCode })
  const id = `qr-${now.getTime().toString(36)}-${Math.random().toString(16).slice(2, 8)}`
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString()
  const pendingOrder = createOrder(input, {
    method: 'vietqr',
    status: 'pending',
    reference: id,
    orderStatus: 'payment_pending',
  })

  return {
    id,
    amount: totals.total,
    transferContent: `STYLEMIND ${id}`,
    expiresAt,
    orderId: null,
    pendingOrder,
  }
}

export async function confirmQrPayment(session: QrSession, database: DemoDatabase): Promise<Order> {
  const existingOrder = database.orders.find(order => order.paymentReference === session.id)
  if (existingOrder) return existingOrder

  if (session.pendingOrder) {
    const now = new Date().toISOString()
    return {
      ...session.pendingOrder,
      status: 'paid',
      paymentStatus: 'paid',
      timeline: [
        ...session.pendingOrder.timeline,
        {
          id: `timeline-vietqr-confirmed-${now}`,
          label: 'Đã thanh toán VietQR',
          at: now,
        },
      ],
    }
  }

  const userId = database.session?.userId
  const address = userId ? database.addresses.find(item => item.userId === userId && item.isDefault) : null
  if (!userId || !address) throw new Error('Thiếu thông tin giao hàng')

  return createOrder(
    {
      database,
      userId,
      addressId: address.id,
      now: new Date().toISOString(),
    },
    { method: 'vietqr', status: 'paid', reference: session.id },
  )
}
