import { Lock, Shield, Store } from 'lucide-react'
import { useToast } from '@/shared/ui'

export function AdminSettingsUnavailable() {
  const toast = useToast()
  const unsupported = () => toast.info('Chức năng chưa hỗ trợ.')

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-[#222222]">Cài đặt hệ thống</h1>
        <p className="mt-2 text-sm text-[#5E5F5D]">Các thiết lập cửa hàng và bảo mật sẽ được bổ sung sau.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Store size={18} aria-hidden="true" /> Hồ sơ cửa hàng</h2>
            <div className="mt-4 grid gap-4">
              {['Tên cửa hàng', 'Email liên hệ', 'Mô tả'].map(label => (
                <label key={label} className="grid gap-2 text-sm font-medium text-[#5E5F5D]">{label}
                  <input readOnly onFocus={unsupported} placeholder="Chưa hỗ trợ" className="border-b border-[#E3E2E2] bg-transparent py-2 outline-none focus:border-[#876B76]" />
                </label>
              ))}
              <button type="button" onClick={unsupported} className="w-fit rounded-lg bg-[#222222] px-6 py-2 text-sm font-semibold text-white hover:bg-[#474747]">Lưu thay đổi</button>
            </div>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Shield size={18} aria-hidden="true" /> Kiểm soát truy cập</h2>
            <p className="mt-4 text-sm text-[#5E5F5D]">Thiết lập quyền truy cập chưa được hỗ trợ.</p>
          </div>
        </div>
        <div className="h-fit rounded-xl bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Lock size={18} aria-hidden="true" /> Kiểm tra bảo mật</h2>
          <p className="mt-4 text-sm text-[#5E5F5D]">Thông tin kiểm tra bảo mật chưa được hỗ trợ.</p>
        </div>
      </div>
    </section>
  )
}
