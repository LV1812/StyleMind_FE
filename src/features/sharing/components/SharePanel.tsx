import { useState } from 'react'

import type { Outfit } from '@/entities/outfit/model/types'
import type { OutfitShare } from '@/entities/share/model/types'

import { AccessList } from './AccessList'
import { PublicLinkControl } from './PublicLinkControl'

interface SharePanelProps {
  outfit: Outfit
  shares: OutfitShare[]
  onGrant: (email: string) => void
  onRevoke: (shareId: string) => void
  onTogglePublic: (enabled: boolean) => void
}

export function SharePanel({ outfit, shares, onGrant, onRevoke, onTogglePublic }: SharePanelProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const submit = () => {
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setError('Vui lòng nhập email hợp lệ')
      return
    }

    setError('')
    onGrant(normalizedEmail)
    setEmail('')
  }

  return (
    <section
      aria-label="Chia sẻ outfit"
      className="rounded-lg border border-[#E3DAD0] bg-white p-5 shadow-sm"
    >
      <h2 className="font-display text-2xl font-semibold text-[#222222]">Chia sẻ outfit</h2>
      <div className="mt-5 grid gap-4">
        <label className="grid gap-2 text-sm font-semibold text-[#3A3632]">
          Email được chia sẻ
          <input
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            className="min-h-11 rounded-lg border border-[#D8D0C6] bg-white px-3 text-sm font-medium text-[#222222] outline-none transition focus:border-[#684B5A] focus:ring-2 focus:ring-[#684B5A]/20"
            placeholder="banbe@example.com"
          />
        </label>
        {error && <p className="text-xs font-medium text-[#A94B4B]">{error}</p>}
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#684B5A] px-4 text-sm font-semibold text-white transition hover:bg-[#563E4A] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A]/30"
          onClick={submit}
        >
          Chia sẻ outfit
        </button>
        <AccessList shares={shares} onRevoke={onRevoke} />
        <PublicLinkControl outfit={outfit} onToggle={onTogglePublic} />
      </div>
    </section>
  )
}
