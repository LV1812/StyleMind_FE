import { Eye } from 'lucide-react'
import { useMemo, useState } from 'react'

import type { DemoAction, DemoDatabase } from '@/app/store/types'
import type { Order, OrderStatus } from '@/entities/order/model/types'
import { orderStatusLabel, paymentMethodLabel, paymentStatusLabel } from '@/features/admin/model/adminLabels'
import { selectAdminOrders } from '@/features/admin/model/adminSelectors'
import type { AdminOrderFilters } from '@/features/admin/model/adminTypes'
import { formatCurrency } from '@/shared/lib/formatCurrency'
import { formatDate } from '@/shared/lib/formatDate'
import { Button, Modal, SelectField, TextField, useToast } from '@/shared/ui'

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
  pending: 'Đưa về chờ xác nhận',
  payment_pending: 'Chờ thanh toán',
  paid: 'Ghi nhận thanh toán',
  confirmed: 'Xác nhận đơn',
  processing: 'Chuyển xử lý',
  shipped: 'Chuyển sang giao hàng',
  completed: 'Hoàn tất đơn',
  cancelled: 'Hủy đơn',
}

function statusTone(status: OrderStatus) {
  if (status === 'completed') return 'success'
  if (status === 'cancelled') return 'danger'
  if (status === 'pending' || status === 'payment_pending') return 'warning'
  return 'accent'
}

function nextStatuses(status: OrderStatus) {
  return nextStatusMap[status] ?? []
}

function fullAddress(order: Order) {
  const address = order.shippingAddress
  return `${address.line1}, ${address.ward}, ${address.district}, ${address.province}`
}

export function AdminOrdersPanel({ database, dispatch }: AdminOrdersPanelProps) {
  const toast = useToast()
  const [filters, setFilters] = useState<AdminOrderFilters>({ query: '', status: 'all', paymentMethod: 'all' })
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const rows = useMemo(() => selectAdminOrders(database, filters), [database, filters])
  const selectedOrder = selectedOrderId ? database.orders.find(order => order.id === selectedOrderId) ?? null : null

  const changeStatus = (orderId: string, status: OrderStatus) => {
    dispatch({
      type: 'admin/orderStatusChanged',
      payload: { orderId, status, at: new Date().toISOString() },
    })
    toast.success('Đã cập nhật trạng thái đơn hàng.')
  }

  return (
    <section className="grid gap-5">
      <div>
        <p className="text-sm font-semibold text-[#684B5A]">Vận hành đơn hàng</p>
        <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-[#222222] md:text-4xl">
          Quản lý đơn hàng
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6F6B67]">
          Theo dõi thanh toán, địa chỉ giao hàng và các bước xử lý đơn trong mock data.
        </p>
      </div>

      <div className="grid gap-3 rounded-lg bg-white p-4 shadow-[0_10px_28px_rgba(58,54,50,0.07)] md:grid-cols-[minmax(220px,1fr)_180px_220px]">
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

      <div className="grid gap-3">
        {rows.length === 0 ? (
          <p className="rounded-lg bg-white p-4 text-sm text-[#6F6B67] shadow-[0_10px_28px_rgba(58,54,50,0.07)]">
            Không có đơn hàng phù hợp.
          </p>
        ) : (
          rows.map(row => {
            const next = nextStatuses(row.status)

            return (
              <article key={row.id} className="grid gap-4 rounded-lg bg-white p-4 shadow-[0_10px_28px_rgba(58,54,50,0.07)]">
                <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="break-all font-display text-2xl font-semibold text-[#222222]">{row.id}</h2>
                      <StatusBadge tone={statusTone(row.status)}>{orderStatusLabel[row.status]}</StatusBadge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#6F6B67]">
                      {row.customerName} · {formatDate(row.createdAt)} · {row.itemCount} sản phẩm
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[#6F6B67]">
                      {paymentMethodLabel[row.paymentMethod]} · {paymentStatusLabel[row.paymentStatus]}
                    </p>
                    <p className="mt-2 text-base font-semibold tabular-nums text-[#222222]">{formatCurrency(row.total)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      icon={<Eye size={17} aria-hidden="true" />}
                      onClick={() => setSelectedOrderId(row.id)}
                    >
                      Xem chi tiết {row.id}
                    </Button>
                    {next.length === 0 ? (
                      <span className="inline-flex min-h-11 items-center rounded-lg bg-[#FAF8F5] px-3 text-sm font-semibold text-[#8A8179]">
                        Trạng thái cuối
                      </span>
                    ) : (
                      next.map(status => (
                        <Button
                          key={`${row.id}-${status}`}
                          type="button"
                          variant={status === 'cancelled' ? 'danger' : 'primary'}
                          onClick={() => changeStatus(row.id, status)}
                        >
                          {actionLabel[status]} {row.id}
                        </Button>
                      ))
                    )}
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>

      <Modal
        open={Boolean(selectedOrder)}
        title={selectedOrder ? `Chi tiết đơn ${selectedOrder.id}` : 'Chi tiết đơn'}
        onClose={() => setSelectedOrderId(null)}
      >
        {selectedOrder && (
          <div className="grid gap-5">
            <section className="grid gap-2">
              <h2 className="text-base font-semibold text-[#222222]">Địa chỉ giao hàng</h2>
              <div className="rounded-lg bg-[#FAF8F5] p-3 text-sm leading-6 text-[#3A3632]">
                <p>
                  <strong>Người nhận:</strong> {selectedOrder.shippingAddress.recipientName}
                </p>
                <p>
                  <strong>Số điện thoại:</strong> {selectedOrder.shippingAddress.phone}
                </p>
                <p>{fullAddress(selectedOrder)}</p>
              </div>
            </section>

            <section className="grid gap-2">
              <h2 className="text-base font-semibold text-[#222222]">Sản phẩm trong đơn</h2>
              <div className="grid gap-2">
                {selectedOrder.items.map(item => (
                  <article key={`${item.productId}-${item.variantId}`} className="grid grid-cols-[56px_minmax(0,1fr)] gap-3 rounded-lg border border-[#E3DAD0] p-3">
                    <img src={item.imageUrl} alt={item.name} className="h-14 w-14 rounded-md object-cover" />
                    <div className="min-w-0 text-sm">
                      <p className="font-semibold text-[#222222]">{item.name}</p>
                      <p className="mt-1 text-[#6F6B67]">
                        {item.color} · Cỡ {item.size} · Số lượng {item.quantity}
                      </p>
                      <p className="mt-1 font-semibold tabular-nums text-[#222222]">{formatCurrency(item.unitPrice)}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="grid gap-2">
              <h2 className="text-base font-semibold text-[#222222]">Lịch sử đơn hàng</h2>
              <ol className="grid gap-2">
                {selectedOrder.timeline.map(item => (
                  <li key={item.id} className="rounded-lg border border-[#E3DAD0] p-3 text-sm leading-6">
                    <p className="font-semibold text-[#222222]">{item.label}</p>
                    <p className="text-[#6F6B67]">{formatDate(item.at)}</p>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        )}
      </Modal>
    </section>
  )
}
