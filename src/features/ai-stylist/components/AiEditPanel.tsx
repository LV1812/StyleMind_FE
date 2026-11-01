import { useEffect, useState } from 'react'

import type { DemoDatabase } from '@/app/store/types'
import type { AiConversation } from '@/entities/ai/model/types'
import type { Outfit } from '@/entities/outfit/model/types'
import type { OutfitItemDetail } from '@/features/wardrobe/model/outfitSelectors'

import { appendUserMessage } from '../model/aiConversation'
import {
  applyOutfitChange,
  createEditConversation,
  proposalReply,
  proposeOutfitChange,
  type OutfitChangeProposal,
} from '../model/editOutfitWithAi'

interface AiEditPanelProps {
  database: DemoDatabase
  ownerId: string
  outfit: Outfit
  items: OutfitItemDetail[]
  onApply: (outfit: Outfit) => void
  onConversationUpsert: (conversation: AiConversation) => void
}

export function AiEditPanel({
  database,
  ownerId,
  outfit,
  items,
  onApply,
  onConversationUpsert,
}: AiEditPanelProps) {
  const [conversation, setConversation] = useState(() => createEditConversation(database, ownerId, outfit.id))
  const [request, setRequest] = useState('')
  const [proposal, setProposal] = useState<OutfitChangeProposal | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    setConversation(createEditConversation(database, ownerId, outfit.id))
    setProposal(null)
  }, [ownerId, outfit.id, outfit.updatedAt])

  const submitRequest = () => {
    const trimmed = request.trim()
    if (!trimmed) return

    const userMessageAt = new Date().toISOString()
    const assistantReplyAt = new Date(Date.parse(userMessageAt) + 1).toISOString()
    const withUserMessage = appendUserMessage(conversation, trimmed, userMessageAt)
    const nextProposal = proposeOutfitChange(database, withUserMessage)
    const withAssistantReply = proposalReply(withUserMessage, nextProposal, assistantReplyAt)

    setConversation(withAssistantReply)
    setProposal(nextProposal)
    setStatus('')
    setRequest('')
    onConversationUpsert(withAssistantReply)
  }

  const applyProposal = () => {
    if (!proposal) return

    const updatedOutfit = applyOutfitChange(outfit, proposal, new Date().toISOString())
    onApply(updatedOutfit)
    setStatus('Đã áp dụng đề xuất AI')
    setProposal(null)
  }

  return (
    <section
      aria-label="AI chỉnh outfit"
      className="rounded-lg border border-[#E3DAD0] bg-white p-5 shadow-sm"
    >
      <h2 className="font-display text-2xl font-semibold text-[#222222]">AI chỉnh outfit</h2>
      <p className="mt-2 text-sm leading-6 text-[#6F6B67]">
        AI đọc các món hiện có và đề xuất thêm hoặc thay một món bằng sản phẩm đang hoạt động.
      </p>

      <div className="mt-4 rounded-lg bg-[#FAF8F5] p-4">
        <p className="text-sm font-semibold text-[#3A3632]">Outfit hiện tại</p>
        <ul className="mt-3 grid gap-2 text-sm text-[#6F6B67]">
          {items.map(item => (
            <li key={item.item.id}>{item.product.name}</li>
          ))}
        </ul>
      </div>

      <label className="mt-4 grid gap-2 text-sm font-semibold text-[#3A3632]">
        Yêu cầu chỉnh outfit
        <textarea
          value={request}
          onChange={event => setRequest(event.target.value)}
          className="min-h-24 rounded-lg border border-[#D8D0C6] bg-white px-3 py-3 text-sm font-medium leading-6 text-[#222222] outline-none transition focus:border-[#684B5A] focus:ring-2 focus:ring-[#684B5A]/20"
          placeholder="Ví dụ: Thay áo blouse bằng áo sơ mi trắng"
        />
      </label>
      <button
        type="button"
        className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg bg-[#684B5A] px-3 text-sm font-semibold text-white transition hover:bg-[#563E4A] active:translate-y-px disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A]/30"
        disabled={!request.trim()}
        onClick={submitRequest}
      >
        Đề xuất thay đổi
      </button>

      {proposal && (
        <div className="mt-4 rounded-lg bg-[#F4E7E8] p-4">
          <p className="text-sm font-semibold text-[#684B5A]">{proposal.reason}</p>
          <button
            type="button"
            className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg bg-[#684B5A] px-3 text-sm font-semibold text-white transition hover:bg-[#563E4A] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A]/30"
            onClick={applyProposal}
          >
            Áp dụng đề xuất
          </button>
        </div>
      )}

      {status && <p className="mt-4 text-sm font-semibold text-[#2F7D4E]">{status}</p>}
    </section>
  )
}
