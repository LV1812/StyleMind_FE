import { TextField } from '@/shared/ui'

import type { FieldErrors, ProfileInput } from '../model/validators'

interface BodyInfoFormProps {
  value: ProfileInput
  errors: FieldErrors<ProfileInput>
  onChange: (value: ProfileInput) => void
}

export function BodyInfoForm({ value, errors, onChange }: BodyInfoFormProps) {
  return (
    <section className="rounded-lg border border-[#E3DAD0] bg-white p-5 shadow-sm">
      <h2 className="font-display text-2xl font-semibold text-[#222222]">Thông tin vóc dáng</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <TextField
          label="Chiều cao (cm)"
          type="number"
          min="1"
          value={value.heightCm}
          error={errors.heightCm}
          onChange={event => onChange({ ...value, heightCm: event.target.value })}
        />
        <TextField
          label="Cân nặng (kg)"
          type="number"
          min="1"
          value={value.weightKg}
          error={errors.weightKg}
          onChange={event => onChange({ ...value, weightKg: event.target.value })}
        />
      </div>
    </section>
  )
}
