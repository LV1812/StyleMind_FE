import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { Button, TextField } from '@/shared/ui'
import { ROUTES } from '@/app/router/routes'
import { isUuid } from '../api/paymentClient'
import { readOrderReferences } from '../model/orderReferences'
import AccountOrderPayment from './AccountOrderPayment'

export default function PaymentEntryPage() {
  const params = useParams()
  const [search] = useSearchParams()
  const orderId = params.orderId ?? search.get('orderId') ?? ''
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [input, setInput] = useState(orderId)
  const [error, setError] = useState('')
  const records = readOrderReferences()
  if (records.some(item => item.orderId === orderId && item.owner === 'guest')) {
    return <Navigate replace to={ROUTES.guestOrder.replace(':orderId', encodeURIComponent(orderId))} />
  }
  if (orderId && isUuid(orderId)) return <AccountOrderPayment key={`${currentUser?.id}:${orderId}`} orderId={orderId} />
  return <section className="mx-auto grid max-w-3xl gap-5 px-5 py-8">
    <h1 className="font-display text-3xl font-semibold">Thanh toán đơn hàng</h1>
    <form className="grid gap-4 rounded-2xl border border-sand bg-white p-5" onSubmit={event => {
      event.preventDefault()
      if (!isUuid(input.trim())) { setError('Mã đơn hàng phải là UUID hợp lệ.'); return }
      navigate(ROUTES.paymentOrder.replace(':orderId', encodeURIComponent(input.trim())))
    }}>
      <TextField label="Mã đơn hàng" value={input} onChange={event => setInput(event.target.value)} required />
      <Button type="submit">Mở thanh toán</Button>
      <p className="text-sm text-secondary">Nhập mã đơn hàng thuộc tài khoản của bạn để xem và tiếp tục thanh toán.</p>
      {(error || orderId) && <p role="alert" className="text-sm text-error">{error || 'Mã đơn hàng phải là UUID hợp lệ.'}</p>}
    </form>
    <Link className="text-accent underline" to={ROUTES.orders}>Đơn hàng đã lưu trên trình duyệt này</Link>
  </section>
}
