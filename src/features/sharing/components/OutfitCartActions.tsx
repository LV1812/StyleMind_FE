import { useRef, useState } from 'react'
import { useActiveCommerce } from '@/features/cart/model/AccountCommerceProvider'
import { guestCartErrorMessage } from '@/features/cart/data/guestCartApi'
import type { OutfitItemDto } from '@/shared/api/communityApi'
import { accessToken } from '@/shared/api/http'
import { Button } from '@/shared/ui'

export function OutfitCartActions({ items }: { items: OutfitItemDto[] }) {
  const cart = useActiveCommerce()
  const lock = useRef(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const available = items.filter(item => item.available && item.variant_id)

  const add = async (selected: OutfitItemDto[]) => {
    if (lock.current || cart.busy || !selected.length) return
    lock.current = true
    setBusy(true); setError(''); setMessage('')
    let added = 0
    const token = accessToken()
    try {
      for (const item of selected) {
        if (accessToken() !== token) throw new Error('Phiên đăng nhập đã thay đổi.')
        await cart.addItem(item.variant_id, 1)
        added++
      }
      const skipped = selected === available ? items.length - selected.length : 0
      setMessage(`Đã thêm ${added} món${skipped ? `; ${skipped} món không còn khả dụng` : ''}.`)
    } catch (failure) {
      setError(`Đã thêm ${added} món. ${guestCartErrorMessage(failure)} Hãy kiểm tra giỏ hàng trước khi thử lại.`)
    } finally { lock.current = false; setBusy(false) }
  }

  return <section className="mt-8 rounded-xl border border-[#E3E2E2] bg-white p-5" aria-label="Thêm Outfit vào giỏ">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="font-display text-2xl font-semibold">Mua các món trong Outfit</h2><p className="mt-2 text-sm text-secondary">Chọn từng món hoặc thêm các món còn khả dụng.</p></div><Button disabled={!available.length || cart.busy} loading={busy} onClick={() => void add(available)}>Thêm Outfit vào giỏ</Button></div>
    <div className="mt-4 grid gap-2">{items.map(item => <div key={item.outfit_item_id} className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E3E2E2] py-3"><span className="min-w-0 break-words text-sm">{item.product_name || 'Sản phẩm không còn khả dụng'}</span><Button size="sm" variant="secondary" disabled={!item.available || !item.variant_id || busy || cart.busy} onClick={() => void add([item])}>Thêm {item.product_name || 'món này'} vào giỏ</Button></div>)}</div>
    {message && <p role="status" className="mt-3 text-sm text-[#294C36]">{message}</p>}
    {error && <p role="alert" className="mt-3 text-sm text-[#A94B4B]">{error}</p>}
  </section>
}
