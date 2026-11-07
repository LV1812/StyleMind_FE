import { TextField } from '@/shared/ui'
import { useEffect, useState } from 'react'

import type { FieldErrors, StyleProfileInput } from '../model/validators'

interface BodyInfoFormProps {
  value: StyleProfileInput
  errors: FieldErrors<StyleProfileInput>
  onChange: (value: StyleProfileInput) => void
}

export function BodyInfoForm({ value, errors, onChange }: BodyInfoFormProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false)
  useEffect(() => {
    if (errors.fitPreference || errors.styleCodes || errors.colorCodes || errors.brandIds) setAdvancedOpen(true)
  }, [errors])
  return (
    <section>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Chiều cao (cm)"
          type="number"
          min="50"
          max="250"
          step="0.1"
          value={value.heightCm}
          error={errors.heightCm}
          onChange={event => onChange({ ...value, heightCm: event.target.value })}
        />
        <TextField
          label="Cân nặng (kg)"
          type="number"
          min="20"
          max="300"
          step="0.1"
          value={value.weightKg}
          error={errors.weightKg}
          onChange={event => onChange({ ...value, weightKg: event.target.value })}
        />
        <TextField label="Cỡ áo thường dùng" value={value.usualTopSize} error={errors.usualTopSize} onChange={event => onChange({ ...value, usualTopSize: event.target.value })} />
        <TextField label="Cỡ quần/váy thường dùng" value={value.usualBottomSize} error={errors.usualBottomSize} onChange={event => onChange({ ...value, usualBottomSize: event.target.value })} />
        <TextField label="Cỡ giày" value={value.shoeSize} error={errors.shoeSize} onChange={event => onChange({ ...value, shoeSize: event.target.value })} />
      </div>
      <details open={advancedOpen} onToggle={event => setAdvancedOpen(event.currentTarget.open)} className="mt-5 rounded-lg border border-[#E3E2E2] bg-[#FBF9F9] p-4">
        <summary className="cursor-pointer text-sm font-semibold text-[#222222] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1B1B]">Tùy chọn nâng cao</summary>
        <p className="mt-3 text-sm leading-6 text-[#5E5F5D]">Các mã này là tùy chọn. Nhiều mã được ngăn cách bằng dấu phẩy; để trống danh sách nếu muốn xóa.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <TextField label="Dáng mặc vừa (mã)" value={value.fitPreference} error={errors.fitPreference} onChange={event => onChange({ ...value, fitPreference: event.target.value })} />
        <TextField label="Mã phong cách (phân tách bằng dấu phẩy)" value={value.styleCodes} error={errors.styleCodes} onChange={event => onChange({ ...value, styleCodes: event.target.value })} />
        <TextField label="Mã màu (phân tách bằng dấu phẩy)" value={value.colorCodes} error={errors.colorCodes} onChange={event => onChange({ ...value, colorCodes: event.target.value })} />
        <TextField label="Mã thương hiệu UUID (phân tách bằng dấu phẩy)" value={value.brandIds} error={errors.brandIds} onChange={event => onChange({ ...value, brandIds: event.target.value })} />
        </div>
      </details>
    </section>
  )
}
