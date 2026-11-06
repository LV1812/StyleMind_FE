import { ApiError, apiRequest, isUuid } from './http'
export type Visibility = 'PRIVATE' | 'FRIENDS' | 'PUBLIC'
export interface Page<T> { items: T[]; page: number; size: number; total_elements: number; total_pages: number }
export interface FriendDto { friendship_id: string; friend_account_id: string; email?: string | null; display_name: string | null; established_at: string }
export interface InvitationDto { friend_invitation_id: string; recipient_email: string; status: string; created_at: string; expires_at: string; accepted_at: string | null }
export interface IncomingDto { friend_invitation_id: string; sender_account_id: string; sender_display_name: string | null; created_at: string; expires_at: string }
export interface InvitationResult { friend_invitation_id: string; status: string; outcome: string; delivery_status: string | null; retry_after_seconds: number; expires_at: string | null }
export interface OutfitSummaryDto { outfit_id: string; name: string; visibility: Visibility; item_count: number; updated_at: string; owner_display_name?: string | null }
export interface OutfitItemDto { outfit_item_id: string; variant_id: string; product_id: string | null; product_name: string | null; color: string | null; size: string | null; unit_price_vnd: number | null; image_url: string | null; available: boolean }
export interface OutfitDetailDto { outfit_id: string; name: string; items: OutfitItemDto[]; visibility?: Visibility; owner_display_name?: string | null }
export interface SharingDto { outfit_id: string; visibility: Visibility; public_enabled: boolean; public_token: string | null; public_enabled_at: string | null }
const base = '/wardrobe-community/api/v1'
function uuid(value: string) { if (!isUuid(value)) throw new ApiError(400, 'INVALID_ID', 'Định danh dữ liệu không hợp lệ.'); return value }
async function page<T>(path: string, index: number, signal?: AbortSignal): Promise<Page<T>> {
  if (!Number.isSafeInteger(index) || index < 0) throw new ApiError(400, 'INVALID_PAGE', 'Số trang không hợp lệ.')
  const data = await apiRequest<Page<T>>(`${base}${path}?page=${index}&size=20`, { signal })
  if (!Array.isArray(data.items) || ![data.page, data.size, data.total_elements, data.total_pages].every(n => Number.isSafeInteger(n) && n >= 0) || data.size < 1) throw new ApiError(502, 'INVALID_RESPONSE', 'Danh sách API không hợp lệ.')
  return data
}
export const communityApi = {
  friends: (index = 0, signal?: AbortSignal) => page<FriendDto>('/me/friends', index, signal),
  incoming: (index = 0, signal?: AbortSignal) => page<IncomingDto>('/me/friend-invitations/incoming', index, signal),
  outgoing: (index = 0, signal?: AbortSignal) => page<InvitationDto>('/me/friend-invitations', index, signal),
  invite: (email: string) => apiRequest<InvitationResult>(`${base}/me/friend-invitations`, { method: 'POST', body: { recipient_email: email.trim().toLowerCase() } }),
  accept: async (id: string) => apiRequest<InvitationResult>(`${base}/me/friend-invitations/${uuid(id)}/accept`, { method: 'POST', body: {} }),
  acceptLink: async (id: string, token: string) => apiRequest<InvitationResult>(`${base}/me/friend-invitations/accept`, { method: 'POST', body: { friend_invitation_id: uuid(id), token } }),
  resend: async (id: string) => apiRequest<InvitationResult>(`${base}/me/friend-invitations/${uuid(id)}/resend`, { method: 'POST', body: {} }),
  unfriend: async (id: string) => apiRequest<void>(`${base}/me/friends/${uuid(id)}`, { method: 'DELETE' }),
  outfits: (index = 0, signal?: AbortSignal) => page<OutfitSummaryDto>('/me/outfits', index, signal),
  friendOutfits: async (id: string, index = 0, signal?: AbortSignal) => page<OutfitSummaryDto>(`/me/friends/${uuid(id)}/outfits`, index, signal),
  outfit: async (id: string, signal?: AbortSignal) => apiRequest<OutfitDetailDto>(`${base}/me/outfits/${uuid(id)}`, { signal }),
  friendOutfit: async (peer: string, id: string, signal?: AbortSignal) => apiRequest<OutfitDetailDto>(`${base}/me/friends/${uuid(peer)}/outfits/${uuid(id)}`, { signal }),
  publicOutfit: (token: string, signal?: AbortSignal) => apiRequest<OutfitDetailDto>(`${base}/public/outfits/${encodeURIComponent(token)}`, { auth: false, signal }),
  sharing: async (id: string, signal?: AbortSignal) => apiRequest<SharingDto>(`${base}/me/outfits/${uuid(id)}/sharing`, { signal }),
  changeSharing: async (id: string, value: string) => {
    const visibility = value.toUpperCase()
    if (!['PRIVATE', 'FRIENDS', 'PUBLIC'].includes(visibility)) throw new ApiError(400, 'INVALID_VISIBILITY', 'Chế độ chia sẻ không hợp lệ.')
    return apiRequest<SharingDto>(`${base}/me/outfits/${uuid(id)}/sharing`, { method: 'PATCH', body: { visibility } })
  },
}
