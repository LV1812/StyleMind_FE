import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiOutfitManagement } from '../components/ApiOutfitManagement'
import { communityApi, type OutfitDetailDto, type SharingDto, type Visibility } from '@/shared/api/communityApi'
import { useApiQuery } from '@/shared/api/useApiQuery'
import { ApiModal, ApiPagination, ApiSection, ApiState } from '@/shared/api/ApiUi'
import { Button } from '@/shared/ui'

const label: Record<Visibility, string> = { PRIVATE: 'Riêng tư', FRIENDS: 'Bạn bè', PUBLIC: 'Công khai' }
export function ApiWardrobePage() {
  const [page, setPage] = useState(0)
  const query = useApiQuery(`own-outfits:${page}`, signal => communityApi.outfits(page, signal))
  return <ApiSection title="Tủ đồ của tôi"><p className="mt-4 text-sm text-[#6F6B67]">Chọn Outfit để quản lý quyền chia sẻ.</p><Link to="/wardrobes/new" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-[#684B5A] px-5 py-3 text-sm font-semibold text-white hover:bg-[#593f4d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A]">Tạo Outfit</Link><ApiState {...query} retry={query.refresh} />{query.data && <><div className="mt-6 grid gap-4 md:grid-cols-2">{query.data.items.map(o => <Link className="rounded-lg border border-[#E3DAD0] bg-white p-5" key={o.outfit_id} to={`/outfits/${o.outfit_id}`}><h2 className="font-display text-2xl">{o.name}</h2><p className="mt-3 text-sm">{o.item_count} món · {label[o.visibility]}</p></Link>)}</div>{!query.data.items.length && <p className="mt-6">Chưa có Outfit.</p>}<ApiPagination data={query.data} setPage={setPage} /></>}</ApiSection>
}
export function ApiSharedWithMePage() {
  const [page, setPage] = useState(0), query = useApiQuery(`friends:${page}`, signal => communityApi.friends(page, signal))
  return <ApiSection title="Outfit bạn bè"><ApiState {...query} retry={query.refresh} />{query.data && <><div className="mt-6 grid gap-4 md:grid-cols-2">{query.data.items.map(f => <Link className="rounded-lg border border-[#E3DAD0] bg-white p-5" key={f.friendship_id} to={`/shared-with-me/${f.friend_account_id}`}><h2 className="font-display text-2xl">Tủ đồ của {f.display_name || 'một người bạn'}</h2><span className="mt-3 inline-block text-sm text-[#684B5A]">Xem Outfit</span></Link>)}</div>{!query.data.items.length && <p className="mt-6">Chưa có bạn bè.</p>}<ApiPagination data={query.data} setPage={setPage} /></>}</ApiSection>
}
export function ApiFriendWardrobePage() {
  const { ownerId = '' } = useParams(), [page, setPage] = useState(0)
  const query = useApiQuery(`friend-outfits:${ownerId}:${page}`, signal => communityApi.friendOutfits(ownerId, page, signal))
  return <ApiSection title="Outfit bạn bè"><Link to="/shared-with-me" className="mt-3 inline-block text-sm text-[#684B5A]">Quay lại</Link><ApiState {...query} retry={query.refresh} />{query.data && <><div className="mt-6 grid gap-4 md:grid-cols-2">{query.data.items.map(o => <Link className="rounded-lg border border-[#E3DAD0] bg-white p-5" key={o.outfit_id} to={`/shared-with-me/${ownerId}/outfits/${o.outfit_id}`}><h2 className="font-display text-2xl">{o.name}</h2><p className="mt-3 text-sm">{o.item_count} món · {label[o.visibility]}</p></Link>)}</div>{!query.data.items.length && <p className="mt-6">Chưa có Outfit để xem.</p>}<ApiPagination data={query.data} setPage={setPage} /></>}</ApiSection>
}
function Items({ detail }: { detail: OutfitDetailDto }) {
  return <div className="mt-6 grid gap-4 md:grid-cols-3">{detail.items.map(item => <article key={item.outfit_item_id} className="rounded-lg border border-[#E3DAD0] bg-white p-4">{item.available && item.image_url && <img src={item.image_url} alt="" className="aspect-[4/5] w-full object-cover" />}<h2 className="mt-3 font-semibold">{item.product_name || 'Sản phẩm không còn khả dụng'}</h2>{item.available && <p className="mt-2 text-sm">{item.color} · {item.size} · {item.unit_price_vnd?.toLocaleString('vi-VN')} ₫</p>}</article>)}</div>
}
function Sharing({ outfitId, settings, refresh }: { outfitId: string; settings: SharingDto; refresh: () => void }) {
  const [open, setOpen] = useState(false), [draft, setDraft] = useState<Visibility>(settings.visibility), [busy, setBusy] = useState(false), [error, setError] = useState(''), [copy, setCopy] = useState('')
  const url = settings.public_enabled && settings.public_token ? `${window.location.origin}/shared/outfits/${encodeURIComponent(settings.public_token)}` : ''
  const save = async () => { setBusy(true); setError(''); try { if (draft === 'PUBLIC') await communityApi.enablePublicLink(outfitId); else if (draft === 'PRIVATE' && settings.visibility === 'PUBLIC') await communityApi.disablePublicLink(outfitId); else await communityApi.changeSharing(outfitId, draft); setOpen(false); refresh() } catch (e) { setError(e instanceof Error ? e.message : 'Không lưu được chế độ.') } finally { setBusy(false) } }
  return <><Button onClick={() => { setDraft(settings.visibility); setError(''); setCopy(''); setOpen(true) }}>Chia sẻ outfit</Button><ApiModal open={open} title="Chia sẻ outfit" onClose={() => { if (!busy) setOpen(false) }}><fieldset className="grid gap-3">{(['PRIVATE', 'FRIENDS', 'PUBLIC'] as const).map(v => <label key={v} className="rounded-lg border border-[#E3DAD0] p-4"><input type="radio" name="visibility" checked={draft === v} onChange={() => setDraft(v)} /> {label[v]}</label>)}</fieldset><p className="mt-4 text-sm">Bạn bè có thể xem Outfit Bạn bè. Mời bạn không tự đổi chế độ.</p>{url && draft === 'PUBLIC' && <div><label className="mt-4 grid gap-2 text-sm">Liên kết công khai<input readOnly value={url} className="min-w-0 rounded border p-2" onFocus={e => e.currentTarget.select()} /></label><Button variant="secondary" className="mt-3" onClick={async () => { try { await navigator.clipboard.writeText(url); setCopy('Đã sao chép') } catch { setCopy('Hãy chọn liên kết và sao chép thủ công.') } }}>Sao chép liên kết</Button><p role="status" className="mt-2 text-xs">{copy}</p></div>}{error && <p role="alert" className="mt-4 text-sm text-[#A94B4B]">{error}</p>}<div className="mt-5 flex justify-end gap-3"><Button variant="ghost" disabled={busy} onClick={() => setOpen(false)}>Hủy</Button><Button loading={busy} onClick={() => void save()}>Lưu chế độ</Button></div></ApiModal></>
}
export function ApiOutfitDetailPage({ kind }: { kind: 'owner' | 'friend' | 'public' }) {
  const { outfitId = '', ownerId = '', token = '' } = useParams()
  const navigate = useNavigate()
  const query = useApiQuery(`${kind}:${ownerId}:${outfitId}:${token}`, signal => kind === 'public' ? communityApi.publicOutfit(token, signal) : kind === 'friend' ? communityApi.friendOutfit(ownerId, outfitId, signal) : communityApi.outfit(outfitId, signal), kind === 'public')
  const settings = useApiQuery(`sharing:${outfitId}`, signal => kind === 'owner' ? communityApi.sharing(outfitId, signal) : Promise.resolve(null), kind !== 'owner')
  return <main className="min-h-screen bg-[#FAF8F5]"><ApiSection title={query.data?.name || 'Outfit'}><ApiState {...query} retry={query.refresh} />{query.data && <>{kind === 'owner' && <><ApiState {...settings} retry={settings.refresh} />{settings.data && <div className="mt-4 flex items-center gap-4"><span>{label[settings.data.visibility]}</span><Sharing outfitId={outfitId} settings={settings.data} refresh={() => { settings.refresh(); query.refresh() }} /></div>}</>}{kind === 'owner' ? <ApiOutfitManagement key={outfitId} detail={query.data} refresh={query.refresh} onDeleted={() => navigate('/wardrobes')} /> : <Items detail={query.data} />}</>}</ApiSection></main>
}

