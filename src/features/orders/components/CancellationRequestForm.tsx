import { useState } from 'react'

interface CancellationRequestFormProps {
  submitted: boolean
  onSubmit: (reason: string) => void
}

export function CancellationRequestForm({ submitted, onSubmit }: CancellationRequestFormProps) {
  const [reason, setReason] = useState('')

  if (submitted) {
    return (
      <section className="rounded-lg border border-[#E3DAD0] bg-white p-5 shadow-sm">
        <h2 className="font-display text-xl font-semibold text-[#222222]">Yêu cầu hủy đơn</h2>
        <p className="mt-3 text-sm font-semibold text-[#2F7D4E]">Đã gửi yêu cầu hủy</p>
      </section>
    )
  }

  return (
    <section className="rounded-lg border border-[#E3DAD0] bg-white p-5 shadow-sm">
      <h2 className="font-display text-xl font-semibold text-[#222222]">Yêu cầu hủy đơn</h2>
      <label className="mt-4 grid gap-2 text-sm font-semibold text-[#3A3632]">
        Lý do hủy đơn
        <textarea
          value={reason}
          onChange={event => setReason(event.target.value)}
          className="min-h-24 rounded-lg border border-[#D8D0C6] bg-white px-3 py-2 text-sm font-medium text-[#222222] outline-none focus:border-[#684B5A] focus:ring-2 focus:ring-[#684B5A]/20"
        />
      </label>
      <button
        type="button"
        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#684B5A] px-4 text-sm font-semibold text-white disabled:opacity-60"
        disabled={!reason.trim()}
        onClick={() => onSubmit(reason.trim())}
      >
        Gửi yêu cầu hủy
      </button>
    </section>
  )
}
