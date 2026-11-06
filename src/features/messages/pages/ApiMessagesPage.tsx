import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { friendLabel } from '@/features/friends/model/friendLabel'
import { useAuth } from '@/features/auth'
import { useApiQuery } from '@/shared/api/useApiQuery'
import { ApiPagination, ApiSection, ApiState } from '@/shared/api/ApiUi'
import { Button } from '@/shared/ui'
import { accessToken } from '@/shared/api/http'
import { communityApi } from '@/shared/api/communityApi'
import { chatApi, mergeHistory, type ChatMessageDto } from '../model/chatApi'
import { useChatRealtime } from '../model/useChatRealtime'
import { ChatImage, DraftImage, validateImages } from './ChatImage'

export default function ApiMessagesPage() {
  const { currentUser } = useAuth()
  const [params, setParams] = useSearchParams()
  const [page, setPage] = useState(0), [drafts, setDrafts] = useState<Record<string, string>>({}), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const pending = useRef<Record<string, { key: string; content: string; files: File[] }>>({})
  const [imageDrafts, setImageDrafts] = useState<Record<string, File[]>>({})
  const friendNames = useApiQuery('chat-friends', signal => communityApi.friends(0, signal))
  const chats = useApiQuery(`chats:${page}`, signal => chatApi.list(page, signal))
  const [fallbackChat, setFallbackChat] = useState('')
  const id = params.get('conversation') || fallbackChat
  useEffect(() => { if (!params.get('conversation') && !fallbackChat && chats.data?.items[0]) setFallbackChat(chats.data.items[0].chat_session_id) }, [params, fallbackChat, chats.data])
  const currentChat = useRef(id); currentChat.current = id
  const history = useApiQuery(`history:${id}`, signal => id ? chatApi.history(id, undefined, signal) : Promise.resolve({ items: [], has_more: false, next_before_sequence: null }))
  const seenHistory = useRef(new Set<string>())
  if (history.data && id) seenHistory.current.add(id)
  if (history.error) seenHistory.current.delete(id)
  const showComposer = !!history.data || (history.loading && seenHistory.current.has(id))
  const connected = useChatRealtime(id, history.refresh)
  const [older, setOlder] = useState<ChatMessageDto[]>([]), [cursor, setCursor] = useState<number | null>(null), [loadingOlder, setLoadingOlder] = useState(false)
  useEffect(() => { setOlder([]); setCursor(null) }, [id])
  useEffect(() => {
    if (!history.data) return
    setOlder(old => mergeHistory(old, history.data!.items))
  }, [id, history.data])
  useEffect(() => {
    const latest = history.data
    if (!latest?.items.length || !older.length) return
    const lastSeen = Math.max(...older.map(item => item.sequence_number))
    let before = Math.min(...latest.items.map(item => item.sequence_number))
    if (before <= lastSeen + 1) return
    const controller = new AbortController(), token = accessToken()
    void (async () => {
      try {
        while (before > lastSeen + 1 && !controller.signal.aborted) {
          const page = await chatApi.history(id, before, controller.signal)
          if (controller.signal.aborted || currentChat.current !== id || accessToken() !== token) return
          if (!page.items.length) break
          setOlder(old => mergeHistory(old, page.items))
          const next = Math.min(...page.items.map(item => item.sequence_number))
          if (!page.has_more || next >= before) break
          before = next
        }
      } catch { if (!controller.signal.aborted) setError('Không đồng bộ được tin cũ. Hãy tải lại hội thoại.') }
    })()
    return () => controller.abort()
  }, [id, history.data])
  const loadOlder = async () => {
    const next = cursor ?? history.data?.next_before_sequence
    if (!id || !next || loadingOlder) return
    setLoadingOlder(true); setError('')
    const token = accessToken()
    try { const result = await chatApi.history(id, next); if (currentChat.current !== id || accessToken() !== token) return; setOlder(old => [...result.items, ...old]); setCursor(result.has_more ? result.next_before_sequence : -1) }
    catch (e) { if (currentChat.current === id && accessToken() === token) setError(e instanceof Error ? e.message : 'Không tải được tin cũ.') }
    finally { setLoadingOlder(false) }
  }
  const combined = mergeHistory(older, history.data?.items ?? [])
  const draft = drafts[id] || ''
  const images = imageDrafts[id] || []
  const send = async () => {
    if (!id || !connected || (!draft.trim() && !images.length) || busy) return
    if ([...draft].length > 4000) { setError('Tin nhắn tối đa 4.000 ký tự.'); return }
    if (draft.includes('\u0000') || /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(draft)) { setError('Tin nhắn chứa ký tự không hợp lệ.'); return }
    setBusy(true); setError('')
    const attempt = pending.current[id]?.content === draft && pending.current[id]?.files.length === images.length && pending.current[id]?.files.every((file, index) => file === images[index]) ? pending.current[id] : { key: crypto.randomUUID(), content: draft, files: images }
    pending.current[id] = attempt
    const sessionToken = accessToken()
    try { await (images.length ? chatApi.sendImages(id, attempt.key, draft, images) : chatApi.sendText(id, attempt.key, draft)); if (!sessionToken || accessToken() !== sessionToken) return; delete pending.current[id]; setDrafts(old => ({ ...old, [id]: '' })); setImageDrafts(old => ({ ...old, [id]: [] })); history.refresh(); chats.refresh() }
    catch (e) { if (!sessionToken || accessToken() !== sessionToken) return; setError(e instanceof Error ? e.message : 'Không gửi được tin nhắn.') }
    finally { setBusy(false) }
  }
  return <ApiSection title="Tin nhắn"><p className="mt-3 text-sm text-[#6F6B67]">{connected ? 'Đã kết nối' : 'Đang kết nối; bản nháp được giữ lại cho đến khi kết nối trở lại.'}</p><ApiState {...chats} retry={chats.refresh} />{chats.data && <><div className="mt-6 grid gap-4 md:grid-cols-[260px_1fr]"><aside className="grid content-start gap-2">{chats.data.items.map(chat => <Button key={chat.chat_session_id} disabled={busy} variant={id === chat.chat_session_id ? 'primary' : 'secondary'} onClick={() => { setError(''); setParams({ conversation: chat.chat_session_id }) }}>{(() => { const friend = friendNames.data?.items.find(item => item.friend_account_id === chat.friend_account_id); return friend ? friendLabel(friend) : 'Bạn bè' })()}</Button>)}{!chats.data.items.length && <p className="text-sm">Chưa có cuộc trò chuyện. Mở từ danh sách Bạn bè.</p>}</aside>{id && <div className="rounded-lg border border-[#E3DAD0] bg-white p-5"><ApiState {...history} retry={history.refresh} />{history.data && <div className="grid gap-3">{(cursor !== -1 && (cursor !== null || history.data.has_more)) && <Button variant="ghost" loading={loadingOlder} onClick={() => void loadOlder()}>Xem tin cũ hơn</Button>}{combined.map(message => <div key={message.chat_message_id} className={`flex ${message.sender_account_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}><div aria-label={message.sender_account_id === currentUser?.id ? 'Tin nhắn của bạn' : 'Tin nhắn của bạn bè'} className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm sm:max-w-[70%] ${message.sender_account_id === currentUser?.id ? 'rounded-br-sm bg-[#684B5A] text-white' : 'rounded-bl-sm bg-[#EEE8E1] text-[#222222]'}`}><p className="whitespace-pre-wrap break-words">{message.content}</p>{message.attachments?.map(attachment => <ChatImage key={attachment.chat_attachment_id} chatId={id} attachmentId={attachment.chat_attachment_id} />)}</div></div>)}</div>}{error && <p role="alert" className="mt-3 text-sm text-[#A94B4B]">{error}</p>}{showComposer && <><div className="mt-4 flex flex-wrap gap-2">{images.map((file, index) => <DraftImage key={`${file.name}-${index}`} file={file} remove={() => setImageDrafts(old => ({ ...old, [id]: images.filter((_, i) => i !== index) }))} />)}</div><label className="mt-3 inline-block cursor-pointer text-sm text-[#684B5A]">Chọn ảnh<input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" multiple disabled={busy} onChange={async event => { const files = [...(event.target.files || [])]; event.target.value = ""; const selected = [...images, ...files]; const invalid = await validateImages(selected); if (invalid) { setError(invalid); return } setError(""); setImageDrafts(old => ({ ...old, [id]: selected })) }} /></label><form className="mt-5 flex gap-3" onSubmit={e => { e.preventDefault(); void send() }}><label className="sr-only" htmlFor="api-message">Tin nhắn</label><input id="api-message" disabled={busy} className="min-w-0 flex-1 rounded-lg border p-3" value={draft} onChange={e => { const value = e.target.value; setDrafts(old => ({ ...old, [id]: value })) }} /><Button type="submit" loading={busy} disabled={!connected || (!draft.trim() && !images.length)}>Gửi</Button></form></>}</div>}</div><ApiPagination data={chats.data} setPage={setPage} /></>}</ApiSection>
}









