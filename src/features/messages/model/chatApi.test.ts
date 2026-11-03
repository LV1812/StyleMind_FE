import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { saveApiSession } from '@/test/communitySession'
import { chatApi, mergeHistory, type ChatMessageDto } from './chatApi'
const id = '10000000-0000-0000-0000-000000000001'
beforeEach(() => { sessionStorage.clear(); saveApiSession('test-token', Date.now() + 60000) })
afterEach(() => { vi.unstubAllGlobals(); sessionStorage.clear() })
it('opens a chat using the friend UUID and sends text with an explicit idempotency key', async () => {
  const fetcher = vi.fn(async (_path: string, _options: RequestInit) => new Response('{}', { status: 200 })); vi.stubGlobal('fetch', fetcher)
  await chatApi.open(id); await chatApi.sendText(id, id, 'Xin chào')
  expect(fetcher.mock.calls[0][0]).toBe('/wardrobe-community/api/v1/me/chats')
  expect(fetcher.mock.calls[0][1].body).toBe(JSON.stringify({ friend_account_id: id }))
  expect(fetcher.mock.calls[1][1].body).toBe(JSON.stringify({ client_message_id: id, content: 'Xin chào' }))
})
it('requests history by sequence and rejects invalid IDs before making a request', async () => {
  const fetcher = vi.fn(async (_path: string, _options: RequestInit) => new Response(JSON.stringify({ items: [], has_more: false, next_before_sequence: null }), { status: 200 })); vi.stubGlobal('fetch', fetcher)
  await chatApi.history(id, 42)
  expect(fetcher.mock.calls[0][0]).toBe(`/wardrobe-community/api/v1/chats/${id}/messages?limit=30&before_sequence=42`)
  await expect(chatApi.open('demo-id')).rejects.toThrow()
  expect(fetcher).toHaveBeenCalledTimes(1)
})
it('sends images as multipart and downloads private bytes with bearer authorization', async () => {
  const fetcher = vi.fn(async (_path: string, _options: RequestInit) => new Response('{}', { status: 200 }))
  vi.stubGlobal('fetch', fetcher)
  await chatApi.sendImages(id, id, '', [new File(['abc'], 'sample.png', { type: 'image/png' })])
  const request = fetcher.mock.calls[0][1], form = request.body as FormData
  expect(form.getAll('images')).toHaveLength(1)
  expect((request.headers as Record<string, string>)['Content-Type']).toBeUndefined()
  expect((request.headers as Record<string, string>).Authorization).toBe('Bearer test-token')
  const result = await chatApi.attachment(id, id)
  expect(result).toBeInstanceOf(Blob)
  expect(fetcher.mock.calls[1][0]).toContain(`/chats/${id}/attachments/${id}/content`)
})
it('preserves boundary messages when a new history window shifts', () => {
  const item = (sequence: number) => ({ chat_message_id: String(sequence), sequence_number: sequence }) as ChatMessageDto
  const stored = Array.from({ length: 60 }, (_, index) => item(index + 31))
  const refreshed = Array.from({ length: 30 }, (_, index) => item(index + 62))
  expect(mergeHistory(stored, refreshed).map(message => message.sequence_number)).toEqual(Array.from({ length: 61 }, (_, index) => index + 31))
})
