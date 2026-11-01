import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useMemo, useReducer, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { useDemoStore } from '@/app/store/DemoStoreProvider'
import { formatCurrency } from '@/shared/lib/formatCurrency'
import { wait } from '@/shared/lib/wait'
import { Button, EmptyState } from '@/shared/ui'

import { CHECKOUT_LATEST_ORDER_KEY, CHECKOUT_QR_SESSION_KEY, confirmQrPayment, type QrSession } from '../data/checkoutRepository'
import { checkoutReducer, type CheckoutState } from '../model/checkoutMachine'

function readQrSession(): QrSession | null {
  const raw = window.sessionStorage.getItem(CHECKOUT_QR_SESSION_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as QrSession
  } catch {
    return null
  }
}

function initialState(session: QrSession | null): CheckoutState {
  if (!session) return { status: 'failed', qrSession: null, orderId: null, error: 'Không tìm thấy phiên thanh toán' }
  return { status: 'waiting_payment', qrSession: session, orderId: session.orderId, error: null }
}

function secondsLeft(expiresAt: string, now: Date) {
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - now.getTime()) / 1000))
}

export function QrPaymentPage() {
  const navigate = useNavigate()
  const { state, dispatch } = useDemoStore()
  const [session] = useState(() => readQrSession())
  const [machine, send] = useReducer(checkoutReducer, session, initialState)
  const [now, setNow] = useState(() => new Date())
  const remainingSeconds = useMemo(
    () => (machine.qrSession ? secondsLeft(machine.qrSession.expiresAt, now) : 0),
    [machine.qrSession, now],
  )

  useEffect(() => {
    const tick = () => {
      const nextNow = new Date()
      setNow(nextNow)
      send({ type: 'clock/ticked', payload: { now: nextNow.toISOString() } })
    }

    tick()
    const intervalId = window.setInterval(tick, 1000)
    return () => window.clearInterval(intervalId)
  }, [])

  if (!machine.qrSession) {
    return (
      <div className="mx-auto max-w-[var(--container-wide)] px-5 py-12 md:px-8">
        <EmptyState title="Không tìm thấy phiên thanh toán" description="Hãy quay lại checkout để tạo mã QR mới." />
      </div>
    )
  }

  const expired = machine.status === 'expired'
  const verifying = machine.status === 'verifying'

  const handleConfirm = async () => {
    const activeSession = machine.qrSession
    if (!activeSession || expired || verifying) return
    send({ type: 'payment/verifying' })
    await wait(900)
    const order = await confirmQrPayment(activeSession, state)
    dispatch({ type: 'order/placed', payload: order })
    window.sessionStorage.setItem(CHECKOUT_LATEST_ORDER_KEY, JSON.stringify(order))
    const nextSession = { ...activeSession, orderId: order.id }
    window.sessionStorage.setItem(CHECKOUT_QR_SESSION_KEY, JSON.stringify(nextSession))
    send({ type: 'payment/confirmed', payload: { orderId: order.id } })
    navigate(ROUTES.orderSuccess.replace(':orderId', order.id))
  }

  return (
    <div className="mx-auto grid max-w-[var(--container-wide)] gap-8 px-5 py-8 md:px-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(320px,0.6fr)]">
      <section className="grid gap-5 rounded-lg bg-[#FDFCFA] p-5 shadow-[0_18px_36px_rgba(58,54,50,0.08)]">
        <div>
          <p className="text-sm font-semibold text-[#684B5A]">Thanh toán VietQR</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-[#222222]">
            {expired ? 'Thanh toán đã hết hạn' : 'Quét mã để thanh toán'}
          </h1>
        </div>
        {!expired && (
          <div className="grid place-items-center rounded-lg bg-white p-6">
            <QRCodeSVG value={`${machine.qrSession.transferContent}|${machine.qrSession.amount}`} size={220} />
          </div>
        )}
        {expired ? (
          <Button variant="secondary" onClick={() => navigate(ROUTES.checkout)}>
            Tạo mã QR mới
          </Button>
        ) : (
          <Button loading={verifying} onClick={handleConfirm}>
            {verifying ? 'Đang xác minh thanh toán' : 'Tôi đã thanh toán'}
          </Button>
        )}
      </section>

      <aside className="grid content-start gap-4 rounded-lg bg-[#FDFCFA] p-5 shadow-[0_18px_36px_rgba(58,54,50,0.08)]">
        <h2 className="font-display text-2xl font-semibold text-[#222222]">Thông tin chuyển khoản</h2>
        <dl className="grid gap-3 text-sm">
          <InfoRow label="Số tiền" value={formatCurrency(machine.qrSession.amount)} />
          <InfoRow label="Nội dung" value={machine.qrSession.transferContent} />
          <InfoRow label="Thời gian còn lại" value={expired ? 'Đã hết hạn' : `${remainingSeconds} giây`} />
        </dl>
        <p className="text-sm leading-6 text-[#6F6B67]">
          Sau khi chuyển khoản, bấm xác nhận để hệ thống ghi nhận đơn và chống tạo trùng theo mã QR.
        </p>
      </aside>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <dt className="font-semibold text-[#6F6B67]">{label}</dt>
      <dd className="break-words font-bold text-[#222222]">{value}</dd>
    </div>
  )
}
