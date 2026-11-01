import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { useDemoStore } from '@/app/store/DemoStoreProvider'
import type { Outfit } from '@/entities/outfit/model/types'
import { useAuth } from '@/features/auth'

import { AiChatPanel } from '../components/AiChatPanel'
import { AiRecommendationPanel } from '../components/AiRecommendationPanel'
import { BodyInfoCapture } from '../components/BodyInfoCapture'
import {
  appendUserMessage,
  createAssistantReply,
  createInitialAiConversation,
} from '../model/aiConversation'

function timestampId(prefix: string, now: string) {
  const parsedTime = Date.parse(now)
  const stamp = Number.isFinite(parsedTime) ? parsedTime : Date.now()
  return `${prefix}-${stamp}`
}

function withoutRecommendation(conversation: ReturnType<typeof createInitialAiConversation>): ReturnType<typeof createInitialAiConversation> {
  const { recommendation: _recommendation, ...draftConversation } = conversation
  return draftConversation
}

export function AiStylistCreatePage() {
  const navigate = useNavigate()
  const { state, dispatch } = useDemoStore()
  const { currentUser } = useAuth()
  const ownerId = currentUser?.id ?? ''
  const [conversation, setConversation] = useState(() => createInitialAiConversation(ownerId))
  const [message, setMessage] = useState('')
  const [outfitName, setOutfitName] = useState('')
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (!ownerId) return
    setConversation(previous => (previous.ownerId === ownerId ? previous : createInitialAiConversation(ownerId)))
  }, [ownerId])

  if (!currentUser) return null

  const saveBodyInfo = (heightCm: number, weightKg: number) => {
    dispatch({
      type: 'user/profileUpdated',
      payload: {
        userId: currentUser.id,
        heightCm,
        weightKg,
      },
    })
  }

  const submitMessage = () => {
    const trimmed = message.trim()
    if (!trimmed) return

    const userMessageAt = new Date().toISOString()
    const assistantReplyAt = new Date(Date.parse(userMessageAt) + 1).toISOString()
    const withUserMessage = appendUserMessage(conversation, trimmed, userMessageAt)
    const withAssistantReply = createAssistantReply(state, withUserMessage, assistantReplyAt)

    setConversation(withAssistantReply)
    dispatch({ type: 'ai/conversationUpserted', payload: withoutRecommendation(withAssistantReply) })
    setMessage('')
  }

  const saveOutfit = () => {
    if (!conversation.recommendation) return

    const trimmedName = outfitName.trim()
    if (!trimmedName) {
      setSaveError('Vui lòng đặt tên outfit')
      return
    }

    const now = new Date().toISOString()
    const outfit: Outfit = {
      id: timestampId('outfit-ai', now),
      ownerId: currentUser.id,
      name: trimmedName,
      description: conversation.requirement.additionalNotes
        ? `AI Stylist tạo từ yêu cầu: ${conversation.requirement.additionalNotes}`
        : 'AI Stylist tạo outfit từ catalog StyleMind.',
      source: 'ai',
      visibility: 'private',
      items: conversation.recommendation.items.map((item, index) => ({
        id: `outfit-ai-item-${Date.parse(now)}-${index + 1}`,
        productId: item.productId,
        variantId: item.variantId,
        addedBy: 'ai',
        note: item.reason,
      })),
      createdAt: now,
      updatedAt: now,
    }

    dispatch({ type: 'outfit/created', payload: outfit })
    dispatch({ type: 'ai/conversationUpserted', payload: conversation })
    navigate(`/outfits/${outfit.id}`)
  }

  return (
    <section className="mx-auto grid max-w-[var(--container-wide)] gap-8 px-5 py-8 md:px-8 md:py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Link to={ROUTES.wardrobes} className="text-sm font-semibold text-[#684B5A] hover:underline">
            Tủ đồ
          </Link>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-[#222222]">AI Stylist</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6F6B67]">
            Trò chuyện với AI để tạo outfit từ sản phẩm thật đang hoạt động trong catalog StyleMind.
          </p>
        </div>
        <Link
          to={ROUTES.outfitNew}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#EEE8E1] px-4 text-sm font-semibold text-[#222222] transition hover:bg-[#E3DAD0] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A]/30"
        >
          Tạo tủ đồ
        </Link>
      </div>

      {(!currentUser.heightCm || !currentUser.weightKg) && (
        <BodyInfoCapture user={currentUser} onSave={saveBodyInfo} />
      )}

      <div className="grid gap-5 lg:grid-cols-[420px_minmax(0,1fr)]">
        <AiChatPanel
          conversation={conversation}
          message={message}
          hasRecommendation={Boolean(conversation.recommendation)}
          onMessageChange={setMessage}
          onSubmit={submitMessage}
        />
        <AiRecommendationPanel
          database={state}
          recommendation={conversation.recommendation}
          outfitName={outfitName}
          error={saveError}
          onNameChange={value => {
            setSaveError('')
            setOutfitName(value)
          }}
          onSave={saveOutfit}
        />
      </div>
    </section>
  )
}
