import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ImagePlus } from 'lucide-react'
import { friendLabel } from '@/features/friends/model/friendLabel'
import { useAuth } from '@/features/auth'
import { useApiQuery } from '@/shared/api/useApiQuery'
import { ApiPagination, ApiState } from '@/shared/api/ApiUi'
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
  const [validatingImages, setValidatingImages] = useState(false)
  const friendNames = useApiQuery('chat-friends', signal => communityApi.friends(0, signal))
  const chats = useApiQuery(`chats:${page}`, signal => chatApi.list(page, signal), false, true)
  const [fallbackChat, setFallbackChat] = useState('')
  const id = params.get('conversation') || fallbackChat
  useEffect(() => { if (!params.get('conversation') && !fallbackChat && chats.data?.items[0]) setFallbackChat(chats.data.items[0].chat_session_id) }, [params, fallbackChat, chats.data])
  const currentChat = useRef(id); currentChat.current = id
  const history = useApiQuery(`history:${id}`, signal => id ? chatApi.history(id, undefined, signal) : Promise.resolve({ items: [], has_more: false, next_before_sequence: null }), false, true)
  const session = useApiQuery(`chat:${id}`, signal => id ? chatApi.get(id, signal) : Promise.resolve(null))
  const activeFriend = friendNames.data?.items.find(friend => friend.friend_account_id === session.data?.friend_account_id)
  const seenHistory = useRef(new Set<string>())
  if (history.data && id) seenHistory.current.add(id)
  if (history.error) seenHistory.current.delete(id)
  const showComposer = !!history.data || (history.loading && seenHistory.current.has(id))
  const connected = useChatRealtime(id, history.refresh)
  const [older, setOlder] = useState<ChatMessageDto[]>([]), [cursor, setCursor] = useState<number | null>(null), [loadingOlder, setLoadingOlder] = useState(false)
  const historyBox = useRef<HTMLDivElement>(null)
  const nearBottom = useRef(true)
  const lastScrollChat = useRef('')
  const scrollAnchor = useRef<{ height: number; top: number } | null>(null)
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
    try { const result = await chatApi.history(id, next); if (currentChat.current !== id || accessToken() !== token) return; if (historyBox.current && result.items.length) scrollAnchor.current = { height: historyBox.current.scrollHeight, top: historyBox.current.scrollTop }; setOlder(old => [...result.items, ...old]); setCursor(result.has_more ? result.next_before_sequence : -1) }
    catch (e) { if (currentChat.current === id && accessToken() === token) setError(e instanceof Error ? e.message : 'Không tải được tin cũ.') }
    finally { setLoadingOlder(false) }
  }
  const combined = mergeHistory(older, history.data?.items ?? [])
  const latestSequence = history.data ? combined.at(-1)?.sequence_number : undefined
  useLayoutEffect(() => {
    const element = historyBox.current
    if (!element || !history.data) return
    if (lastScrollChat.current !== id) { lastScrollChat.current = id; nearBottom.current = true; scrollAnchor.current = null; element.scrollTop = element.scrollHeight }
    else if (scrollAnchor.current) { element.scrollTop = scrollAnchor.current.top + element.scrollHeight - scrollAnchor.current.height; scrollAnchor.current = null }
    else if (nearBottom.current) element.scrollTop = element.scrollHeight
  }, [id, history.data, combined.length, latestSequence])
  const draft = drafts[id] || ''
  const images = imageDrafts[id] || []
  const send = async () => {
    if (!id || !connected || (!draft.trim() && !images.length) || busy || validatingImages) return
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
  return <section data-testid="chat-viewport" className="mx-auto flex h-[calc(100dvh-9rem-var(--safe-bottom))] max-w-[var(--container-wide)] flex-col overflow-hidden px-4 py-3 sm:px-6 lg:h-[calc(100dvh-5rem)] lg:px-8">
    <div className="flex shrink-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-1"><h1 className="font-display text-2xl font-semibold text-[#222222] sm:text-3xl">Tin nhắn</h1>{id && <p role="status" className="text-xs text-[#5E5F5D] sm:text-sm">{connected ? 'Đã kết nối' : 'Đang kết nối; bản nháp được giữ lại cho đến khi kết nối trở lại.'}</p>}</div>
    {(!chats.data || chats.error) && <ApiState {...chats} retry={chats.refresh} />}
    {chats.data && <>
      <div className="mt-3 grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-2xl border border-[#E3E2E2] bg-white shadow-sm md:grid-cols-[240px_minmax(0,1fr)] md:grid-rows-1 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="min-w-0 border-b border-[#E3E2E2] bg-[#FBF9F9] p-3 md:min-h-0 md:overflow-y-auto md:border-b-0 md:border-r md:p-4" aria-label="Danh sách hội thoại">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#5E5F5D]">Hội thoại</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 md:grid md:content-start md:overflow-visible md:pb-0">
            {chats.data.items.map(chat => {
              const friend = friendNames.data?.items.find(item => item.friend_account_id === chat.friend_account_id)
              return <Button className="max-w-[240px] break-all md:max-w-full" key={chat.chat_session_id} disabled={busy} variant={id === chat.chat_session_id ? 'primary' : 'secondary'} onClick={() => { setError(''); setParams({ conversation: chat.chat_session_id }) }}>{friend ? friendLabel(friend) : 'Bạn bè'}</Button>
            })}
            {!chats.data.items.length && <div className="text-sm leading-6 text-[#5E5F5D]"><p>Chưa có cuộc trò chuyện. Mở từ danh sách Bạn bè.</p><Link to="/friends" className="mt-3 inline-block font-semibold text-[#1C1B1B] underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1B1B]">Đi đến Bạn bè</Link></div>}
          </div>
          {chats.data.total_pages > 1 && <ApiPagination data={chats.data} setPage={setPage} />}
        </aside>
        {id ? <div className="flex min-h-0 min-w-0 flex-col bg-white">
          <div className="shrink-0 border-b border-[#E3E2E2] px-4 py-3 sm:px-6"><h2 className="break-words font-display text-xl sm:text-2xl">{activeFriend ? friendLabel(activeFriend) : 'Bạn bè'}</h2></div>
          {(!history.data || history.error) && <div className="px-4 sm:px-6"><ApiState {...history} retry={history.refresh} /></div>}
          {history.data && <div ref={historyBox} aria-label="Lịch sử tin nhắn" tabIndex={0} onScroll={event => { const el = event.currentTarget; nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80 }} className="grid min-h-0 flex-1 content-start gap-2 overflow-y-auto overscroll-contain px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1C1B1B] sm:px-6">
            {(cursor !== -1 && (cursor !== null || history.data.has_more)) && <Button variant="ghost" loading={loadingOlder} onClick={() => void loadOlder()}>Xem tin cũ hơn</Button>}
            {combined.length === 0 && <p className="py-8 text-center text-sm text-[#5E5F5D]">Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện.</p>}
            {combined.map(message => <div key={message.chat_message_id} className={`flex ${message.sender_account_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}><div aria-label={message.sender_account_id === currentUser?.id ? 'Tin nhắn của bạn' : 'Tin nhắn của bạn bè'} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm sm:max-w-[70%] ${message.sender_account_id === currentUser?.id ? 'rounded-br-sm bg-[#1C1B1B] text-white' : 'rounded-bl-sm bg-[#EFEDED] text-[#222222]'}`}>{message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}{message.attachments?.map(attachment => <ChatImage key={attachment.chat_attachment_id} chatId={id} attachmentId={attachment.chat_attachment_id} />)}</div></div>)}
          </div>}
          {error && <p role="alert" className="mx-4 mt-2 text-sm text-[#A94B4B] sm:mx-6">{error}</p>}
          {showComposer && <div className="shrink-0 border-t border-[#E3E2E2] bg-[#FBF9F9] px-4 py-4 sm:px-6">
            {images.length > 0 && <div className="mb-3 flex max-h-24 flex-wrap gap-2 overflow-y-auto p-1">{images.map((file, index) => <DraftImage key={`${file.name}-${index}`} file={file} remove={() => setImageDrafts(old => ({ ...old, [id]: images.filter((_, i) => i !== index) }))} />)}</div>}
            <form className="flex items-center gap-2 sm:gap-3" onSubmit={event => { event.preventDefault(); void send() }}><label className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#D9D7D5] bg-white text-[#5E5F5D] transition hover:bg-[#EFEDED] focus-within:ring-2 focus-within:ring-[#1C1B1B]" title="Chọn ảnh"><ImagePlus size={20} aria-hidden="true" /><span className="sr-only">Chọn ảnh</span><input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" multiple disabled={busy || validatingImages} onChange={async event => { const files = [...(event.target.files || [])]; event.target.value = ''; if (!files.length) return; const selected = [...images, ...files]; const selectedChat = id; setValidatingImages(true); setError(''); try { const invalid = await validateImages(selected); if (currentChat.current !== selectedChat) return; if (invalid) { setError(invalid); return } setImageDrafts(old => ({ ...old, [selectedChat]: selected })) } finally { setValidatingImages(false) } }} /></label><label className="sr-only" htmlFor="api-message">Tin nhắn</label><input id="api-message" disabled={busy} placeholder="Nhập tin nhắn..." className="min-h-11 min-w-0 flex-1 rounded-xl border border-[#C4C7C7] bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-[#1C1B1B]/20" value={draft} onChange={event => { const value = event.target.value; setDrafts(old => ({ ...old, [id]: value })) }} /><Button type="submit" loading={busy} disabled={validatingImages || !connected || (!draft.trim() && !images.length)}>Gửi</Button></form>
            <p className="mt-2 text-xs text-[#5E5F5D]" role={validatingImages ? 'status' : undefined}>{validatingImages ? 'Đang kiểm tra ảnh…' : 'Ảnh JPG, PNG hoặc WebP · tối đa 5 ảnh, 5 MB mỗi ảnh'}</p>
          </div>}
        </div> : <div className="grid min-h-0 place-items-center p-6 text-center text-sm text-[#5E5F5D]">Chọn một cuộc trò chuyện để bắt đầu.</div>}
      </div>
    </>}
  </section>
}









