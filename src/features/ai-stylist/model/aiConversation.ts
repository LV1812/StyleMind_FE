import type { DemoDatabase } from '@/app/store/types'
import type { AiConversation, AiMessage, OutfitRequirement } from '@/entities/ai/model/types'

import { recommendOutfit } from './recommendOutfit'

export const ASSISTANT_INTRO =
  'Mình là AI Stylist của StyleMind. Hãy nói dịp mặc, phong cách hoặc món bạn muốn phối.'

function timestampId(prefix: string, now: string) {
  const parsedTime = Date.parse(now)
  const stamp = Number.isFinite(parsedTime) ? parsedTime : Date.now()
  return `${prefix}-${stamp}`
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function assistantMessage(body: string, now: string): AiMessage {
  return {
    id: timestampId('ai-assistant-message', now),
    role: 'assistant',
    body,
    createdAt: now,
  }
}

export function appendAssistantMessage(conversation: AiConversation, body: string, now: string): AiConversation {
  return {
    ...conversation,
    messages: [...conversation.messages, assistantMessage(body, now)],
    updatedAt: now,
  }
}

function userMessage(body: string, now: string): AiMessage {
  return {
    id: timestampId('ai-user-message', now),
    role: 'user',
    body,
    createdAt: now,
  }
}

function inferRequirement(body: string, previous: OutfitRequirement): OutfitRequirement {
  const text = normalize(body)
  const next: OutfitRequirement = { ...previous, additionalNotes: body }
  const categories: string[] = []

  if (text.includes('di lam') || text.includes('cong so')) next.occasion = 'work'
  if (text.includes('cuoi tuan') || text.includes('cafe')) next.occasion = 'weekend'
  if (text.includes('hen ho')) next.occasion = 'date'
  if (text.includes('tiec')) next.occasion = 'party'

  if (text.includes('toi gian')) next.style = 'minimal'
  if (text.includes('nu tinh')) next.style = 'feminine'
  if (text.includes('thanh lich')) next.style = 'classic'
  if (text.includes('nang dong')) next.style = 'casual'
  if (text.includes('thoai mai')) next.style = 'relaxed'
  if (text.includes('buoi toi')) next.style = 'evening'

  if (text.includes('ao')) categories.push('tops')
  if (text.includes('quan')) categories.push('pants')
  if (text.includes('chan vay') || text.includes('vay')) categories.push('skirts')
  if (text.includes('dam')) categories.push('dresses')
  if (text.includes('blazer') || text.includes('ao khoac')) categories.push('outerwear')

  if (categories.length > 0) {
    if (categories.includes('skirts') && previous.desiredCategories?.includes('tops') && !categories.includes('tops')) {
      categories.unshift('tops')
    }
    next.desiredCategories = [...new Set(categories)]
  }

  return next
}

export function createInitialAiConversation(ownerId: string, now = new Date().toISOString()): AiConversation {
  return {
    id: timestampId(`ai-create-${ownerId}`, now),
    ownerId,
    mode: 'create',
    messages: [assistantMessage(ASSISTANT_INTRO, now)],
    requirement: {},
    createdAt: now,
    updatedAt: now,
  }
}

export function appendUserMessage(conversation: AiConversation, body: string, now: string): AiConversation {
  return {
    ...conversation,
    messages: [...conversation.messages, userMessage(body, now)],
    requirement: inferRequirement(body, conversation.requirement),
    updatedAt: now,
  }
}

export function createAssistantReply(
  database: DemoDatabase,
  conversation: AiConversation,
  now: string,
): AiConversation {
  const hadRecommendation = Boolean(conversation.recommendation)
  const recommendation = recommendOutfit(database, {
    ownerId: conversation.ownerId,
    requirement: conversation.requirement,
  })

  const withAssistantReply = appendAssistantMessage(
    conversation,
    hadRecommendation
      ? 'Mình đã tạo lại outfit theo phản hồi của bạn.'
      : 'Mình đã chọn các món đang hoạt động trong catalog cho bạn.',
    now,
  )

  return {
    ...withAssistantReply,
    recommendation,
  }
}
