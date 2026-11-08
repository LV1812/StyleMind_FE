import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, ArrowRight, Check, CheckCircle2, Clock3, Copy, MapPin, PackageCheck, QrCode, RefreshCw, ShieldCheck, Smartphone, Truck } from 'lucide-react'
import type { OrderResponse, PaymentAttempt } from '@/features/payments/api/types'
import { Button } from '@/shared/ui'
import { formatCurrency } from '@/shared/lib/formatCurrency'
import { ROUTES } from '@/app/router/routes'

interface GuestPaymentViewProps {
  ownerType?: 'guest' | 'account'
  orderId: string
  order: OrderResponse | null
  attempt: PaymentAttempt | null
  countdownSeconds: number | null
  expired: boolean
  showQr: boolean
  pending: boolean
  busy: boolean
  error: string
  imageFailed: boolean
  onImageError: () => void
  onRecover: () => void
  onRefresh: () => void
}

const orderLabels: Record<string, string> = {
  PENDING_PAYMENT: 'Chờ thanh toán', PLACED: 'Đã đặt hàng', PAID: 'Đã thanh toán',
  CONFIRMED: 'Đã xác nhận', PROCESSING: 'Đang chuẩn bị', FULFILLING: 'Đang chuẩn bị',
  SHIPPED: 'Đang giao hàng', DELIVERED: 'Đã giao hàng', COMPLETED: 'Đã hoàn tất',
  CANCELLED: 'Đã hủy', EXPIRED: 'Đã hết hạn',
}

export default function GuestPaymentView({
  ownerType = 'guest', orderId, order, attempt, countdownSeconds, expired, showQr, pending, busy, error, imageFailed,
  onImageError, onRecover, onRefresh,
}: GuestPaymentViewProps) {
  const [copied, setCopied] = useState('')
  const [copyError, setCopyError] = useState('')
  const online = order?.payment_method === 'SEPAY_VIETQR'
  const paid = order?.order_status === 'PAID'
  const qrExpired = pending && online && expired
  const blocked = attempt?.status === 'CANCELLED' || attempt?.status === 'EXCEPTION'
  const closed = order?.order_status === 'CANCELLED' || order?.order_status === 'EXPIRED'
  const urgent = countdownSeconds !== null && countdownSeconds <= 60
  const amount = showQr && attempt ? attempt.amountVnd : order?.accepted_total_vnd

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(''), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const copy = async (field: string, value: string) => {
    setCopyError('')
    try {
      await navigator.clipboard.writeText(value)
      setCopied(field)
    } catch {
      setCopyError('Không thể sao chép tự động. Bạn có thể chọn và sao chép trực tiếp thông tin bên dưới.')
    }
  }

  return <div className="mx-auto max-w-6xl px-5 py-7 sm:px-8 sm:py-10 lg:py-12">
    <Link to={ROUTES.shop} className="mb-7 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-secondary transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
      <ArrowLeft size={16} aria-hidden="true" /> Trở về cửa hàng
    </Link>

    <header className="mb-8 flex flex-wrap items-start justify-between gap-5">
      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-accent-mid">Mua sắm cùng StyleMind</p>
        <h1 className="font-display text-3xl font-medium leading-tight text-charcoal sm:text-4xl">{ownerType === 'guest' ? 'Kết quả đơn hàng khách' : 'Thanh toán đơn hàng'}</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-secondary">
          {blocked ? 'Khoản thanh toán cần được kiểm tra. Hãy xem trạng thái đơn hoặc liên hệ hỗ trợ.' : paid ? 'Cảm ơn bạn đã lựa chọn StyleMind. Đơn hàng của bạn đang được tiếp nhận.'
            : pending && online ? 'Chỉ còn một bước nữa để hoàn tất thanh toán cho đơn hàng của bạn.'
            : order?.payment_method === 'COD' ? 'Thông tin đơn hàng đã được lưu. Bạn có thể theo dõi cập nhật ngay tại đây.'
            : 'Xem thông tin và theo dõi trạng thái đơn hàng của bạn.'}
        </p>
      </div>
      {order && <span className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold ${pending ? 'border-warning/20 bg-warning-bg text-warning-ink' : closed ? 'border-sand bg-sand/40 text-secondary' : 'border-success/20 bg-success-bg text-success'}`}>
        {pending ? <Clock3 size={15} aria-hidden="true" /> : <PackageCheck size={15} aria-hidden="true" />}
        {orderLabels[order.order_status] ?? 'Đang cập nhật'}
      </span>}
    </header>

    {error && <p role="alert" className="mb-5 rounded-2xl border border-error/20 bg-error-bg px-5 py-4 text-sm leading-6 text-error">{error}</p>}

    {!order ? <section className="grid min-h-72 place-content-center gap-5 rounded-3xl border border-sand bg-white px-6 py-12 text-center">
      <QrCode size={36} className="mx-auto text-accent-light" aria-hidden="true" />
      <p className="text-sm text-secondary">{busy ? 'Đang tải thông tin thanh toán…' : 'Chưa tải được thông tin đơn hàng.'}</p>
      <Button variant="secondary" loading={busy} onClick={onRefresh} icon={<RefreshCw size={15} aria-hidden="true" />}>Kiểm tra trạng thái đơn</Button>
      <p className="max-w-sm break-all text-xs text-muted">Mã đơn hàng: {orderId}</p>
    </section> : <section aria-label={ownerType === 'guest' ? 'Đơn hàng khách' : 'Thông tin thanh toán'} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="overflow-hidden rounded-3xl border border-sand bg-white shadow-[0_12px_40px_-24px_rgba(58,54,50,0.2)]">
        <div className="border-b border-sand/70 px-6 py-5 sm:px-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-ink">{online ? 'Thanh toán chuyển khoản' : 'Thanh toán khi nhận hàng'}</h2>
            <span className="rounded-md bg-ivory px-2.5 py-1 text-[10px] font-bold tracking-wider text-accent">{online ? 'VIETQR · SEPAY' : 'COD'}</span>
          </div>
        </div>

        <div className="px-6 py-7 sm:px-8 sm:py-8">
          <div className="mb-7 text-center">
            <p className="text-xs font-medium text-secondary">{online && pending && !blocked ? 'Số tiền cần thanh toán' : 'Giá trị đơn hàng'}</p>
            <p className="mt-2 font-display text-4xl font-semibold tracking-tight text-accent sm:text-5xl">{amount !== undefined ? formatCurrency(amount) : '—'}</p>
          </div>

          {showQr && attempt ? <>
            <div className="mx-auto max-w-[296px] rounded-[24px] border border-sand bg-ivory p-4">
              <div className="rounded-2xl bg-white p-3 shadow-[0_4px_20px_rgba(58,54,50,0.04)]">
                {attempt.qrPayload && !imageFailed ? <img src={attempt.qrPayload} alt="Mã QR chuyển khoản ngân hàng" className="mx-auto aspect-square w-full max-w-60 object-contain" onError={onImageError} />
                  : <div className="grid aspect-square place-content-center gap-3 px-3 text-center"><QrCode size={42} className="mx-auto text-muted" aria-hidden="true" /><p role="alert" className="text-sm leading-6 text-error">Không tải được ảnh QR. Hãy thử khôi phục thanh toán.</p></div>}
              </div>
            </div>
            <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-secondary"><Smartphone size={15} className="shrink-0" aria-hidden="true" />Mở ứng dụng ngân hàng để quét mã VietQR</p>
          </> : <div className="mx-auto grid max-w-md place-items-center gap-4 py-4 text-center">
            <span className={`grid h-20 w-20 place-items-center rounded-full ${blocked || qrExpired || (pending && online) ? 'bg-warning-bg text-warning-ink' : closed ? 'bg-sand text-secondary' : 'bg-success-bg text-success'}`}>
              {blocked ? <AlertTriangle size={34} strokeWidth={1.5} aria-hidden="true" /> : qrExpired || (pending && online) ? <Clock3 size={34} strokeWidth={1.5} aria-hidden="true" /> : paid ? <CheckCircle2 size={34} strokeWidth={1.5} aria-hidden="true" /> : <Truck size={34} strokeWidth={1.5} aria-hidden="true" />}
            </span>
            <h3 className="font-display text-2xl font-medium text-charcoal">{blocked ? 'Thanh toán cần kiểm tra' : qrExpired ? 'Mã QR đã hết hạn' : paid ? 'Thanh toán thành công' : closed ? 'Đơn hàng đã kết thúc' : pending && online ? 'Đang chờ thanh toán' : online ? 'Thông tin thanh toán' : 'Đơn hàng của bạn đã được lưu'}</h3>
            {paid && <p role="status" className="text-sm leading-6 text-secondary">Máy chủ đã xác nhận thanh toán.</p>}
            {!online && <p className="text-sm leading-6 text-secondary">{order.order_status === 'PLACED' ? 'Đặt hàng thành công — thanh toán khi nhận hàng.' : 'Thanh toán khi nhận hàng.'} Trạng thái đặt đơn không xác nhận đã thu tiền.</p>}
            {pending && !expired && !blocked && <p role="status" className="text-sm leading-6 text-secondary">Đơn hàng đã được lưu, đang chờ bước thanh toán. Bạn có thể thử lại trên đơn này.</p>}
          </div>}

          {pending && online && !blocked && countdownSeconds !== null && <div className={`mx-auto mt-6 flex max-w-sm items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${urgent ? 'border-warning/20 bg-warning-bg text-warning-ink' : 'border-accent/10 bg-blush/60 text-accent'}`}>
            <span className="flex items-center gap-2 text-xs font-medium"><Clock3 size={17} className="shrink-0" aria-hidden="true" />Thời gian thanh toán còn lại</span>
            <p role="timer" aria-label="Thời gian thanh toán còn lại" aria-live="off" className="shrink-0 text-2xl font-bold tabular-nums tracking-wide">{String(Math.floor(countdownSeconds / 60)).padStart(2, '0')}:{String(countdownSeconds % 60).padStart(2, '0')}</p>
          </div>}

          {expired && pending && <p role="status" className="mx-auto mt-4 max-w-sm text-center text-xs leading-6 text-warning-ink">QR đã hết hạn. Chưa hỗ trợ tạo mã mới cho đơn này. Hãy kiểm tra trạng thái nếu bạn đã chuyển khoản.</p>}
          {showQr && <p className="mx-auto mt-4 max-w-sm text-center text-xs leading-5 text-secondary">Sau khi chuyển khoản, trạng thái sẽ tự cập nhật khi hệ thống xác nhận thanh toán.</p>}
          {attempt?.status === 'EXCEPTION' && <p role="status" className="mt-4 rounded-xl bg-warning-bg p-4 text-sm text-warning-ink">Khoản thanh toán cần được kiểm tra. Vui lòng liên hệ hỗ trợ.</p>}
          {attempt?.status === 'CANCELLED' && <p role="status" className="mt-4 rounded-xl bg-warning-bg p-4 text-sm text-warning-ink">Khoản thanh toán đã bị hủy. Không tiếp tục chuyển khoản theo thông tin cũ.</p>}
          {pending && online && attempt?.status === 'PAID' && <p role="status" className="mt-4 text-sm text-success">Khoản chuyển khoản đã được ghi nhận, đang chờ cập nhật trạng thái đơn hàng.</p>}

          <div className="mt-7 grid gap-2 border-t border-sand/70 pt-6 sm:grid-cols-2">
            <Button className={`rounded-xl ${pending ? '' : 'sm:col-span-2'}`} loading={busy} onClick={onRefresh} icon={<RefreshCw size={15} aria-hidden="true" />}>Kiểm tra trạng thái đơn</Button>
            {pending && !blocked && !expired && <Button variant="ghost" className="rounded-xl text-xs" disabled={busy} onClick={onRecover}>Tải lại thông tin thanh toán</Button>}
          </div>
          {pending && !blocked && !expired && <p className="mt-3 text-xs text-secondary">Tải lại thông tin của đơn này khi mã thanh toán chưa hiển thị. Thao tác không tạo đơn mới.</p>}
        </div>
      </div>

      <aside className="grid min-w-0 gap-5">
        {showQr && attempt && <div className="rounded-3xl border border-sand bg-white p-6">
          <h2 className="text-base font-semibold text-ink">Thông tin chuyển khoản</h2>
          <p className="mt-2 text-xs leading-5 text-secondary">Vui lòng giữ đúng số tiền và nội dung để thanh toán được ghi nhận.</p>
          <dl className="mt-5 grid gap-5">
            <div><dt className="text-xs text-secondary">Số tiền chuyển</dt><dd className="mt-1.5 flex items-center justify-between gap-3"><strong className="text-lg font-bold text-accent">{formatCurrency(attempt.amountVnd)}</strong><CopyButton label="Sao chép số tiền" copied={copied === 'amount'} onClick={() => void copy('amount', String(attempt.amountVnd))} /></dd></div>
            <div className="border-t border-sand/70 pt-4"><dt className="text-xs text-secondary">Nội dung chuyển khoản</dt><dd className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-ivory p-3"><strong className="min-w-0 break-all font-mono text-sm font-semibold text-ink">{attempt.transferContent || 'Chưa có nội dung chuyển khoản'}</strong>{attempt.transferContent && <CopyButton label="Sao chép nội dung chuyển khoản" copied={copied === 'content'} onClick={() => void copy('content', attempt.transferContent!)} />}</dd></div>
          </dl>
          {copied && <p role="status" className="mt-3 text-xs font-medium text-success">Đã sao chép {copied === 'amount' ? 'số tiền' : 'nội dung chuyển khoản'}.</p>}
          {copyError && <p role="alert" className="mt-3 text-xs leading-5 text-error">{copyError}</p>}
        </div>}

        <div className="rounded-3xl border border-sand bg-white p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink"><PackageCheck size={18} className="text-accent-mid" aria-hidden="true" />Thông tin đơn hàng</h2>
          <div className="mt-5 grid gap-4 text-sm">
            <div><p className="text-xs text-secondary">Mã đơn hàng</p><p className="mt-1.5 break-all font-mono text-xs font-medium leading-5 text-ink">{order.order_number || orderId}</p></div>
            <div className="flex justify-between gap-3 border-t border-sand/70 pt-4"><span className="text-secondary">Phương thức</span><span className="font-medium text-ink">{online ? 'Chuyển khoản VietQR' : 'Thanh toán COD'}</span></div>
            <div className="flex justify-between gap-3"><span className="text-secondary">Tổng tiền</span><strong className="font-semibold text-accent">{formatCurrency(order.accepted_total_vnd)}</strong></div>
          </div>
          {Boolean(order.items?.length) && <ul className="mt-5 grid max-h-64 gap-3 overflow-y-auto border-t border-sand/70 pt-4">{order.items.map(item => <li key={item.order_item_id} className="flex items-start justify-between gap-3 text-xs leading-5"><span className="text-ink">{item.product_name_snapshot}<span className="block text-muted">{[item.color_snapshot, item.size_snapshot].filter(Boolean).join(' / ')}</span></span><span className="shrink-0 text-secondary">× {item.quantity}</span></li>)}</ul>}
          {order.address && <div className="mt-5 border-t border-sand/70 pt-4"><p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-secondary"><MapPin size={14} aria-hidden="true" />Giao đến</p><p className="text-sm font-semibold text-ink">{order.address.recipient_name}</p><p className="mt-1 text-xs leading-6 text-secondary">{order.address.recipient_phone}<br />{order.address.address_line}</p></div>}
        </div>

        <div className="flex items-start gap-3 px-2 text-xs leading-5 text-secondary"><ShieldCheck size={19} className="mt-0.5 shrink-0 text-accent-mid" aria-hidden="true" /><p>{ownerType === 'guest' ? 'Giữ dữ liệu trình duyệt để xem lại đơn hàng tại trang này. Bạn không cần đăng nhập.' : 'Thông tin được tải từ đơn hàng thuộc tài khoản đang đăng nhập.'}</p></div>
        <Link to={ROUTES.shop} className="inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-accent transition hover:bg-blush/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">Tiếp tục mua sắm<ArrowRight size={16} aria-hidden="true" /></Link>
      </aside>
    </section>}
  </div>
}

function CopyButton({ label, copied, onClick }: { label: string; copied: boolean; onClick: () => void }) {
  return <button type="button" aria-label={label} title={copied ? 'Đã sao chép' : label} onClick={onClick} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-accent-mid transition hover:bg-blush hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">{copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}</button>
}
