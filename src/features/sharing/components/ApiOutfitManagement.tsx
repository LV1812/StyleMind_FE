import { useEffect, useRef, useState } from 'react'
import type { CommerceProduct, ProductVariant } from '@/api/commerce.types'
import { loadAllCommerceProducts } from '@/features/commerce/data/loadCommerceProducts'
import { useAuth } from '@/features/auth'
import { ApiModal } from '@/shared/api/ApiUi'
import { communityApi, type OutfitDetailDto, type OutfitItemDto } from '@/shared/api/communityApi'
import { ApiError } from '@/shared/api/http'
import { Button } from '@/shared/ui'
import { Shirt } from 'lucide-react'

type Dialog = 'rename' | 'delete' | 'add' | 'change' | 'remove' | null
const optionLabel = (product: CommerceProduct, variant: ProductVariant) =>
  `${product.name} · ${variant.color || 'Mặc định'} · ${variant.size || 'Một cỡ'}`

function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const messages: Record<string, string> = {
      OUTFIT_LAST_ITEM: 'Outfit phải giữ lại ít nhất một món.',
      OUTFIT_ITEM_LIMIT_REACHED: 'Mỗi outfit tối đa 10 món.',
      OUTFIT_ITEM_DUPLICATE: 'Phiên bản này đã có trong outfit.',
      OUTFIT_ITEM_UNAVAILABLE: 'Món này không còn khả dụng. Bạn có thể xóa và thêm món khác.',
      VARIANT_NOT_ACTIVE: 'Phiên bản này không còn khả dụng.',
    }
    return messages[error.code] || error.message
  }
  return error instanceof Error ? error.message : 'Không thể cập nhật outfit. Vui lòng thử lại.'
}

export function ApiOutfitManagement({ detail, refresh, onDeleted }: { detail: OutfitDetailDto; refresh: () => void; onDeleted: () => void }) {
  const { currentUser } = useAuth()
  const owner = useRef(currentUser?.id)
  owner.current = currentUser?.id
  const currentOutfit = useRef(detail.outfit_id)
  currentOutfit.current = detail.outfit_id
  const mounted = useRef(true), lock = useRef(false)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [selectedItem, setSelectedItem] = useState<OutfitItemDto | null>(null)
  const [name, setName] = useState(detail.name)
  const [selected, setSelected] = useState('')
  const [catalog, setCatalog] = useState<CommerceProduct[]>([])
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [catalogError, setCatalogError] = useState('')
  const [catalogRevision, setCatalogRevision] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  useEffect(() => {
    if (dialog !== 'add' && dialog !== 'change') return
    let active = true
    setCatalogLoading(true); setCatalogError(''); setSelected('')
    void loadAllCommerceProducts().then(products => { if (active) setCatalog(products) })
      .catch(() => { if (active) setCatalogError('Không tải được sản phẩm. Vui lòng thử lại.') })
      .finally(() => { if (active) setCatalogLoading(false) })
    return () => { active = false }
  }, [dialog, catalogRevision])

  const open = (next: Dialog, item?: OutfitItemDto) => {
    setError(''); setSelected(''); setSelectedItem(item ?? null); setName(detail.name); setDialog(next)
  }
  const close = () => { if (!busy) { setDialog(null); setError('') } }
  const perform = async (action: () => Promise<unknown>, deleted = false) => {
    if (lock.current || !owner.current) return
    const originalOwner = owner.current
    const originalOutfit = detail.outfit_id
    lock.current = true; setBusy(true); setError('')
    try {
      await action()
      if (!mounted.current || owner.current !== originalOwner || currentOutfit.current !== originalOutfit) return
      setDialog(null)
      if (deleted) onDeleted(); else refresh()
    } catch (failure) {
      if (mounted.current && owner.current === originalOwner && currentOutfit.current === originalOutfit) setError(errorMessage(failure))
    } finally { lock.current = false; if (mounted.current && owner.current === originalOwner) setBusy(false) }
  }

  const used = new Set(detail.items.map(item => item.variant_id))
  const options = catalog.filter(product => product.product_status === 'ACTIVE' && (dialog !== 'change' || product.product_id === selectedItem?.product_id))
    .flatMap(product => product.variants.filter(variant => variant.variant_status === 'ACTIVE' && !used.has(variant.variant_id))
      .map(variant => ({ value: variant.variant_id, label: optionLabel(product, variant) })))

  return <>
    <div className="mt-5 flex flex-wrap gap-3">
      <Button variant="secondary" onClick={() => open('rename')}>Đổi tên</Button>
      <Button variant="secondary" disabled={detail.items.length >= 10} onClick={() => open('add')}>Thêm món</Button>
      <Button variant="danger" onClick={() => open('delete')}>Xóa outfit</Button>
    </div>
    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{detail.items.map(item => <article key={item.outfit_item_id} className="min-w-0 overflow-hidden rounded-xl border border-[#E3E2E2] bg-white p-4">
      {item.available && item.image_url ? <img src={item.image_url} alt="" className="aspect-[4/5] w-full rounded-lg object-cover" /> : <div className="grid aspect-[4/5] place-items-center rounded-lg bg-[#F5F3F3] text-[#C4C7C7]"><Shirt size={40} strokeWidth={1} aria-hidden="true" /></div>}
      <h2 className="mt-4 break-words font-display text-xl font-semibold">{item.product_name || 'Sản phẩm không còn khả dụng'}</h2>
      {item.available && <p className="mt-2 text-sm text-[#5E5F5D]">{item.color} · {item.size} · {item.unit_price_vnd?.toLocaleString('vi-VN')} ₫</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" disabled={!item.available || !item.product_id} onClick={() => open('change', item)}>Đổi phiên bản {item.product_name || 'món này'}</Button>
        <Button variant="ghost" disabled={detail.items.length <= 1} onClick={() => open('remove', item)}>Xóa {item.product_name || 'món này'} khỏi outfit</Button>
      </div>
      {detail.items.length <= 1 && <p className="mt-2 text-xs text-[#5E5F5D]">Outfit cần giữ ít nhất một món.</p>}
    </article>)}</div>

    <ApiModal open={dialog === 'rename'} title="Đổi tên outfit" onClose={close}>
      <form onSubmit={event => { event.preventDefault(); const value = name.trim(); if (!value || [...value].length > 100 || /[\u0000-\u001f\u007f-\u009f]/u.test(value)) { setError('Nhập tên từ 1 đến 100 ký tự hợp lệ.'); return }; void perform(() => communityApi.renameOutfit(detail.outfit_id, value)) }}>
        <label className="grid gap-2 text-sm font-semibold">Tên outfit<input className="rounded-lg border p-3" value={name} onChange={event => setName(event.target.value)} disabled={busy} /></label>
        {error && <p role="alert" className="mt-3 text-sm text-[#A94B4B]">{error}</p>}
        <div className="mt-5 flex justify-end gap-3"><Button variant="ghost" disabled={busy} onClick={close}>Hủy</Button><Button type="submit" loading={busy}>Lưu</Button></div>
      </form>
    </ApiModal>

    <ApiModal open={dialog === 'delete' || dialog === 'remove'} title={dialog === 'delete' ? 'Xóa outfit' : 'Xóa món'} onClose={close}>
      <p className="text-sm">{dialog === 'delete' ? `Xóa outfit “${detail.name}”?` : `Xóa ${selectedItem?.product_name || 'món này'} khỏi outfit?`}</p>
      {error && <p role="alert" className="mt-3 text-sm text-[#A94B4B]">{error}</p>}
      <div className="mt-5 flex justify-end gap-3"><Button variant="ghost" disabled={busy} onClick={close}>Hủy</Button><Button variant="danger" loading={busy} onClick={() => { if (dialog === 'delete') void perform(() => communityApi.deleteOutfit(detail.outfit_id), true); else if (selectedItem) void perform(() => communityApi.removeOutfitItem(detail.outfit_id, selectedItem.outfit_item_id)) }}>Xác nhận xóa</Button></div>
    </ApiModal>

    <ApiModal open={dialog === 'add' || dialog === 'change'} title={dialog === 'add' ? 'Thêm món' : 'Đổi phiên bản'} onClose={close}>
      {catalogLoading && <p role="status">Đang tải sản phẩm…</p>}
      {catalogError && <div><p role="alert">{catalogError}</p><Button variant="secondary" onClick={() => setCatalogRevision(value => value + 1)}>Thử lại</Button></div>}
      {!catalogLoading && !catalogError && <><label className="grid gap-2 text-sm font-semibold">{dialog === 'add' ? 'Chọn sản phẩm và phiên bản' : 'Chọn phiên bản mới'}<select className="rounded-lg border p-3" value={selected} onChange={event => setSelected(event.target.value)} disabled={busy}><option value="">Chọn phiên bản</option>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>{!options.length && <p className="mt-3 text-sm">Không có phiên bản phù hợp.</p>}</>}
      {error && <p role="alert" className="mt-3 text-sm text-[#A94B4B]">{error}</p>}
      <div className="mt-5 flex justify-end gap-3"><Button variant="ghost" disabled={busy} onClick={close}>Hủy</Button><Button disabled={!selected || catalogLoading || !!catalogError} loading={busy} onClick={() => { if (dialog === 'add') void perform(() => communityApi.addOutfitItem(detail.outfit_id, selected)); else if (selectedItem) void perform(() => communityApi.changeOutfitItem(detail.outfit_id, selectedItem.outfit_item_id, selected)) }}>{dialog === 'add' ? 'Thêm vào outfit' : 'Lưu phiên bản'}</Button></div>
    </ApiModal>
  </>
}
