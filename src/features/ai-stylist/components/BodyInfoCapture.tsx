import { useState } from 'react'

import type { User } from '@/entities/user/model/types'

interface BodyInfoCaptureProps {
  user: User
  onSave: (heightCm: number, weightKg: number) => void
}

export function BodyInfoCapture({ user, onSave }: BodyInfoCaptureProps) {
  const [heightCm, setHeightCm] = useState(user.heightCm?.toString() ?? '')
  const [weightKg, setWeightKg] = useState(user.weightKg?.toString() ?? '')
  const [error, setError] = useState('')

  const save = () => {
    const height = Number(heightCm)
    const weight = Number(weightKg)

    if (!height || !weight || height <= 0 || weight <= 0) {
      setError('Vui lòng nhập chiều cao và cân nặng hợp lệ')
      return
    }

    setError('')
    onSave(height, weight)
  }

  return (
    <section className="rounded-lg border border-[#E3DAD0] bg-white p-5 shadow-sm">
      <h2 className="font-display text-2xl font-semibold text-[#222222]">Bổ sung số đo</h2>
      <p className="mt-2 text-sm leading-6 text-[#6F6B67]">
        AI dùng số đo này để cân bằng form dáng, không lưu sở thích phong cách vào hồ sơ.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-[#3A3632]">
          Chiều cao (cm)
          <input
            type="number"
            min="1"
            value={heightCm}
            onChange={event => setHeightCm(event.target.value)}
            className="min-h-11 rounded-lg border border-[#D8D0C6] bg-white px-3 text-sm font-medium text-[#222222] outline-none transition focus:border-[#684B5A] focus:ring-2 focus:ring-[#684B5A]/20"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-[#3A3632]">
          Cân nặng (kg)
          <input
            type="number"
            min="1"
            value={weightKg}
            onChange={event => setWeightKg(event.target.value)}
            className="min-h-11 rounded-lg border border-[#D8D0C6] bg-white px-3 text-sm font-medium text-[#222222] outline-none transition focus:border-[#684B5A] focus:ring-2 focus:ring-[#684B5A]/20"
          />
        </label>
      </div>
      {error && <p className="mt-3 text-sm font-semibold text-[#A94B4B]">{error}</p>}
      <button
        type="button"
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#684B5A] px-4 text-sm font-semibold text-white transition hover:bg-[#563E4A] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A]/30"
        onClick={save}
      >
        Lưu số đo
      </button>
    </section>
  )
}
