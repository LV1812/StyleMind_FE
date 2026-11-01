import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { useDemoStore } from '@/app/store/DemoStoreProvider'
import type { AiConversation } from '@/entities/ai/model/types'
import type { Outfit } from '@/entities/outfit/model/types'
import { AiEditPanel } from '@/features/ai-stylist/components/AiEditPanel'
import { useAuth } from '@/features/auth'
import { canViewSharedOutfit } from '@/features/sharing/model/shareSelectors'
import { formatCurrency } from '@/shared/lib/formatCurrency'
import { formatDate } from '@/shared/lib/formatDate'

import { OutfitItemCard } from '../components/OutfitItemCard'
import {
  selectOutfitDetail,
  type OutfitDetail,
  type OutfitItemDetail,
  type UnavailableOutfitItemDetail,
} from '../model/outfitSelectors'

function updatedOutfit(outfit: Outfit, patch: Partial<Outfit>): Outfit {
  return {
    ...outfit,
    ...patch,
    updatedAt: new Date().toISOString(),
  }
}

function ReadOnlySharedOutfit({ detail }: { detail: OutfitDetail }) {
  return (
    <section className="mx-auto grid max-w-[var(--container-wide)] gap-8 px-5 py-8 md:px-8 md:py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-3xl">
          <Link to={ROUTES.sharedWithMe} className="text-sm font-semibold text-[#684B5A] hover:underline">
            Được chia sẻ với tôi
          </Link>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-[#222222]">{detail.outfit.name}</h1>
          {detail.outfit.description && <p className="mt-3 text-sm leading-6 text-[#6F6B67]">{detail.outfit.description}</p>}
        </div>
        <div className="rounded-lg border border-[#E3DAD0] bg-white px-4 py-3 text-sm font-semibold text-[#3A3632] shadow-sm">
          Được chia sẻ
        </div>
      </div>

      <section aria-label="Các món trong outfit được chia sẻ" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {detail.items.map(item => (
          <Link
            key={item.item.id}
            to={`/products/${item.product.id}`}
            className="overflow-hidden rounded-lg border border-[#E3DAD0] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A]"
          >
            {item.image && <img src={item.image.url} alt={item.image.alt} className="aspect-[4/5] w-full object-cover" />}
            <div className="p-4">
              <h2 className="font-semibold text-[#222222]">{item.product.name}</h2>
              <p className="mt-1 text-sm text-[#6F6B67]">
                {item.variant.color} · {item.variant.size}
              </p>
              <p className="mt-3 font-semibold text-[#222222]">{formatCurrency(item.price)}</p>
            </div>
          </Link>
        ))}
      </section>
    </section>
  )
}

function UnavailableOutfitItemRow({ item }: { item: UnavailableOutfitItemDetail }) {
  return (
    <article className="rounded-lg border border-dashed border-[#D8D0C6] bg-white p-4 shadow-sm">
      <h2 className="font-semibold text-[#222222]">{item.name}</h2>
      {item.variant && (
        <p className="mt-1 text-sm text-[#6F6B67]">
          {item.variant.color} · {item.variant.size}
        </p>
      )}
      <p className="mt-3 text-sm font-semibold text-[#A94B4B]">{item.reason}</p>
      <button
        type="button"
        disabled
        className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-[#EEE8E1] px-3 text-sm font-semibold text-[#6F6B67] opacity-70"
      >
        Không thể thêm vào giỏ
      </button>
    </article>
  )
}

export function OutfitDetailPage() {
  const { outfitId } = useParams()
  const { state, dispatch } = useDemoStore()
  const { currentUser } = useAuth()
  const detail = outfitId ? selectOutfitDetail(state, outfitId) : null
  const [nameDraft, setNameDraft] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (detail?.outfit.name) setNameDraft(detail.outfit.name)
  }, [detail?.outfit.name])

  if (!currentUser) return null

  const isOwner = detail?.outfit.ownerId === currentUser.id
  const isSharedViewer = detail ? canViewSharedOutfit(state, detail.outfit.id, currentUser.email) : false

  if (!detail || (!isOwner && !isSharedViewer)) {
    return (
      <section className="mx-auto max-w-[var(--container-wide)] px-5 py-10 md:px-8">
        <Link to={ROUTES.wardrobes} className="text-sm font-semibold text-[#684B5A] hover:underline">
          Tủ đồ
        </Link>
        <h1 className="mt-4 font-display text-4xl font-semibold text-[#222222]">Không tìm thấy outfit</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[#6F6B67]">
          Outfit này không tồn tại hoặc bạn không có quyền xem.
        </p>
      </section>
    )
  }

  if (!isOwner) {
    return <ReadOnlySharedOutfit detail={detail} />
  }

  const cartSource = detail.outfit.source === 'ai' ? 'ai' : 'shop'

  const saveName = () => {
    const trimmed = nameDraft.trim()
    if (!trimmed) return

    dispatch({
      type: 'outfit/updated',
      payload: updatedOutfit(detail.outfit, { name: trimmed }),
    })
    setMessage('Đã đổi tên outfit')
  }

  const removeItem = (itemId: string) => {
    dispatch({ type: 'outfit/itemRemoved', payload: { outfitId: detail.outfit.id, itemId } })
    setMessage('Đã xóa món khỏi outfit')
  }

  const changeVariant = (itemId: string, variantId: string) => {
    const item = detail.items.find(candidate => candidate.item.id === itemId)
    const activeVariant = item?.product.variants.find(variant => variant.id === variantId && variant.active)
    if (!item || !activeVariant) return

    dispatch({
      type: 'outfit/itemUpdated',
      payload: {
        outfitId: detail.outfit.id,
        itemId,
        item: { variantId },
      },
    })
    setMessage('Đã cập nhật phiên bản')
  }

  const addItemToCart = (item: OutfitItemDetail) => {
    dispatch({
      type: 'cart/lineAdded',
      payload: {
        productId: item.product.id,
        variantId: item.variant.id,
        quantity: 1,
        source: cartSource,
      },
    })
    setMessage('Đã thêm món vào giỏ hàng')
  }

  const addOutfitToCart = () => {
    detail.items.forEach(item => {
      dispatch({
        type: 'cart/lineAdded',
        payload: {
          productId: item.product.id,
          variantId: item.variant.id,
          quantity: 1,
          source: cartSource,
        },
      })
    })

    if (detail.unavailableItems.length > 0) {
      setMessage(`Đã thêm các món còn khả dụng vào giỏ. Bỏ qua ${detail.unavailableItems.map(item => item.name).join(', ')}.`)
      return
    }

    setMessage('Đã thêm toàn bộ outfit vào giỏ hàng')
  }

  const applyAiOutfit = (outfit: Outfit) => {
    dispatch({ type: 'outfit/updated', payload: outfit })
  }

  const saveAiConversation = (conversation: AiConversation) => {
    dispatch({ type: 'ai/conversationUpserted', payload: conversation })
  }

  return (
    <section className="mx-auto grid max-w-[var(--container-wide)] gap-8 px-5 py-8 md:px-8 md:py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-3xl">
          <Link to={ROUTES.wardrobes} className="text-sm font-semibold text-[#684B5A] hover:underline">
            Tủ đồ
          </Link>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-[#222222]">{detail.outfit.name}</h1>
          {detail.outfit.description && <p className="mt-3 text-sm leading-6 text-[#6F6B67]">{detail.outfit.description}</p>}
          <p className="mt-3 text-sm text-[#8A8179]">Cập nhật {formatDate(detail.outfit.updatedAt)}</p>
        </div>
        <div className="rounded-lg border border-[#E3DAD0] bg-white px-4 py-3 text-sm font-semibold text-[#3A3632] shadow-sm">
          {detail.outfit.visibility === 'public' ? 'Đang công khai' : 'Riêng tư'}
        </div>
      </div>

      {message && (
        <p className="rounded-lg border border-[#E3DAD0] bg-white px-4 py-3 text-sm font-semibold text-[#2F7D4E]">
          {message}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="grid gap-4 md:grid-cols-2">
          {detail.items.map(item => (
            <OutfitItemCard
              key={item.item.id}
              database={state}
              item={item}
              onVariantChange={changeVariant}
              onRemove={removeItem}
              onAddToCart={addItemToCart}
            />
          ))}
          {detail.unavailableItems.map(item => (
            <UnavailableOutfitItemRow key={item.item.id} item={item} />
          ))}
        </section>

        <aside className="grid h-fit gap-4">
          <section className="rounded-lg border border-[#E3DAD0] bg-white p-5 shadow-sm">
            <h2 className="font-display text-2xl font-semibold text-[#222222]">Tóm tắt outfit</h2>
            <dl className="mt-5 grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[#6F6B67]">Số món</dt>
                <dd className="font-semibold text-[#222222]">{detail.outfit.items.length}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[#6F6B67]">Nguồn</dt>
                <dd className="font-semibold text-[#222222]">{detail.outfit.source === 'ai' ? 'AI Stylist' : 'Thủ công'}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[#6F6B67]">Tổng giá</dt>
                <dd className="font-semibold text-[#222222]">{formatCurrency(detail.total)}</dd>
              </div>
            </dl>
            <button
              type="button"
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#684B5A] px-4 text-sm font-semibold text-white disabled:opacity-60"
              disabled={detail.items.length === 0}
              onClick={addOutfitToCart}
            >
              Thêm toàn bộ outfit vào giỏ
            </button>
          </section>

          <section className="rounded-lg border border-[#E3DAD0] bg-white p-5 shadow-sm">
            <h2 className="font-display text-2xl font-semibold text-[#222222]">Chỉnh tên</h2>
            <label className="mt-4 grid gap-2 text-sm font-semibold text-[#3A3632]">
              Tên outfit
              <input
                value={nameDraft}
                onChange={event => setNameDraft(event.target.value)}
                className="min-h-11 rounded-lg border border-[#D8D0C6] bg-white px-3 text-sm font-medium text-[#222222] outline-none focus:border-[#684B5A] focus:ring-2 focus:ring-[#684B5A]/20"
              />
            </label>
            <button
              type="button"
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#EEE8E1] px-4 text-sm font-semibold text-[#222222]"
              onClick={saveName}
            >
              Lưu tên outfit
            </button>
          </section>

          <AiEditPanel
            database={state}
            ownerId={currentUser.id}
            outfit={detail.outfit}
            items={detail.items}
            onApply={applyAiOutfit}
            onConversationUpsert={saveAiConversation}
          />
        </aside>
      </div>
    </section>
  )
}
