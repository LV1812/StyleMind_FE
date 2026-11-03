import { useEffect, useState } from 'react'
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
  return error ? <p>Không tải được ảnh.</p> : src ? <img src={src} alt="Ảnh trong cuộc trò chuyện" className="mt-2 max-h-80 max-w-full rounded-lg" /> : <p>Đang tải ảnh…</p>
}
export function DraftImage({ file, remove }: { file: File; remove: () => void }) {
  const [url, setUrl] = useState('')
  useEffect(() => { const objectUrl = URL.createObjectURL(file); setUrl(objectUrl); return () => URL.revokeObjectURL(objectUrl) }, [file])
  return <div className="relative"><img src={url} alt={`Ảnh chờ gửi ${file.name}`} className="h-20 w-20 rounded-lg object-cover" /><button type="button" onClick={remove} aria-label={`Gỡ ${file.name}`} className="absolute right-0 top-0 rounded-full bg-white px-2">×</button></div>
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
