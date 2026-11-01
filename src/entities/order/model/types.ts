import type { AddressSnapshot } from '@/entities/address/model/types'

export type PaymentMethod = 'cod' | 'vietqr'
export type PaymentStatus = 'pending' | 'paid' | 'expired' | 'failed'
export type OrderStatus =
  | 'pending'
  | 'payment_pending'
  | 'paid'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'completed'
  | 'cancelled'

export interface OrderItemSnapshot {
  productId: string
  variantId: string
  name: string
  brand: string
  color: string
  size: string
  quantity: number
  unitPrice: number
  imageUrl: string
}

export interface OrderTimelineItem {
  id: string
  label: string
  at: string
}

export interface Order {
  id: string
  userId: string
  status: OrderStatus
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  paymentReference: string | null
  items: OrderItemSnapshot[]
  shippingAddress: AddressSnapshot
  subtotal: number
  discount: number
  shipping: number
  total: number
  createdAt: string
  timeline: OrderTimelineItem[]
}

export interface CancellationRequest {
  id: string
  orderId: string
  userId: string
  reason: string
  status: 'submitted' | 'approved' | 'rejected'
  createdAt: string
  reviewedBy?: string
  reviewedAt?: string
  adminNote?: string
}

export interface ReturnRequest {
  id: string
  orderId: string
  userId: string
  reason: string
  items: Pick<OrderItemSnapshot, 'productId' | 'variantId' | 'quantity'>[]
  status: 'submitted' | 'reviewing' | 'approved' | 'rejected' | 'refunded'
  createdAt: string
  reviewedBy?: string
  reviewedAt?: string
  adminNote?: string
}
