import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, TextField } from '@/shared/ui'
import { formatCurrency } from '@/shared/lib/formatCurrency'
import { PaymentApiError } from '../api/paymentApi'
import { isUuid, paymentApi, paymentErrorMessage } from '../api/paymentClient'
import type { PaymentExceptionList } from '../api/types'

export default function AdminPaymentsPage() {
  const sending = useRef(false)
  const [attemptId, setAttemptId] = useState('')
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [attested, setAttested] = useState(false)
  const [saving, setSaving] = useState(false)
  const [blockedIds, setBlockedIds] = useState<Set<string>>(() => new Set())
  const locked = blockedIds.has(attemptId.trim().toLowerCase())
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState<PaymentExceptionList | null>(null)
  const [listError, setListError] = useState('')
  const [filter, setFilter] = useState('')
  const [query, setQuery] = useState({ status: '', offset: 0, version: 0 })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setResult(null)
    setListError('')
    void paymentApi.listPaymentExceptions({ status: query.status || undefined, limit: 20, offset: query.offset }, { signal: controller.signal })
      .then(value => { if (!controller.signal.aborted) setResult(value) })
      .catch(failure => { if (!controller.signal.aborted) setListError(paymentErrorMessage(failure)) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [query])

  const collect = async () => {
    if (sending.current || saving || locked) return
    setError('')
    setMessage('')
    const value = Number(amount)
    if (!isUuid(attemptId.trim()) || !/^[0-9]+$/.test(amount) || !Number.isSafeInteger(value) || value <= 0 || !attested) {
      setError('Nhập UUID khoản thanh toán, số tiền VND nguyên dương và xác nhận đã thực thu.')
      return
    }
    if (Array.from(reference.trim()).length > 255 || /\p{Cc}/u.test(reference)) { setError('Mã biên nhận tối đa 255 ký tự và không chứa ký tự điều khiển.'); return }
    sending.current = true
    setSaving(true)
    try {
      const collected = await paymentApi.confirmCodCollection({
        payment_attempt_id: attemptId.trim(), collected_amount_vnd: value,
        ...(reference.trim() ? { collection_reference: reference.trim() } : {}),
      })
      setBlockedIds(current => new Set(current).add(attemptId.trim().toLowerCase()))
      setMessage('Đã ghi nhận thu COD: ' + formatCurrency(collected.amountVnd) + '. Trạng thái: ' + collected.status)
    } catch (failure) {
      const uncertain = !(failure instanceof PaymentApiError) || failure.status >= 500
      const already = failure instanceof PaymentApiError && ['PAYMENT_ATTEMPT_NOT_PENDING', 'PAYMENT_ALREADY_CONFIRMED'].includes(failure.code)
      if (uncertain || already) setBlockedIds(current => new Set(current).add(attemptId.trim().toLowerCase()))
      setError(paymentErrorMessage(failure) + (uncertain ? ' Kết quả thu tiền chưa xác định; cần đối soát trước khi thực hiện lại.' : ''))
    } finally {
      sending.current = false
      setSaving(false)
    }
  }

  return <main className="mx-auto grid max-w-5xl gap-6 px-5 py-8">
    <Link to="/admin" className="text-[#684B5A] underline">Về quản trị</Link>
    <h1 className="font-display text-3xl font-semibold">Thanh toán Admin</h1>
    <form className="grid gap-4 rounded-lg bg-white p-5" onSubmit={event => { event.preventDefault(); void collect() }}>
      <h2 className="text-xl font-semibold">Ghi nhận thực thu COD</h2>
      <p>Chỉ ghi nhận sau khi đã nhận tiền. Mã khoản thanh toán được lấy từ backend, không phải mã Order.</p>
      <p className="text-sm text-secondary">Chưa có API tra cứu khoản COD theo đơn dành cho Admin. Cần cung cấp đúng mã khoản thanh toán để ghi nhận.</p>
      <TextField label="Mã khoản thanh toán COD" value={attemptId} disabled={saving} onChange={event => {
        setAttemptId(event.target.value); setAttested(false); setMessage(''); setError('')
      }} required />
      <TextField label="Số tiền đã thu (VND)" value={amount} onChange={event => setAmount(event.target.value)} inputMode="numeric" pattern="[0-9]+" disabled={saving || locked} required />
      <TextField label="Mã biên nhận (tùy chọn)" value={reference} maxLength={255} onChange={event => setReference(event.target.value)} disabled={saving || locked} />
      <label className="flex gap-2"><input type="checkbox" checked={attested} disabled={saving || locked} onChange={event => setAttested(event.target.checked)} />Tôi xác nhận đã thực nhận số tiền trên</label>
      <Button type="submit" loading={saving} disabled={locked || !attested}>Ghi nhận thu COD</Button>
      {message && <p role="status" className="text-green-800">{message}</p>}
      {error && <p role="alert" className="text-red-800">{error}</p>}
    </form>
    <section className="grid gap-4 rounded-lg bg-white p-5">
      <h2 className="text-xl font-semibold">Lỗi thanh toán cần kiểm tra</h2>
      <form className="flex flex-wrap items-end gap-3" onSubmit={event => {
        event.preventDefault()
        setQuery(current => ({ status: filter.trim(), offset: 0, version: current.version + 1 }))
      }}>
        <TextField label="Trạng thái đối soát" value={filter} maxLength={100} placeholder="Ví dụ: OPEN" onChange={event => setFilter(event.target.value)} />
        <Button type="submit" loading={loading}>Tải danh sách</Button>
      </form>
      {listError && <p role="alert">{listError}</p>}
      {result && <>
        {result.items.length === 0 ? <p>Không có lỗi thanh toán.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm">
          <thead><tr><th className="p-2">Mã khoản thanh toán</th><th className="p-2">Số tiền nhận</th><th className="p-2">Lý do</th><th className="p-2">Trạng thái</th><th className="p-2">Thời điểm</th></tr></thead>
          <tbody>{result.items.map(item => <tr key={item.exception_id} className="border-t">
            <td className="p-2">{item.payment_attempt_id ?? 'Không xác định'}</td><td className="p-2">{formatCurrency(item.received_amount_vnd)}</td>
            <td className="p-2">{item.exception_reason}</td><td className="p-2">{item.reconciliation_status}</td><td className="p-2">{item.detected_at}</td>
          </tr>)}</tbody>
        </table></div>}
        <div className="flex gap-3">
          <Button variant="secondary" disabled={loading || query.offset === 0} onClick={() => setQuery(current => ({ ...current, offset: Math.max(0, current.offset - 20) }))}>Trang trước</Button>
          <Button variant="secondary" disabled={loading || result.items.length < 20} onClick={() => setQuery(current => ({ ...current, offset: current.offset + 20 }))}>Trang sau</Button>
        </div>
      </>}
      <p className="text-sm text-[#6F6B67]">Hiện chưa hỗ trợ xử lý đối soát hoặc hoàn tiền trên giao diện.</p>
    </section>
  </main>
}
