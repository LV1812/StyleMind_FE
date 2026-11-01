import { beforeEach, describe, expect, it } from 'vitest'

import { createDemoSeed } from '@/app/data/demoSeed'
import {
  identityApi,
  IdentityApiError,
  readIdentitySession,
} from '@/shared/api/identityApi'
import { expireNextIdentityRequest, getIdentityMockCalls, resetIdentityMockBackend, seedIdentitySession } from '@/test/identityMockBackend'

const DEMO_STORAGE_KEY = 'stylemind.demo.database'

function persistDemoSession(userId: string) {
  const database = createDemoSeed()
  database.session = { userId, persistent: true }
  window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(database))
}

function call(method: string, path: string) {
  return getIdentityMockCalls().find(item => item.method === method && item.path === path)
}

describe('Identity API contract', () => {
  beforeEach(() => {
    resetIdentityMockBackend()
    window.localStorage.clear()
    window.sessionStorage.clear()
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(createDemoSeed()))
  })

  it('sends the complete public authentication lifecycle with the BE DTO fields', async () => {
    const seed = createDemoSeed()
    const admin = seed.users.find(user => user.role === 'admin')!

    await identityApi.register('new@example.test', 'long-password-123')
    await identityApi.verifyEmail('new@example.test', '123456')
    await identityApi.resendEmailVerification('new@example.test')
    const tokens = await identityApi.login(admin.email, admin.password)
    const rotated = await identityApi.refresh(tokens.refresh_token)
    await identityApi.logout(rotated.refresh_token)
    await identityApi.requestPasswordReset(admin.email)
    const reset = await identityApi.verifyPasswordReset(admin.email, '654321')
    await identityApi.resetPassword(reset.reset_token, 'a-new-long-password')

    expect(getIdentityMockCalls().map(item => `${item.method} ${item.path.split('?')[0]}`)).toEqual([
      'POST /api/v1/auth/register',
      'POST /api/v1/auth/verify-email',
      'POST /api/v1/auth/resend-email-verification',
      'POST /api/v1/auth/login',
      'POST /api/v1/auth/refresh',
      'POST /api/v1/auth/logout',
      'POST /api/v1/auth/forgot-password',
      'POST /api/v1/auth/verify-password-reset',
      'POST /api/v1/auth/reset-password',
    ])
    expect(call('POST', '/api/v1/auth/register')?.body).toEqual({ email: 'new@example.test', password: 'long-password-123' })
    expect(call('POST', '/api/v1/auth/verify-email')?.body).toEqual({ email: 'new@example.test', code: '123456' })
    expect(call('POST', '/api/v1/auth/refresh')?.body).toEqual({ refresh_token: tokens.refresh_token })
    expect(call('POST', '/api/v1/auth/reset-password')?.body).toEqual({ reset_token: reset.reset_token, new_password: 'a-new-long-password' })
  })

  it('uses Bearer auth and exact self-profile, style-profile, address, and location contracts', async () => {
    persistDemoSession('usr-customer-01')
    seedIdentitySession('usr-customer-01')
    const session = readIdentitySession()!
    const seed = createDemoSeed()
    const addressId = seed.addresses.find(address => address.userId === 'usr-customer-01')!.id
    const created = await identityApi.createAddress({
      label: 'Nhà',
      recipient_name: 'Nguyễn An',
      recipient_phone: '0912345678',
      address_line: '12 Đường A',
      ward_code: null,
    })

    await identityApi.getMyProfile()
    await identityApi.patchMyProfile('An Nguyễn')
    await identityApi.getStyleProfile()
    await identityApi.replaceStyleProfile({
      fit_preference: 'RELAXED',
      height_cm: 165,
      weight_kg: 52.5,
      usual_top_size: 'M',
      usual_bottom_size: 'S',
      shoe_size: '38',
      style_codes: ['MINIMAL'],
      color_codes: ['BLACK'],
      brand_ids: [],
    })
    await identityApi.listAddresses()
    await identityApi.getAddress(addressId)
    await identityApi.patchAddress(created.address_id, { label: null, ward_code: null })
    await identityApi.setDefaultAddress(created.address_id)
    await expect(identityApi.deleteAddress(created.address_id)).rejects.toMatchObject<Partial<IdentityApiError>>({ status: 409, code: 'DEFAULT_ADDRESS_CHANGE_REQUIRED' })
    await identityApi.setDefaultAddress(addressId)
    await identityApi.deleteAddress(created.address_id)
    await identityApi.listProvinces()
    await identityApi.listWards('79')

    const protectedCalls = getIdentityMockCalls().filter(item => item.path.startsWith('/api/v1/me') || item.path.startsWith('/api/v1/locations'))
    expect(protectedCalls).toHaveLength(14)
    expect(protectedCalls[0].headers.get('Authorization')).toBe(`Bearer ${session.accessToken}`)
    expect(protectedCalls.every(item => item.headers.get('Authorization')?.startsWith('Bearer '))).toBe(true)
    expect(call('PATCH', '/api/v1/me')?.body).toEqual({ display_name: 'An Nguyễn' })
    expect(call('PUT', '/api/v1/me/style-profile')?.body).toEqual({
      fit_preference: 'RELAXED',
      height_cm: 165,
      weight_kg: 52.5,
      usual_top_size: 'M',
      usual_bottom_size: 'S',
      shoe_size: '38',
      style_codes: ['MINIMAL'],
      color_codes: ['BLACK'],
      brand_ids: [],
    })
    expect(call('POST', '/api/v1/me/addresses')?.body).toEqual({
      label: 'Nhà', recipient_name: 'Nguyễn An', recipient_phone: '0912345678', address_line: '12 Đường A', ward_code: null,
    })
    expect(call('PUT', `/api/v1/me/addresses/${created.address_id}/default`)?.body).toBeUndefined()
    expect(call('GET', '/api/v1/locations/provinces/79/wards')?.headers.get('Authorization')).toContain('Bearer ')
  })

  it('sends admin filters and mutation payloads, and preserves backend problem codes', async () => {
    persistDemoSession('usr-admin-01')
    seedIdentitySession('usr-admin-01')
    await identityApi.listUsers({ status: 'ACTIVE', role: 'CUSTOMER', email_contains: 'stylemind', page: 2, size: 25 })
    await identityApi.updateUserStatus('usr-customer-01', 'SUSPENDED')
    await identityApi.replaceUserRoles('usr-customer-01', ['CUSTOMER', 'ADMIN'])

    expect(call('GET', '/api/v1/admin/users?status=ACTIVE&role=CUSTOMER&email_contains=stylemind&page=2&size=25')?.headers.get('Authorization')).toContain('Bearer ')
    expect(call('PATCH', '/api/v1/admin/users/usr-customer-01/status')?.body).toEqual({ account_status: 'SUSPENDED' })
    expect(call('PUT', '/api/v1/admin/users/usr-customer-01/roles')?.body).toEqual({ roles: ['CUSTOMER', 'ADMIN'] })
    await expect(identityApi.login('missing@example.test', 'wrong-password')).rejects.toMatchObject<Partial<IdentityApiError>>({
      status: 401,
      code: 'INVALID_CREDENTIALS',
    })
  })

  it('refreshes a protected request once after a 401 and stores the rotated session', async () => {
    persistDemoSession('usr-customer-01')
    seedIdentitySession('usr-customer-01')
    const previousSession = readIdentitySession()!
    expireNextIdentityRequest('GET', '/api/v1/me')

    const profile = await identityApi.getMyProfile()

    expect(profile.account_id).toBe('usr-customer-01')
    expect(getIdentityMockCalls().map(item => `${item.method} ${item.path}`)).toEqual([
      'GET /api/v1/me',
      'POST /api/v1/auth/refresh',
      'GET /api/v1/me',
    ])
    expect(readIdentitySession()?.accessToken).not.toBe(previousSession.accessToken)
    expect(readIdentitySession()?.refreshToken).not.toBe(previousSession.refreshToken)
  })
})
