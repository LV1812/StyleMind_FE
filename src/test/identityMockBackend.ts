import { vi } from 'vitest'

const DEMO_STORAGE_KEY = 'stylemind.demo.database'
const IDENTITY_STORAGE_KEY = 'stylemind.identity.session'

type JsonRecord = Record<string, any>

interface MockCall {
  method: string
  path: string
  headers: Headers
  body: JsonRecord | undefined
}

const styleProfiles = new Map<string, JsonRecord | null>()
const addresses = new Map<string, JsonRecord[]>()
const refreshSessions = new Map<string, string>()
const resetTokens = new Map<string, string>()
const unauthorizedOnce = new Set<string>()
const calls: MockCall[] = []
const commerceCarts = new Map<string, JsonRecord[]>()
const commerceOrders = new Map<string, JsonRecord>()
const checkoutOrders = new Map<string, string>()
let nextAddressId = 1
let nextTokenId = 1
let originalSetItem: typeof Storage.prototype.setItem | undefined

function currentDatabase(): JsonRecord | null {
  const raw = window.localStorage.getItem(DEMO_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as JsonRecord
  } catch {
    return null
  }
}

function updateDatabase(update: (database: JsonRecord) => void) {
  const database = currentDatabase()
  if (!database) return
  update(database)
  window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(database))
}

function encodeBase64Url(value: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value))
  let binary = ''
  bytes.forEach(byte => { binary += String.fromCharCode(byte) })
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function issueTokens(user: JsonRecord) {
  const roles = user.role === 'admin' ? ['ADMIN'] : ['CUSTOMER']
  const accessToken = `test.${encodeBase64Url({ sub: user.id, roles, exp: Math.floor(Date.now() / 1000) + 3600, jti: `test-${nextTokenId++}` })}.signature`
  const refreshToken = `refresh-${user.id}-${Date.now()}-${Math.random()}`
  refreshSessions.set(refreshToken, user.id)
  return { access_token: accessToken, refresh_token: refreshToken, token_type: 'Bearer', expires_in: 3600 }
}

function seedStoredSession(database: JsonRecord | null) {
  const session = database?.session
  const user = session && database?.users?.find((item: JsonRecord) => item.id === session.userId)
  if (!user || user.status !== 'active') {
    originalSetItem?.call(window.localStorage, IDENTITY_STORAGE_KEY, '')
    window.localStorage.removeItem(IDENTITY_STORAGE_KEY)
    return
  }

  const tokens = issueTokens(user)
  const saved = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    persistent: session.persistent !== false,
  }
  originalSetItem?.call(window.localStorage, IDENTITY_STORAGE_KEY, JSON.stringify(saved))
}

function jsonResponse(status: number, body?: unknown, contentType = 'application/json') {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': contentType },
  })
}

function problem(status: number, code: string, detail = code) {
  return jsonResponse(status, { type: 'about:blank', title: code, status, detail, code }, 'application/problem+json')
}

function readUserId(headers: Headers): string | null {
  const authorization = headers.get('Authorization') ?? ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='))
    const bytes = Uint8Array.from(decoded, character => character.charCodeAt(0))
    const claims = JSON.parse(new TextDecoder().decode(bytes)) as { sub?: unknown }
    return typeof claims.sub === 'string' ? claims.sub : null
  } catch {
    return null
  }
}

function getUserById(userId: string): JsonRecord | undefined {
  return currentDatabase()?.users?.find((user: JsonRecord) => user.id === userId)
}

function currentUser(headers: Headers): JsonRecord | null {
  const userId = readUserId(headers)
  const user = userId ? getUserById(userId) : undefined
  return user?.status === 'active' ? user : null
}

function addressList(userId: string): JsonRecord[] {
  const saved = addresses.get(userId)
  if (saved) return saved
  const seeded = (currentDatabase()?.addresses ?? [])
    .filter((address: JsonRecord) => address.userId === userId)
    .map((address: JsonRecord) => ({
      address_id: address.id,
      label: null,
      recipient_name: address.recipientName,
      recipient_phone: address.phone,
      address_line: [address.line1, address.district, address.province].filter(Boolean).join(', '),
      ward_code: null,
      is_default: Boolean(address.isDefault),
    }))
  addresses.set(userId, seeded)
  return seeded
}

function accountStatus(user: JsonRecord): string {
  if (user.status === 'locked') return 'SUSPENDED'
  return 'ACTIVE'
}

function toManagedUser(user: JsonRecord) {
  return {
    account_id: user.id,
    email: user.email,
    account_status: accountStatus(user),
    email_verified_at: '2026-01-01T00:00:00Z',
    registered_at: user.createdAt ?? '2026-01-01T00:00:00Z',
    roles: user.role === 'admin' ? ['ADMIN'] : ['CUSTOMER'],
  }
}

async function handleRequest(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, window.location.origin)
  const method = (init.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase()
  const headers = new Headers(init.headers ?? (input instanceof Request ? input.headers : undefined))
  let body: JsonRecord | undefined
  if (typeof init.body === 'string') {
    try { body = JSON.parse(init.body) as JsonRecord } catch { body = undefined }
  }
  calls.push({ method, path: `${url.pathname}${url.search}`, headers, body })

  // Public Commerce fixtures use the wire contract rather than bypassing the catalog adapter.
  if (url.pathname === '/commerce/api/v1/products' && method === 'GET') {
    const database = currentDatabase()
    const categories = database?.categories ?? []
    const active = (database?.products ?? []).filter((product: JsonRecord) => product.active && categories.some((category: JsonRecord) => category.id === product.categoryId && category.active))
    const items = active.map((product: JsonRecord) => ({
      product_id: product.id, category_id: product.categoryId, category_name: categories.find((category: JsonRecord) => category.id === product.categoryId)?.label ?? '',
      brand_name: product.brand, name: product.name, description: product.description, product_status: 'ACTIVE',
      variants: product.variants.filter((variant: JsonRecord) => variant.active).map((variant: JsonRecord) => ({
        variant_id: variant.id, size: variant.size, color: variant.color, material: product.material,
        unit_price_vnd: variant.priceOverride ?? product.basePrice, variant_status: 'ACTIVE', available_quantity: variant.stock,
        images: variant.images.map((image: JsonRecord) => ({ image_id: image.id, image_url: image.url, alt_text: image.alt, display_order: image.order, is_primary: image.isPrimary })),
      })),
    }))
    const size = Number(url.searchParams.get('size') ?? 100)
    const page = Number(url.searchParams.get('page') ?? 0)
    return jsonResponse(200, { items: items.slice(page * size, (page + 1) * size), page, size, total_elements: items.length, total_pages: Math.ceil(items.length / size) })
  }
  if (url.pathname.startsWith('/commerce/api/v1/') && !url.pathname.includes('/guest/')) {
    if (unauthorizedOnce.delete(`${method} ${url.pathname}`)) return problem(401, 'INVALID_BEARER_TOKEN')
    const user = currentUser(headers)
    const owner = user?.id ?? headers.get('X-Guest-Session-Key')
    const cartPath = url.pathname.match(/^\/commerce\/api\/v1\/cart(?:\/items(?:\/([^/]+))?)?$/)
    const pricesPath = url.pathname === '/commerce/api/v1/checkout/prices'
    const orderPath = url.pathname.match(/^\/commerce\/api\/v1\/orders(?:\/([^/]+)(\/payment-attempt)?)?$/)
    if (cartPath || pricesPath || orderPath) {
      if (!owner) return problem(401, 'UNAUTHENTICATED')
      if (!commerceCarts.has(owner)) {
        const lines = user ? currentDatabase()?.cartLines ?? [] : []
        commerceCarts.set(owner, lines.map((line: JsonRecord) => ({ cart_item_id: line.id, variant_id: line.variantId, quantity: line.quantity })))
      }
      let lines = commerceCarts.get(owner)!
      const snapshot = () => {
        const products = currentDatabase()?.products ?? []
        const items = lines.map((line): JsonRecord => {
          const product = products.find((p: JsonRecord) => p.variants.some((v: JsonRecord) => v.id === line.variant_id))
          const variant = product?.variants.find((v: JsonRecord) => v.id === line.variant_id)
          const price = variant?.priceOverride ?? product?.basePrice ?? 0
          return { ...line, product_id: product?.id, product_name: product?.name, size: variant?.size, color: variant?.color, unit_price_vnd: price, line_total_vnd: price * line.quantity }
        })
        return { cart_id: owner, cart_status: 'ACTIVE', items, total_vnd: items.reduce((sum, item) => sum + item.line_total_vnd, 0) }
      }
      if (cartPath) {
        if (method === 'POST') {
          const existing = lines.find(line => line.variant_id === body?.variant_id)
          if (existing) existing.quantity += body?.quantity ?? 1
          else lines.push({ cart_item_id: crypto.randomUUID(), variant_id: body?.variant_id, quantity: body?.quantity })
        }
        if (method === 'PUT') { const item = lines.find(line => line.cart_item_id === cartPath[1]); if (item) item.quantity = body?.quantity }
        if (method === 'DELETE') { lines = lines.filter(line => line.cart_item_id !== cartPath[1]); commerceCarts.set(owner, lines); return jsonResponse(204) }
        return jsonResponse(200, snapshot())
      }
      if (pricesPath) return lines.length ? jsonResponse(200, snapshot()) : problem(409, 'EMPTY_CART')
      if (orderPath) {
        if (!user) return problem(401, 'UNAUTHENTICATED')
        if (!orderPath[1] && method === 'POST') {
          const existing = checkoutOrders.get(owner + body?.checkout_key)
          if (existing) return jsonResponse(201, commerceOrders.get(existing))
          if (!lines.length) return problem(409, 'EMPTY_CART')
          const cart = snapshot()
          const id = crypto.randomUUID()
          const order = { order_id: id, order_number: 'TEST-' + id.slice(0, 8), customer_id: owner, checkout_key: body?.checkout_key, order_status: body?.payment_method === 'COD' ? 'PLACED' : 'PENDING_PAYMENT', payment_method: body?.payment_method, accepted_total_vnd: cart.total_vnd, address: addressList(owner).find(a => a.address_id === body?.shipping_address_id), items: cart.items.map(item => ({ ...item, order_item_id: item.variant_id, product_name_snapshot: item.product_name })) }
          commerceOrders.set(id, order); checkoutOrders.set(owner + body?.checkout_key, id); commerceCarts.set(owner, [])
          return jsonResponse(201, order)
        }
        const order = commerceOrders.get(orderPath[1])
        if (!order || order.customer_id !== owner) return problem(404, 'ORDER_NOT_FOUND')
        if (orderPath[2] && method === 'POST') {
          if (order.order_status !== 'PENDING_PAYMENT') return problem(409, 'ORDER_NOT_PAYABLE')
          return jsonResponse(200, { id: order.order_id, orderId: order.order_id, method: order.payment_method, status: 'PENDING', amountVnd: order.accepted_total_vnd, reference: 'TEST', transferContent: 'TEST', expiresAt: '2099-01-01T00:00:00Z', qrPayload: order.payment_method === 'SEPAY_VIETQR' ? 'https://example.test/test-qr.png' : null })
        }
        return jsonResponse(200, order)
      }
    }
  }

  const path = url.pathname
  if (unauthorizedOnce.delete(`${method} ${path}`)) return problem(401, 'INVALID_BEARER_TOKEN')
  if (path === '/api/v1/auth/register' && method === 'POST') {
    return jsonResponse(201, { account_id: 'test-account', email: body?.email, account_status: 'PENDING_VERIFICATION' })
  }
  if (path === '/api/v1/auth/verify-email' && method === 'POST') return jsonResponse(204)
  if (path === '/api/v1/auth/resend-email-verification' && method === 'POST') return jsonResponse(204)
  if (path === '/api/v1/auth/login' && method === 'POST') {
    const database = currentDatabase()
    const user = database?.users?.find((item: JsonRecord) => item.email.toLowerCase() === String(body?.email ?? '').toLowerCase())
    if (!user || user.password !== body?.password) return problem(401, 'INVALID_CREDENTIALS')
    if (user.status !== 'active') return problem(403, 'ACCOUNT_NOT_ACTIVE')
    return jsonResponse(200, issueTokens(user))
  }
  if (path === '/api/v1/auth/refresh' && method === 'POST') {
    const userId = refreshSessions.get(String(body?.refresh_token ?? ''))
    const user = userId ? getUserById(userId) : undefined
    if (!user || user.status !== 'active') return problem(401, 'INVALID_REFRESH_TOKEN')
    return jsonResponse(200, issueTokens(user))
  }
  if (path === '/api/v1/auth/logout' && method === 'POST') {
    refreshSessions.delete(String(body?.refresh_token ?? ''))
    return jsonResponse(204)
  }
  if (path === '/api/v1/auth/forgot-password' && method === 'POST') return jsonResponse(202, { message: 'If eligible, instructions will be sent.' })
  if (path === '/api/v1/auth/verify-password-reset' && method === 'POST') {
    const resetToken = `reset-${Date.now()}-${Math.random()}`
    resetTokens.set(resetToken, String(body?.email ?? ''))
    return jsonResponse(200, { reset_token: resetToken, expires_in: 600 })
  }
  if (path === '/api/v1/auth/reset-password' && method === 'POST') {
    if (!resetTokens.delete(String(body?.reset_token ?? ''))) return problem(400, 'PASSWORD_RESET_INVALID')
    return jsonResponse(204)
  }

  if (path === '/api/v1/me' && method === 'GET') {
    const user = currentUser(headers)
    if (!user) return problem(401, 'AUTHENTICATION_REQUIRED')
    return jsonResponse(200, { account_id: user.id, email: user.email, profile: user.fullName ? { display_name: user.fullName } : null })
  }
  if (path === '/api/v1/me' && method === 'PATCH') {
    const user = currentUser(headers)
    if (!user) return problem(401, 'AUTHENTICATION_REQUIRED')
    if (typeof body?.display_name !== 'string' || !body.display_name.trim()) return problem(400, 'INVALID_REQUEST')
    const displayName = body.display_name.trim()
    updateDatabase(database => {
      const target = database.users.find((item: JsonRecord) => item.id === user.id)
      if (target) target.fullName = displayName
    })
    return jsonResponse(200, { account_id: user.id, email: user.email, profile: { display_name: displayName } })
  }
  const stylePath = '/api/v1/me/style-profile'
  if (path === stylePath && method === 'GET') {
    const user = currentUser(headers)
    if (!user) return problem(401, 'AUTHENTICATION_REQUIRED')
    const value = styleProfiles.has(user.id) ? styleProfiles.get(user.id) : null
    if (value == null && (user.heightCm != null || user.weightKg != null)) {
      const seeded = {
        fit_preference: null,
        height_cm: user.heightCm ?? null,
        weight_kg: user.weightKg ?? null,
        usual_top_size: null,
        usual_bottom_size: null,
        shoe_size: null,
        style_codes: [],
        color_codes: [],
        brand_ids: [],
      }
      styleProfiles.set(user.id, seeded)
      return jsonResponse(200, { style_profile: seeded })
    }
    return jsonResponse(200, { style_profile: value })
  }
  if (path === stylePath && method === 'PUT') {
    const user = currentUser(headers)
    if (!user) return problem(401, 'AUTHENTICATION_REQUIRED')
    const value = { ...body }
    styleProfiles.set(user.id, value)
    updateDatabase(database => {
      const target = database.users.find((item: JsonRecord) => item.id === user.id)
      if (target) {
        target.heightCm = value.height_cm ?? undefined
        target.weightKg = value.weight_kg ?? undefined
      }
    })
    return jsonResponse(200, { style_profile: value })
  }

  if (path === '/api/v1/locations/provinces' && method === 'GET') {
    if (!currentUser(headers)) return problem(401, 'AUTHENTICATION_REQUIRED')
    return jsonResponse(200, { dataset_version: 'test-v1', provinces: [{ code: '79', name: 'Thành phố Hồ Chí Minh' }, { code: '01', name: 'Thành phố Hà Nội' }] })
  }
  const wardsMatch = path.match(/^\/api\/v1\/locations\/provinces\/([^/]+)\/wards$/)
  if (wardsMatch && method === 'GET') {
    if (!currentUser(headers)) return problem(401, 'AUTHENTICATION_REQUIRED')
    return jsonResponse(200, { dataset_version: 'test-v1', province_code: wardsMatch[1], wards: [{ code: '00001', name: 'Phường Một' }, { code: '00004', name: 'Phường Bốn' }] })
  }
  if (path === '/api/v1/me/addresses' && method === 'GET') {
    const user = currentUser(headers)
    if (!user) return problem(401, 'AUTHENTICATION_REQUIRED')
    const list = addressList(user.id)
    return jsonResponse(200, { addresses: [...list].sort((left, right) => Number(right.is_default) - Number(left.is_default)) })
  }
  if (path === '/api/v1/me/addresses' && method === 'POST') {
    const user = currentUser(headers)
    if (!user) return problem(401, 'AUTHENTICATION_REQUIRED')
    const list = addressList(user.id)
    const created = {
      address_id: `mock-address-${nextAddressId++}`,
      label: body?.label ?? null,
      recipient_name: body?.recipient_name,
      recipient_phone: body?.recipient_phone,
      address_line: body?.address_line,
      ward_code: body?.ward_code ?? null,
      is_default: list.length === 0,
    }
    addresses.set(user.id, [...list, created])
    return jsonResponse(201, created)
  }
  const addressMatch = path.match(/^\/api\/v1\/me\/addresses\/([^/]+)(?:\/(default))?$/)
  if (addressMatch) {
    const user = currentUser(headers)
    if (!user) return problem(401, 'AUTHENTICATION_REQUIRED')
    const [, addressId, defaultAction] = addressMatch
    const list = addressList(user.id)
    const index = list.findIndex(address => address.address_id === decodeURIComponent(addressId))
    if (index < 0) return problem(404, 'RESOURCE_NOT_FOUND')
    if (defaultAction && method === 'PUT') {
      const updated = list.map((address, addressIndex) => ({ ...address, is_default: addressIndex === index }))
      addresses.set(user.id, updated)
      return jsonResponse(200, updated[index])
    }
    if (!defaultAction && method === 'GET') return jsonResponse(200, list[index])
    if (!defaultAction && method === 'PATCH') {
      const updated = { ...list[index] }
      for (const key of ['label', 'recipient_name', 'recipient_phone', 'address_line', 'ward_code']) {
        if (Object.prototype.hasOwnProperty.call(body ?? {}, key)) updated[key] = body?.[key] ?? null
      }
      const next = [...list]
      next[index] = updated
      addresses.set(user.id, next)
      return jsonResponse(200, updated)
    }
    if (!defaultAction && method === 'DELETE') {
      if (list[index].is_default && list.length > 1) return problem(409, 'DEFAULT_ADDRESS_CHANGE_REQUIRED')
      addresses.set(user.id, list.filter((_, addressIndex) => addressIndex !== index))
      return jsonResponse(204)
    }
  }

  const adminUsersPath = '/api/v1/admin/users'
  if (path === adminUsersPath && method === 'GET') {
    const actor = currentUser(headers)
    if (actor?.role !== 'admin') return problem(403, 'ADMIN_ACCESS_DENIED')
    const allUsers = (currentDatabase()?.users ?? []).map(toManagedUser)
    const filtered = allUsers.filter((user: JsonRecord) =>
      (!url.searchParams.has('status') || user.account_status === url.searchParams.get('status')) &&
      (!url.searchParams.has('role') || user.roles.includes(url.searchParams.get('role'))) &&
      (!url.searchParams.has('email_contains') || user.email.toLowerCase().includes(url.searchParams.get('email_contains')!.toLowerCase())))
    const page = Number(url.searchParams.get('page') ?? 0)
    const size = Number(url.searchParams.get('size') ?? 20)
    return jsonResponse(200, { items: filtered.slice(page * size, (page + 1) * size), page, size, total_elements: filtered.length, total_pages: Math.ceil(filtered.length / size) })
  }
  const adminUserMatch = path.match(/^\/api\/v1\/admin\/users\/([^/]+)\/(status|roles)$/)
  if (adminUserMatch && ['PATCH', 'PUT'].includes(method)) {
    const actor = currentUser(headers)
    if (actor?.role !== 'admin') return problem(403, 'ADMIN_ACCESS_DENIED')
    const [, accountId, operation] = adminUserMatch
    if (accountId === actor.id) return problem(403, 'ADMIN_SELF_CHANGE_FORBIDDEN')
    const target = getUserById(decodeURIComponent(accountId))
    if (!target) return problem(404, 'RESOURCE_NOT_FOUND')
    if (operation === 'status' && method === 'PATCH') {
      const status = body?.account_status === 'SUSPENDED' ? 'locked' : body?.account_status === 'ACTIVE' ? 'active' : undefined
      if (!status) return problem(400, 'INVALID_REQUEST')
      updateDatabase(database => {
        const item = database.users.find((user: JsonRecord) => user.id === target.id)
        if (item) item.status = status
      })
      return jsonResponse(200, { account_id: target.id, account_status: body?.account_status, email_verified_at: '2026-01-01T00:00:00Z' })
    }
    if (operation === 'roles' && method === 'PUT') {
      const roles = body?.roles as string[] | undefined
      if (!roles?.length) return problem(400, 'INVALID_REQUEST')
      const role = roles.includes('ADMIN') ? 'admin' : 'customer'
      updateDatabase(database => {
        const item = database.users.find((user: JsonRecord) => user.id === target.id)
        if (item) item.role = role
      })
      return jsonResponse(200, { account_id: target.id, roles })
    }
  }

  return problem(404, 'RESOURCE_NOT_FOUND', `Mock backend has no route for ${method} ${path}`)
}

export function installIdentityMockBackend() {
  if (!originalSetItem) {
    originalSetItem = Storage.prototype.setItem
    Storage.prototype.setItem = function (key: string, value: string) {
      originalSetItem?.call(this, key, value)
      if (this === window.localStorage && key === DEMO_STORAGE_KEY) {
        let database: JsonRecord | null = null
        try { database = JSON.parse(value) as JsonRecord } catch { database = null }
        seedStoredSession(database)
      }
    }
  }
  vi.stubGlobal('fetch', handleRequest)
}

export function resetIdentityMockBackend() {
  commerceCarts.clear(); commerceOrders.clear(); checkoutOrders.clear()
  styleProfiles.clear()
  addresses.clear()
  refreshSessions.clear()
  resetTokens.clear()
  unauthorizedOnce.clear()
  calls.length = 0
  nextAddressId = 1
  nextTokenId = 1
}

export function getIdentityMockCalls() {
  return [...calls]
}

export function expireNextIdentityRequest(method: string, path: string) {
  unauthorizedOnce.add(`${method.toUpperCase()} ${path}`)
}

export function seedIdentitySession(userId: string) {
  const user = getUserById(userId)
  if (!user) throw new Error(`Demo user ${userId} not found`)
  const tokens = issueTokens(user)
  window.localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    persistent: true,
  }))
}
