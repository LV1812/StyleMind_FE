import { Send } from 'lucide-react'
import { FormEvent, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { useDemoStore } from '@/app/store/DemoStoreProvider'
import { useAuth } from '@/features/auth'
import { canChatAboutWardrobe } from '@/features/sharing/model/shareSelectors'
import { Button } from '@/shared/ui'

import { selectChatThreadsForUser } from '../model/chatSelectors'

export function MessagesPage() {
  const { state, dispatch } = useDemoStore()
  const { currentUser } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [draft, setDraft] = useState('')

  const threads = useMemo(() => (currentUser ? selectChatThreadsForUser(state, currentUser) : []), [currentUser, state])
  const selectedId = searchParams.get('conversation') ?? threads[0]?.session.id ?? ''
  const selected = threads.find(thread => thread.session.id === selectedId) ?? threads[0]
  const messages = selected
    ? state.chatMessages
      .filter(message => message.sessionId === selected.session.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    : []

  if (!currentUser) return null

  const sendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const body = draft.trim()
    if (!body || !selected || selected.isLocked) return

    const createdAt = new Date().toISOString()
    dispatch({
      type: 'chat/messageSent',
      payload: {
        id: `msg-${selected.session.id}-${Date.now()}`,
        sessionId: selected.session.id,
        senderId: currentUser.id,
        body,
        createdAt,
      },
    })
    setDraft('')
  }

  return (
    <section className="mx-auto grid max-w-[var(--container-wide)] gap-8 px-5 py-8 md:px-8 md:py-12">
      <div>
        <h1 className="font-display text-4xl font-semibold leading-tight text-[#222222]">Tin nhắn</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6F6B67]">
          Trò chuyện 1-1 với những người có quyền xem tủ đồ qua email. Public link không tạo quyền chat.
        </p>
      </div>

      {threads.length === 0 ? (
        <section className="rounded-lg border border-dashed border-[#D8D0C6] bg-white p-8">
          <h2 className="font-display text-2xl font-semibold text-[#222222]">Chưa có cuộc trò chuyện</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6F6B67]">
            Khi bạn chia sẻ tủ đồ qua email hoặc được người khác chia sẻ, cuộc trò chuyện hợp lệ sẽ xuất hiện tại đây.
          </p>
        </section>
      ) : (
        <div className="grid min-h-[620px] overflow-hidden rounded-lg border border-[#E3DAD0] bg-white shadow-sm lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="border-b border-[#EEE8E1] bg-[#FAF8F5] lg:border-b-0 lg:border-r">
            <div className="border-b border-[#EEE8E1] px-4 py-3">
              <h2 className="font-semibold text-[#222222]">Hội thoại</h2>
            </div>
            <div className="grid max-h-[280px] overflow-auto lg:max-h-none">
              {threads.map(thread => (
                <button
                  key={thread.session.id}
                  type="button"
                  className={`grid grid-cols-[44px_1fr] gap-3 border-b border-[#EEE8E1] px-4 py-3 text-left transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A] ${
                    selected?.session.id === thread.session.id ? 'bg-white' : ''
                  }`}
                  onClick={() => setSearchParams({ conversation: thread.session.id })}
                >
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#684B5A] font-display text-xs font-semibold text-white">
                    {thread.initials}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[#222222]">{thread.title}</span>
                    <span className="mt-1 block truncate text-xs text-[#6F6B67]">{thread.lastMessage}</span>
                    {thread.isLocked && <span className="mt-2 block text-xs font-semibold text-[#A94B4B]">{thread.lockReason}</span>}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          {selected && (
            <article className="grid min-h-[620px] grid-rows-[auto_1fr_auto]">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEE8E1] px-5 py-4">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-[#222222]">{selected.title}</h2>
                  <p className="mt-1 text-sm text-[#6F6B67]">{selected.subtitle}</p>
                </div>
                {selected.session.wardrobeOwnerId === currentUser.id ? (
                  <Link to={ROUTES.wardrobeAccess} className="text-sm font-semibold text-[#684B5A] hover:underline">
                    Quyền truy cập
                  </Link>
                ) : (
                  <Link to={`/shared-with-me/${selected.session.wardrobeOwnerId}`} className="text-sm font-semibold text-[#684B5A] hover:underline">
                    Xem tủ đồ
                  </Link>
                )}
              </header>

              <div className="grid content-end gap-3 overflow-auto bg-[#FDFCFA] px-5 py-5">
                {messages.map(message => {
                  const mine = message.senderId === currentUser.id
                  return (
                    <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[min(520px,85%)] rounded-lg px-4 py-3 ${mine ? 'bg-[#684B5A] text-white' : 'bg-[#EEE8E1] text-[#222222]'}`}>
                        <p className="text-sm leading-6">{message.body}</p>
                        <p className={`mt-2 text-[11px] font-semibold ${mine ? 'text-white/70' : 'text-[#8A8179]'}`}>
                          {new Date(message.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {selected.isLocked || !canChatAboutWardrobe(state, selected.session.wardrobeOwnerId, selected.session.participantEmail) ? (
                <div className="border-t border-[#EEE8E1] bg-[#FAF8F5] px-5 py-4">
                  <p className="rounded-lg bg-[#FCEAEA] px-3 py-2 text-sm font-semibold text-[#A94B4B]">
                    Cuộc trò chuyện đang tạm khóa vì quyền truy cập tủ đồ không còn hiệu lực.
                  </p>
                </div>
              ) : (
                <form className="flex gap-3 border-t border-[#EEE8E1] bg-white px-5 py-4" onSubmit={sendMessage}>
                  <label className="sr-only" htmlFor="friend-chat-message">Tin nhắn</label>
                  <input
                    id="friend-chat-message"
                    value={draft}
                    onChange={event => setDraft(event.target.value)}
                    placeholder="Nhập tin nhắn"
                    className="min-h-11 flex-1 rounded-lg border border-[#D8D0C6] bg-white px-3 text-sm font-medium text-[#222222] outline-none transition focus:border-[#684B5A] focus:ring-2 focus:ring-[#684B5A]/20"
                  />
                  <Button type="submit" icon={<Send size={17} aria-hidden="true" />} disabled={!draft.trim()}>
                    Gửi
                  </Button>
                </form>
              )}
            </article>
          )}
        </div>
      )}
    </section>
  )
}
