import { Bell, Check } from 'lucide-react'
import { useToast } from '@/shared/ui'

export function UnavailableNotificationsPage() {
  const toast = useToast()
  const unsupported = () => toast.info('Chức năng chưa hỗ trợ.')
  return <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 lg:py-14">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-display text-4xl text-black">Thông báo</h1><p className="mt-2 text-sm text-secondary">Thông báo trong ứng dụng hiện chưa được hỗ trợ.</p></div><button onClick={unsupported} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-black px-4 py-2 text-sm hover:bg-black hover:text-white"><Check size={15} /> Đánh dấu tất cả đã đọc</button></div>
    <div className="mt-8 flex flex-wrap gap-2 border-b border-[#C4C7C7]/30 pb-5" aria-label="Bộ lọc thông báo">{['Tất cả', 'Chưa đọc', 'Đã đọc'].map(label => <button key={label} onClick={unsupported} className="rounded-full bg-[#EFEDED] px-4 py-2 text-xs font-medium text-[#444746] hover:bg-[#E3E2E2]">{label}</button>)}</div>
    <div className="grid justify-items-center gap-3 py-16 text-center text-secondary"><Bell size={28} aria-hidden="true" /><p>Chức năng chưa hỗ trợ.</p></div>
  </main>
}
