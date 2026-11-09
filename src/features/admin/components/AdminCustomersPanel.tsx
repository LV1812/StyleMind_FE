import { Fragment, useEffect, useState } from 'react'

import { useAuth } from '@/features/auth'
import {
  identityApi,
  identityErrorMessage,
  type IdentityAccountStatus,
  type IdentityRole,
  type ManagedUser,
} from '@/shared/api/identityApi'
import { Button, SelectField, TextField, useToast } from '@/shared/ui'
import { Plus } from 'lucide-react'

import { StatusBadge } from './AdminCommon'

type StatusFilter = 'all' | IdentityAccountStatus
type RoleFilter = 'all' | IdentityRole

const statusLabels: Record<IdentityAccountStatus, string> = {
  ACTIVE: 'Đang hoạt động',
  PENDING_VERIFICATION: 'Chờ xác thực email',
  SUSPENDED: 'Tạm khóa',
}

const roleLabels: Record<IdentityRole, string> = {
  CUSTOMER: 'Khách hàng',
  ADMIN: 'Quản trị viên',
}

function sameRoles(left: IdentityRole[], right: IdentityRole[]) {
  return left.length === right.length && left.every(role => right.includes(role))
}

export function AdminCustomersPanel() {
  const { currentUser } = useAuth()
  const toast = useToast()
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [query, setQuery] = useState('')
  const [role, setRole] = useState<RoleFilter>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [appliedFilters, setAppliedFilters] = useState({ query: '', role: 'all' as RoleFilter, status: 'all' as StatusFilter })
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editingRolesFor, setEditingRolesFor] = useState('')
  const [roleDraft, setRoleDraft] = useState<IdentityRole[]>([])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    void identityApi.listUsers({
      page,
      size: 20,
      ...(appliedFilters.query.trim() ? { email_contains: appliedFilters.query.trim() } : {}),
      ...(appliedFilters.role !== 'all' ? { role: appliedFilters.role } : {}),
      ...(appliedFilters.status !== 'all' ? { status: appliedFilters.status } : {}),
    }).then(response => {
      if (!active) return
      setUsers(response.items)
      setTotalPages(response.total_pages)
      setTotalElements(response.total_elements)
    }).catch(requestError => {
      if (active) setError(identityErrorMessage(requestError, 'Không thể tải danh sách tài khoản.'))
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => {
      active = false
    }
  }, [page, appliedFilters])

  const applyFilters = () => {
    setPage(0)
    setAppliedFilters({ query, role, status })
  }

  const changeStatus = async (user: ManagedUser) => {
    const nextStatus = user.account_status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    setActionId(user.account_id)
    setError('')
    setNotice('')
    try {
      const updated = await identityApi.updateUserStatus(user.account_id, nextStatus)
      setUsers(current => current.map(item => item.account_id === updated.account_id
        ? { ...item, account_status: updated.account_status, email_verified_at: updated.email_verified_at }
        : item))
      setNotice(nextStatus === 'SUSPENDED' ? 'Đã tạm khóa tài khoản.' : 'Đã kích hoạt lại tài khoản.')
    } catch (requestError) {
      setError(identityErrorMessage(requestError, 'Không thể cập nhật trạng thái tài khoản.'))
    } finally {
      setActionId('')
    }
  }

  const startRoleEdit = (user: ManagedUser) => {
    setEditingRolesFor(user.account_id)
    setRoleDraft(user.roles.length === 1 ? [...user.roles] : [])
    setError('')
    setNotice('')
  }

  const saveRoles = async (user: ManagedUser) => {
    if (roleDraft.length === 0) {
      setError('Mỗi tài khoản cần có ít nhất một vai trò.')
      return
    }
    if (sameRoles(user.roles, roleDraft)) {
      setEditingRolesFor('')
      return
    }
    setActionId(user.account_id)
    setError('')
    setNotice('')
    try {
      const updated = await identityApi.replaceUserRoles(user.account_id, roleDraft)
      setUsers(current => current.map(item => item.account_id === updated.account_id ? { ...item, roles: updated.roles } : item))
      setEditingRolesFor('')
      setNotice('Đã cập nhật vai trò tài khoản.')
    } catch (requestError) {
      setError(identityErrorMessage(requestError, 'Không thể cập nhật vai trò tài khoản.'))
    } finally {
      setActionId('')
    }
  }

  return (
    <section className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
        <p className="text-sm font-semibold text-[#5E5F5D]">Quản trị</p>
        <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-[#222222] md:text-4xl">Quản lý tài khoản</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5E5F5D]">
          Quản lý tài khoản, trạng thái và vai trò của người dùng.
        </p>
        </div>
        <Button type="button" icon={<Plus size={16} aria-hidden="true" />} onClick={() => toast.info('Chức năng chưa hỗ trợ.')}>Tạo tài khoản</Button>
      </div>

      <div className="grid gap-3 rounded-lg border border-[#E3E2E2] bg-white p-4 md:grid-cols-2 xl:grid-cols-[minmax(180px,1fr)_160px_180px_auto] md:items-end">
        <TextField label="Tìm theo email" value={query} onChange={event => setQuery(event.target.value)} placeholder="Nhập một phần email" />
        <SelectField label="Vai trò" value={role} onChange={event => setRole(event.target.value as RoleFilter)}>
          <option value="all">Tất cả vai trò</option>
          <option value="CUSTOMER">{roleLabels.CUSTOMER}</option>
          <option value="ADMIN">{roleLabels.ADMIN}</option>
        </SelectField>
        <SelectField label="Trạng thái" value={status} onChange={event => setStatus(event.target.value as StatusFilter)}>
          <option value="all">Tất cả trạng thái</option>
          <option value="ACTIVE">{statusLabels.ACTIVE}</option>
          <option value="PENDING_VERIFICATION">{statusLabels.PENDING_VERIFICATION}</option>
          <option value="SUSPENDED">{statusLabels.SUSPENDED}</option>
        </SelectField>
        <Button type="button" variant="secondary" onClick={applyFilters}>Lọc</Button>
      </div>

      {error && <p className="rounded-lg bg-[#FCEAEA] px-4 py-3 text-sm font-semibold text-[#A94B4B]" role="alert">{error}</p>}
      {notice && <p className="rounded-lg bg-[#EAF2EC] px-4 py-3 text-sm font-semibold text-[#294C36]" role="status">{notice}</p>}
      {loading && <p className="text-sm text-[#5E5F5D]" role="status">Đang tải danh sách tài khoản…</p>}

      {!loading && users.length === 0 && (
        <section className="rounded-lg border border-dashed border-[#C4C7C7] bg-white p-8">
          <h2 className="font-display text-2xl font-semibold text-[#222222]">Không tìm thấy tài khoản</h2>
          <p className="mt-2 text-sm text-[#5E5F5D]">Thử thay đổi bộ lọc email, trạng thái hoặc vai trò.</p>
        </section>
      )}

      <div className="overflow-hidden rounded-lg border border-[#E3E2E2] bg-white">
        <p className="border-b border-[#E3E2E2] px-4 py-2 text-xs text-[#5E5F5D] lg:hidden">Vuốt ngang để xem toàn bộ thông tin tài khoản.</p>
        <div className="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1C1B1B]" role="region" aria-label="Bảng tài khoản" tabIndex={0}>
          <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
            <thead className="bg-[#FBF9F9] text-xs font-semibold uppercase tracking-wide text-[#5E5F5D]">
              <tr>
                <th scope="col" className="px-4 py-3">Tài khoản</th>
                <th scope="col" className="px-4 py-3">Vai trò</th>
                <th scope="col" className="px-4 py-3">Xác thực & ngày tạo</th>
                <th scope="col" className="px-4 py-3">Trạng thái</th>
                <th scope="col" className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E0D8]">
              {users.map(user => {
                const isSelf = user.account_id === currentUser?.id
                const isEditingRoles = editingRolesFor === user.account_id
                const canChangeStatus = user.account_status !== 'PENDING_VERIFICATION' && !isSelf
                const roleTone = (item: IdentityRole) => item === 'ADMIN' ? 'accent' : 'neutral'
                const statusTone = user.account_status === 'ACTIVE' ? 'success' : user.account_status === 'PENDING_VERIFICATION' ? 'warning' : 'neutral'

                return (
                  <Fragment key={user.account_id}>
                    <tr className="align-middle hover:bg-[#FBF9F9]/70">
                      <th scope="row" className="px-4 py-3 text-left font-normal">
                        <div className="flex min-w-64 items-center gap-3">
                          <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#E9E8E7] text-sm font-semibold uppercase text-[#1C1B1B]">
                            {user.email.trim().charAt(0) || '?'}
                          </span>
                          <span className="min-w-0">
                            <span className="block break-all font-semibold text-[#222222]">{user.email}</span>
                            <span className="mt-0.5 block text-xs text-[#5E5F5D]" title={user.account_id}>
                              ID {user.account_id.slice(0, 8)}…
                            </span>
                            {isSelf && <span className="mt-1 inline-flex rounded-md bg-[#F5F2EE] px-2 py-0.5 text-[11px] font-semibold text-[#3A3632]">Tài khoản của bạn</span>}
                          </span>
                        </div>
                      </th>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {user.roles.map(item => <StatusBadge key={item} tone={roleTone(item)}>{roleLabels[item]}</StatusBadge>)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={user.email_verified_at ? 'success' : 'warning'}>
                          {user.email_verified_at ? 'Email đã xác thực' : 'Email chưa xác thực'}
                        </StatusBadge>
                        <p className="mt-1.5 whitespace-nowrap text-xs text-[#5E5F5D]">Đăng ký {new Date(user.registered_at).toLocaleDateString('vi-VN')}</p>
                      </td>
                      <td className="px-4 py-3"><StatusBadge tone={statusTone}>{statusLabels[user.account_status]}</StatusBadge></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {!isEditingRoles && (
                            <Button type="button" size="sm" variant="ghost" className="border border-[#E5E0D8]" onClick={() => startRoleEdit(user)}>
                              Sửa vai trò
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant={user.account_status === 'SUSPENDED' ? 'soft' : 'ghost'}
                            className={user.account_status === 'SUSPENDED' ? '' : 'border border-[#E5E0D8]'}
                            disabled={!canChangeStatus || actionId === user.account_id}
                            loading={actionId === user.account_id}
                            onClick={() => void changeStatus(user)}
                          >
                            {user.account_status === 'ACTIVE' ? 'Khóa' : user.account_status === 'SUSPENDED' ? 'Mở khóa' : 'Chờ xác thực'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {isEditingRoles && (
                      <tr className="bg-[#FBF9F9]">
                        <td colSpan={5} className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                            <label className="inline-flex items-center gap-3 text-sm font-semibold text-[#3A3632]">Vai trò
                              <select aria-label="Chọn vai trò" value={roleDraft[0] ?? ''} disabled={isSelf || actionId === user.account_id} onChange={event => setRoleDraft(event.target.value ? [event.target.value as IdentityRole] : [])} className="min-h-10 rounded-lg border border-[#C4C7C7] bg-white px-3">
                                <option value="" disabled>Chọn vai trò</option>
                                <option value="CUSTOMER">Khách hàng</option>
                                <option value="ADMIN">Quản trị viên</option>
                              </select>
                            </label>
                            {isSelf && <p className="text-xs text-[#5E5F5D]">Bạn không thể tự thay đổi vai trò của tài khoản này.</p>}
                            <div className="ml-auto flex items-center gap-2">
                              <Button size="sm" type="button" loading={actionId === user.account_id} disabled={isSelf || roleDraft.length === 0} onClick={() => void saveRoles(user)}>Lưu</Button>
                              <Button size="sm" type="button" variant="ghost" className="border border-[#E5E0D8]" disabled={actionId === user.account_id} onClick={() => setEditingRolesFor('')}>Hủy</Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#E3E2E2] bg-white p-4">
        <p className="text-sm text-[#5E5F5D]">{totalElements} tài khoản · Trang {totalPages ? page + 1 : 0} / {totalPages}</p>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" disabled={loading || page <= 0} onClick={() => setPage(value => Math.max(0, value - 1))}>Trước</Button>
          <Button type="button" variant="secondary" disabled={loading || totalPages === 0 || page + 1 >= totalPages} onClick={() => setPage(value => value + 1)}>Sau</Button>
        </div>
      </div>
    </section>
  )
}
