import { Bell, Filter, RefreshCw, Search } from 'lucide-react'
import { useToast } from '@/shared/ui'

export function AdminNotificationsUnavailable() {
  const toast = useToast()
  const unsupported = () => toast.info('Chức năng chưa hỗ trợ.')
  return <section className="space-y-6"><div className="flex items-center justify-between"><h1 className="font-display text-4xl">Thông báo</h1><button onClick={unsupported} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[#EFEDED]"><RefreshCw size={14} /> Làm mới</button></div>
    <p className="rounded-lg border border-[#E3E2E2] bg-white p-4 text-sm text-secondary">Quản lý thông báo hiện chưa được hỗ trợ.</p>
    <div className="flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><Search size={16} className="absolute left-3 top-3 text-secondary" /><input aria-label="Tìm thông báo" onFocus={unsupported} readOnly placeholder="Tìm thông báo..." className="w-full rounded-lg bg-[#EFEDED] py-2 pl-9 pr-4 text-sm" /></label><div className="flex flex-wrap items-center gap-2"><Filter size={16} aria-hidden="true" />{['Tất cả', 'Đã gửi', 'Chờ gửi', 'Thất bại'].map(label => <button key={label} onClick={unsupported} className="rounded-lg bg-[#EFEDED] px-3 py-2 text-xs hover:bg-[#E3E2E2]">{label}</button>)}</div></div>
    <div className="grid justify-items-center rounded-xl bg-white py-16 text-center text-secondary"><Bell size={40} className="mb-3 opacity-30" /><p className="text-sm">Danh sách thông báo chưa được hỗ trợ.</p></div>
  </section>
}
