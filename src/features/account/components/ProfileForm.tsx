import { TextField } from '@/shared/ui'

import type { FieldErrors, ProfileInput } from '../model/validators'

interface ProfileFormProps {
  value: ProfileInput
  errors: FieldErrors<ProfileInput>
  onChange: (value: ProfileInput) => void
}

export function ProfileForm({ value, errors, onChange }: ProfileFormProps) {
  return (
    <section>
      <h2 className="font-display text-2xl font-semibold text-[#222222]">Hồ sơ cá nhân</h2>
      <div className="mt-5 max-w-xl">
        <TextField
          label="Tên hiển thị"
          value={value.displayName}
          error={errors.displayName}
          onChange={event => onChange({ ...value, displayName: event.target.value })}
        />
      </div>
    </section>
  )
}
