import type { FormEvent } from 'react'

import type { AiConversation } from '@/entities/ai/model/types'

interface AiChatPanelProps {
  conversation: AiConversation
  message: string
  hasRecommendation: boolean
  onMessageChange: (value: string) => void
  onSubmit: () => void
}

export function AiChatPanel({
  conversation,
  message,
  hasRecommendation,
  onMessageChange,
  onSubmit,
}: AiChatPanelProps) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit()
  }

  return (
    <section className="rounded-lg border border-[#E3DAD0] bg-white p-5 shadow-sm">
      <h2 className="font-display text-2xl font-semibold text-[#222222]">Trao đổi với AI</h2>
      <div className="mt-5 grid max-h-[420px] gap-3 overflow-y-auto pr-1">
        {conversation.messages.map(item => (
          <article
            key={item.id}
            className={`rounded-lg px-4 py-3 text-sm leading-6 ${
              item.role === 'assistant' ? 'bg-[#FAF8F5] text-[#3A3632]' : 'bg-[#684B5A] text-white'
            }`}
          >
            {item.body}
          </article>
        ))}
      </div>

      <form className="mt-5 grid gap-3" onSubmit={submit}>
        <label className="grid gap-2 text-sm font-semibold text-[#3A3632]">
          Tin nhắn cho AI Stylist
          <textarea
            value={message}
            onChange={event => onMessageChange(event.target.value)}
            className="min-h-28 rounded-lg border border-[#D8D0C6] bg-white px-3 py-3 text-sm font-medium leading-6 text-[#222222] outline-none transition focus:border-[#684B5A] focus:ring-2 focus:ring-[#684B5A]/20"
            placeholder="Ví dụ: Tôi cần outfit đi làm tối giản với áo và chân váy"
          />
        </label>
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#684B5A] px-4 text-sm font-semibold text-white transition hover:bg-[#563E4A] active:translate-y-px disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A]/30"
          disabled={!message.trim()}
        >
          {hasRecommendation ? 'Tạo lại gợi ý' : 'Gửi yêu cầu'}
        </button>
      </form>
    </section>
  )
}
