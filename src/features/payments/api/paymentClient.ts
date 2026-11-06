import { readIdentitySession, refreshIdentityAccessToken } from '@/shared/api/identityApi'
import { createPaymentApi, PaymentApiError } from './paymentApi'

/** Reads the current Identity session for each request, including after token rotation. */
export const paymentApi = createPaymentApi({
  getAccessToken: () => readIdentitySession()?.accessToken,
  fetch: (...args) => globalThis.fetch(...args),
  refreshAccessToken: refreshIdentityAccessToken,
})

export function paymentErrorMessage(error: unknown): string {
  if (error instanceof PaymentApiError) {
    if (error.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
    if (error.status === 400) return 'Thông tin gửi lên chưa hợp lệ. Vui lòng kiểm tra lại dữ liệu nhập.'
    if (error.status === 403) return 'Bạn không có quyền thực hiện thao tác này.'
    if (error.status === 404) return 'Không tìm thấy dữ liệu hoặc đơn hàng không thuộc tài khoản của bạn.'
    const messages: Record<string, string> = {
      EMPTY_CART: 'Giỏ hàng trên hệ thống đang trống. Vui lòng thêm sản phẩm trước khi thanh toán.',
      DUPLICATE_CHECKOUT: 'Lần đặt hàng này đã được xử lý hoặc kết quả chưa xác định. Không tạo lại đơn với mã mới.',
      INSUFFICIENT_STOCK: 'Số lượng sản phẩm không còn đủ. Hãy tải lại giỏ và điều chỉnh số lượng.',
      PAYMENT_UNAVAILABLE: 'Đơn hàng đã được lưu nhưng chưa hoàn tất bước thanh toán. Vui lòng thử khôi phục trên cùng đơn.',
      PAYMENT_DELIVERY_UNKNOWN: 'Chưa xác định được kết quả thanh toán. Hãy kiểm tra lại trên cùng đơn hàng.',
      ORDER_NOT_PAYABLE: 'Đơn hàng không còn ở trạng thái có thể lấy mã thanh toán.',
      PAYMENT_METHOD_MISMATCH: 'Phương thức thanh toán không khớp.',
      PAYMENT_AMOUNT_MISMATCH: 'Số tiền thu phải bằng đúng số tiền của đơn hàng.',
      PAYMENT_ATTEMPT_NOT_PENDING: 'Khoản thanh toán không còn chờ thu. Không ghi nhận lại.',
      PAYMENT_ALREADY_CONFIRMED: 'Khoản thanh toán đã được ghi nhận. Không ghi nhận lại.',
      INVALID_REQUEST: 'Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.',
    }
    return messages[error.code] ?? 'Không thể xử lý yêu cầu. Vui lòng kiểm tra lại trạng thái đơn hàng.'
  }
  return 'Không kết nối được máy chủ. Chưa xác định được kết quả yêu cầu.'
}

export const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
