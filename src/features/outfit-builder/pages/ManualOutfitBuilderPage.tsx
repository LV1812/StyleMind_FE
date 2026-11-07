import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { useDemoStore } from '@/app/store/DemoStoreProvider'
import { useAuth } from '@/features/auth'
import { loadAllCommerceProducts } from '@/features/commerce/data/loadCommerceProducts'
import { commerceProductToEntity } from '@/features/commerce/data/commerceEntityAdapters'
import type { Product } from '@/entities/product/model/types'
import { communityApi } from '@/shared/api/communityApi'
import { apiMode } from '@/shared/api/http'

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
  const realMode = apiMode()
  const [catalog, setCatalog] = useState<Product[]>([])
  const [catalogLoading, setCatalogLoading] = useState(realMode)
  const [catalogError, setCatalogError] = useState('')
  const [catalogRevision, setCatalogRevision] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const savingLock = useRef(false)
  const activeOwner = useRef(ownerId)
  activeOwner.current = ownerId
  const products = (realMode ? catalog : state.products).filter(product => product.active)

  useEffect(() => {
    if (!realMode) return
    let active = true
    setCatalogLoading(true); setCatalogError('')
    void loadAllCommerceProducts().then(items => {
      if (active) setCatalog(items.map(commerceProductToEntity))
    }).catch(() => {
      if (active) setCatalogError('Không tải được sản phẩm. Vui lòng thử lại.')
    }).finally(() => { if (active) setCatalogLoading(false) })
    return () => { active = false }
  }, [realMode, catalogRevision])

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

  const saveOutfit = async () => {
    if (savingLock.current) return
    const nextErrors = validateOutfitDraft(draft)
    if (realMode && [...draft.name.trim()].length > 100) nextErrors.name = 'Tên outfit tối đa 100 ký tự'
    if (realMode && draft.items.length > 10) nextErrors.items = 'Mỗi outfit tối đa 10 món'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    if (realMode) {
      savingLock.current = true; setSaving(true); setSaveError('')
      try {
        const created = await communityApi.createOutfit(draft.name.trim(), draft.items.map(item => item.variantId))
        if (activeOwner.current === ownerId) navigate(`/outfits/${created.outfit_id}`)
      } catch (error) {
        if (activeOwner.current === ownerId) setSaveError(error instanceof Error ? error.message : 'Không lưu được outfit. Vui lòng thử lại.')
      } finally { savingLock.current = false; setSaving(false) }
      return
    }
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
        {catalogError ? <div role="alert" className="rounded-lg border bg-white p-5">{catalogError} <button type="button" className="underline" onClick={() => setCatalogRevision(value => value + 1)}>Thử lại</button></div> : catalogLoading ? <p role="status">Đang tải sản phẩm…</p> : <BuilderCatalogPanel
          products={products}
          search={search}
          onSearchChange={setSearch}
          onAddVariant={addVariant}
        />}
        <div>
        {saveError && <p role="alert" className="mb-3 text-sm text-[#A94B4B]">{saveError}</p>}
        <BuilderDraftPanel
          draft={draft}
          products={products}
          errors={errors}
          onNameChange={changeName}
          onVariantChange={changeVariant}
          onRemoveItem={removeItem}
          onSave={() => void saveOutfit()}
          saving={saving}
        />
        </div>
      </div>
    </section>
  )
}
