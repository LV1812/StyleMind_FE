import { commerceRequest, queryString } from './http'
import type {
  CancellationRequestResponse,
  CartResponse,
  CatalogReference,
  CatalogReferenceInput,
  CatalogReferenceList,
  CheckoutInput,
  CheckoutPriceResponse,
  CommerceProduct,
  ImageOrderInput,
  OrderListQuery,
  OrderListResponse,
  OrderResponse,
  PaymentAttempt,
  ProductInput,
  ProductListQuery,
  ProductListResponse,
  ProductVariant,
  UUID,
  VariantImage,
  VariantInput,
} from './commerce.types'

const get = <T>(path: string) => commerceRequest<T>(path)
const publicGet = <T>(path: string) => commerceRequest<T>(path, { auth: false })
const post = <T>(path: string, body?: unknown) => commerceRequest<T>(path, { method: 'POST', body })
const put = <T>(path: string, body: unknown) => commerceRequest<T>(path, { method: 'PUT', body })
const del = <T = void>(path: string) => commerceRequest<T>(path, { method: 'DELETE' })

function guestQuery(guestSessionKey?: string | null) {
  return queryString({ guest_session_key: guestSessionKey })
}

export const commerceApi = {
  categories: {
    list: () => publicGet<CatalogReferenceList>('/api/v1/categories'),
    get: (id: UUID) => publicGet<CatalogReference>(`/api/v1/categories/${id}`),
    listAdmin: () => get<CatalogReferenceList>('/api/v1/admin/categories'),
    getAdmin: (id: UUID) => get<CatalogReference>(`/api/v1/admin/categories/${id}`),
    create: (input: CatalogReferenceInput) => post<CatalogReference>('/api/v1/admin/categories', input),
    replace: (id: UUID, input: CatalogReferenceInput) => put<CatalogReference>(`/api/v1/admin/categories/${id}`, input),
    remove: (id: UUID) => del(`/api/v1/admin/categories/${id}`),
  },
  brands: {
    list: () => publicGet<CatalogReferenceList>('/api/v1/brands'),
    get: (id: UUID) => publicGet<CatalogReference>(`/api/v1/brands/${id}`),
    listAdmin: () => get<CatalogReferenceList>('/api/v1/admin/brands'),
    getAdmin: (id: UUID) => get<CatalogReference>(`/api/v1/admin/brands/${id}`),
    create: (input: CatalogReferenceInput) => post<CatalogReference>('/api/v1/admin/brands', input),
    replace: (id: UUID, input: CatalogReferenceInput) => put<CatalogReference>(`/api/v1/admin/brands/${id}`, input),
    remove: (id: UUID) => del(`/api/v1/admin/brands/${id}`),
  },
  products: {
    list: (query: ProductListQuery = {}) => publicGet<ProductListResponse>(`/api/v1/products${queryString(query)}`),
    get: (id: UUID) => publicGet<CommerceProduct>(`/api/v1/products/${id}`),
    lookupVariants: (variantIds: UUID[]) =>
      commerceRequest<{ items: ProductVariant[] }>('/api/v1/variants/batch-lookup', { method: 'POST', body: { variant_ids: variantIds }, auth: false }),
    create: (input: ProductInput) => post<CommerceProduct>('/api/v1/admin/products', input),
    getAdmin: (id: UUID) => get<CommerceProduct>(`/api/v1/admin/products/${id}`),
    replace: (id: UUID, input: ProductInput) => put<CommerceProduct>(`/api/v1/admin/products/${id}`, input),
    remove: (id: UUID) => del(`/api/v1/admin/products/${id}`),
    createVariant: (productId: UUID, input: VariantInput) =>
      post<ProductVariant>(`/api/v1/admin/products/${productId}/variants`, input),
    replaceVariant: (variantId: UUID, input: VariantInput) =>
      put<ProductVariant>(`/api/v1/admin/variants/${variantId}`, input),
    removeVariant: (variantId: UUID) => del(`/api/v1/admin/variants/${variantId}`),
    uploadImage: (variantId: UUID, file: File, altText?: string) => {
      const form = new FormData()
      form.append('file', file)
      if (altText) form.append('alt_text', altText)
      return commerceRequest<VariantImage>(`/api/v1/admin/variants/${variantId}/images`, {
        method: 'POST',
        body: form,
      })
    },
    reorderImages: (variantId: UUID, input: ImageOrderInput) =>
      put<VariantImage[]>(`/api/v1/admin/variants/${variantId}/images/reorder`, input),
    removeImage: (imageId: UUID) => del(`/api/v1/admin/variant-images/${imageId}`),
    getLegacyImage: (imageId: UUID) =>
      commerceRequest<Blob>(`/api/v1/variant-images/${imageId}/content`, { responseType: 'blob', auth: false }),
  },
  cart: {
    get: (guestSessionKey?: string | null) => get<CartResponse>(`/api/v1/cart${guestQuery(guestSessionKey)}`),
    add: (variantId: UUID, quantity: number, guestSessionKey?: string | null) =>
      post<CartResponse>('/api/v1/cart/items', {
        variant_id: variantId,
        quantity,
        guest_session_key: guestSessionKey || null,
      }),
    update: (cartItemId: UUID, quantity: number, guestSessionKey?: string | null) =>
      put<CartResponse>(`/api/v1/cart/items/${cartItemId}`, {
        quantity,
        guest_session_key: guestSessionKey || null,
      }),
    remove: (cartItemId: UUID, guestSessionKey?: string | null) =>
      del(`/api/v1/cart/items/${cartItemId}${guestQuery(guestSessionKey)}`),
    clear: (guestSessionKey?: string | null) =>
      del<CartResponse>(`/api/v1/cart/items${guestQuery(guestSessionKey)}`),
    merge: (guestSessionKey: string) => post<CartResponse>('/api/v1/cart/merge', { guest_session_key: guestSessionKey }),
  },
  orders: {
    preview: () => get<CheckoutPriceResponse>('/api/v1/checkout/prices'),
    checkout: (input: CheckoutInput) => post<OrderResponse>('/api/v1/orders', input),
    list: (query: OrderListQuery = {}) => get<OrderListResponse>(`/api/v1/orders${queryString(query)}`),
    get: (id: UUID) => get<OrderResponse>(`/api/v1/orders/${id}`),
    requestCancellation: (id: UUID, reason: string) =>
      post<CancellationRequestResponse>(`/api/v1/orders/${id}/cancellation-requests`, { reason }),
    recoverPayment: (id: UUID) => post<PaymentAttempt>(`/api/v1/orders/${id}/payment-attempt`),
    listAdmin: (query: OrderListQuery = {}) =>
      get<OrderListResponse>(`/api/v1/admin/orders${queryString(query)}`),
    getAdmin: (id: UUID) => get<OrderResponse>(`/api/v1/admin/orders/${id}`),
    confirm: (id: UUID) => post<OrderResponse>(`/api/v1/admin/orders/${id}/confirm`),
    updateStatus: (id: UUID, orderStatus: string, reason: string | null = null) =>
      put<OrderResponse>(`/api/v1/admin/orders/${id}/status`, {
        order_status: orderStatus,
        reason,
      }),
    reviewCancellation: (requestId: UUID, requestStatus: 'APPROVED' | 'REJECTED', decisionReason: string | null) =>
      put<CancellationRequestResponse>(`/api/v1/admin/cancellation-requests/${requestId}`, {
        request_status: requestStatus,
        decision_reason: decisionReason,
      }),
  },
}

export type CommerceApi = typeof commerceApi

