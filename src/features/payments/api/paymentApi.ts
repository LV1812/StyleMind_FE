import type {
  CheckoutRequest, CodCollectionRequest, OrderResponse, PaymentAttempt,
  PaymentExceptionList, PaymentExceptionQuery,
} from './types'
import type { GuestCart } from '@/features/cart/data/guestCartApi'
import type { GuestPrices } from '@/features/checkout/data/guestCheckoutApi'

export interface ApiProblem {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  code?: string
  timestamp?: string
  correlationId?: string
}

export class PaymentApiError extends Error {
  readonly code: string
  readonly correlationId?: string

  constructor(readonly status: number, readonly problem: ApiProblem) {
    super(problem.detail || problem.title || `Request failed (HTTP ${status})`)
    this.name = 'PaymentApiError'
    this.code = problem.code || 'HTTP_ERROR'
    this.correlationId = problem.correlationId
  }
}

export interface PaymentApiOptions {
  /** Gateway origin, or empty string when using a same-origin reverse proxy. */
  gatewayUrl?: string
  /** Read the current Identity access token on every call. Never use a service token. */
  getAccessToken: () => string | null | undefined
  fetch?: typeof globalThis.fetch
  refreshAccessToken?: () => Promise<string>
}

export interface RequestOptions {
  signal?: AbortSignal
}

/** Backend APIs only. No demo data, local payment confirmation or automatic write retries. */
export function createPaymentApi(options: PaymentApiOptions) {
  const gateway = (options.gatewayUrl ?? import.meta.env.VITE_API_GATEWAY_URL ?? import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')
  const fetchRequest = options.fetch ?? globalThis.fetch.bind(globalThis)

  async function request<T>(
    path: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: unknown, requestOptions?: RequestOptions, mayRefresh = true,
  ): Promise<T> {
    const token = options.getAccessToken()?.trim()
    if (!token) {
      throw new PaymentApiError(401, { code: 'AUTHENTICATION_REQUIRED', detail: 'An Identity access token is required' })
    }
    const headers: Record<string, string> = {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    }
    if (body !== undefined) headers['Content-Type'] = 'application/json'

    const timeout = new AbortController()
    const timer = setTimeout(() => timeout.abort(), 20000)
    try {
    const response = await fetchRequest(`${gateway}${path}`, {
      method, headers, signal: requestOptions?.signal ? AbortSignal.any([requestOptions.signal, timeout.signal]) : timeout.signal,
      credentials: 'omit', cache: 'no-store',
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
    if (response.status === 401 && mayRefresh && options.refreshAccessToken && token === options.getAccessToken()?.trim()) {
      try { await options.refreshAccessToken() }
      catch { throw new PaymentApiError(401, { code: 'AUTHENTICATION_REQUIRED', detail: 'Phiên đăng nhập đã hết hạn.' }) }
      if (requestOptions?.signal?.aborted) throw new DOMException('Aborted', 'AbortError')
      return request<T>(path, method, body, requestOptions, false)
    }
    if (!response.ok) {
      let problem: ApiProblem = {}
      try {
        const value: unknown = await response.json()
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          const raw = value as Record<string, unknown>
          // Only extract Problem Details fields; never include raw responses or request headers.
          for (const key of ['type', 'title', 'detail', 'instance', 'code', 'timestamp', 'correlationId'] as const) {
            if (typeof raw[key] === 'string') problem[key] = raw[key]
          }
        }
      } catch {
        // Gateway may return an empty or non-JSON error response.
      }
      throw new PaymentApiError(response.status, problem)
    }
    if (response.status === 204) return undefined as T
    return await response.json() as T
    } finally { clearTimeout(timer) }
  }

  return {
    getPrices: (requestOptions?: RequestOptions) => request<GuestPrices>('/commerce/api/v1/checkout/prices', 'GET', undefined, requestOptions),
    previewSelection: (body: { cart_item_ids: string[] }, requestOptions?: RequestOptions) => request<GuestPrices>('/commerce/api/v1/checkout/selected/prices', 'POST', body, requestOptions),
    previewBuyNow: (body: { variant_id: string; quantity: number }, requestOptions?: RequestOptions) => request<GuestPrices>('/commerce/api/v1/checkout/buy-now/prices', 'POST', body, requestOptions),
    checkoutSelection: (body: CheckoutRequest & { cart_item_ids: string[] }) => request<OrderResponse>('/commerce/api/v1/orders/selected', 'POST', body),
    checkoutBuyNow: (body: CheckoutRequest & { variant_id: string; quantity: number }) => request<OrderResponse>('/commerce/api/v1/orders/buy-now', 'POST', body),
    recoverCheckout: (checkoutKey: string) => request<OrderResponse>('/commerce/api/v1/checkout/recover', 'POST', { checkout_key: checkoutKey }),
    getCart: (requestOptions?: RequestOptions) => request<GuestCart>('/commerce/api/v1/cart', 'GET', undefined, requestOptions),
    listOrders: (query: { page: number; size: number; status?: string }, requestOptions?: RequestOptions) => {
      const params = new URLSearchParams({ page: String(query.page), size: String(query.size) })
      if (query.status) params.set('status', query.status)
      return request<{ items: OrderResponse[]; page: number; total_pages: number; total_elements: number }>(`/commerce/api/v1/orders?${params}`, 'GET', undefined, requestOptions)
    },
    requestCancellation: (orderId: string, reason: string) => request<unknown>(`/commerce/api/v1/orders/${encodeURIComponent(orderId)}/cancellation-requests`, 'POST', { reason }),
    mergeGuestCart: (key: string) => request<GuestCart>('/commerce/api/v1/cart/merge', 'POST', { guest_session_key: key }),
    addCartItem: (variantId: string, quantity: number) => request<GuestCart>('/commerce/api/v1/cart/items', 'POST', { variant_id: variantId, quantity, guest_session_key: null }),
    updateCartItem: (id: string, quantity: number) => request<GuestCart>(`/commerce/api/v1/cart/items/${encodeURIComponent(id)}`, 'PUT', { quantity, guest_session_key: null }),
    removeCartItem: (id: string) => request<void>(`/commerce/api/v1/cart/items/${encodeURIComponent(id)}`, 'DELETE'),
    checkout: (body: CheckoutRequest, requestOptions?: RequestOptions) =>
      request<OrderResponse>('/commerce/api/v1/orders', 'POST', body, requestOptions),

    /** Self-only; deliberately no request body. Reuses initial-<orderId>. */
    getOrderPaymentAttempt: (orderId: string, requestOptions?: RequestOptions) =>
      request<PaymentAttempt>(
        `/commerce/api/v1/orders/${encodeURIComponent(orderId)}/payment-attempt`,
        'POST', undefined, requestOptions,
      ),

    /** Read Order state after a provider callback; recovery is not a status polling API. */
    getOrder: (orderId: string, requestOptions?: RequestOptions) =>
      request<OrderResponse>(
        `/commerce/api/v1/orders/${encodeURIComponent(orderId)}`, 'GET', undefined, requestOptions,
      ),

    /** Admin attests actual receipt of cash. Never automatically retry this write. */
    confirmCodCollection: (body: CodCollectionRequest, requestOptions?: RequestOptions) => {
      if (!Number.isSafeInteger(body.collected_amount_vnd) || body.collected_amount_vnd <= 0) {
        throw new PaymentApiError(400, { code: 'INVALID_REQUEST', detail: 'Amount must be a positive safe integer in VND' })
      }
      if (body.collection_reference && (Array.from(body.collection_reference).length > 255 || /\p{Cc}/u.test(body.collection_reference))) throw new PaymentApiError(400, { code: 'INVALID_REQUEST', detail: 'Invalid collection reference' })
      if (body.collected_at && (!Number.isFinite(Date.parse(body.collected_at)) || Date.parse(body.collected_at) > Date.now())) throw new PaymentApiError(400, { code: 'INVALID_REQUEST', detail: 'Invalid collection time' })
      return request<PaymentAttempt>('/payment/api/v1/admin/cod-collections', 'POST', body, requestOptions)
    },

    listPaymentExceptions: (query: PaymentExceptionQuery = {}, requestOptions?: RequestOptions) => {
      const limit = query.limit ?? 50
      const offset = query.offset ?? 0
      if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0) {
        throw new PaymentApiError(400, { code: 'INVALID_REQUEST', detail: 'Invalid pagination' })
      }
      const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
      if (query.status !== undefined) params.set('status', query.status)
      return request<PaymentExceptionList>(
        `/payment/api/v1/admin/payment-exceptions?${params}`, 'GET', undefined, requestOptions,
      )
    },
  }
}

export type PaymentApi = ReturnType<typeof createPaymentApi>
