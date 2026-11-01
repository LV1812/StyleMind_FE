import { useMemo, useState } from 'react'

import type { DemoAction, DemoDatabase } from '@/app/store/types'
import type { UserRole, UserStatus } from '@/entities/user/model/types'
import { userRoleLabel, userStatusLabel } from '@/features/admin/model/adminLabels'
import { selectAdminCustomers } from '@/features/admin/model/adminSelectors'
import type { AdminCustomerFilters } from '@/features/admin/model/adminTypes'
import { Button, SelectField, TextField, useToast } from '@/shared/ui'

import { StatusBadge } from './AdminCommon'

interface AdminCustomersPanelProps {
  database: DemoDatabase
  dispatch: React.Dispatch<DemoAction>
  actorId: string
}

function statusTone(status: UserStatus) {
  return status === 'active' ? 'success' : 'danger'
}

function roleActionLabel(role: UserRole) {
  return role === 'admin' ? 'quản trị viên' : 'khách hàng'
}

export function AdminCustomersPanel({ database, dispatch, actorId }: AdminCustomersPanelProps) {
  const toast = useToast()
  const [filters, setFilters] = useState<AdminCustomerFilters>({ query: '', role: 'all', status: 'all' })
  const rows = useMemo(() => selectAdminCustomers(database, filters), [database, filters])

  const changeStatus = (userId: string, status: UserStatus) => {
    dispatch({ type: 'admin/userStatusChanged', payload: { userId, status, actorId } })
    toast.success(status === 'locked' ? 'Đã khóa tài khoản.' : 'Đã mở khóa tài khoản.')
  }

  return (
    <section className="grid gap-5">
      <div>
        <p className="text-sm font-semibold text-[#684B5A]">Tài khoản người dùng</p>
        <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-[#222222] md:text-4xl">
          Quản lý khách hàng
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6F6B67]">
          Xem thông tin khách hàng, số đơn, bộ phối và khóa tài khoản khi cần hỗ trợ vận hành.
        </p>
      </div>

      <div className="grid gap-3 rounded-lg bg-white p-4 shadow-[0_10px_28px_rgba(58,54,50,0.07)] md:grid-cols-[minmax(220px,1fr)_180px_180px]">
        <TextField
          label="Tìm khách hàng"
          value={filters.query ?? ''}
          onChange={event => setFilters(current => ({ ...current, query: event.target.value }))}
          placeholder="Nhập tên hoặc email"
        />
        <SelectField
          label="Vai trò"
          value={filters.role ?? 'all'}
          onChange={event => setFilters(current => ({ ...current, role: event.target.value as AdminCustomerFilters['role'] }))}
        >
          <option value="all">Tất cả vai trò</option>
          <option value="customer">{userRoleLabel.customer}</option>
          <option value="admin">{userRoleLabel.admin}</option>
        </SelectField>
        <SelectField
          label="Trạng thái"
          value={filters.status ?? 'all'}
          onChange={event => setFilters(current => ({ ...current, status: event.target.value as AdminCustomerFilters['status'] }))}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">{userStatusLabel.active}</option>
          <option value="locked">{userStatusLabel.locked}</option>
        </SelectField>
      </div>

      <div className="grid gap-3">
        {rows.map(row => {
          const isCurrentAdmin = row.id === actorId
          const nextStatus: UserStatus = row.status === 'active' ? 'locked' : 'active'

          return (
            <article key={row.id} className="grid gap-4 rounded-lg bg-white p-4 shadow-[0_10px_28px_rgba(58,54,50,0.07)] xl:grid-cols-[minmax(0,1fr)_auto]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-2xl font-semibold text-[#222222]">{row.fullName}</h2>
                  <StatusBadge tone={statusTone(row.status)}>{userStatusLabel[row.status]}</StatusBadge>
                  <StatusBadge tone="accent">{userRoleLabel[row.role]}</StatusBadge>
                </div>
                <p className="mt-1 break-all text-sm font-semibold text-[#684B5A]">{row.id}</p>
                <p className="mt-2 break-all text-sm leading-6 text-[#6F6B67]">{row.email}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[#3A3632]">
                  <span className="rounded-md bg-[#FAF8F5] px-2.5 py-1">{row.orderCount} đơn hàng</span>
                  <span className="rounded-md bg-[#FAF8F5] px-2.5 py-1">{row.outfitCount} bộ phối</span>
                  {row.heightCm && <span className="rounded-md bg-[#FAF8F5] px-2.5 py-1">Cao {row.heightCm} cm</span>}
                  {row.weightKg && <span className="rounded-md bg-[#FAF8F5] px-2.5 py-1">Nặng {row.weightKg} kg</span>}
                </div>
              </div>
              {isCurrentAdmin ? (
                <Button type="button" variant="secondary" disabled>
                  Không thể tự khóa
                </Button>
              ) : (
                <Button
                  type="button"
                  variant={row.status === 'active' ? 'danger' : 'secondary'}
                  onClick={() => changeStatus(row.id, nextStatus)}
                >
                  {row.status === 'active' ? `Khóa ${roleActionLabel(row.role)} ${row.id}` : `Mở khóa ${roleActionLabel(row.role)} ${row.id}`}
                </Button>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
