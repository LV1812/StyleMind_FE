import { apiRequest, ApiError, isUuid } from '@/shared/api/http'
import type { Page } from '@/shared/api/communityApi'
const base = '/wardrobe-community/api/v1'
function uuid(id: string) { if (!isUuid(id)) throw new ApiError(400, 'INVALID_ID', 'Định danh hội thoại không hợp lệ.'); return id }
export interface ChatSessionDto { chat_session_id: string; friend_account_id: string; created_at: string; updated_at: string }
export interface ChatAttachmentDto { chat_attachment_id: string; display_order: number; content_type: string; size_bytes: number }
export interface ChatMessageDto { chat_message_id: string; chat_session_id: string; sender_account_id: string; client_message_id: string; sequence_number: number; content: string | null; created_at: string; attachments: ChatAttachmentDto[] }
export interface ChatHistoryDto { items: ChatMessageDto[]; has_more: boolean; next_before_sequence: number | null }
export function mergeHistory(existing: ChatMessageDto[], incoming: ChatMessageDto[]): ChatMessageDto[] {
  const messages = new Map(existing.map(message => [message.chat_message_id, message]))
  incoming.forEach(message => messages.set(message.chat_message_id, message))
  return [...messages.values()].sort((a, b) => a.sequence_number - b.sequence_number)
}
export const chatApi = {
  open: async (friendId: string) => apiRequest<ChatSessionDto>(`${base}/me/chats`, { method: 'POST', body: { friend_account_id: uuid(friendId) } }),
  list: (page = 0, signal?: AbortSignal) => apiRequest<Page<ChatSessionDto>>(`${base}/me/chats?page=${page}&size=20`, { signal }),
  history: async (chatId: string, before?: number, signal?: AbortSignal) => {
    if (before !== undefined && (!Number.isSafeInteger(before) || before <= 0)) throw new ApiError(400, 'INVALID_CURSOR', 'Trang tin nhắn không hợp lệ.')
    return apiRequest<ChatHistoryDto>(`${base}/chats/${uuid(chatId)}/messages?limit=30${before === undefined ? '' : `&before_sequence=${before}`}`, { signal })
  },
  sendText: async (chatId: string, clientId: string, content: string) => apiRequest<ChatMessageDto>(`${base}/chats/${uuid(chatId)}/messages`, { method: 'POST', body: { client_message_id: uuid(clientId), content } }),
  sendImages: async (chatId: string, clientId: string, content: string, images: File[]) => {
    const form = new FormData()
    form.append('message', new Blob([JSON.stringify({ client_message_id: uuid(clientId), content: content.trim() ? content : null })], { type: 'application/json' }))
    images.forEach(file => form.append('images', file))
    return apiRequest<ChatMessageDto>(`${base}/chats/${uuid(chatId)}/messages`, { method: 'POST', body: form })
  },
  attachment: async (chatId: string, attachmentId: string, signal?: AbortSignal) => apiRequest<Blob>(`${base}/chats/${uuid(chatId)}/attachments/${uuid(attachmentId)}/content`, { responseType: 'blob', signal }),
}
