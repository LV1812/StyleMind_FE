export type PaymentMethod = 'COD' | 'SEPAY_VIETQR'
export type PaymentAttemptStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'EXCEPTION'

export interface PaymentAttempt {
  id: string
  orderId: string
  method: PaymentMethod
  amountVnd: number
  reference: string
  status: PaymentAttemptStatus
  expiresAt: string | null
  transferContent: string | null
  /** URL of the bank QR image; display directly, do not encode it into another QR. */
  qrPayload: string | null
}

export interface CheckoutRequest {
  checkout_key: string
  shipping_address_id: string
  payment_method: PaymentMethod
}

export interface OrderResponse {
  order_id: string
  order_number: string
  customer_id: string | null
  checkout_key: string
  order_status: string
  payment_method: PaymentMethod
  accepted_total_vnd: number
  placed_at: string
  completed_at: string | null
  address: {
    source_address_id: string | null
    recipient_name: string
    recipient_phone: string
    address_line: string
  }
  items: Array<{
    order_item_id: string
    variant_id: string
    sku_snapshot: string
    product_name_snapshot: string
    brand_name_snapshot: string | null
    color_snapshot: string | null
    size_snapshot: string | null
    material_snapshot: string | null
    image_url_snapshot: string | null
    quantity: number
    unit_price_vnd: number
    line_total_vnd: number
  }>
  history: Array<{
    history_id: string
    from_status: string | null
    to_status: string
    actor_user_id: string | null
    changed_at: string
    reason: string | null
  }>
  cancellation_request: {
    cancellation_request_id: string
    order_id: string
    requested_by_user_id: string
    reason: string
    request_status: string
    requested_at: string
    reviewed_by_user_id: string | null
    reviewed_at: string | null
    decision_reason: string | null
  } | null
}

export interface CodCollectionRequest {
  payment_attempt_id: string
  collected_amount_vnd: number
  collection_reference?: string | null
  collected_at?: string | null
}

export interface PaymentException {
  exception_id: string
  payment_attempt_id: string | null
  provider_name: string
  provider_event_id: string
  received_reference: string | null
  received_amount_vnd: number
  exception_reason: string
  reconciliation_status: string
  reviewed_by_user_id: string | null
  detected_at: string
}

export interface PaymentExceptionQuery {
  status?: string
  limit?: number
  offset?: number
}

export interface PaymentExceptionList {
  items: PaymentException[]
  limit: number
  offset: number
}
