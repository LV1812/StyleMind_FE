import { beforeEach, expect, it, vi } from 'vitest'
import { refreshRoleOnReload } from './roleRefresh'

const mock = vi.hoisted(() => ({ refresh: vi.fn(), read: vi.fn() }))
vi.mock('@/shared/api/identityApi', () => ({ refreshIdentitySession: mock.refresh, readIdentitySession: mock.read }))
const token = (roles: string[]) => `header.${btoa(JSON.stringify({ roles }))}.signature`
const session = (roles: string[]) => ({ accessToken: token(roles), refreshToken: 'refresh', persistent: true })
beforeEach(() => vi.resetAllMocks())

it('làm mới phiên và xác định trang quản trị khi được cấp quyền', async () => {
  mock.refresh.mockResolvedValue(true)
  mock.read.mockReturnValueOnce(session(['CUSTOMER'])).mockReturnValue(session(['ADMIN']))
  expect(await refreshRoleOnReload(session(['CUSTOMER']))).toMatchObject({ destination: '/admin' })
  expect(mock.refresh).toHaveBeenCalledWith(token(['CUSTOMER']))
})

it('đưa người dùng bị thu hồi quyền về trang chủ khách hàng', async () => {
  mock.refresh.mockResolvedValue(true)
  mock.read.mockReturnValueOnce(session(['ADMIN'])).mockReturnValue(session(['CUSTOMER']))
  expect(await refreshRoleOnReload(session(['ADMIN']))).toMatchObject({ destination: '/' })
})

it('không chuyển trang nếu quyền sử dụng không đổi', async () => {
  mock.refresh.mockResolvedValue(true)
  mock.read.mockReturnValueOnce(session(['ADMIN'])).mockReturnValue(session(['CUSTOMER', 'ADMIN']))
  expect(await refreshRoleOnReload(session(['ADMIN']))).toMatchObject({ destination: null })
})

it('báo lỗi nếu không làm mới được, không xóa phiên trong helper', async () => {
  mock.refresh.mockRejectedValue(new Error('Không có kết nối'))
  mock.read.mockReturnValue(session(['CUSTOMER']))
  await expect(refreshRoleOnReload(session(['CUSTOMER']))).rejects.toThrow('Không có kết nối')
})
