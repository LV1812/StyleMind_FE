import { Check, Copy, Globe2, LockKeyhole, Share2, UsersRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDemoStore } from '@/app/store/DemoStoreProvider'
import type { Outfit, OutfitVisibility } from '@/entities/outfit/model/types'
import { Button, Modal, useToast } from '@/shared/ui'
import { activeCustomer, visibilityLabels } from '../model/outfitSharing'

const choices = [
  { value: 'private', label: 'Riêng tư', description: 'Chỉ mình bạn xem được Outfit này.', icon: LockKeyhole },
  { value: 'friends', label: 'Bạn bè', description: 'Tất cả bạn bè hiện tại của bạn đều xem được.', icon: UsersRound },
  { value: 'public', label: 'Công khai', description: 'Bất kỳ ai có liên kết đều xem được, không cần đăng nhập.', icon: Globe2 },
] as const

export default function OutfitSharingDialog({ outfit }: { outfit: Outfit }) {
  const { state, dispatch } = useDemoStore()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<OutfitVisibility>(outfit.visibility)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
  const close = () => setOpen(false)
  const path = outfit.publicToken ? `/shared/outfits/${encodeURIComponent(outfit.publicToken)}` : ''
  const publicUrl = path ? `${window.location.origin}${path}` : ''

  useEffect(() => {
    if (!open) return
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const dialog = document.querySelector('[data-outfit-sharing]')?.closest<HTMLElement>('[role="dialog"]')
      const controls = Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled):not([type=radio]),input[type=radio]:checked,a[href]') ?? [])
      const first = controls[0], last = controls[controls.length - 1]
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', trap)
    return () => document.removeEventListener('keydown', trap)
  }, [open])

  return <>
    <Button variant="secondary" icon={<Share2 size={17} aria-hidden="true" />} onClick={() => { setDraft(outfit.visibility); setCopyState('idle'); setOpen(true) }}>Chia sẻ outfit</Button>
    <Modal open={open} title="Chia sẻ outfit" description={`Ai có thể xem “${outfit.name}”?`} onClose={close} footer={<><Button variant="ghost" onClick={close}>Hủy</Button><Button onClick={() => {
      const actor = state.session && activeCustomer(state, state.session.userId)
      if (!actor || actor.id !== outfit.ownerId) { toast.error('Bạn không có quyền đổi chế độ Outfit này.'); close(); return }
      dispatch({ type: 'outfit/visibilityChanged', payload: { outfitId: outfit.id, visibility: draft } })
      close(); toast.info(`Đã lưu chế độ ${visibilityLabels[draft]} trong bản demo.`)
    }}>Lưu chế độ</Button></>}>
      <div data-outfit-sharing>
        <fieldset className="grid gap-3">
          <legend className="sr-only">Chế độ hiển thị Outfit</legend>
          {choices.map(({ value, label, description, icon: Icon }) => <label key={value} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${draft === value ? 'border-[#684B5A] bg-[#F4E7E8]/50' : 'border-[#E3DAD0] bg-white hover:bg-[#FAF8F5]'}`}>
            <input type="radio" name="outfit-visibility" value={value} checked={draft === value} onChange={() => { setDraft(value); setCopyState('idle') }} className="mt-1 accent-[#684B5A]" />
            <Icon size={19} className="mt-0.5 shrink-0 text-[#684B5A]" aria-hidden="true" />
            <span className="min-w-0"><span className="block text-sm font-semibold text-[#222222]">{label}</span><span className="mt-1 block text-xs leading-6 text-[#6F6B67]">{description}</span></span>
          </label>)}
        </fieldset>
        <p className="mt-4 text-xs leading-6 text-[#6F6B67]">Mời hoặc chấp nhận kết bạn không tự thay đổi chế độ Outfit. Người xem chỉ xem được Outfit và các sản phẩm trong đó.</p>
        {draft === 'public' && <div className="mt-4 rounded-lg bg-[#EEE8E1]/70 p-4">
          {outfit.visibility === 'public' && publicUrl ? <>
            <label className="grid gap-2 text-sm font-semibold text-[#3A3632]">Liên kết công khai<input readOnly value={publicUrl} onFocus={event => event.target.select()} className="min-h-11 min-w-0 w-full rounded-lg border border-[#D8D0C6] bg-white px-3 text-xs font-normal" /></label>
            <Button className="mt-3" variant="secondary" icon={copyState === 'copied' ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />} onClick={async () => {
              try { await navigator.clipboard.writeText(publicUrl); setCopyState('copied') } catch { setCopyState('error') }
            }}>{copyState === 'copied' ? 'Đã sao chép' : 'Sao chép liên kết'}</Button>
            {copyState === 'error' && <p role="alert" className="mt-2 text-xs leading-6 text-[#A94B4B]">Không thể sao chép tự động. Chọn liên kết ở trên và sao chép thủ công.</p>}
          </> : <p className="text-xs leading-6 text-[#6F6B67]">Lưu chế độ Công khai để kích hoạt liên kết. Tắt rồi bật lại sẽ dùng cùng liên kết.</p>}
        </div>}
        <p className="mt-4 text-xs leading-6 text-[#8A8179]">Bản demo lưu trên trình duyệt này; chưa kết nối API chia sẻ.</p>
      </div>
    </Modal>
  </>
}
