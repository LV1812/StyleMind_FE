export interface IdentityProblem {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  code?: string
  timestamp?: string
  correlationId?: string
}

export class IdentityApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly problem?: IdentityProblem,
  ) {
    super(message)
    this.name = 'IdentityApiError'
  }
}

export interface IdentityTokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface StoredIdentitySession {
  accessToken: string
  refreshToken: string
  persistent: boolean
}

export interface RegisterResponse {
  account_id: string
  email: string
  account_status: string
}

export interface MyProfileResponse {
  account_id: string
  email: string
  profile: { display_name: string } | null
}

export interface StyleProfile {
  fit_preference: string | null
  height_cm: number | null
  weight_kg: number | null
  usual_top_size: string | null
  usual_bottom_size: string | null
  shoe_size: string | null
  style_codes: string[]
  color_codes: string[]
  brand_ids: string[]
}

export interface StyleProfileResponse {
  style_profile: StyleProfile | null
}

export interface StyleProfilePayload {
  fit_preference: string | null
  height_cm: number | null
  weight_kg: number | null
  usual_top_size: string | null
  usual_bottom_size: string | null
  shoe_size: string | null
  style_codes: string[]
  color_codes: string[]
  brand_ids: string[]
}

export interface IdentityAddress {
  address_id: string
  label: string | null
  recipient_name: string
  recipient_phone: string
  address_line: string
  ward_code: string | null
  is_default: boolean
}

export interface AddressPayload {
  label: string | null
  recipient_name: string
  recipient_phone: string
  address_line: string
  ward_code: string | null
}

export interface AddressPatchPayload {
  label?: string | null
  recipient_name?: string
  recipient_phone?: string
  address_line?: string
  ward_code?: string | null
}

export interface AddressListResponse {
  addresses: IdentityAddress[]
}

export interface Province {
  code: string
  name: string
}

export interface ProvinceListResponse {
  dataset_version: string
  provinces: Province[]
}

export interface Ward {
  code: string
  name: string
}

export interface WardListResponse {
  dataset_version: string
  province_code: string
  wards: Ward[]
}

export type IdentityAccountStatus = 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED'
export type IdentityRole = 'CUSTOMER' | 'ADMIN'

export interface ManagedUser {
  account_id: string
  email: string
  account_status: IdentityAccountStatus
  email_verified_at: string | null
  registered_at: string
  roles: IdentityRole[]
}

export interface ManagedUsersPage {
  items: ManagedUser[]
  page: number
  size: number
  total_elements: number
  total_pages: number
}

export interface ManageUsersQuery {
  status?: IdentityAccountStatus
  role?: IdentityRole
  email_contains?: string
  page?: number
  size?: number
}

export interface ManagedUserStatusResponse {
  account_id: string
  account_status: IdentityAccountStatus
  email_verified_at: string | null
}

export interface ManagedUserRolesResponse {
  account_id: string
  roles: IdentityRole[]
}

const TOKEN_STORAGE_KEY = 'stylemind.identity.session'
const PASSWORD_RESET_TOKEN_KEY = 'stylemind.identity.password-reset-token'
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')
let refreshInFlight: Promise<IdentityTokenResponse> | null = null

function storageFor(persistent: boolean): Storage | null {
  if (typeof window === 'undefined') return null
  return persistent ? window.localStorage : window.sessionStorage
}

export function readIdentitySession(): StoredIdentitySession | null {
  if (typeof window === 'undefined') return null

  for (const storage of [window.sessionStorage, window.localStorage]) {
    try {
      const raw = storage.getItem(TOKEN_STORAGE_KEY)
      if (!raw) continue
      const value = JSON.parse(raw) as Partial<StoredIdentitySession>
      if (typeof value.accessToken === 'string' && typeof value.refreshToken === 'string') {
        return {
          accessToken: value.accessToken,
          refreshToken: value.refreshToken,
          persistent: storage === window.localStorage,
        }
      }
    } catch {
      storage.removeItem(TOKEN_STORAGE_KEY)
    }
  }

  return null
}

export function storeIdentityTokens(tokens: IdentityTokenResponse, persistent: boolean): void {
  if (typeof window === 'undefined') return
  const session: StoredIdentitySession = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    persistent,
  }
  window.localStorage.removeItem(TOKEN_STORAGE_KEY)
  window.sessionStorage.removeItem(TOKEN_STORAGE_KEY)
  storageFor(persistent)?.setItem(TOKEN_STORAGE_KEY, JSON.stringify(session))
  window.dispatchEvent(new Event('identity:tokens-changed'))
}

export function clearIdentitySession(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(TOKEN_STORAGE_KEY)
  window.sessionStorage.removeItem(TOKEN_STORAGE_KEY)
  window.dispatchEvent(new Event('identity:tokens-changed'))
}

export function storePasswordResetToken(token: string, expiresInSeconds: number): void {
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(PASSWORD_RESET_TOKEN_KEY, JSON.stringify({ token, expiresAt: Date.now() + expiresInSeconds * 1000 }))
  }
}

export function readPasswordResetToken(): string | null {
  if (typeof window === 'undefined') return null
  const raw = window.sessionStorage.getItem(PASSWORD_RESET_TOKEN_KEY)
  if (!raw) return null
  try {
    const saved = JSON.parse(raw) as { token?: unknown; expiresAt?: unknown }
    if (typeof saved.token !== 'string' || typeof saved.expiresAt !== 'number' || Date.now() >= saved.expiresAt) {
      clearPasswordResetToken()
      return null
    }
    return saved.token
  } catch {
    clearPasswordResetToken()
    return null
  }
}

export function clearPasswordResetToken(): void {
  if (typeof window !== 'undefined') window.sessionStorage.removeItem(PASSWORD_RESET_TOKEN_KEY)
}

export function identityErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof IdentityApiError)) return error instanceof Error ? error.message : fallback

  const messages: Record<string, string> = {
    INVALID_REQUEST: 'Thông tin gửi lên chưa hợp lệ. Vui lòng kiểm tra lại.',
    EMAIL_ALREADY_EXISTS: 'Email này đã được đăng ký.',
    INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng.',
    ACCOUNT_NOT_ACTIVE: 'Tài khoản chưa xác thực hoặc đang tạm khóa.',
    INVALID_REFRESH_TOKEN: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    EMAIL_DELIVERY_FAILED: 'Không gửi được email. Vui lòng thử lại sau.',
    EMAIL_DELIVERY_UNKNOWN: 'Chưa xác nhận được việc gửi email. Hãy kiểm tra hộp thư trước khi yêu cầu gửi lại.',
    EMAIL_VERIFICATION_INVALID: 'Mã xác thực không đúng hoặc đã được sử dụng.',
    EMAIL_VERIFICATION_EXPIRED: 'Mã xác thực đã hết hạn. Hãy yêu cầu gửi mã mới.',
    EMAIL_VERIFICATION_ATTEMPTS_EXCEEDED: 'Bạn đã thử quá nhiều lần. Hãy chờ trước khi thử lại.',
    EMAIL_VERIFICATION_SEND_LIMIT_EXCEEDED: 'Bạn vừa yêu cầu gửi mã. Hãy chờ trước khi gửi lại.',
    EMAIL_ALREADY_VERIFIED: 'Email này đã được xác thực.',
    EMAIL_VERIFICATION_NOT_ALLOWED: 'Tài khoản hiện không thể xác thực email.',
    PASSWORD_RESET_VERIFICATION_INVALID: 'Mã đặt lại mật khẩu không đúng hoặc đã hết hạn.',
    PASSWORD_RESET_ATTEMPTS_EXCEEDED: 'Bạn đã thử quá nhiều lần. Hãy chờ trước khi thử lại.',
    PASSWORD_RESET_INVALID: 'Yêu cầu đặt lại mật khẩu không còn hợp lệ. Hãy bắt đầu lại.',
    RESOURCE_NOT_FOUND: 'Không tìm thấy dữ liệu yêu cầu.',
    DEFAULT_ADDRESS_CHANGE_REQUIRED: 'Hãy chọn địa chỉ khác làm mặc định trước khi xóa địa chỉ này.',
    ADMIN_ACCESS_DENIED: 'Phiên quản trị không còn quyền thực hiện thao tác này.',
    ACCESS_DENIED: 'Bạn không có quyền thực hiện thao tác này.',
    AUTHENTICATION_REQUIRED: 'Vui lòng đăng nhập để tiếp tục.',
    INVALID_BEARER_TOKEN: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    ACCOUNT_STATUS_TRANSITION_NOT_ALLOWED: 'Không thể chuyển tài khoản sang trạng thái này.',
    ADMIN_SELF_CHANGE_FORBIDDEN: 'Không thể thay đổi trạng thái hoặc vai trò của chính mình.',
    LAST_QUALIFYING_ADMIN_REQUIRED: 'Phải còn ít nhất một quản trị viên đang hoạt động và đã xác thực.',
    INTERNAL_ERROR: 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.',
  }

  return (error.code && messages[error.code]) || error.message || fallback
}

async function readProblem(response: Response): Promise<IdentityProblem> {
  try {
    return (await response.json()) as IdentityProblem
  } catch {
    return {}
  }
}

function apiUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

async function performRequest<T>(
  path: string,
  init: RequestInit,
  authenticated: boolean,
  mayRefresh: boolean,
): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json, application/problem+json')
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  const session = authenticated ? readIdentitySession() : null
  if (session?.accessToken) headers.set('Authorization', `Bearer ${session.accessToken}`)

  let response: Response
  try {
    response = await fetch(apiUrl(path), { ...init, headers, cache: 'no-store' })
  } catch {
    throw new IdentityApiError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối và thử lại.', 0)
  }

  if (response.status === 401 && authenticated && mayRefresh && session?.refreshToken) {
    try {
      const rotated = await rotateStoredRefreshToken()
      storeIdentityTokens(rotated, session.persistent)
      return performRequest<T>(path, init, true, false)
    } catch (error) {
      clearIdentitySession()
      window.dispatchEvent(new Event('identity:session-expired'))
      if (error instanceof IdentityApiError) throw error
      throw new IdentityApiError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 401, 'INVALID_REFRESH_TOKEN')
    }
  }

  if (!response.ok) {
    const problem = await readProblem(response)
    throw new IdentityApiError(problem.detail || problem.title || 'Yêu cầu không thành công.', response.status, problem.code, problem)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

async function rotateStoredRefreshToken(): Promise<IdentityTokenResponse> {
  const session = readIdentitySession()
  if (!session?.refreshToken) throw new IdentityApiError('Phiên đăng nhập đã hết hạn.', 401, 'INVALID_REFRESH_TOKEN')
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const response = await performRequest<IdentityTokenResponse>(
        '/api/v1/auth/refresh',
        { method: 'POST', body: JSON.stringify({ refresh_token: session.refreshToken }) },
        false,
        false,
      )
      return response
    })().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

// Community and Identity requests share the same refresh operation.
export async function refreshIdentitySession(expectedToken: string): Promise<boolean> {
  const session = readIdentitySession()
  if (!session) return false
  if (session.accessToken !== expectedToken) return true
  const tokens = await rotateStoredRefreshToken()
  const current = readIdentitySession()
  if (!current || current.accessToken !== expectedToken || current.refreshToken !== session.refreshToken) return false
  storeIdentityTokens(tokens, session.persistent)
  return true
}

function jsonRequest(method: string, body?: unknown): RequestInit {
  return { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }
}

/** Commerce uses the existing Identity rotation/storage and expiry event. */
export async function refreshIdentityAccessToken(): Promise<string> {
  const session = readIdentitySession()
  if (!session) throw new IdentityApiError('Phiên đăng nhập đã hết hạn.', 401)
  try {
    const tokens = await rotateStoredRefreshToken()
    if (readIdentitySession()?.accessToken === tokens.access_token) return tokens.access_token
    if (readIdentitySession()?.refreshToken !== session.refreshToken) {
      throw new IdentityApiError('Phiên đăng nhập đã thay đổi. Vui lòng tải lại.', 401)
    }
    storeIdentityTokens(tokens, session.persistent)
    return tokens.access_token
  } catch (error) {
    if (readIdentitySession()?.refreshToken === session.refreshToken) {
      clearIdentitySession()
      window.dispatchEvent(new Event('identity:session-expired'))
    }
    throw error
  }
}

export const identityApi = {
  register(email: string, password: string) {
    return performRequest<RegisterResponse>('/api/v1/auth/register', jsonRequest('POST', { email, password }), false, false)
  },
  verifyEmail(email: string, code: string) {
    return performRequest<void>('/api/v1/auth/verify-email', jsonRequest('POST', { email, code }), false, false)
  },
  resendEmailVerification(email: string) {
    return performRequest<void>('/api/v1/auth/resend-email-verification', jsonRequest('POST', { email }), false, false)
  },
  login(email: string, password: string) {
    return performRequest<IdentityTokenResponse>('/api/v1/auth/login', jsonRequest('POST', { email, password }), false, false)
  },
  refresh(refreshToken: string) {
    return performRequest<IdentityTokenResponse>('/api/v1/auth/refresh', jsonRequest('POST', { refresh_token: refreshToken }), false, false)
  },
  logout(refreshToken: string) {
    return performRequest<void>('/api/v1/auth/logout', jsonRequest('POST', { refresh_token: refreshToken }), false, false)
  },
  requestPasswordReset(email: string) {
    return performRequest<{ message: string }>('/api/v1/auth/forgot-password', jsonRequest('POST', { email }), false, false)
  },
  verifyPasswordReset(email: string, code: string) {
    return performRequest<{ reset_token: string; expires_in: number }>(
      '/api/v1/auth/verify-password-reset',
      jsonRequest('POST', { email, code }),
      false,
      false,
    )
  },
  resetPassword(resetToken: string, newPassword: string) {
    return performRequest<void>(
      '/api/v1/auth/reset-password',
      jsonRequest('POST', { reset_token: resetToken, new_password: newPassword }),
      false,
      false,
    )
  },
  getMyProfile() {
    return performRequest<MyProfileResponse>('/api/v1/me', { method: 'GET' }, true, true)
  },
  patchMyProfile(displayName: string) {
    return performRequest<MyProfileResponse>('/api/v1/me', jsonRequest('PATCH', { display_name: displayName }), true, true)
  },
  getStyleProfile() {
    return performRequest<StyleProfileResponse>('/api/v1/me/style-profile', { method: 'GET' }, true, true)
  },
  replaceStyleProfile(payload: StyleProfilePayload) {
    return performRequest<StyleProfileResponse>('/api/v1/me/style-profile', jsonRequest('PUT', payload), true, true)
  },
  listAddresses() {
    return performRequest<AddressListResponse>('/api/v1/me/addresses', { method: 'GET' }, true, true)
  },
  getAddress(addressId: string) {
    return performRequest<IdentityAddress>(`/api/v1/me/addresses/${encodeURIComponent(addressId)}`, { method: 'GET' }, true, true)
  },
  createAddress(payload: AddressPayload) {
    return performRequest<IdentityAddress>('/api/v1/me/addresses', jsonRequest('POST', payload), true, true)
  },
  patchAddress(addressId: string, payload: AddressPatchPayload) {
    return performRequest<IdentityAddress>(
      `/api/v1/me/addresses/${encodeURIComponent(addressId)}`,
      jsonRequest('PATCH', payload),
      true,
      true,
    )
  },
  setDefaultAddress(addressId: string) {
    return performRequest<IdentityAddress>(
      `/api/v1/me/addresses/${encodeURIComponent(addressId)}/default`,
      { method: 'PUT' },
      true,
      true,
    )
  },
  deleteAddress(addressId: string) {
    return performRequest<void>(`/api/v1/me/addresses/${encodeURIComponent(addressId)}`, { method: 'DELETE' }, true, true)
  },
  listProvinces() {
    return performRequest<ProvinceListResponse>('/api/v1/locations/provinces', { method: 'GET' }, true, true)
  },
  listWards(provinceCode: string) {
    return performRequest<WardListResponse>(
      `/api/v1/locations/provinces/${encodeURIComponent(provinceCode)}/wards`,
      { method: 'GET' },
      true,
      true,
    )
  },
  listUsers(query: ManageUsersQuery) {
    const params = new URLSearchParams()
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.set(key, String(value))
    })
    const suffix = params.size ? `?${params.toString()}` : ''
    return performRequest<ManagedUsersPage>(`/api/v1/admin/users${suffix}`, { method: 'GET' }, true, true)
  },
  updateUserStatus(accountId: string, accountStatus: 'ACTIVE' | 'SUSPENDED') {
    return performRequest<ManagedUserStatusResponse>(
      `/api/v1/admin/users/${encodeURIComponent(accountId)}/status`,
      jsonRequest('PATCH', { account_status: accountStatus }),
      true,
      true,
    )
  },
  replaceUserRoles(accountId: string, roles: IdentityRole[]) {
    return performRequest<ManagedUserRolesResponse>(
      `/api/v1/admin/users/${encodeURIComponent(accountId)}/roles`,
      jsonRequest('PUT', { roles }),
      true,
      true,
    )
  },
}
