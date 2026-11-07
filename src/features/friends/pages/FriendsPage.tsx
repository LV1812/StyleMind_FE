import { Search, UserPlus, UsersRound, UserRoundMinus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDemoStore } from '@/app/store/DemoStoreProvider'
import { useAuth } from '@/features/auth'
import { Button, Modal, useToast } from '@/shared/ui'
import { retrySeconds, selectFriends, validateInvitation, validateRetry } from '../model/friendshipModel'

type Section = 'friends' | 'received' | 'sent'
const emailKey = (email: string) => email.trim().toLowerCase()

export default function FriendsPage() {
  const { state, dispatch } = useDemoStore()
  const { currentUser } = useAuth()
  const toast = useToast()
  const [section, setSection] = useState<Section>('friends')
  const [search, setSearch] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [removeId, setRemoveId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  useEffect(() => {
    if (!inviteOpen && !removeId) return
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const dialog = document.querySelector<HTMLElement>('[role="dialog"]')
      const controls = Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled)') ?? []).filter(el => el.getClientRects().length)
      const first = controls[0], last = controls[controls.length - 1]
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', trap)
    return () => document.removeEventListener('keydown', trap)
  }, [inviteOpen, removeId])

  if (!currentUser) return null
  const friends = selectFriends(state, currentUser.id)
  const incoming = state.friendInvitations.filter(i => emailKey(i.recipientEmail) === emailKey(currentUser.email) && i.senderId !== currentUser.id && i.status === 'PENDING' && i.delivery === 'SENT' && i.expiresAt > now && state.users.some(u => u.id === i.senderId && u.status === 'active' && u.role === 'customer'))
  const outgoing = state.friendInvitations.filter(i => i.senderId === currentUser.id)
  const filtered = friends.filter(f => f.fullName.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')))
  const removeFriend = friends.find(f => f.id === removeId)
  const closeInvite = () => { setInviteOpen(false); setEmail(''); setError('') }
  const tabs: { id: Section; label: string; count: number }[] = [
    { id: 'friends', label: 'Bạn bè', count: friends.length },
    { id: 'received', label: 'Đã nhận', count: incoming.length },
    { id: 'sent', label: 'Đã gửi', count: outgoing.length },
  ]

  return (
    <section className="mx-auto max-w-[var(--container-wide)] px-5 py-8 md:px-8 md:py-12">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#B98791]">Kết nối từ những điều yêu thích</p>
          <h1 className="font-display text-4xl font-semibold text-[#222222] md:text-5xl">Bạn bè</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-[#5E5F5D]">Gu riêng, cảm hứng chung. Một góc nhỏ dành cho những người bạn muốn kết nối.</p>
        </div>
        <Button icon={<UserPlus size={18} aria-hidden="true" />} onClick={() => setInviteOpen(true)}>Mời bạn bè</Button>
      </div>
      <p className="mt-6 rounded-lg border border-[#E3E2E2] bg-[#E9E8E7]/40 px-4 py-3 text-xs leading-6 text-[#1C1B1B]">Bản tương tác demo · lời mời được lưu trên trình duyệt này, chưa gửi email thật.</p>
      <div className="mb-7 mt-7 flex gap-2 overflow-x-auto border-b border-[#E3E2E2] pb-3" role="group" aria-label="Danh sách kết nối">
        {tabs.map(tab => <button key={tab.id} aria-pressed={section === tab.id} className={`min-h-11 shrink-0 rounded-lg px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1B1B] ${section === tab.id ? 'bg-[#1C1B1B] text-white' : 'text-[#5E5F5D] hover:bg-[#EFEDED]'}`} onClick={() => setSection(tab.id)}>{tab.label} ({tab.count})</button>)}
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div>
          {section === 'friends' ? <>
            <label className="mb-5 flex min-h-11 items-center gap-3 rounded-lg border border-[#E3E2E2] bg-white px-4 text-[#8A8179]">
              <Search size={17} aria-hidden="true" /><span className="sr-only">Tìm bạn bè theo tên</span>
              <input className="min-w-0 flex-1 bg-transparent py-3 text-sm text-[#3A3632] outline-none" value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm trong danh sách bạn bè…" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map(friend => <article key={friend.id} className="rounded-lg border border-[#E3E2E2] bg-[#FFFFFF] p-6 shadow-sm">
                <span className="mb-5 grid h-14 w-14 place-items-center rounded-full bg-[#E9E8E7] font-display text-xl text-[#1C1B1B]">{friend.avatarInitials || friend.fullName[0]}</span>
                <h2 className="font-display text-2xl text-[#222222]">{friend.fullName}</h2>
                <p className="mt-2 text-xs text-[#8A8179]">Một người bạn trong vòng kết nối của bạn</p>
                <Link aria-label={`Xem Outfit của ${friend.fullName}`} to={`/shared-with-me/${friend.id}`} className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-[#1C1B1B] px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1B1B] focus-visible:ring-offset-2">Xem Outfit</Link>
                <Button className="mt-6" variant="ghost" icon={<UserRoundMinus size={16} aria-hidden="true" />} aria-label={`Hủy kết bạn với ${friend.fullName}`} onClick={() => setRemoveId(friend.id)}>Hủy kết bạn</Button>
              </article>)}
            </div>
            {!filtered.length && <EmptyCircle title={search ? 'Chưa tìm thấy tên này' : 'Vòng kết nối bắt đầu từ một lời mời'} description={search ? 'Thử một tên khác trong danh sách bạn bè.' : 'Mời một người bạn hoặc mở Đã nhận để chấp nhận lời mời.'} />}
          </> : <div className="grid gap-3">
            {(section === 'received' ? incoming : outgoing).map(invitation => {
              const sender = state.users.find(u => u.id === invitation.senderId)
              const expired = invitation.status === 'PENDING' && invitation.expiresAt <= now
              const retry = retrySeconds(invitation, now)
              const label = invitation.status === 'ACCEPTED' ? 'Đã chấp nhận' : invitation.status === 'INVALIDATED' ? 'Đã vô hiệu hóa' : expired ? 'Đã hết hạn' : invitation.delivery === 'FAILED' ? 'Gửi không thành công' : invitation.delivery === 'UNKNOWN' ? 'Chưa rõ kết quả gửi' : 'Đang chờ chấp nhận'
              return <article key={invitation.id} className="flex flex-wrap items-center gap-4 rounded-lg border border-[#E3E2E2] bg-[#FFFFFF] p-5 shadow-sm">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#E9E8E7] font-display text-lg text-[#1C1B1B]">{section === 'received' ? sender?.avatarInitials ?? '?' : invitation.recipientEmail[0].toUpperCase()}</span>
                <div className="min-w-0 flex-1"><h2 className="break-words text-sm font-semibold text-[#3A3632]">{section === 'received' ? sender?.fullName ?? 'Một người bạn' : invitation.recipientEmail}</h2><p className="mt-1 text-xs leading-6 text-[#8A8179]">{section === 'received' ? 'Muốn kết nối cùng bạn' : label}</p>{invitation.status === 'PENDING' && !expired && <p className="text-xs text-[#8A8179]">Hết hạn sau {Math.ceil((invitation.expiresAt - now) / 86400000)} ngày</p>}</div>
                {section === 'received' ? <Button onClick={() => {
                  if (invitation.expiresAt <= Date.now()) { toast.error('Lời mời đã hết hạn.'); return }
                  dispatch({ type: 'friends/accept', payload: { id: invitation.id, now: Date.now() } }); toast.info('Đã thêm bạn trong bản demo.')
                }}>Chấp nhận</Button> : retry !== null ? <Button variant="secondary" disabled={retry > 0} onClick={() => { const invalid = validateRetry(state, invitation.id, Date.now()); if (invalid) { toast.error(invalid); return }; dispatch({ type: 'friends/retry', payload: { id: invitation.id, now: Date.now() } }); toast.info('Đã làm mới lời mời demo, chưa gửi email thật.') }}>{retry > 0 ? `Thử lại sau ${retry}s` : 'Gửi lại'}</Button> : <span className="rounded-full bg-[#EFEDED] px-3 py-1 text-xs text-[#5E5F5D]">{label}</span>}
              </article>
            })}
            {!(section === 'received' ? incoming : outgoing).length && <EmptyCircle title="Chưa có lời mời" description={section === 'received' ? 'Lời mời hợp lệ gửi đến bạn sẽ xuất hiện ở đây.' : 'Mời người bạn muốn kết nối bằng địa chỉ email.'} />}
          </div>}
        </div>
        <aside className="h-fit rounded-lg bg-[#EFEDED]/70 p-6">
          <span className="font-display text-4xl italic leading-tight text-[#927383]">Một chút<br />gần nhau hơn.</span>
          <p className="mt-6 text-sm leading-7 text-[#5E5F5D]">Lời mời có hiệu lực 7 ngày. Người nhận chỉ cần chấp nhận để trở thành bạn bè.</p>
          <p className="mt-3 text-xs leading-6 text-[#8A8179]">Gửi hoặc nhận lời mời không tự đổi chế độ riêng tư của Outfit.</p>
        </aside>
      </div>
      <Modal open={inviteOpen} title="Mời một người bạn" onClose={closeInvite} description="Thêm email người bạn muốn kết nối. Outfit riêng tư vẫn giữ nguyên.">
        <form onSubmit={event => {
          event.preventDefault(); const invalid = validateInvitation(state, email, Date.now())
          if (invalid) { setError(invalid); return }
          dispatch({ type: 'friends/invite', payload: { id: crypto.randomUUID(), email, now: Date.now() } }); closeInvite(); toast.info('Đã thêm lời mời demo, chưa gửi email thật.')
        }}>
          <label className="grid gap-2 text-sm font-semibold text-[#3A3632]">Email người nhận<input type="email" required autoComplete="email" value={email} onChange={event => { setEmail(event.target.value); setError('') }} placeholder="banbe@example.com" aria-invalid={!!error} aria-describedby={error ? 'friends-invite-error' : undefined} className="min-h-11 rounded-lg border border-[#C4C7C7] bg-white px-3 text-sm font-normal outline-none focus:border-[#1C1B1B] focus:ring-2 focus:ring-[#1C1B1B]/20" /></label>
          {error && <p id="friends-invite-error" className="mt-3 text-sm text-[#A94B4B]" role="alert">{error}</p>}
          <div className="mt-6 flex justify-end gap-3"><Button variant="ghost" onClick={closeInvite}>Hủy</Button><Button type="submit">Thêm lời mời</Button></div>
        </form>
      </Modal>
      <Modal open={!!removeId} title="Hủy kết bạn?" onClose={() => setRemoveId(null)} description={`Bạn muốn hủy kết bạn với ${removeFriend?.fullName ?? 'người này'}? Quan hệ bạn bè và các lời mời cũ giữa hai người sẽ bị vô hiệu hóa.`}>
        <div className="flex justify-end gap-3"><Button variant="ghost" onClick={() => setRemoveId(null)}>Giữ bạn bè</Button><Button variant="danger" onClick={() => { if (removeId) dispatch({ type: 'friends/remove', payload: { friendId: removeId, now: Date.now() } }); setRemoveId(null); toast.info('Đã hủy kết bạn trong bản demo.') }}>Hủy kết bạn</Button></div>
      </Modal>
    </section>
  )
}

function EmptyCircle({ title, description }: { title: string; description: string }) {
  return <div className="rounded-lg border border-dashed border-[#C4C7C7] px-6 py-12 text-center"><UsersRound className="mx-auto mb-5 text-[#B98791]" size={32} aria-hidden="true" /><h2 className="font-display text-2xl text-[#3A3632]">{title}</h2><p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#8A8179]">{description}</p></div>
}
