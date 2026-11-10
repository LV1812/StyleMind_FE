import { PaymentApiError } from "@/features/payments/api/paymentApi"
import type { GuestCartItem } from '@/features/cart/data/guestCartApi'
import type {
  OrderResponse,
  PaymentAttempt,
  PaymentMethod,
  QrCheckout,
} from "@/features/payments/api/types"

export interface GuestShippingAddress {
  recipient_name: string
  recipient_phone: string
  address_line: string
}

export interface GuestCheckoutRequest {
  checkout_key: string
  payment_method: PaymentMethod
  shipping_address: GuestShippingAddress
}

export interface GuestPrices {
  items: GuestCartItem[]
  total_vnd: number
}

const gateway = (
  import.meta.env.VITE_API_GATEWAY_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  ""
).replace(/\/+$/, "")

async function request<T>(
  key: string | null,
  path: string,
  method: "GET" | "POST",
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  if (!key) throw new PaymentApiError(401, { code: "GUEST_SESSION_REQUIRED" })
  const timeout = new AbortController()
  const timer = setTimeout(() => timeout.abort(), 20000)
  try {
    const response = await fetch(`${gateway}/commerce/api/v1/guest${path}`, {
      method,
      signal: signal
        ? AbortSignal.any([signal, timeout.signal])
        : timeout.signal,
      credentials: "omit",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "X-Guest-Session-Key": key,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    if (!response.ok) {
      let problem = {}
      try {
        const value: unknown = await response.json()
        if (value && typeof value === "object" && !Array.isArray(value))
          problem = value
      } catch {
        /* Gateway may return no JSON. */
      }
      throw new PaymentApiError(response.status, problem)
    }
    return (await response.json()) as T
  } finally {
    clearTimeout(timer)
  }
}

export const guestCheckoutApi = {
  prepareQrSelection: (key: string, body: GuestCheckoutRequest & { cart_item_ids: string[] }) => request<QrCheckout>(key, '/qr-checkouts/selected', 'POST', body),
  prepareQrBuyNow: (key: string, body: GuestCheckoutRequest & { variant_id: string; quantity: number }) => request<QrCheckout>(key, '/qr-checkouts/buy-now', 'POST', body),
  recoverQr: (key: string | null, checkoutKey: string) => request<QrCheckout>(key, '/qr-checkouts/recover', 'POST', { checkout_key: checkoutKey }),
  getQr: (key: string | null, id: string, signal?: AbortSignal) => request<QrCheckout>(key, `/qr-checkouts/${encodeURIComponent(id)}`, 'GET', undefined, signal),
  qrAttempt: (key: string | null, id: string, signal?: AbortSignal) => request<PaymentAttempt>(key, `/qr-checkouts/${encodeURIComponent(id)}/payment-attempt`, 'POST', undefined, signal),
  cancelQr: (key: string | null, id: string) => request<QrCheckout>(key, `/qr-checkouts/${encodeURIComponent(id)}/cancel`, 'POST'),
  prices: (key: string | null, signal?: AbortSignal) =>
    request<GuestPrices>(key, "/checkout/prices", "GET", undefined, signal),
  createOrder: (key: string, body: GuestCheckoutRequest) =>
    request<OrderResponse>(key, "/orders", "POST", body),
  previewSelection: (key: string | null, body: { cart_item_ids: string[] }, signal?: AbortSignal) =>
    request<GuestPrices>(key, '/checkout/selected/prices', 'POST', body, signal),
  previewBuyNow: (key: string | null, body: { variant_id: string; quantity: number }, signal?: AbortSignal) =>
    request<GuestPrices>(key, '/checkout/buy-now/prices', 'POST', body, signal),
  checkoutSelection: (key: string, body: GuestCheckoutRequest & { cart_item_ids: string[] }) =>
    request<OrderResponse>(key, '/orders/selected', 'POST', body),
  checkoutBuyNow: (key: string, body: GuestCheckoutRequest & { variant_id: string; quantity: number }) =>
    request<OrderResponse>(key, '/orders/buy-now', 'POST', body),
  recoverCheckout: (key: string | null, checkoutKey: string) => request<OrderResponse>(key, '/checkout/recover', 'POST', { checkout_key: checkoutKey }),
  getOrder: (key: string | null, id: string, signal?: AbortSignal) =>
    request<OrderResponse>(
      key,
      `/orders/${encodeURIComponent(id)}`,
      "GET",
      undefined,
      signal,
    ),
  paymentAttempt: (key: string | null, id: string, signal?: AbortSignal) =>
    request<PaymentAttempt>(
      key,
      `/orders/${encodeURIComponent(id)}/payment-attempt`,
      "POST",
      undefined,
      signal,
    ),
}

export function guestErrorMessage(error: unknown): string {
  if (error instanceof PaymentApiError) {
    if (error.code === 'INVALID_CART_ITEM') return 'Sản phẩm đã chọn không còn trong giỏ hoặc không còn bán. Hãy tải lại giỏ và chọn lại.'
    if (error.code === 'EMPTY_CART') return 'Giỏ hàng trên hệ thống đang trống. Vui lòng quay lại cửa hàng và thêm sản phẩm trước khi thanh toán.'
    if (error.code === 'DUPLICATE_CHECKOUT') return 'Lần checkout này đã được xử lý hoặc kết quả chưa xác định. Không tạo lại đơn bằng mã mới. Hãy kiểm tra đơn đã lưu hoặc liên hệ hỗ trợ.'
    if (error.code === 'INSUFFICIENT_STOCK') return 'Số lượng sản phẩm không còn đủ. Giỏ và giá đã được tải lại; hãy điều chỉnh số lượng trong giỏ.'
    if (['PAYMENT_UNAVAILABLE', 'PAYMENT_DELIVERY_UNKNOWN'].includes(error.code)) return 'Đơn đã được lưu nhưng bước thanh toán chưa được xác nhận. Hãy kiểm tra trạng thái hoặc khôi phục thanh toán trên cùng đơn.'
    if (error.status >= 500) return 'Hệ thống chưa phản hồi kết quả chắc chắn. Giữ nguyên đơn và mã checkout; hãy kiểm tra lại hoặc thử lại cùng yêu cầu.'
    if (error.status === 400)
      return (
        "Dữ liệu yêu cầu chưa hợp lệ. Vui lòng kiểm tra thông tin đã nhập. " +
        error.message
      )
    if (error.status === 401)
      return "Thiếu hoặc không xác thực được phiên khách. Hãy dùng đúng trình duyệt đã tạo giỏ hàng và đơn hàng."
    if (error.status === 403) return 'Phiên khách không có quyền thực hiện thao tác này. Vui lòng liên hệ hỗ trợ.'
    if (error.status === 404)
      return "Không tìm thấy đơn hàng hoặc phiên khách không có quyền truy cập."
    if (error.status === 409) return "Yêu cầu xung đột. " + error.message
    return "Không xử lý được yêu cầu. " + error.message
  }
  return "Mất kết nối hoặc hết thời gian chờ. Chưa xác định được kết quả; hãy thử lại cùng lần checkout, không tạo đơn mới."
}
