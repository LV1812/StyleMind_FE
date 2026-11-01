import { TextField } from '@/shared/ui'

import type { FieldErrors, ProfileInput } from '../model/validators'

interface ProfileFormProps {
  value: ProfileInput
  errors: FieldErrors<ProfileInput>
  onChange: (value: ProfileInput) => void
}

export function ProfileForm({ value, errors, onChange }: ProfileFormProps) {
  return (
    <section className="rounded-lg border border-[#E3DAD0] bg-white p-5 shadow-sm">
      <h2 className="font-display text-2xl font-semibold text-[#222222]">Hồ sơ cá nhân</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <TextField
          label="Họ tên"
          value={value.fullName}
          error={errors.fullName}
          onChange={event => onChange({ ...value, fullName: event.target.value })}
        />
        <TextField
          label="Số điện thoại"
          value={value.phone}
          error={errors.phone}
          onChange={event => onChange({ ...value, phone: event.target.value })}
        />
      </div>
    </section>
  )
}
