import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/features/auth'
import { ApiModal } from '@/shared/api/ApiUi'
import { communityApi, type OutfitDetailDto, type OutfitItemDto } from '@/shared/api/communityApi'
import { ApiError } from '@/shared/api/http'
import { Button } from '@/shared/ui'
import { formatCurrency } from '@/shared/lib/formatCurrency'
import { Shirt } from 'lucide-react'
import { OutfitProductPicker } from './OutfitProductPicker'

type Dialog = 'rename' | 'delete' | 'add' | 'change' | 'remove' | null

/** Shared grid for outfit items: 2 columns on phones, 3 on tablets, 4 on desktop. */
export const OUTFIT_GRID_CLASS = 'mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4'

/** Total of the items that can still be bought (each item counts once: outfits have no quantities). */
export function OutfitItemsTotal({ items }: { items: OutfitItemDto[] }) {
  const sellable = items.filter(item => item.available && item.unit_price_vnd != null)
  const total = sellable.reduce((sum, item) => sum + (item.unit_price_vnd ?? 0), 0)
  return <div className="mt-5 flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-[#E3E2E2] bg-white px-4 py-3">
    <span className="text-sm text-[#5E5F5D]">Tổng giá ({sellable.length} món còn bán)</span>
    <span className="text-lg font-semibold text-[#222222]">{formatCurrency(total)}</span>
  </div>
}

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
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])

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
  return <>
    <div className="mt-5 flex flex-wrap gap-3">
      <Button variant="secondary" onClick={() => open('rename')}>Đổi tên</Button>
      <Button variant="secondary" disabled={detail.items.length >= 10} onClick={() => open('add')}>Thêm món</Button>
      <Button variant="danger" onClick={() => open('delete')}>Xóa outfit</Button>
    </div>
    <div className={OUTFIT_GRID_CLASS}>{detail.items.map(item => {
      const name = item.product_name || 'món này'
      return <article key={item.outfit_item_id} className="grid min-w-0 content-start gap-3 overflow-hidden rounded-xl border border-[#E3E2E2] bg-white p-3">
        {item.available && item.image_url ? <img src={item.image_url} alt="" className="aspect-[3/4] w-full rounded-lg bg-[#F5F3F3] object-cover" /> : <div className="grid aspect-[3/4] place-items-center rounded-lg bg-[#F5F3F3] text-[#C4C7C7]"><Shirt size={36} strokeWidth={1} aria-hidden="true" /></div>}
        <div className="min-w-0">
          <h2 className="line-clamp-2 break-words text-sm font-semibold text-[#222222]">{item.product_name || 'Sản phẩm không còn khả dụng'}</h2>
          {item.available && <p className="mt-1 text-xs text-[#5E5F5D]">{[item.color, item.size].filter(Boolean).join(' · ')}</p>}
          {item.available && item.unit_price_vnd != null && <p className="mt-1 text-sm font-semibold text-[#222222]">{formatCurrency(item.unit_price_vnd)}</p>}
        </div>
        <div className="grid gap-2">
          <Button variant="secondary" size="sm" aria-label={`Đổi màu/size ${name}`} disabled={!item.available || !item.product_id} onClick={() => open('change', item)}>Đổi màu/size</Button>
          <Button variant="danger-soft" size="sm" aria-label={`Xóa ${name} khỏi outfit`} disabled={detail.items.length <= 1} onClick={() => open('remove', item)}>Xóa</Button>
        </div>
        {detail.items.length <= 1 && <p className="text-xs text-[#5E5F5D]">Outfit cần giữ ít nhất một món.</p>}
      </article>
    })}</div>
    <OutfitItemsTotal items={detail.items} />

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

    <ApiModal open={dialog === 'add' || dialog === 'change'} title={dialog === 'add' ? 'Thêm món' : 'Đổi màu/size'} onClose={close}>
      <OutfitProductPicker
        key={`${dialog}:${selectedItem?.outfit_item_id ?? 'new'}`}
        usedVariantIds={used}
        restrictToProductId={dialog === 'change' ? selectedItem?.product_id ?? undefined : undefined}
        disabled={busy}
        onSelect={setSelected}
      />
      {error && <p role="alert" className="mt-3 text-sm text-[#A94B4B]">{error}</p>}
      <div className="mt-5 flex justify-end gap-3"><Button variant="ghost" disabled={busy} onClick={close}>Hủy</Button><Button disabled={!selected} loading={busy} onClick={() => { if (dialog === 'add') void perform(() => communityApi.addOutfitItem(detail.outfit_id, selected)); else if (selectedItem) void perform(() => communityApi.changeOutfitItem(detail.outfit_id, selectedItem.outfit_item_id, selected)) }}>{dialog === 'add' ? 'Thêm vào outfit' : 'Lưu phiên bản'}</Button></div>
    </ApiModal>
  </>
}
