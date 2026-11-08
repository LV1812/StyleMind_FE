import type { ApiProblem } from './commerce.types'
import { readIdentitySession, refreshIdentitySession } from '../shared/api/identityApi'

const configuredGatewayUrl = import.meta.env.VITE_API_BASE_URL as string | undefined
const gatewayUrl = (configuredGatewayUrl || '').replace(/\/$/, '')
export const COMMERCE_API_URL = `${gatewayUrl}/commerce`

let inMemoryAccessToken: string | null = null

export function setCommerceAccessToken(token: string | null) {
  inMemoryAccessToken = token
}

export function getCommerceAccessToken(): string | null {
  if (inMemoryAccessToken) return inMemoryAccessToken
  if (typeof window === 'undefined') return null

  const identityToken = readIdentitySession()?.accessToken
  if (identityToken) return identityToken

  return (
    window.localStorage.getItem('stylemind_access_token') ||
    window.localStorage.getItem('access_token') ||
    window.sessionStorage.getItem('stylemind_access_token') ||
    window.sessionStorage.getItem('access_token')
  )
}

export class CommerceApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly problem?: ApiProblem

  constructor(status: number, problem?: ApiProblem) {
    super(problem?.detail || problem?.title || `Commerce API request failed (${status})`)
    this.name = 'CommerceApiError'
    this.status = status
    this.code = problem?.code
    this.problem = problem
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  responseType?: 'json' | 'blob'
  auth?: boolean
}

export async function commerceRequest<T>(path: string, options: RequestOptions = {}, retried = false): Promise<T> {
  const headers = new Headers(options.headers)
  const token = options.auth === false ? null : getCommerceAccessToken()
  const isFormData = options.body instanceof FormData
  const requestBody: BodyInit | undefined =
    options.body === undefined
      ? undefined
      : options.body instanceof FormData
        ? options.body
        : JSON.stringify(options.body)

  headers.set('Accept', options.responseType === 'blob' ? '*/*' : 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.body !== undefined && !isFormData) headers.set('Content-Type', 'application/json')

  const response = await fetch(`${COMMERCE_API_URL}${path}`, {
    ...options,
    headers,
    body: requestBody,
  })

  if (response.status === 401 && token && !retried && readIdentitySession()?.accessToken === token) {
    try {
      if (await refreshIdentitySession(token)) return commerceRequest<T>(path, options, true)
    } catch { /* Surface the original unauthorized response. */ }
  }

  if (!response.ok) {
    const contentType = response.headers.get('content-type') || ''
    const problem = contentType.includes('json')
      ? ((await response.json().catch(() => undefined)) as ApiProblem | undefined)
      : undefined
    throw new CommerceApiError(response.status, problem)
  }

  if (response.status === 204) return undefined as T
  if (options.responseType === 'blob') return (await response.blob()) as T
  return (await response.json()) as T
}

export function queryString(values: object): string {
  const query = new URLSearchParams()
  Object.entries(values as Record<string, unknown>).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value))
  })
  const serialized = query.toString()
  return serialized ? `?${serialized}` : ''
}
