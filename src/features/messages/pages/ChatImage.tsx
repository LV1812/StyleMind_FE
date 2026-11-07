import { useEffect, useState } from 'react'
import { ImageOff, X } from 'lucide-react'
import { chatApi } from '../model/chatApi'

export function ChatImage({ chatId, attachmentId }: { chatId: string; attachmentId: string }) {
  const [src, setSrc] = useState(''), [error, setError] = useState(false)
  useEffect(() => {
    const controller = new AbortController(); let url = ''
    setSrc(''); setError(false)
    chatApi.attachment(chatId, attachmentId, controller.signal).then(blob => {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(blob.type.toLowerCase())) throw new Error('Invalid image')
      if (!controller.signal.aborted) { url = URL.createObjectURL(blob); setSrc(url) }
    }).catch(() => { if (!controller.signal.aborted) setError(true) })
    return () => { controller.abort(); if (url) URL.revokeObjectURL(url) }
  }, [chatId, attachmentId])
  return error ? <p className="mt-1 flex items-center gap-2 text-sm"><ImageOff size={16} aria-hidden="true" /> Không tải được ảnh.</p> : src ? <img src={src} alt="Ảnh trong cuộc trò chuyện" className="mt-1 h-auto max-h-48 w-auto max-w-[min(100%,280px)] rounded-xl object-contain" /> : <p className="mt-1 text-sm">Đang tải ảnh…</p>
}
export function DraftImage({ file, remove }: { file: File; remove: () => void }) {
  const [url, setUrl] = useState('')
  useEffect(() => { const objectUrl = URL.createObjectURL(file); setUrl(objectUrl); return () => URL.revokeObjectURL(objectUrl) }, [file])
  return <div className="relative"><img src={url} alt={`Ảnh chờ gửi ${file.name}`} className="h-20 w-20 rounded-xl border border-[#E3E2E2] object-cover" /><button type="button" onClick={remove} aria-label={`Gỡ ${file.name}`} className="absolute -right-1.5 -top-1.5 grid h-7 w-7 place-items-center rounded-full border border-[#E3E2E2] bg-white text-[#222222] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1B1B]"><X size={15} aria-hidden="true" /></button></div>
}
export async function validateImages(files: File[]): Promise<string | null> {
  if (files.length > 5) return 'Mỗi tin nhắn tối đa 5 ảnh.'
  for (const file of files) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return 'Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP.'
    if (!file.size || file.size > 5 * 1024 * 1024) return 'Mỗi ảnh phải có dung lượng tối đa 5 MB.'
    try { const bitmap = await createImageBitmap(file); const pixels = bitmap.width * bitmap.height; bitmap.close(); if (pixels > 40000000) return 'Mỗi ảnh tối đa 40 megapixel.' }
    catch { return 'Không thể đọc ảnh. Hãy chọn ảnh hợp lệ.' }
  }
  return null
}
