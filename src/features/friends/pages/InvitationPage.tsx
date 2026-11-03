import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { communityApi } from '@/shared/api/communityApi'
import { accessToken, apiMode, isUuid } from '@/shared/api/http'
import { Button } from '@/shared/ui'
const key = 'stylemind.pending-invitation'
export default function InvitationPage() {
  const { currentUser } = useAuth(), location = useLocation()
  const [credential, setCredential] = useState<{ id: string; token: string } | null>(() => {
    const fragment = new URLSearchParams(location.hash.slice(1)), id = fragment.get('invitation_id'), token = fragment.get('token')
    if (isUuid(id) && token && token.length <= 1024) { sessionStorage.setItem(key, JSON.stringify({ id, token })); return { id, token } }
    if (location.hash) { sessionStorage.removeItem(key); return null }
    try { const stored = JSON.parse(sessionStorage.getItem(key) || 'null'); return isUuid(stored?.id) && typeof stored.token === 'string' ? stored : null } catch { return null }
  })
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [accepted, setAccepted] = useState(false)
  const generation = useRef(0)
  useEffect(() => {
    if (!location.hash) return
    generation.current++
    const fragment = new URLSearchParams(location.hash.slice(1)), id = fragment.get('invitation_id'), token = fragment.get('token')
    const next = isUuid(id) && token && token.length <= 1024 ? { id, token } : null
    if (next) sessionStorage.setItem(key, JSON.stringify(next)); else sessionStorage.removeItem(key)
    setCredential(next); setAccepted(false); setError(''); setBusy(false)
    window.history.replaceState(window.history.state, '', location.pathname + location.search)
  }, [location.hash, location.pathname, location.search])
  async function accept() {
    if (!credential || busy) return
    const version = generation.current, token = accessToken()
    setBusy(true); setError('')
    try { await communityApi.acceptLink(credential.id, credential.token); if (version !== generation.current || accessToken() !== token) return; sessionStorage.removeItem(key); setCredential(null); setAccepted(true) }
    catch (e) { if (version === generation.current && accessToken() === token) setError(e instanceof Error ? e.message : 'Không thể chấp nhận lời mời.') }
    finally { if (version === generation.current && accessToken() === token) setBusy(false) }
  }
  return <main className="mx-auto max-w-xl px-5 py-12"><h1 className="font-display text-4xl">Lời mời kết bạn</h1>{!apiMode() ? <p className="mt-4">Tính năng lời mời thật đang chờ tích hợp đăng nhập.</p> : accepted ? <><p className="mt-4">Đã chấp nhận lời mời.</p><Link to="/friends">Xem bạn bè</Link></> : !credential ? <p className="mt-4">Liên kết không hợp lệ hoặc không còn dữ liệu lời mời.</p> : !currentUser ? <><p className="mt-4">Đăng nhập bằng tài khoản có email nhận lời mời đã xác minh, sau đó xác nhận kết bạn.</p><Link className="mt-4 inline-block text-[#684B5A]" to="/login" state={{ from: { pathname: location.pathname } }}>Đăng nhập</Link></> : <><p className="mt-4">Bạn đang đăng nhập với {currentUser.email}. Chỉ tài khoản nhận lời mời đã xác minh mới có thể chấp nhận.</p>{error && <p role="alert" className="mt-4 text-[#A94B4B]">{error}</p>}<Button className="mt-5" loading={busy} onClick={() => void accept()}>Chấp nhận kết bạn</Button></>}</main>
}
