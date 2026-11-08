import { useCallback, useEffect, useState } from 'react'
import { commerceApi } from '@/api/commerce'
import type { CommerceProduct, VariantImage } from '@/api/commerce.types'

interface Props { productId: string; variantId: string; onUpdated: (product: CommerceProduct) => void }

export default function VariantImagesManager({ productId, variantId, onUpdated }: Props) {
  const [images, setImages] = useState<VariantImage[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const product = await commerceApi.products.getAdmin(productId)
    const variant = product.variants.find(item => item.variant_id === variantId)
    if (!variant) throw new Error('Không tìm thấy biến thể.')
    setImages([...variant.images].sort((a, b) => a.display_order - b.display_order))
    onUpdated(product)
  }, [productId, variantId, onUpdated])

  useEffect(() => {
    let active = true
    setLoading(true); setError('')
    void commerceApi.products.getAdmin(productId).then(product => {
      if (!active) return
      const variant = product.variants.find(item => item.variant_id === variantId)
      if (!variant) throw new Error('Không tìm thấy biến thể.')
      setImages([...variant.images].sort((a, b) => a.display_order - b.display_order))
    }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Không tải được ảnh.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [productId, variantId])

  const run = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true); setError(''); setNotice('')
    try {
      await action()
      setConfirmId(null)
      try { await load(); setNotice(success) }
      catch { setError('Thao tác đã được gửi, nhưng chưa tải lại được dữ liệu. Hãy tải lại ảnh trước khi tiếp tục.') }
    } catch (reason) { setError(`${reason instanceof Error ? reason.message : 'Không thể cập nhật ảnh.'} Hãy tải lại ảnh để kiểm tra trước khi thao tác tiếp.`) }
    finally { setBusy(false) }
  }

  const reorder = (ordered: VariantImage[], primaryId: string | null) => run(
    () => commerceApi.products.reorderImages(variantId, {
      items: ordered.map((image, index) => ({ image_id: image.image_id, display_order: index + 1 })),
      primary_image_id: primaryId,
    }), 'Đã cập nhật ảnh.'
  )

  const move = (index: number, direction: number) => {
    const ordered = [...images]
    const target = index + direction
    if (target < 0 || target >= ordered.length) return
    ;[ordered[index], ordered[target]] = [ordered[target], ordered[index]]
    void reorder(ordered, images.find(image => image.is_primary)?.image_id ?? null)
  }

  return <section aria-label="Quản lý ảnh biến thể" className="grid gap-3">
    <p className="text-sm text-[#5E5F5D]">Thứ tự và ảnh chính được lưu ngay sau mỗi thao tác.</p>
    {loading && <p role="status">Đang tải ảnh…</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="text-sm text-green-700">{notice}</p>}
    {!loading && !images.length && <p className="text-sm">Biến thể chưa có ảnh.</p>}
    <fieldset disabled={loading} className="min-w-0"><ul className="grid gap-3">
      {images.map((image, index) => <li key={image.image_id} className="flex flex-wrap items-center gap-3 rounded-lg border border-[#E5E0D8] p-3">
        <img src={image.image_url} alt={image.alt_text || `Ảnh ${index + 1}`} className="h-20 w-20 rounded-md object-cover" />
        <div className="min-w-0 flex-1"><p className="text-sm font-semibold">Ảnh {index + 1}{image.is_primary ? ' · Ảnh chính' : ''}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" disabled={busy || !!error || index === 0} aria-label={`Đưa ảnh ${index + 1} lên trước`} onClick={() => move(index, -1)} className="rounded border px-2 py-1 text-sm disabled:opacity-40">Lên</button>
            <button type="button" disabled={busy || !!error || index === images.length - 1} aria-label={`Đưa ảnh ${index + 1} xuống sau`} onClick={() => move(index, 1)} className="rounded border px-2 py-1 text-sm disabled:opacity-40">Xuống</button>
            {!image.is_primary && <button type="button" disabled={busy || !!error} onClick={() => void reorder(images, image.image_id)} className="rounded border px-2 py-1 text-sm disabled:opacity-40">Đặt làm ảnh chính</button>}
            <button type="button" disabled={busy || !!error} aria-label={`Xóa ảnh ${index + 1}`} onClick={() => setConfirmId(image.image_id)} className="rounded border px-2 py-1 text-sm text-red-700 disabled:opacity-40">Xóa</button>
          </div>
          {confirmId === image.image_id && <div role="group" aria-label={`Xác nhận xóa ảnh ${index + 1}`} className="mt-3 flex flex-wrap items-center gap-2 text-sm"><span>{image.is_primary ? 'Đây là ảnh chính. Sau khi xóa, hãy chọn ảnh chính khác nếu cần.' : 'Xóa ảnh này?'}</span><button type="button" disabled={busy || !!error} onClick={() => void run(() => commerceApi.products.removeImage(image.image_id), 'Đã xóa ảnh.')} className="rounded bg-red-700 px-3 py-1 text-white disabled:opacity-40">Xác nhận xóa</button><button type="button" disabled={busy} onClick={() => setConfirmId(null)} className="rounded border px-3 py-1">Hủy</button></div>}
        </div>
      </li>)}
    </ul></fieldset>
    {error && <button type="button" disabled={busy} onClick={() => { setError(''); setLoading(true); void load().catch(reason => setError(reason instanceof Error ? reason.message : 'Không tải được ảnh.')).finally(() => setLoading(false)) }} className="w-fit rounded border px-3 py-2 text-sm">Tải lại ảnh</button>}
  </section>
}
