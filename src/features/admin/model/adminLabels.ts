import type { PaymentMethod, PaymentStatus, OrderStatus, ReturnRequest } from '@/entities/order/model/types'
import type { UserRole, UserStatus } from '@/entities/user/model/types'

export const orderStatusLabel: Record<OrderStatus, string> = {
  pending: 'Chờ xác nhận',
  payment_pending: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  shipped: 'Đang giao',
  completed: 'Hoàn tất',
  cancelled: 'Đã hủy',
}

export const paymentMethodLabel: Record<PaymentMethod, string> = {
  cod: 'Thanh toán khi nhận hàng',
  vietqr: 'VietQR',
}

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  pending: 'Chờ xử lý',
  paid: 'Đã thanh toán',
  expired: 'Hết hạn',
  failed: 'Thất bại',
}

export const userRoleLabel: Record<UserRole, string> = {
  customer: 'Khách hàng',
  admin: 'Quản trị viên',
}

export const userStatusLabel: Record<UserStatus, string> = {
  active: 'Đang hoạt động',
  locked: 'Đã khóa',
}

export const returnStatusLabel: Record<ReturnRequest['status'], string> = {
  submitted: 'Đã gửi',
  reviewing: 'Đang xem xét',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  refunded: 'Đã hoàn tiền',
}

export const cancellationStatusLabel = {
  submitted: 'Đã gửi',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
} as const
