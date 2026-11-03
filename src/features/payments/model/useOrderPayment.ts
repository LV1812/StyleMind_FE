import { useCallback, useEffect, useRef, useState } from 'react'
import { guestCheckoutApi, guestErrorMessage } from '@/features/checkout/data/guestCheckoutApi'
import { readGuestSessionKey } from '@/features/cart/model/guestSession'
import { paymentApi, paymentErrorMessage } from '../api/paymentClient'
import { PaymentApiError } from '../api/paymentApi'
import type { OrderResponse, PaymentAttempt } from '../api/types'
import { rememberOrder } from './orderReferences'

export const PAYMENT_POLL_INTERVAL_MS = 5000
export const PAYMENT_POLL_WINDOW_MS = 15 * 60 * 1000

export default function useOrderPayment(owner: 'guest' | 'account', orderId: string, accountId?: string) {
  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [attempt, setAttempt] = useState<PaymentAttempt | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [pollStopped, setPollStopped] = useState(false)
  const [pollTimedOut, setPollTimedOut] = useState(false)
  const [now, setNow] = useState(Date.now())
  const lifetime = useRef<AbortController | null>(null)
  const locked = useRef(false)
  const reading = useRef(false)
  const key = useRef<string | null>(null)
  const deadline = useRef(0)
  const message = owner === 'guest' ? guestErrorMessage : paymentErrorMessage

  const getOrder = useCallback((signal: AbortSignal) => owner === 'guest'
    ? guestCheckoutApi.getOrder(key.current, orderId, signal)
    : paymentApi.getOrder(orderId, { signal }), [owner, orderId])
  const getAttempt = useCallback((signal: AbortSignal) => owner === 'guest'
    ? guestCheckoutApi.paymentAttempt(key.current, orderId, signal)
    : paymentApi.getOrderPaymentAttempt(orderId, { signal }), [owner, orderId])

  const loadAttempt = useCallback(async (signal: AbortSignal) => {
    try {
      const payment = await getAttempt(signal)
      if (signal.aborted) return
      setAttempt(payment)
      rememberOrder({ orderId, owner, accountId, attemptId: payment.id })
      if (payment.status === 'PAID' || payment.method === 'COD' || !payment.method) {
        const latest = await getOrder(signal)
        if (!signal.aborted) setOrder(latest)
      }
    } catch (failure) {
      if (signal.aborted) return
      if (failure instanceof PaymentApiError && failure.code === 'ORDER_NOT_PAYABLE') {
        const latest = await getOrder(signal)
        if (signal.aborted) return
        setOrder(latest)
        if (latest.order_status !== 'PENDING_PAYMENT') return
      }
      throw failure
    }
  }, [getAttempt, getOrder, orderId, owner, accountId])

  useEffect(() => {
    const controller = new AbortController()
    lifetime.current = controller
    key.current = owner === 'guest' ? readGuestSessionKey() : null
    deadline.current = Date.now() + PAYMENT_POLL_WINDOW_MS
    setOrder(null); setAttempt(null); setError(''); setPollStopped(false); setPollTimedOut(false)
    locked.current = true; setBusy(true)
    void (async () => {
      try {
        const latest = await getOrder(controller.signal)
        if (controller.signal.aborted) return
        setOrder(latest)
        rememberOrder({ orderId, owner, accountId })
        if (latest.order_status === 'PENDING_PAYMENT') await loadAttempt(controller.signal)
      } catch (failure) {
        if (!controller.signal.aborted) {
          setError(message(failure))
          if (failure instanceof PaymentApiError && [401, 403, 404].includes(failure.status)) setPollStopped(true)
        }
      } finally {
        if (!controller.signal.aborted) { locked.current = false; setBusy(false) }
      }
    })()
    return () => controller.abort()
  }, [getOrder, loadAttempt, orderId, owner, accountId, message])

  const pending = order?.order_status === 'PENDING_PAYMENT'
  const blockedAttempt = attempt?.status === 'CANCELLED' || attempt?.status === 'EXCEPTION'
  useEffect(() => {
    if (!pending || pollStopped || blockedAttempt) return
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout>
    const check = async () => {
      if (Date.now() >= deadline.current) { setPollStopped(true); setPollTimedOut(true); return }
      if (document.visibilityState === 'hidden' || locked.current) { timer = setTimeout(check, PAYMENT_POLL_INTERVAL_MS); return }
      let again = true
      reading.current = true
      try {
        const latest = await getOrder(controller.signal)
        again = latest.order_status === 'PENDING_PAYMENT'
        if (!controller.signal.aborted) setOrder(latest)
      } catch (failure) {
        again = false
        if (!controller.signal.aborted) { setError(message(failure)); setPollStopped(true) }
      } finally {
        reading.current = false
        if (!controller.signal.aborted && again) timer = setTimeout(check, PAYMENT_POLL_INTERVAL_MS)
      }
    }
    timer = setTimeout(check, PAYMENT_POLL_INTERVAL_MS)
    return () => { controller.abort(); clearTimeout(timer) }
  }, [pending, blockedAttempt, pollStopped, getOrder, message])

  useEffect(() => {
    setNow(Date.now())
    if (!pending || !attempt?.expiresAt) return
    const timer = setInterval(() => {
      setNow(Date.now())
      if (Date.now() >= Date.parse(attempt.expiresAt!)) clearInterval(timer)
    }, 1000)
    return () => clearInterval(timer)
  }, [pending, attempt?.expiresAt])

  const perform = useCallback(async (recover: boolean) => {
    const controller = lifetime.current
    if (locked.current || reading.current || !controller || controller.signal.aborted) return
    locked.current = true; setBusy(true); setError('')
    try {
      // Checking status is always GET-only. Recovery never creates another order.
      const latest = await getOrder(controller.signal)
      if (controller.signal.aborted) return
      setOrder(latest)
      if (recover && latest.order_status === 'PENDING_PAYMENT') await loadAttempt(controller.signal)
    } catch (failure) {
      if (!controller.signal.aborted) setError(message(failure))
    } finally {
      if (!controller.signal.aborted) { locked.current = false; setBusy(false) }
    }
  }, [getOrder, loadAttempt, message])

  const expires = attempt?.expiresAt ? Date.parse(attempt.expiresAt) : NaN
  const remaining = Number.isFinite(expires) ? Math.max(0, Math.ceil((expires - now) / 1000)) : null
  const expired = attempt?.status === 'EXPIRED' || remaining === 0
  return {
    order, attempt, error, busy, pending, expired, pollTimedOut,
    countdownSeconds: expired ? 0 : remaining,
    showQr: pending && order?.payment_method === 'SEPAY_VIETQR' && attempt?.status === 'PENDING' && !expired,
    refresh: () => void perform(false), recover: () => void perform(true),
  }
}
