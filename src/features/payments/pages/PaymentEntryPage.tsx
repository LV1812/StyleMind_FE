import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { Button, TextField } from '@/shared/ui'
import { ROUTES } from '@/app/router/routes'
import { isUuid } from '../api/paymentClient'
import { readOrderReferences } from '../model/orderReferences'
import AccountOrderPayment from './AccountOrderPayment'
import { ArrowLeft, Search } from 'lucide-react'

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
  return <section className="mx-auto max-w-5xl px-5 py-10 md:px-8 md:py-12">
    <header className="border-b border-[#E3E2E2] pb-7">
      <p className="text-sm font-medium text-secondary">Đơn hàng của bạn</p>
      <h1 className="mt-2 font-display text-4xl font-semibold">Thanh toán đơn hàng</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-secondary">Nhập mã đơn hàng thuộc tài khoản của bạn để xem và tiếp tục thanh toán.</p>
    </header>
    <form className="mt-8 grid max-w-2xl gap-5 rounded-lg border border-[#E3E2E2] bg-white p-6 sm:p-8" onSubmit={event => {
      event.preventDefault()
      if (!isUuid(input.trim())) { setError('Mã đơn hàng phải là UUID hợp lệ.'); return }
      navigate(ROUTES.paymentOrder.replace(':orderId', encodeURIComponent(input.trim())))
    }}>
      <div><h2 className="font-display text-2xl font-semibold">Tìm đơn hàng</h2><p className="mt-2 text-sm leading-6 text-secondary">Mở chi tiết để kiểm tra trạng thái mới nhất.</p></div>
      <TextField label="Mã đơn hàng" value={input} onChange={event => setInput(event.target.value)} required />
      <Button type="submit" icon={<Search size={17} aria-hidden="true" />}>Mở thanh toán</Button>
      {(error || orderId) && <p role="alert" className="text-sm text-error">{error || 'Mã đơn hàng phải là UUID hợp lệ.'}</p>}
    </form>
    <Link className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4" to={ROUTES.orders}><ArrowLeft size={16} aria-hidden="true" /> Đơn hàng đã lưu trên trình duyệt này</Link>
  </section>
}
