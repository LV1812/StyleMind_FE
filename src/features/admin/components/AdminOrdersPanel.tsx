import { Eye } from 'lucide-react'
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
  pending: 'Xác nhận',
  payment_pending: 'Xác nhận thanh toán',
  paid: 'Xác nhận đơn',
  confirmed: 'Bắt đầu xử lý',
  processing: 'Giao vận chuyển',
  shipped: 'Hoàn tất',
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
  return `${address.line1}, ${address.ward}, ${address.district}, ${address.province}`
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

  return (
    <section className="grid gap-5">
      <div>
        <p className="text-sm font-semibold text-[#684B5A]">Vận hành đơn hàng</p>
        <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-[#222222] md:text-4xl">
          Quản lý đơn hàng
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6F6B67]">
          Theo dõi thanh toán, địa chỉ giao hàng và các bước xử lý đơn.
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

      <div className="overflow-hidden rounded-xl border border-[#E5E0D8] bg-white shadow-[0_8px_24px_rgba(58,54,50,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
            <thead className="bg-[#FAF8F5] text-xs font-semibold uppercase tracking-wide text-[#6F6B67]">
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
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-[#6F6B67]">Không có đơn hàng phù hợp.</td></tr>
              ) : rows.map(row => {
                const next = nextStatuses(row.status)

                return (
                  <tr key={row.id} className="align-middle hover:bg-[#FAF8F5]/70">
                    <td className="whitespace-nowrap px-4 py-3">
                      <p className="font-semibold text-[#222222]">{row.id}</p>
                      <p className="mt-0.5 text-xs text-[#6F6B67]">{row.itemCount} sản phẩm</p>
                    </td>
                    <td className="px-4 py-3 text-[#3A3632]">{row.customerName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-[#6F6B67]">{formatDate(row.createdAt)}</td>
                    <td className="px-4 py-3">
                      <p className="text-[#3A3632]">{paymentMethodLabel[row.paymentMethod]}</p>
                      <p className="mt-0.5 text-xs text-[#6F6B67]">{paymentStatusLabel[row.paymentStatus]}</p>
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
                          <span className="whitespace-nowrap text-xs font-medium text-[#6F6B67]">Trạng thái cuối</span>
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

      <Modal
        open={Boolean(selectedOrder)}
        title={selectedOrder ? `Chi tiết đơn ${selectedOrder.id}` : 'Chi tiết đơn'}
        onClose={closeOrderDetail}
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
