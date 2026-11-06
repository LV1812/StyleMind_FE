import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import GuestPaymentView from '../components/GuestPaymentView'
import useOrderPayment from '@/features/payments/model/useOrderPayment'
import { useGuestCommerce } from '@/features/cart/model/GuestCommerceProvider'
import { GUEST_CHECKOUT_DRAFT } from '../model/guestCheckout'

export default function GuestOrderPage() {
 const { orderId = '' } = useParams()
 const payment = useOrderPayment('guest', orderId)
 const { refreshCart } = useGuestCommerce()
 const [failedAttempt, setFailedAttempt] = useState<string | null>(null)
  const imageFailed = Boolean(payment.attempt && failedAttempt === payment.attempt.id)
 useEffect(() => {
  if (!payment.order) return
  for (const storage of [sessionStorage, localStorage]) {
   try { if (JSON.parse(storage.getItem(GUEST_CHECKOUT_DRAFT) ?? 'null')?.orderId === orderId) { storage.removeItem(GUEST_CHECKOUT_DRAFT); void refreshCart().catch(() => undefined) } } catch {}
  }
  try { if (JSON.parse(localStorage.getItem(GUEST_CHECKOUT_DRAFT + '.meta') ?? 'null')?.orderId === orderId) localStorage.removeItem(GUEST_CHECKOUT_DRAFT + '.meta') } catch {}
 }, [payment.order, orderId, refreshCart])
 return <GuestPaymentView orderId={orderId} {...payment} error={payment.pollTimedOut ? payment.error || 'Đã dừng cập nhật tự động sau khoảng chờ. Chưa nhận được xác nhận không có nghĩa giao dịch thất bại; hãy kiểm tra trạng thái thủ công.' : payment.error} imageFailed={imageFailed} onImageError={() => setFailedAttempt(payment.attempt?.id ?? null)} onRecover={() => { setFailedAttempt(null); payment.recover() }} onRefresh={payment.refresh} />
}
