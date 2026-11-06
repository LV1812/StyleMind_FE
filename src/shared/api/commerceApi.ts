import { PaymentApiError } from '@/features/payments/api/paymentApi'

export const COMMERCE_GATEWAY = (import.meta.env.VITE_API_GATEWAY_URL ?? import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')

export async function commerceRequest<T>(path: string, options: { method?: string; key?: string | null; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20000)
  try {
    const response = await fetch(`${COMMERCE_GATEWAY}/commerce/api/v1${path}`, {
      method: options.method ?? 'GET', credentials: 'omit', cache: 'no-store',
      signal: options.signal ? AbortSignal.any([options.signal, controller.signal]) : controller.signal,
      headers: {
        Accept: 'application/json',
        ...(options.key ? { 'X-Guest-Session-Key': options.key } : {}),
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    })
    if (!response.ok) {
      let problem = {}
      try {
        const raw: unknown = await response.json()
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) problem = raw
      } catch { /* A proxy may return non-JSON errors. */ }
      throw new PaymentApiError(response.status, problem)
    }
    if (response.status === 204) return undefined as T
    return await response.json() as T
  } finally { clearTimeout(timer) }
}
