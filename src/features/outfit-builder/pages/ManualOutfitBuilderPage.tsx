import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { useDemoStore } from '@/app/store/DemoStoreProvider'
import { useAuth } from '@/features/auth'

import { BuilderCatalogPanel } from '../components/BuilderCatalogPanel'
import { BuilderDraftPanel } from '../components/BuilderDraftPanel'
import {
  createDraftItem,
  createManualOutfitDraft,
  draftToOutfit,
  validateOutfitDraft,
  type OutfitDraftErrors,
} from '../model/draftOutfit'

export function ManualOutfitBuilderPage() {
  const navigate = useNavigate()
  const { state, dispatch } = useDemoStore()
  const { currentUser } = useAuth()
  const ownerId = currentUser?.id ?? ''
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState(() => createManualOutfitDraft(ownerId))
  const [errors, setErrors] = useState<OutfitDraftErrors>({})
  const products = state.products.filter(product => product.active)

  useEffect(() => {
    if (!ownerId) return
    setDraft(previous => (previous.ownerId === ownerId ? previous : createManualOutfitDraft(ownerId)))
  }, [ownerId])

  if (!currentUser) return null

  const addVariant = (productId: string, variantId: string) => {
    setErrors(previous => ({ ...previous, items: undefined }))
    setDraft(previous => {
      const exists = previous.items.some(item => item.productId === productId && item.variantId === variantId)
      if (exists) return previous

      return {
        ...previous,
        items: [...previous.items, createDraftItem(productId, variantId, previous.items.length + 1)],
      }
    })
  }

  const changeName = (name: string) => {
    setErrors(previous => ({ ...previous, name: undefined }))
    setDraft(previous => ({ ...previous, name }))
  }

  const changeVariant = (itemId: string, variantId: string) => {
    setDraft(previous => ({
      ...previous,
      items: previous.items.map(item => (item.id === itemId ? { ...item, variantId } : item)),
    }))
  }

  const removeItem = (itemId: string) => {
    setDraft(previous => ({
      ...previous,
      items: previous.items.filter(item => item.id !== itemId),
    }))
  }

  const saveOutfit = () => {
    const nextErrors = validateOutfitDraft(draft)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const now = new Date().toISOString()
    const outfit = draftToOutfit(draft, now)
    dispatch({ type: 'outfit/created', payload: outfit })
    navigate(`/outfits/${outfit.id}`)
  }

  return (
    <section className="mx-auto grid max-w-[var(--container-wide)] gap-8 px-5 py-8 md:px-8 md:py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Link to={ROUTES.wardrobes} className="text-sm font-semibold text-[#684B5A] hover:underline">
            Tủ đồ
          </Link>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-[#222222]">
            Tạo outfit thủ công
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6F6B67]">
            Chọn sản phẩm thật trong catalog, đổi phiên bản theo màu hoặc size rồi lưu vào tủ đồ cá nhân.
          </p>
        </div>
        <Link
          to={ROUTES.outfitNewAi}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#684B5A] px-4 text-sm font-semibold text-white transition hover:bg-[#563E4A] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A]/30"
        >
          Chuyển sang AI Stylist
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <BuilderCatalogPanel
          products={products}
          search={search}
          onSearchChange={setSearch}
          onAddVariant={addVariant}
        />
        <BuilderDraftPanel
          draft={draft}
          products={products}
          errors={errors}
          onNameChange={changeName}
          onVariantChange={changeVariant}
          onRemoveItem={removeItem}
          onSave={saveOutfit}
        />
      </div>
    </section>
  )
}
