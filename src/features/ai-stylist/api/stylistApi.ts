import { ApiError, apiRequest } from '@/shared/api/http'

const STYLIST_API = '/stylist/api/v1/stylist'
const INTAKE_TIMEOUT_MS = 20_000
const GENERATION_TIMEOUT_MS = 120_000
const DETAIL_TIMEOUT_MS = 20_000

export interface StylistSessionResponse {
  session_id: string
  title: string | null
  opened_at: string
  closed_at: string | null
}

export interface StylingConstraintInput {
  constraint_kind: 'EXCLUDE_COLOR'
  text_value: string
  is_hard: boolean
}

export interface CreateStylingRequestPayload {
  message?: string
  occasion?: string
  intended_use?: string
  style_context?: string
  general_weather_context?: string
  max_budget_vnd?: number
  budget_is_hard: boolean
  constraints?: StylingConstraintInput[]
}

export interface CreateStylingRequestResponse {
  request_id: string
  session_id: string
  source_message_id: string | null
  request_status: string
  requested_at: string
  generation_started: boolean
}

export interface StylingRequestResponse {
  request_id: string
  session_id: string
  request_status: string
  occasion: string | null
  intended_use: string | null
  style_context: string | null
  general_weather_context: string | null
  max_budget_vnd: number | null
  budget_is_hard: boolean
}

export interface GenerateRecommendationsResponse {
  request_id: string
  request_status: string
  recommendations: Array<{
    recommendation_id: string
    explanation: string | null
    styling_tips: string | null
    generated_at: string
    items: Array<{
      source_type: string
      shop_variant_id: string | null
      slot_name: string
      selection_reason: string | null
      display_order: number
    }>
  }>
  limitations: string[]
}

export interface RecommendationImage {
  imageId: string
  imageUrl: string
  altText: string | null
  displayOrder: number
  primary: boolean
}

export interface RecommendationDetailResponse {
  recommendation_id: string
  request_id: string
  explanation: string | null
  styling_tips: string | null
  generated_at: string
  total_current_price_vnd: number | null
  price_semantics: string
  items: Array<{
    source_type: string
    shop_variant_id: string | null
    slot_name: string
    selection_reason: string | null
    display_order: number
    current_availability: string
    product_id: string | null
    category_id: string | null
    brand_id: string | null
    product_name: string | null
    category_name: string | null
    brand_name: string | null
    color: string | null
    size: string | null
    material: string | null
    current_unit_price_vnd: number | null
    // CatalogImage is an unannotated Java record, so these fields use Jackson's camelCase names.
    images: RecommendationImage[]
  }>
}

export type StylistErrorStage = 'intake' | 'generation' | 'detail'

export function stylistErrorMessage(error: unknown, stage: StylistErrorStage): string {
  if (!(error instanceof ApiError)) {
    return stage === 'detail'
      ? 'Gợi ý đã tạo nhưng chưa tải được chi tiết sản phẩm.'
      : 'Không thể hoàn tất yêu cầu AI Stylist. Vui lòng kiểm tra kết nối.'
  }

  if (error.status === 0 && error.code === 'NETWORK_UNAVAILABLE') {
    return stage === 'generation'
      ? 'Mất kết nối khi đang tạo gợi ý. Yêu cầu đã được gửi; hệ thống chưa xác nhận kết quả.'
      : 'Không kết nối được Stylist. Kiểm tra backend đang chạy rồi thử lại.'
  }

  if (error.status === 0 && error.code === 'REQUEST_TIMEOUT') {
    return stage === 'generation'
      ? 'Hết thời gian chờ tạo gợi ý. Kết quả chưa được xác nhận; không gửi lại yêu cầu này.'
      : stage === 'detail'
        ? 'Hết thời gian chờ tải chi tiết. Gợi ý đã tạo nhưng sản phẩm chưa tải đủ.'
        : 'Hết thời gian chờ lưu yêu cầu. Trạng thái chưa được xác nhận; không gửi lại để tránh tạo trùng.'
  }

  if (error.status === 503 || [
    'GENERATION_RUNTIME_UNCONFIGURED',
    'GENERATION_PROVIDER_UNAVAILABLE',
    'DEPENDENCY_UNAVAILABLE',
  ].includes(error.code)) {
    if (stage === 'generation') {
      return 'Tính năng tạo gợi ý hiện chưa khả dụng. Yêu cầu đã được lưu, nhưng chưa có gợi ý nào được tạo.'
    }
    if (stage === 'detail') {
      return 'Gợi ý đã tạo nhưng dịch vụ chưa tải được chi tiết sản phẩm. Tên, ảnh và giá chưa thể hiển thị.'
    }
    return 'Stylist hiện chưa sẵn sàng nhận yêu cầu. Vui lòng thử lại sau.'
  }

  if (error.status === 400) {
    return stage === 'generation'
      ? 'Yêu cầu đã được lưu nhưng chưa đủ thông tin hoặc chưa hợp lệ để tạo gợi ý.'
      : 'Thông tin nhu cầu chưa hợp lệ. Vui lòng kiểm tra lại các mục đã nhập.'
  }

  if (error.status === 404) {
    return stage === 'detail'
      ? 'Backend đã trả mã gợi ý nhưng không tìm thấy chi tiết sản phẩm.'
      : 'Không tìm thấy yêu cầu AI Stylist. Hãy tải lại trang và tạo yêu cầu mới.'
  }

  if (error.status === 409) {
    return 'Yêu cầu này đã được tiếp nhận hoặc tạo trước đó. Không gửi lại cùng yêu cầu.'
  }

  if (error.status >= 500) {
    return stage === 'generation'
      ? 'Đã lưu yêu cầu nhưng chưa tạo được gợi ý do dịch vụ gặp sự cố.'
      : stage === 'detail'
        ? 'Gợi ý đã tạo nhưng chưa tải được chi tiết sản phẩm.'
        : 'Stylist đang gặp sự cố. Vui lòng thử lại sau.'
  }

  return error.message
}

export const stylistApi = {
  createSession(title: string) {
    return apiRequest<StylistSessionResponse>(STYLIST_API + '/sessions', {
      method: 'POST',
      body: { title },
      timeoutMs: INTAKE_TIMEOUT_MS,
    })
  },

  createRequest(sessionId: string, payload: CreateStylingRequestPayload) {
    return apiRequest<CreateStylingRequestResponse>(
      STYLIST_API + '/sessions/' + encodeURIComponent(sessionId) + '/requests',
      { method: 'POST', body: payload, timeoutMs: INTAKE_TIMEOUT_MS },
    )
  },

  generate(requestId: string) {
    return apiRequest<GenerateRecommendationsResponse>(
      STYLIST_API + '/requests/' + encodeURIComponent(requestId) + '/generate',
      { method: 'POST', body: {}, timeoutMs: GENERATION_TIMEOUT_MS },
    )
  },

  getRequest(requestId: string) {
    return apiRequest<StylingRequestResponse>(
      STYLIST_API + '/requests/' + encodeURIComponent(requestId),
      { timeoutMs: INTAKE_TIMEOUT_MS },
    )
  },

  getRecommendationDetail(recommendationId: string) {
    return apiRequest<RecommendationDetailResponse>(
      STYLIST_API + '/recommendations/' + encodeURIComponent(recommendationId),
      { timeoutMs: DETAIL_TIMEOUT_MS },
    )
  },
}

export function invalidStylistResponse(message: string) {
  return new ApiError(502, 'INVALID_RESPONSE', message)
}
