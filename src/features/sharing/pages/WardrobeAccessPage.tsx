import { MessageCircle, RotateCcw, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { useDemoStore } from '@/app/store/DemoStoreProvider'
import { useAuth } from '@/features/auth'
import { chatSessionId, upsertableChatSession } from '@/features/messages/model/chatSelectors'
import { Button } from '@/shared/ui'

import { getWardrobeSettings, getWardrobeVisibilityLabel, selectWardrobeOutfits, selectWardrobeSharesForOwner } from '../model/shareSelectors'

function accessStatus(active: boolean, visibility: string) {
  if (!active) return { label: 'Đã thu hồi', className: 'bg-[#FCEAEA] text-[#A94B4B]' }
  if (visibility === 'private') return { label: 'Tạm khóa do tủ đồ riêng tư', className: 'bg-[#FFF3D8] text-[#8A5A00]' }
  return { label: 'Đang được chia sẻ', className: 'bg-[#EAF2EC] text-[#2F7D4E]' }
}

export function WardrobeAccessPage() {
  const { state, dispatch } = useDemoStore()
  const { currentUser } = useAuth()

  if (!currentUser) return null

  const settings = getWardrobeSettings(state, currentUser.id)
  const shares = selectWardrobeSharesForOwner(state, currentUser.id)
  const outfitCount = selectWardrobeOutfits(state, currentUser.id).length

  const revoke = (shareId: string, email: string) => {
    dispatch({ type: 'wardrobeShare/revoked', payload: { shareId } })
    state.outfitShares
      .filter(share => share.ownerId === currentUser.id && share.viewerEmail.toLowerCase() === email.toLowerCase() && share.active)
      .forEach(share => dispatch({ type: 'share/revoked', payload: { shareId: share.id } }))
  }

  const restore = (shareId: string, email: string) => {
    const restoredAt = new Date().toISOString()
    dispatch({ type: 'wardrobeShare/restored', payload: { shareId, restoredAt } })
    dispatch({ type: 'chat/sessionUpserted', payload: upsertableChatSession(currentUser.id, email, restoredAt) })
  }

  return (
    <section className="mx-auto grid max-w-[var(--container-wide)] gap-8 px-5 py-8 md:px-8 md:py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Link to={ROUTES.wardrobes} className="text-sm font-semibold text-[#684B5A] hover:underline">
            Tủ đồ
          </Link>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-[#222222]">Quyền truy cập</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6F6B67]">
            Quản lý những email đang được xem tủ đồ và quyền chat với bạn.
          </p>
        </div>
        <div className="rounded-lg border border-[#E3DAD0] bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold text-[#6F6B67]">Chế độ hiện tại</p>
          <p className="mt-1 font-semibold text-[#222222]">{getWardrobeVisibilityLabel(settings.visibility)}</p>
        </div>
      </div>

      {shares.length > 0 ? (
        <section className="overflow-hidden rounded-lg border border-[#E3DAD0] bg-white shadow-sm">
          <div className="grid grid-cols-[minmax(220px,1.2fr)_120px_minmax(180px,1fr)_140px_minmax(210px,auto)] gap-3 border-b border-[#EEE8E1] bg-[#FAF8F5] px-4 py-3 text-xs font-semibold text-[#6F6B67] max-lg:hidden">
            <span>Email</span>
            <span>Quyền</span>
            <span>Trạng thái</span>
            <span>Chat</span>
            <span>Hành động</span>
          </div>
          <div className="divide-y divide-[#EEE8E1]">
            {shares.map(share => {
              const status = accessStatus(share.active, settings.visibility)
              const canChat = share.active && settings.visibility !== 'private'
              const conversationId = chatSessionId(currentUser.id, share.viewerEmail)

              return (
                <article
                  key={share.id}
                  className="grid gap-3 px-4 py-4 lg:grid-cols-[minmax(220px,1.2fr)_120px_minmax(180px,1fr)_140px_minmax(210px,auto)] lg:items-center"
                >
                  <div>
                    <p className="font-semibold text-[#222222]">{share.viewerEmail}</p>
                    <p className="mt-1 text-xs text-[#8A8179]">Cấp quyền từ {new Date(share.createdAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <span className="text-sm font-semibold text-[#222222]">Xem</span>
                  <span className={`w-fit rounded-md px-2 py-1 text-xs font-semibold ${status.className}`}>
                    {status.label}
                  </span>
                  <span className="text-sm font-semibold text-[#222222]">{canChat ? 'Có thể chat' : 'Đang khóa'}</span>
                  <div className="flex flex-wrap gap-2">
                    {share.active ? (
                      <Button
                        type="button"
                        variant="danger"
                        className="min-h-10 px-3"
                        icon={<Trash2 size={15} aria-hidden="true" />}
                        onClick={() => revoke(share.id, share.viewerEmail)}
                      >
                        Thu hồi
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        className="min-h-10 px-3"
                        icon={<RotateCcw size={15} aria-hidden="true" />}
                        onClick={() => restore(share.id, share.viewerEmail)}
                      >
                        Chia sẻ lại
                      </Button>
                    )}
                    <Link
                      to={`${ROUTES.messages}?conversation=${conversationId}`}
                      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A] ${
                        canChat ? 'bg-[#EEE8E1] text-[#222222] hover:bg-[#E4DCD2]' : 'pointer-events-none bg-[#EEE8E1] text-[#8A8179]'
                      }`}
                      aria-disabled={!canChat}
                    >
                      <MessageCircle size={15} aria-hidden="true" />
                      Mở chat
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ) : (
        <section className="rounded-lg border border-dashed border-[#D8D0C6] bg-white p-8">
          <h2 className="font-display text-2xl font-semibold text-[#222222]">Chưa có người được chia sẻ</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6F6B67]">
            Mở tủ đồ và dùng nút Chia sẻ tủ đồ để cấp quyền xem cho email đầu tiên.
          </p>
        </section>
      )}

      <p className="text-sm leading-6 text-[#6F6B67]">
        Tủ đồ hiện có {outfitCount} outfit. Người được chia sẻ bằng email sẽ tự động thấy outfit mới nếu quyền còn hiệu lực và tủ đồ không ở chế độ riêng tư.
      </p>
    </section>
  )
}
