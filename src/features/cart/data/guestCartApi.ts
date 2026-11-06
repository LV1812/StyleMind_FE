import { commerceRequest } from '@/shared/api/commerceApi'
import { PaymentApiError } from '@/features/payments/api/paymentApi'

export interface GuestCartItem {
  cart_item_id: string
  variant_id: string
  sku: string
  product_name: string
  brand_name: string | null
  color: string | null
  size: string | null
  quantity: number
  unit_price_vnd: number
  line_total_vnd: number
}

export interface GuestCart {
  cart_id: string | null
  cart_status: string
  items: GuestCartItem[]
  total_vnd: number
}

export const emptyGuestCart = (): GuestCart => ({ cart_id: null, cart_status: 'ACTIVE', items: [], total_vnd: 0 })
export const guestCartApi = {
  get: (key: string, signal?: AbortSignal) => commerceRequest<GuestCart>('/cart', { key, signal }),
  add: (key: string, variantId: string, quantity: number) => commerceRequest<GuestCart>('/cart/items', {
    method: 'POST', key, body: { variant_id: variantId, quantity, guest_session_key: key },
  }),
  update: (key: string, itemId: string, quantity: number) => commerceRequest<GuestCart>(`/cart/items/${encodeURIComponent(itemId)}`, {
    method: 'PUT', key, body: { quantity, guest_session_key: key },
  }),
  remove: (key: string, itemId: string) => commerceRequest<void>(`/cart/items/${encodeURIComponent(itemId)}`, { method: 'DELETE', key }),
}

export function guestCartErrorMessage(error: unknown): string {
  if (!(error instanceof PaymentApiError)) return 'Chưa xác định được kết quả cập nhật giỏ hàng do mất kết nối hoặc hết thời gian chờ. Hãy tải lại giỏ để kiểm tra trước khi thêm sản phẩm lần nữa.'
  if (error.status === 401) return 'Thiếu hoặc không xác thực được phiên giỏ hàng khách.'
  if (error.status === 404) return 'Không tìm thấy sản phẩm hoặc mục giỏ hàng trong phiên này.'
  if (error.code === 'VARIANT_NOT_ACTIVE') return 'Sản phẩm không còn khả dụng. Vui lòng chọn sản phẩm khác.'
  return 'Không cập nhật được giỏ hàng. ' + error.message
}
