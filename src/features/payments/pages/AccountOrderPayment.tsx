import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth'
import GuestPaymentView from '@/features/checkout/components/GuestPaymentView'
import useOrderPayment from '../model/useOrderPayment'
import { accountDraftKey } from '@/features/checkout/model/accountCheckout'
import OrderDetailSections from '@/features/orders/components/OrderDetailSections'
import type { OrderResponse } from '../api/types'

export default function AccountOrderPayment({ orderId }: { orderId: string }) {
  const { currentUser } = useAuth()
  const payment = useOrderPayment('account', orderId, currentUser?.id)
  const [failedAttempt, setFailedAttempt] = useState<string | null>(null)
  const [cancelledOrder, setCancelledOrder] = useState<OrderResponse | null>(null)
  const imageFailed = Boolean(payment.attempt && failedAttempt === payment.attempt.id)
  useEffect(() => {
    if (!payment.order || !currentUser) return
    try {
      const key = accountDraftKey(currentUser.id)
      if (JSON.parse(localStorage.getItem(key) ?? 'null')?.orderId === orderId) localStorage.removeItem(key)
    } catch { /* Keep unrelated drafts. */ }
  }, [payment.order, currentUser, orderId])
  return <>
    {payment.pollTimedOut && !cancelledOrder && <p role="status" className="mx-auto max-w-6xl px-5 pt-6 text-sm text-warning-ink">Đã dừng cập nhật tự động sau khoảng chờ. Chưa nhận được xác nhận không có nghĩa giao dịch thất bại; bạn có thể kiểm tra trạng thái thủ công.</p>}
    <GuestPaymentView ownerType="account" orderId={orderId} {...payment} order={cancelledOrder ?? payment.order} pending={cancelledOrder ? false : payment.pending} showQr={cancelledOrder ? false : payment.showQr} imageFailed={imageFailed} onImageError={() => setFailedAttempt(payment.attempt?.id ?? null)} onRecover={() => { setFailedAttempt(null); payment.recover() }} onRefresh={payment.refresh} />
    {(cancelledOrder ?? payment.order) && <OrderDetailSections order={(cancelledOrder ?? payment.order)!} onRefresh={payment.refresh} onCancelled={setCancelledOrder} />}
  </>
}
