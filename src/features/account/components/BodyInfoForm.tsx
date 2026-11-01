import { TextField } from '@/shared/ui'

import type { FieldErrors, StyleProfileInput } from '../model/validators'

interface BodyInfoFormProps {
  value: StyleProfileInput
  errors: FieldErrors<StyleProfileInput>
  onChange: (value: StyleProfileInput) => void
}

export function BodyInfoForm({ value, errors, onChange }: BodyInfoFormProps) {
  return (
    <section className="rounded-lg border border-[#E3DAD0] bg-white p-5 shadow-sm">
      <h2 className="font-display text-2xl font-semibold text-[#222222]">Thông tin vóc dáng</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <TextField
          label="Dáng mặc vừa (mã)"
          value={value.fitPreference}
          error={errors.fitPreference}
          onChange={event => onChange({ ...value, fitPreference: event.target.value })}
        />
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
        <TextField label="Mã phong cách (phân tách bằng dấu phẩy)" value={value.styleCodes} error={errors.styleCodes} onChange={event => onChange({ ...value, styleCodes: event.target.value })} />
        <TextField label="Mã màu (phân tách bằng dấu phẩy)" value={value.colorCodes} error={errors.colorCodes} onChange={event => onChange({ ...value, colorCodes: event.target.value })} />
        <TextField label="Mã thương hiệu UUID (phân tách bằng dấu phẩy)" value={value.brandIds} error={errors.brandIds} onChange={event => onChange({ ...value, brandIds: event.target.value })} />
      </div>
    </section>
  )
}
