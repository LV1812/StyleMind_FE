import { ArrowLeft, CreditCard, Eye, MapPin, Package } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { commerceApi } from '@/api/commerce'
import type { DemoAction, DemoDatabase } from '@/app/store/types'
import type { Order, OrderStatus } from '@/entities/order/model/types'
import { orderStatusLabel, paymentMethodLabel, paymentStatusLabel } from '@/features/admin/model/adminLabels'
import { selectAdminOrders } from '@/features/admin/model/adminSelectors'
import type { AdminOrderFilters } from '@/features/admin/model/adminTypes'
import { formatCurrency } from '@/shared/lib/formatCurrency'
import { formatDate } from '@/shared/lib/formatDate'
import { Button, SelectField, TextField, useToast } from '@/shared/ui'

import { StatusBadge } from './AdminCommon'

interface AdminOrdersPanelProps {
  database: DemoDatabase
  dispatch: React.Dispatch<DemoAction>
}

const statusOptions: { value: 'all' | OrderStatus; label: string }[] = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'pending', label: orderStatusLabel.pending },
  { value: 'payment_pending', label: orderStatusLabel.payment_pending },
  { value: 'paid', label: orderStatusLabel.paid },
  { value: 'confirmed', label: orderStatusLabel.confirmed },
  { value: 'processing', label: orderStatusLabel.processing },
  { value: 'shipped', label: orderStatusLabel.shipped },
  { value: 'completed', label: orderStatusLabel.completed },
  { value: 'cancelled', label: orderStatusLabel.cancelled },
]

const nextStatusMap: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending: ['confirmed', 'cancelled'],
  payment_pending: ['paid', 'cancelled'],
  paid: ['confirmed'],
  confirmed: ['processing'],
  processing: ['shipped'],
  shipped: ['completed'],
}

const actionLabel: Record<OrderStatus, string> = {
  pending: 'Xác nhận',
  payment_pending: 'Xác nhận thanh toán',
  paid: 'Xác nhận thanh toán',
  confirmed: 'Xác nhận đơn',
  processing: 'Bắt đầu xử lý',
  shipped: 'Giao vận chuyển',
  completed: 'Hoàn tất đơn',
  cancelled: 'Hủy',
}

const commerceStatus: Record<OrderStatus, string> = {
  pending: 'PENDING_PAYMENT',
  payment_pending: 'PENDING_PAYMENT',
  paid: 'PAID',
  confirmed: 'PLACED',
  processing: 'PROCESSING',
  shipped: 'SHIPPED',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
}

function statusTone(status: OrderStatus) {
  if (status === 'completed') return 'success'
  if (status === 'cancelled') return 'neutral'
  if (status === 'pending' || status === 'payment_pending') return 'warning'
  return 'accent'
}

function nextStatuses(status: OrderStatus) {
  return nextStatusMap[status] ?? []
}

function fullAddress(order: Order) {
  const address = order.shippingAddress
  return [address.line1, address.ward, address.district, address.province].filter(Boolean).join(', ')
}

function OrderItemImage({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return <span className="grid h-20 w-20 shrink-0 place-items-center rounded-lg bg-[#EFEDED] text-xs text-[#5E5F5D]">Chưa có ảnh</span>
  return <img src={src} alt={name} onError={() => setFailed(true)} className="h-20 w-20 shrink-0 rounded-lg bg-[#EFEDED] object-cover" />
}

export function AdminOrdersPanel({ database, dispatch }: AdminOrdersPanelProps) {
  const toast = useToast()
  const [filters, setFilters] = useState<AdminOrderFilters>({ query: '', status: 'all', paymentMethod: 'all' })
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedOrderId = searchParams.get('orderId')
  const rows = useMemo(() => selectAdminOrders(database, filters), [database, filters])
  const selectedOrder = selectedOrderId ? database.orders.find(order => order.id === selectedOrderId) ?? null : null

  const openOrderDetail = (orderId: string) => {
    setSearchParams(current => {
      const next = new URLSearchParams(current)
      next.set('section', 'orders')
      next.set('orderId', orderId)
      return next
    })
  }

  const closeOrderDetail = () => {
    setSearchParams(current => {
      const next = new URLSearchParams(current)
      next.delete('orderId')
      return next
    })
  }

  const changeStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await commerceApi.orders.updateStatus(orderId, commerceStatus[status])
      dispatch({
        type: 'admin/orderStatusChanged',
        payload: { orderId, status, at: new Date().toISOString() },
      })
      toast.success('Đã cập nhật trạng thái đơn hàng.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái đơn hàng')
    }
  }

  if (selectedOrder) {
    return (
      <section className="space-y-6">
        <button type="button" onClick={closeOrderDetail} className="inline-flex items-center gap-2 rounded-lg py-2 text-sm font-semibold text-[#5E5F5D] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black">
          <ArrowLeft size={16} aria-hidden="true" /> Quay lại danh sách đơn hàng
        </button>
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl bg-white p-5 shadow-sm">
          <div><p className="text-sm text-[#5E5F5D]">Đơn hàng · {formatDate(selectedOrder.createdAt)}</p><h1 className="mt-1 break-all font-display text-3xl font-semibold">Chi tiết đơn {selectedOrder.id}</h1></div>
          <StatusBadge tone={statusTone(selectedOrder.status)}>{orderStatusLabel[selectedOrder.status]}</StatusBadge>
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(280px,1fr)]">
          <div className="space-y-6">
            <section className="rounded-xl bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-semibold"><Package size={18} aria-hidden="true" /> Sản phẩm trong đơn</h2>
              {selectedOrder.items.length === 0 ? <p className="mt-4 text-sm text-[#5E5F5D]">Đơn hàng chưa có thông tin sản phẩm.</p> : <div className="mt-4 grid gap-3">{selectedOrder.items.map(item => (
                <article key={`${item.productId}-${item.variantId}`} className="flex flex-wrap items-start gap-4 border-b border-[#EFEDED] pb-4 last:border-0 last:pb-0">
                  <OrderItemImage key={item.imageUrl} src={item.imageUrl} name={item.name} />
                  <div className="min-w-0 flex-1"><p className="break-words font-semibold">{item.name}</p><p className="mt-1 text-sm text-[#5E5F5D]">{[item.color, item.size ? `Cỡ ${item.size}` : ''].filter(Boolean).join(' · ')}</p><p className="mt-1 text-sm text-[#5E5F5D]">Số lượng: {item.quantity}</p></div>
                  <div className="text-sm tabular-nums sm:text-right"><p className="text-[#5E5F5D]">Đơn giá: {formatCurrency(item.unitPrice)}</p><p className="mt-1 font-semibold">Thành tiền: {formatCurrency(item.lineTotal ?? item.unitPrice * item.quantity)}</p></div>
                </article>
              ))}</div>}
            </section>
            <section className="rounded-xl bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold">Lịch sử đơn hàng</h2>
              {selectedOrder.timeline.length ? <ol className="mt-4 space-y-3">{selectedOrder.timeline.map(item => <li key={item.id} className="border-l-2 border-[#C4A5B0] pl-4 text-sm"><p className="font-semibold">{item.label}</p><p className="text-[#5E5F5D]">{formatDate(item.at)}</p></li>)}</ol> : <p className="mt-4 text-sm text-[#5E5F5D]">Chưa có lịch sử trạng thái.</p>}
            </section>
          </div>
          <div className="space-y-6">
            <section className="rounded-xl bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 text-lg font-semibold"><MapPin size={18} aria-hidden="true" /> Địa chỉ giao hàng</h2><div className="mt-4 space-y-1 break-words text-sm leading-6 text-[#5E5F5D]"><p className="font-semibold text-[#222222]">{selectedOrder.shippingAddress.recipientName}</p><p>{selectedOrder.shippingAddress.phone}</p><p>{fullAddress(selectedOrder)}</p></div></section>
            <section className="rounded-xl bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 text-lg font-semibold"><CreditCard size={18} aria-hidden="true" /> Thanh toán</h2><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-[#5E5F5D]">Phương thức thanh toán</dt><dd>{paymentMethodLabel[selectedOrder.paymentMethod]}</dd></div><div className="flex justify-between gap-3 border-t border-[#EFEDED] pt-3 font-semibold"><dt>Tổng tiền</dt><dd className="tabular-nums">{formatCurrency(selectedOrder.total)}</dd></div></dl></section>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="grid gap-5">
      <div>
        <p className="text-sm font-semibold text-[#1C1B1B]">Vận hành đơn hàng</p>
        <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-[#222222] md:text-4xl">
          Quản lý đơn hàng
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5E5F5D]">
          Theo dõi thanh toán, địa chỉ giao hàng và các bước xử lý đơn.
        </p>
      </div>

      <div className="grid gap-3 rounded-lg border border-[#E3E2E2] bg-white p-4 md:grid-cols-2 xl:grid-cols-[minmax(180px,1fr)_180px_200px]">
        <TextField
          label="Tìm đơn hàng"
          value={filters.query ?? ''}
          onChange={event => setFilters(current => ({ ...current, query: event.target.value }))}
          placeholder="Nhập mã đơn hoặc khách hàng"
        />
        <SelectField
          label="Trạng thái"
          value={filters.status ?? 'all'}
          onChange={event => setFilters(current => ({ ...current, status: event.target.value as AdminOrderFilters['status'] }))}
        >
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Thanh toán"
          value={filters.paymentMethod ?? 'all'}
          onChange={event => setFilters(current => ({ ...current, paymentMethod: event.target.value as AdminOrderFilters['paymentMethod'] }))}
        >
          <option value="all">Tất cả phương thức</option>
          <option value="cod">{paymentMethodLabel.cod}</option>
          <option value="vietqr">{paymentMethodLabel.vietqr}</option>
        </SelectField>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#E3E2E2] bg-white">
        <p className="border-b border-[#E3E2E2] px-4 py-2 text-xs text-[#5E5F5D] lg:hidden">Vuốt ngang để xem toàn bộ thông tin đơn hàng.</p>
        <div className="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1C1B1B]" role="region" aria-label="Bảng đơn hàng" tabIndex={0}>
          <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
            <thead className="bg-[#FBF9F9] text-xs font-semibold uppercase tracking-wide text-[#5E5F5D]">
              <tr>
                <th scope="col" className="px-4 py-3">Đơn hàng</th>
                <th scope="col" className="px-4 py-3">Khách hàng</th>
                <th scope="col" className="px-4 py-3">Ngày đặt</th>
                <th scope="col" className="px-4 py-3">Thanh toán</th>
                <th scope="col" className="px-4 py-3">Trạng thái</th>
                <th scope="col" className="px-4 py-3 text-right">Tổng tiền</th>
                <th scope="col" className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E0D8]">
              {rows.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-[#5E5F5D]">Không có đơn hàng phù hợp.</td></tr>
              ) : rows.map(row => {
                const next = nextStatuses(row.status)

                return (
                  <tr key={row.id} className="align-middle hover:bg-[#FBF9F9]/70">
                    <td className="whitespace-nowrap px-4 py-3">
                      <p className="font-semibold text-[#222222]">{row.id}</p>
                      <p className="mt-0.5 text-xs text-[#5E5F5D]">{row.itemCount} sản phẩm</p>
                    </td>
                    <td className="px-4 py-3 text-[#3A3632]">{row.customerName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-[#5E5F5D]">{formatDate(row.createdAt)}</td>
                    <td className="px-4 py-3">
                      <p className="text-[#3A3632]">{paymentMethodLabel[row.paymentMethod]}</p>
                      <p className="mt-0.5 text-xs text-[#5E5F5D]">{paymentStatusLabel[row.paymentStatus]}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3"><StatusBadge tone={statusTone(row.status)}>{orderStatusLabel[row.status]}</StatusBadge></td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-[#222222]">{formatCurrency(row.total)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="border border-[#E5E0D8]"
                          icon={<Eye size={14} aria-hidden="true" />}
                          onClick={() => openOrderDetail(row.id)}
                        >
                          Chi tiết
                        </Button>
                        {next.length === 0 ? (
                          <span className="whitespace-nowrap text-xs font-medium text-[#5E5F5D]">Trạng thái cuối</span>
                        ) : next.map(status => (
                          <Button
                            key={`${row.id}-${status}`}
                            type="button"
                            size="sm"
                            variant={status === 'cancelled' ? 'secondary' : 'primary'}
                            onClick={() => void changeStatus(row.id, status)}
                          >
                            {actionLabel[status]}
                          </Button>
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </section>
  )
}
