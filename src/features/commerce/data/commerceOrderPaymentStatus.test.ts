import { expect, it } from 'vitest'
import type { OrderResponse } from '@/api/commerce.types'
import { commerceOrderToEntity } from './commerceEntityAdapters'

it('does not invent a payment status from an order status when the API does not provide one', () => {
  const response: OrderResponse = {
    order_id: 'order-1', order_number: 'ORD-1', customer_id: 'customer-1', checkout_key: 'checkout-1',
    order_status: 'COMPLETED', payment_method: 'COD', accepted_total_vnd: 120000,
    placed_at: '2026-11-01T00:00:00Z', completed_at: null,
    address: { source_address_id: 'address-1', recipient_name: 'An', recipient_phone: '123', address_line: 'Hà Nội' },
    items: [], history: [], cancellation_request: null,
  }
  expect(commerceOrderToEntity(response).paymentStatus).toBe('unknown')
})
