import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { commerceApi } from '@/api/commerce'
import type { DemoAction, DemoDatabase } from '@/app/store/types'
import type { CancellationRequest, ReturnRequest } from '@/entities/order/model/types'
import { cancellationStatusLabel, returnStatusLabel } from '@/features/admin/model/adminLabels'
import { Button, useToast } from '@/shared/ui'
import { apiMode } from '@/shared/api/http'
import { formatDate } from '@/shared/lib/formatDate'

import { StatusBadge } from './AdminCommon'

interface AdminRequestsPanelProps {
  database: DemoDatabase
  dispatch: React.Dispatch<DemoAction>
  reviewerId: string
}

type RequestTab = 'cancellations' | 'returns'

function customerName(database: DemoDatabase, userId: string) {
  return database.users.find(user => user.id === userId)?.fullName ?? 'Khách hàng'
}

function statusTone(status: CancellationRequest['status'] | ReturnRequest['status']) {
  if (status === 'approved' || status === 'refunded') return 'success'
  if (status === 'rejected') return 'danger'
  return 'warning'
}

function orderAdminHref(orderId: string) {
  return `/admin?section=orders&orderId=${encodeURIComponent(orderId)}`
}

export function AdminRequestsPanel({ database, dispatch, reviewerId }: AdminRequestsPanelProps) {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<RequestTab>('cancellations')

  const cancellations = useMemo(
    () => [...database.cancellationRequests].sort((first, second) => second.createdAt.localeCompare(first.createdAt)),
    [database.cancellationRequests],
  )
  const returns = useMemo(
    () => [...database.returnRequests].sort((first, second) => second.createdAt.localeCompare(first.createdAt)),
    [database.returnRequests],
  )

  const reviewCancellation = async (requestId: string, decision: 'approved' | 'rejected') => {
    try {
      await commerceApi.orders.reviewCancellation(
        requestId,
        decision === 'approved' ? 'APPROVED' : 'REJECTED',
        null,
      )
      dispatch({
        type: 'admin/cancellationReviewed',
        payload: {
          requestId,
          decision,
          reviewerId,
          reviewedAt: new Date().toISOString(),
        },
      })
      toast.success(decision === 'approved' ? 'Đã duyệt yêu cầu hủy.' : 'Đã từ chối yêu cầu hủy.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể xử lý yêu cầu hủy')
    }
  }

  const reviewReturn = (requestId: string, decision: 'approved' | 'rejected' | 'refunded') => {
    dispatch({
      type: 'admin/returnReviewed',
      payload: {
        requestId,
        decision,
        reviewerId,
        reviewedAt: new Date().toISOString(),
      },
    })
    toast.success(decision === 'refunded' ? 'Đã hoàn tiền yêu cầu đổi/trả.' : 'Đã cập nhật yêu cầu đổi/trả.')
  }

  return (
    <section className="grid gap-5">
      <div>
        <p className="text-sm font-semibold text-[#684B5A]">Chăm sóc sau mua</p>
        <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-[#222222] md:text-4xl">
          Quản lý yêu cầu
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6F6B67]">
          Xem và xử lý yêu cầu hủy đơn.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={activeTab === 'cancellations' ? 'primary' : 'secondary'} onClick={() => setActiveTab('cancellations')}>
          Hủy đơn
        </Button>
        <Button type="button" variant={activeTab === 'returns' ? 'primary' : 'secondary'} onClick={() => setActiveTab('returns')}>
          Đổi/trả
        </Button>
      </div>

      {activeTab === 'returns' && apiMode() ? <p>Quản lý yêu cầu đổi/trả hiện chưa được hỗ trợ.</p> : activeTab === 'cancellations' ? (
        <div className="overflow-hidden rounded-xl border border-[#E5E0D8] bg-white shadow-[0_8px_24px_rgba(58,54,50,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
              <thead className="bg-[#FAF8F5] text-xs font-semibold uppercase tracking-wide text-[#6F6B67]">
                <tr>
                  <th scope="col" className="px-4 py-3">Yêu cầu</th>
                  <th scope="col" className="px-4 py-3">Đơn hàng</th>
                  <th scope="col" className="px-4 py-3">Khách hàng</th>
                  <th scope="col" className="px-4 py-3">Ngày gửi</th>
                  <th scope="col" className="px-4 py-3">Lý do</th>
                  <th scope="col" className="px-4 py-3">Trạng thái</th>
                  <th scope="col" className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0D8]">
                {cancellations.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-[#6F6B67]">Chưa có yêu cầu hủy đơn.</td></tr>
                ) : cancellations.map(request => (
                  <tr key={request.id} className="align-middle hover:bg-[#FAF8F5]/70">
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-[#222222]">{request.id}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link to={orderAdminHref(request.orderId)} className="font-semibold text-accent underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                        {request.orderId}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[#3A3632]">{customerName(database, request.userId)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-[#6F6B67]">{formatDate(request.createdAt)}</td>
                    <td className="max-w-[18rem] px-4 py-3">
                      <blockquote className="rounded-r-md border-l-2 border-[#D8D0C6] bg-[#F5F2EE] px-3 py-2 leading-5 text-[#3A3632]">{request.reason}</blockquote>
                    </td>
                    <td className="px-4 py-3"><StatusBadge tone={statusTone(request.status)}>{cancellationStatusLabel[request.status]}</StatusBadge></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {request.status === 'submitted' ? (
                          <>
                            <Button type="button" size="sm" onClick={() => void reviewCancellation(request.id, 'approved')}>Duyệt yêu cầu</Button>
                            <Button type="button" size="sm" variant="danger-soft" onClick={() => void reviewCancellation(request.id, 'rejected')}>Từ chối</Button>
                          </>
                        ) : <span className="whitespace-nowrap text-xs font-medium text-[#6F6B67]">Đã xử lý</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#E5E0D8] bg-white shadow-[0_8px_24px_rgba(58,54,50,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
              <thead className="bg-[#FAF8F5] text-xs font-semibold uppercase tracking-wide text-[#6F6B67]">
                <tr>
                  <th scope="col" className="px-4 py-3">Yêu cầu</th>
                  <th scope="col" className="px-4 py-3">Đơn hàng</th>
                  <th scope="col" className="px-4 py-3">Khách hàng</th>
                  <th scope="col" className="px-4 py-3">Ngày gửi</th>
                  <th scope="col" className="px-4 py-3">Lý do</th>
                  <th scope="col" className="px-4 py-3">Trạng thái</th>
                  <th scope="col" className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0D8]">
                {returns.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-[#6F6B67]">Chưa có yêu cầu đổi/trả.</td></tr>
                ) : returns.map(request => (
                  <tr key={request.id} className="align-middle hover:bg-[#FAF8F5]/70">
                    <td className="whitespace-nowrap px-4 py-3">
                      <p className="font-semibold text-[#222222]">{request.id}</p>
                      <p className="mt-0.5 text-xs text-[#6F6B67]">{request.items.length} sản phẩm</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link to={orderAdminHref(request.orderId)} className="font-semibold text-accent underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                        {request.orderId}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[#3A3632]">{customerName(database, request.userId)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-[#6F6B67]">{formatDate(request.createdAt)}</td>
                    <td className="max-w-[18rem] px-4 py-3">
                      <blockquote className="rounded-r-md border-l-2 border-[#D8D0C6] bg-[#F5F2EE] px-3 py-2 leading-5 text-[#3A3632]">{request.reason}</blockquote>
                    </td>
                    <td className="px-4 py-3"><StatusBadge tone={statusTone(request.status)}>{returnStatusLabel[request.status]}</StatusBadge></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {request.status === 'submitted' || request.status === 'reviewing' ? (
                          <>
                            <Button type="button" size="sm" onClick={() => reviewReturn(request.id, 'approved')}>Duyệt đổi/trả</Button>
                            <Button type="button" size="sm" variant="danger-soft" onClick={() => reviewReturn(request.id, 'rejected')}>Từ chối</Button>
                          </>
                        ) : request.status === 'approved' ? (
                          <Button type="button" size="sm" onClick={() => reviewReturn(request.id, 'refunded')}>Hoàn tiền</Button>
                        ) : <span className="whitespace-nowrap text-xs font-medium text-[#6F6B67]">Đã xử lý</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
