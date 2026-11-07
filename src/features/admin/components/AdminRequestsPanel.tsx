import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RotateCcw } from 'lucide-react'

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
        <p className="text-sm font-semibold text-[#1C1B1B]">Chăm sóc sau mua</p>
        <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-[#222222] md:text-4xl">
          Quản lý yêu cầu
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5E5F5D]">
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

      {activeTab === 'returns' && apiMode() ? <section className="space-y-5 rounded-xl border border-[#E3E2E2] bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E3E2E2] pb-5">
          <div><h2 className="flex items-center gap-2 font-display text-2xl"><RotateCcw size={20} aria-hidden="true" /> Trả hàng & Hoàn tiền</h2><p className="mt-2 text-sm text-secondary">Quản lý yêu cầu, kiểm định và hoàn tiền.</p></div>
          <div className="flex flex-wrap items-center gap-2"><Button type="button" variant="secondary" onClick={() => toast.info('Chức năng chưa hỗ trợ.')}>Yêu cầu trả hàng</Button><Button type="button" variant="secondary" onClick={() => toast.info('Chức năng chưa hỗ trợ.')}>Hoàn tiền</Button>
            <label className="sr-only" htmlFor="return-status-filter">Lọc trạng thái trả hàng</label><select id="return-status-filter" value="" onChange={() => toast.info('Chức năng chưa hỗ trợ.')} className="min-h-11 max-w-full rounded-lg border border-[#C4C7C7] bg-white px-3 text-sm text-[#222222] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1B1B]"><option value="">Tất cả trạng thái</option><option value="REQUESTED">Chờ duyệt</option><option value="APPROVED">Đã chấp nhận</option><option value="RETURN_IN_TRANSIT">Đang vận chuyển</option><option value="QC_PASSED">Chờ hoàn tiền</option><option value="QC_FAILED">Kiểm định thất bại</option><option value="REJECTED">Bị từ chối</option></select>
          </div>
        </div>
        <div className="grid justify-items-center gap-3 rounded-xl bg-[#FBF9F9] px-5 py-12 text-center text-sm text-secondary"><RotateCcw size={32} aria-hidden="true" className="opacity-50" /><p>Quản lý yêu cầu đổi/trả hiện chưa được hỗ trợ.</p></div>
      </section> : activeTab === 'cancellations' ? (
        <div className="overflow-hidden rounded-lg border border-[#E3E2E2] bg-white">
          <p className="border-b border-[#E3E2E2] px-4 py-2 text-xs text-[#5E5F5D] lg:hidden">Vuốt ngang để xem toàn bộ yêu cầu hủy.</p>
          <div className="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1C1B1B]" role="region" aria-label="Bảng yêu cầu hủy đơn" tabIndex={0}>
            <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
              <thead className="bg-[#FBF9F9] text-xs font-semibold uppercase tracking-wide text-[#5E5F5D]">
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
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-[#5E5F5D]">Chưa có yêu cầu hủy đơn.</td></tr>
                ) : cancellations.map(request => (
                  <tr key={request.id} className="align-middle hover:bg-[#FBF9F9]/70">
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-[#222222]">{request.id}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link to={orderAdminHref(request.orderId)} className="font-semibold text-accent underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                        {request.orderId}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[#3A3632]">{customerName(database, request.userId)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-[#5E5F5D]">{formatDate(request.createdAt)}</td>
                    <td className="max-w-[18rem] px-4 py-3">
                      <blockquote className="rounded-r-md border-l-2 border-[#C4C7C7] bg-[#F5F2EE] px-3 py-2 leading-5 text-[#3A3632]">{request.reason}</blockquote>
                    </td>
                    <td className="px-4 py-3"><StatusBadge tone={statusTone(request.status)}>{cancellationStatusLabel[request.status]}</StatusBadge></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {request.status === 'submitted' ? (
                          <>
                            <Button type="button" size="sm" onClick={() => void reviewCancellation(request.id, 'approved')}>Duyệt yêu cầu</Button>
                            <Button type="button" size="sm" variant="danger-soft" onClick={() => void reviewCancellation(request.id, 'rejected')}>Từ chối</Button>
                          </>
                        ) : <span className="whitespace-nowrap text-xs font-medium text-[#5E5F5D]">Đã xử lý</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[#E3E2E2] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
              <thead className="bg-[#FBF9F9] text-xs font-semibold uppercase tracking-wide text-[#5E5F5D]">
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
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-[#5E5F5D]">Chưa có yêu cầu đổi/trả.</td></tr>
                ) : returns.map(request => (
                  <tr key={request.id} className="align-middle hover:bg-[#FBF9F9]/70">
                    <td className="whitespace-nowrap px-4 py-3">
                      <p className="font-semibold text-[#222222]">{request.id}</p>
                      <p className="mt-0.5 text-xs text-[#5E5F5D]">{request.items.length} sản phẩm</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link to={orderAdminHref(request.orderId)} className="font-semibold text-accent underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                        {request.orderId}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[#3A3632]">{customerName(database, request.userId)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-[#5E5F5D]">{formatDate(request.createdAt)}</td>
                    <td className="max-w-[18rem] px-4 py-3">
                      <blockquote className="rounded-r-md border-l-2 border-[#C4C7C7] bg-[#F5F2EE] px-3 py-2 leading-5 text-[#3A3632]">{request.reason}</blockquote>
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
                        ) : <span className="whitespace-nowrap text-xs font-medium text-[#5E5F5D]">Đã xử lý</span>}
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
