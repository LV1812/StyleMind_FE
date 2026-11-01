import { useMemo, useState } from 'react'

import type { DemoAction, DemoDatabase } from '@/app/store/types'
import type { CancellationRequest, ReturnRequest } from '@/entities/order/model/types'
import { cancellationStatusLabel, returnStatusLabel } from '@/features/admin/model/adminLabels'
import { Button, useToast } from '@/shared/ui'
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

  const reviewCancellation = (requestId: string, decision: 'approved' | 'rejected') => {
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
          Duyệt hủy đơn và đổi/trả, đồng thời tạo thông báo để khách hàng thấy trong tài khoản của họ.
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

      {activeTab === 'cancellations' ? (
        <div className="grid gap-3">
          {cancellations.length === 0 ? (
            <p className="rounded-lg bg-white p-4 text-sm text-[#6F6B67] shadow-[0_10px_28px_rgba(58,54,50,0.07)]">
              Chưa có yêu cầu hủy đơn.
            </p>
          ) : (
            cancellations.map(request => (
              <article key={request.id} className="grid gap-4 rounded-lg bg-white p-4 shadow-[0_10px_28px_rgba(58,54,50,0.07)] xl:grid-cols-[minmax(0,1fr)_auto]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="break-all font-display text-2xl font-semibold text-[#222222]">{request.id}</h2>
                    <StatusBadge tone={statusTone(request.status)}>{cancellationStatusLabel[request.status]}</StatusBadge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#6F6B67]">
                    Đơn {request.orderId} · {customerName(database, request.userId)} · {formatDate(request.createdAt)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#3A3632]">{request.reason}</p>
                </div>
                <div className="flex flex-wrap gap-2 xl:justify-end">
                  {request.status === 'submitted' ? (
                    <>
                      <Button type="button" onClick={() => reviewCancellation(request.id, 'approved')}>
                        Duyệt hủy {request.id}
                      </Button>
                      <Button type="button" variant="danger" onClick={() => reviewCancellation(request.id, 'rejected')}>
                        Từ chối hủy {request.id}
                      </Button>
                    </>
                  ) : (
                    <span className="inline-flex min-h-11 items-center rounded-lg bg-[#FAF8F5] px-3 text-sm font-semibold text-[#8A8179]">
                      Đã xử lý
                    </span>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {returns.length === 0 ? (
            <p className="rounded-lg bg-white p-4 text-sm text-[#6F6B67] shadow-[0_10px_28px_rgba(58,54,50,0.07)]">
              Chưa có yêu cầu đổi/trả.
            </p>
          ) : (
            returns.map(request => (
              <article key={request.id} className="grid gap-4 rounded-lg bg-white p-4 shadow-[0_10px_28px_rgba(58,54,50,0.07)] xl:grid-cols-[minmax(0,1fr)_auto]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="break-all font-display text-2xl font-semibold text-[#222222]">{request.id}</h2>
                    <StatusBadge tone={statusTone(request.status)}>{returnStatusLabel[request.status]}</StatusBadge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#6F6B67]">
                    Đơn {request.orderId} · {customerName(database, request.userId)} · {formatDate(request.createdAt)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#3A3632]">{request.reason}</p>
                  <p className="mt-2 text-xs font-semibold text-[#8A8179]">{request.items.length} sản phẩm trong yêu cầu</p>
                </div>
                <div className="flex flex-wrap gap-2 xl:justify-end">
                  {request.status === 'submitted' || request.status === 'reviewing' ? (
                    <>
                      <Button type="button" onClick={() => reviewReturn(request.id, 'approved')}>
                        Duyệt đổi/trả {request.id}
                      </Button>
                      <Button type="button" variant="danger" onClick={() => reviewReturn(request.id, 'rejected')}>
                        Từ chối đổi/trả {request.id}
                      </Button>
                    </>
                  ) : request.status === 'approved' ? (
                    <Button type="button" onClick={() => reviewReturn(request.id, 'refunded')}>
                      Hoàn tiền {request.id}
                    </Button>
                  ) : (
                    <span className="inline-flex min-h-11 items-center rounded-lg bg-[#FAF8F5] px-3 text-sm font-semibold text-[#8A8179]">
                      Đã xử lý
                    </span>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </section>
  )
}
