import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { friendLabel } from '../model/friendLabel'
import { chatApi } from '@/features/messages/model/chatApi'
import { communityApi, type InvitationResult } from '@/shared/api/communityApi'
import { accessToken, ApiError } from '@/shared/api/http'
import { useApiQuery } from '@/shared/api/useApiQuery'
import { useAuth } from '@/features/auth'
import { ApiModal, ApiPagination, ApiSection, ApiState } from '@/shared/api/ApiUi'
import { Button, useToast } from '@/shared/ui'
import { Mail, UserRound, UsersRound } from 'lucide-react'

type Section = 'friends' | 'incoming' | 'outgoing'
export default function ApiFriendsPage() {
  const { currentUser } = useAuth()
  const [section, setSection] = useState<Section>('friends'), [pages, setPages] = useState({ friends: 0, incoming: 0, outgoing: 0 })
  const friends = useApiQuery(`friends:${pages.friends}`, signal => communityApi.friends(pages.friends, signal))
  const incoming = useApiQuery(`incoming:${pages.incoming}`, signal => communityApi.incoming(pages.incoming, signal))
  const outgoing = useApiQuery(`outgoing:${pages.outgoing}`, signal => communityApi.outgoing(pages.outgoing, signal))
  const [open, setOpen] = useState(false), [email, setEmail] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const [remove, setRemove] = useState<{ id: string; name: string } | null>(null)
  const retryKey = `stylemind.invitation-retry.${currentUser?.id ?? 'none'}`
  const [retry, setRetry] = useState<Record<string, number>>(() => {
    try { const raw = JSON.parse(sessionStorage.getItem(retryKey) || '{}'); return Object.fromEntries(Object.entries(raw).filter(([, value]) => typeof value === 'number' && Number.isFinite(value))) as Record<string, number> } catch { return {} }
  }), [now, setNow] = useState(Date.now())
  const toast = useToast()
  const navigate = useNavigate()
  const mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer) }, [])
  useEffect(() => { sessionStorage.setItem(retryKey, JSON.stringify(retry)) }, [retryKey, retry])
  const refresh = () => { friends.refresh(); incoming.refresh(); outgoing.refresh() }
  const notice = (result: InvitationResult) => {
    if (result.friend_invitation_id && ['FAILED', 'UNKNOWN', 'SENDING'].includes(result.delivery_status ?? '')) setRetry(r => ({ ...r, [result.friend_invitation_id]: Date.now() + Math.max(0, result.retry_after_seconds) * 1000 }))
    if (result.outcome === 'INCOMING_EXISTS') { setSection('incoming'); toast.info('Người này đã mời bạn. Hãy mở Đã nhận để chấp nhận.') }
    else if (result.outcome === 'ALREADY_FRIENDS') toast.info('Hai tài khoản đã là bạn bè.')
    else if (result.status === 'ACCEPTED') toast.info('Đã chấp nhận lời mời kết bạn.')
    else if (result.delivery_status === 'SMTP_ACCEPTED') toast.info('Máy chủ email đã tiếp nhận lời mời. Hãy đợi người nhận chấp nhận.')
    else toast.info('Lời mời đang tồn tại. Danh sách đã được cập nhật.')
  }
  const run = async (action: () => Promise<InvitationResult | void>, close?: () => void) => {
    if (busy) return
    setBusy(true); setError('')
    const token = accessToken()
    const stillCurrent = () => mounted.current && !!token && accessToken() === token
    try { const result = await action(); if (!stillCurrent()) return; if (result) notice(result); else toast.info('Đã hủy kết bạn.'); close?.(); refresh() }
    catch (failure) {
      if (!stillCurrent()) return
      setError(failure instanceof Error ? failure.message : 'Không thực hiện được thao tác.')
      if (failure instanceof ApiError && failure.invitationId && ['EMAIL_DELIVERY_FAILED', 'EMAIL_DELIVERY_UNKNOWN', 'INVITATION_COOLDOWN'].includes(failure.code)) setRetry(r => ({ ...r, [failure.invitationId!]: Date.now() + failure.retryAfter * 1000 }))
      refresh()
    } finally { if (stillCurrent()) setBusy(false) }
  }
  const selected = section === 'friends' ? friends : section === 'incoming' ? incoming : outgoing
  const tabs = [{ key: 'friends', label: 'Bạn bè', total: friends.data?.total_elements }, { key: 'incoming', label: 'Đã nhận', total: incoming.data?.total_elements }, { key: 'outgoing', label: 'Đã gửi', total: outgoing.data?.total_elements }] as const
  return <ApiSection title="Bạn bè">
    <div className="mt-4 flex flex-wrap items-center justify-between gap-4"><p className="text-sm leading-7 text-[#5E5F5D]">Kết nối để cùng xem Outfit Bạn bè. Outfit Riêng tư vẫn chỉ dành cho chủ sở hữu.</p><Button disabled={busy} onClick={() => { setError(''); setOpen(true) }}>Mời bạn bè</Button></div>
    <div className="mt-7 flex gap-2 overflow-x-auto border-b border-[#E3E2E2] pb-3" role="group" aria-label="Danh sách kết nối">{tabs.map(tab => <Button key={tab.key} variant={section === tab.key ? 'primary' : 'ghost'} aria-pressed={section === tab.key} onClick={() => { setSection(tab.key); setError('') }}>{tab.label}{tab.total === undefined ? '' : ` (${tab.total})`}</Button>)}</div>
    {!open && !remove && error && <p role="alert" className="mt-4 text-sm text-[#A94B4B]">{error}</p>}
    <ApiState loading={selected.loading} error={selected.error} retry={selected.refresh} />
    {selected.data && <>
      {!selected.data.items.length && <div className="mt-6 grid justify-items-center rounded-2xl border border-dashed border-[#C4C7C7] bg-white px-6 py-12 text-center">
        {section === 'friends' ? <UsersRound size={28} className="text-[#8B8B89]" aria-hidden="true" /> : <Mail size={28} className="text-[#8B8B89]" aria-hidden="true" />}
        <p className="mt-4 font-display text-xl font-semibold">{section === 'friends' ? 'Chưa có bạn bè' : section === 'incoming' ? 'Chưa có lời mời đã nhận' : 'Chưa có lời mời đã gửi'}</p>
        <p className="mt-2 max-w-md text-sm leading-6 text-[#5E5F5D]">{section === 'friends' ? 'Mời bạn bè để cùng chia sẻ và xem những Outfit yêu thích.' : section === 'incoming' ? 'Lời mời kết bạn gửi đến bạn sẽ xuất hiện tại đây.' : 'Những lời mời bạn gửi sẽ xuất hiện tại đây.'}</p>
      </div>}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {section === 'friends' && friends.data?.items.map(friend => <article key={friend.friendship_id} className="min-w-0 rounded-[24px] border border-[#E3E2E2] bg-white p-6"><div className="flex items-center gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#EFEDED] text-[#444746]"><UserRound size={21} aria-hidden="true" /></span><h2 className="min-w-0 break-words font-display text-2xl [overflow-wrap:anywhere]">{friendLabel(friend)}</h2></div><div className="mt-5 flex flex-wrap gap-3"><Link className="inline-flex min-h-11 items-center rounded-lg bg-[#EFEDED] px-4 text-sm font-semibold" to={`/shared-with-me/${friend.friend_account_id}`}>Xem Outfit</Link><Button variant="secondary" disabled={busy} onClick={() => { void (async () => { setBusy(true); setError(''); const token = accessToken(); try { const chat = await chatApi.open(friend.friend_account_id); if (!mounted.current || !token || accessToken() !== token) return; navigate(`/messages?conversation=${chat.chat_session_id}`) } catch (e) { setError(e instanceof Error ? e.message : 'Không mở được hội thoại.') } finally { setBusy(false) } })() }}>Nhắn tin</Button><Button variant="ghost" disabled={busy} onClick={() => { setError(''); setRemove({ id: friend.friend_account_id, name: friendLabel(friend) }) }}>Hủy kết bạn</Button></div></article>)}
        {section === 'incoming' && incoming.data?.items.map(invitation => <article key={invitation.friend_invitation_id} className="rounded-lg border border-[#E3E2E2] bg-white p-6"><h2 className="font-display text-2xl">{invitation.sender_display_name || 'Một người bạn'}</h2><p className="my-3 text-xs text-[#5E5F5D]">Hết hạn: {new Date(invitation.expires_at).toLocaleString('vi-VN')}</p><Button loading={busy} onClick={() => void run(() => communityApi.accept(invitation.friend_invitation_id))}>Chấp nhận</Button></article>)}
        {section === 'outgoing' && outgoing.data?.items.map(invitation => {
          const countdown = Math.max(0, Math.ceil(((retry[invitation.friend_invitation_id] ?? 0) - now) / 1000))
          const canRetry = invitation.status === 'EXPIRED' || (invitation.status === 'PENDING' && retry[invitation.friend_invitation_id] !== undefined)
          return <article key={invitation.friend_invitation_id} className="min-w-0 rounded-lg border border-[#E3E2E2] bg-white p-6"><h2 className="break-words text-sm font-semibold">{invitation.recipient_email}</h2><p className="my-3 text-xs text-[#5E5F5D]">{({ PENDING: 'Đang chờ', ACCEPTED: 'Đã chấp nhận', EXPIRED: 'Đã hết hạn', INVALIDATED: 'Đã vô hiệu hóa' } as Record<string, string>)[invitation.status] ?? 'Đang cập nhật'}</p>{canRetry && <Button variant="secondary" disabled={busy || countdown > 0} onClick={() => void run(async () => { const result = await communityApi.resend(invitation.friend_invitation_id); if (result.delivery_status === 'SMTP_ACCEPTED') setRetry(r => { const next = { ...r }; delete next[invitation.friend_invitation_id]; return next }); return result })}>{countdown ? `Thử lại sau ${countdown}s` : 'Gửi lại'}</Button>}</article>
        })}
      </div>
      <ApiPagination data={selected.data} setPage={page => setPages(previous => ({ ...previous, [section]: page }))} />
    </>}
    <ApiModal open={open} title="Mời một người bạn" onClose={() => { if (!busy) setOpen(false) }} description="Email người nhận cần thuộc tài khoản đã xác minh khi chấp nhận. Outfit Riêng tư không tự đổi chế độ.">
      <form onSubmit={event => { event.preventDefault(); void run(() => communityApi.invite(email), () => { setOpen(false); setEmail('') }) }}><label className="grid gap-2 text-sm font-semibold">Email người nhận<input className="min-h-11 rounded-lg border border-[#C4C7C7] px-3" type="email" required value={email} disabled={busy} onChange={event => setEmail(event.target.value)} /></label>{error && <p role="alert" className="mt-3 text-sm leading-6 text-[#A94B4B]">{error}</p>}<div className="mt-5 flex justify-end gap-3"><Button disabled={busy} variant="ghost" onClick={() => setOpen(false)}>Hủy</Button><Button type="submit" loading={busy}>Gửi lời mời</Button></div></form>
    </ApiModal>
    <ApiModal open={!!remove} title="Hủy kết bạn" onClose={() => { if (!busy) setRemove(null) }} description={`Hủy kết bạn với ${remove?.name ?? ''}? Hai người mất quyền xem Outfit Bạn bè.`}>{error && <p role="alert" className="text-sm text-[#A94B4B]">{error}</p>}<div className="flex flex-wrap justify-end gap-3"><Button variant="ghost" disabled={busy} onClick={() => setRemove(null)}>Giữ bạn bè</Button><Button variant="danger" loading={busy} onClick={() => { if (remove) void run(() => communityApi.unfriend(remove.id), () => setRemove(null)) }}>Hủy kết bạn</Button></div></ApiModal>
  </ApiSection>
}


