import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { useDemoStore } from '@/app/store/DemoStoreProvider'
import { identityApi, identityErrorMessage, type StyleProfilePayload } from '@/shared/api/identityApi'
import { apiMode } from '@/shared/api/http'
import { Button } from '@/shared/ui'
import { useAuth } from '@/features/auth'

import { BodyInfoForm } from '../components/BodyInfoForm'
import { ProfileForm } from '../components/ProfileForm'
import {
  hasErrors,
  validateProfileInput,
  validateStyleProfileInput,
  type FieldErrors,
  type ProfileInput,
  type StyleProfileInput,
} from '../model/validators'

const emptyStyleProfile: StyleProfileInput = {
  fitPreference: '',
  heightCm: '',
  weightKg: '',
  usualTopSize: '',
  usualBottomSize: '',
  shoeSize: '',
  styleCodes: '',
  colorCodes: '',
  brandIds: '',
}

function csvValues(value: string): string[] {
  return value.split(',').map(item => item.trim()).filter(Boolean)
}

function nullableNumber(value: string): number | null {
  return value.trim() ? Number(value) : null
}

function profilePayload(value: StyleProfileInput): StyleProfilePayload {
  return {
    fit_preference: value.fitPreference.trim() || null,
    height_cm: nullableNumber(value.heightCm),
    weight_kg: nullableNumber(value.weightKg),
    usual_top_size: value.usualTopSize.trim() || null,
    usual_bottom_size: value.usualBottomSize.trim() || null,
    shoe_size: value.shoeSize.trim() || null,
    style_codes: csvValues(value.styleCodes),
    color_codes: csvValues(value.colorCodes),
    brand_ids: csvValues(value.brandIds),
  }
}

export function AccountPage() {
  const { state } = useDemoStore()
  const auth = useAuth()
  const currentUser = auth.currentUser
  const userId = currentUser?.id ?? ''
  const [profileDraft, setProfileDraft] = useState<ProfileInput>({ displayName: '' })
  const [styleDraft, setStyleDraft] = useState<StyleProfileInput>(emptyStyleProfile)
  const [profileErrors, setProfileErrors] = useState<FieldErrors<ProfileInput>>({})
  const [styleErrors, setStyleErrors] = useState<FieldErrors<StyleProfileInput>>({})
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingStyle, setSavingStyle] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [loadVersion, setLoadVersion] = useState(0)
  const [profileMessage, setProfileMessage] = useState('')
  const [styleMessage, setStyleMessage] = useState('')
  const [addressCount, setAddressCount] = useState(0)

  useEffect(() => {
    if (!userId) return
    let active = true
    setLoading(true)
    setLoadError('')
    void Promise.all([identityApi.getMyProfile(), identityApi.getStyleProfile(), identityApi.listAddresses()])
      .then(([profile, style, addresses]) => {
        if (!active) return
        setProfileDraft({ displayName: profile.profile?.display_name ?? currentUser?.fullName ?? '' })
        setAddressCount(addresses.addresses.length)
        const value = style.style_profile
        setStyleDraft(value ? {
          fitPreference: value.fit_preference ?? '',
          heightCm: value.height_cm == null ? '' : String(value.height_cm),
          weightKg: value.weight_kg == null ? '' : String(value.weight_kg),
          usualTopSize: value.usual_top_size ?? '',
          usualBottomSize: value.usual_bottom_size ?? '',
          shoeSize: value.shoe_size ?? '',
          styleCodes: value.style_codes.join(', '),
          colorCodes: value.color_codes.join(', '),
          brandIds: value.brand_ids.join(', '),
        } : emptyStyleProfile)
      })
      .catch(error => {
        if (active) setLoadError(identityErrorMessage(error, 'Không thể tải thông tin tài khoản.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [userId, loadVersion])

  if (!currentUser) return null

  const orders = state.orders.filter(order => order.userId === currentUser.id)
  const outfits = state.outfits.filter(outfit => outfit.ownerId === currentUser.id)
  const unreadCount = state.notifications.filter(item => item.userId === currentUser.id && !item.read).length

  const handleProfileSave = async () => {
    const nextErrors = validateProfileInput(profileDraft)
    setProfileErrors(nextErrors)
    setProfileMessage('')
    if (hasErrors(nextErrors)) return

    setSavingProfile(true)
    try {
      await auth.updateDisplayName(profileDraft.displayName.trim())
      setProfileMessage('Đã cập nhật hồ sơ cá nhân.')
    } catch (error) {
      setProfileMessage(identityErrorMessage(error, 'Không thể cập nhật hồ sơ.'))
    } finally {
      setSavingProfile(false)
    }
  }

  const handleStyleSave = async () => {
    const nextErrors = validateStyleProfileInput(styleDraft)
    setStyleErrors(nextErrors)
    setStyleMessage('')
    if (hasErrors(nextErrors)) return

    setSavingStyle(true)
    try {
      const saved = await auth.updateStyleProfile(profilePayload(styleDraft))
      const value = saved.style_profile
      if (value) {
        setStyleDraft({
          fitPreference: value.fit_preference ?? '',
          heightCm: value.height_cm == null ? '' : String(value.height_cm),
          weightKg: value.weight_kg == null ? '' : String(value.weight_kg),
          usualTopSize: value.usual_top_size ?? '',
          usualBottomSize: value.usual_bottom_size ?? '',
          shoeSize: value.shoe_size ?? '',
          styleCodes: value.style_codes.join(', '),
          colorCodes: value.color_codes.join(', '),
          brandIds: value.brand_ids.join(', '),
        })
      }
      setStyleMessage('Đã cập nhật thông tin vóc dáng và phong cách.')
    } catch (error) {
      setStyleMessage(identityErrorMessage(error, 'Không thể cập nhật thông tin phong cách.'))
    } finally {
      setSavingStyle(false)
    }
  }

  return (
    <section className="mx-auto grid max-w-5xl gap-8 px-5 py-10 md:px-8 md:py-12">
      <div className="flex flex-col gap-4 border-b border-[#E3E2E2] pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-[#5E5F5D]">Tài khoản của tôi</p>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-[#222222]">Tài khoản</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5E5F5D]">
            Quản lý thông tin hồ sơ, số đo, lựa chọn phong cách và địa chỉ giao hàng.
          </p>
          <p className="mt-2 text-sm text-[#5E5F5D]">{currentUser.email}</p>
        </div>
        <Link
          to={ROUTES.addresses}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#1C1B1B] px-4 text-sm font-semibold text-white transition hover:bg-[#444746] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1B1B]"
        >
          Quản lý địa chỉ
        </Link>
      </div>

      {loading && <p className="text-sm text-[#5E5F5D]" role="status">Đang tải thông tin tài khoản…</p>}
      {loadError && <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[#FCEAEA] px-4 py-3"><p role="alert" className="text-sm font-semibold text-[#A94B4B]">{loadError}</p><Button type="button" variant="secondary" onClick={() => setLoadVersion(value => value + 1)}>Thử tải lại</Button></div>}

      {!loading && !loadError && <>
      <section className="grid gap-4 rounded-lg border border-[#E3E2E2] bg-white p-5 sm:p-7">
        <ProfileForm value={profileDraft} errors={profileErrors} onChange={setProfileDraft} />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" loading={savingProfile} disabled={loading} onClick={handleProfileSave}>Lưu hồ sơ</Button>
          {profileMessage && <p className="text-sm font-semibold text-[#3A3632]" role="status">{profileMessage}</p>}
        </div>
      </section>

      <section className="grid gap-4 rounded-lg border border-[#E3E2E2] bg-white p-5 sm:p-7">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[#222222]">Thông tin vóc dáng và phong cách</h2>
          <p className="mt-2 text-sm leading-6 text-[#5E5F5D]">
            Cập nhật số đo và kích cỡ thường dùng của bạn.
          </p>
        </div>
        <BodyInfoForm value={styleDraft} errors={styleErrors} onChange={setStyleDraft} />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" loading={savingStyle} disabled={loading} onClick={handleStyleSave}>Lưu thông tin phong cách</Button>
          {styleMessage && <p className="text-sm font-semibold text-[#3A3632]" role="status">{styleMessage}</p>}
        </div>
      </section>
      </>}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Shortcut label="Địa chỉ" value={loading || loadError ? 'Xem địa chỉ' : `${addressCount} địa chỉ`} to={ROUTES.addresses} />
        <Shortcut label="Đơn hàng" value={apiMode() ? 'Xem đơn hàng' : `${orders.length} đơn`} to={ROUTES.orders} />
        <Shortcut label="Thông báo" value={apiMode() ? 'Xem thông báo' : `${unreadCount} chưa đọc`} to={ROUTES.notifications} />
        <Shortcut label="Tủ đồ" value={apiMode() ? 'Xem tủ đồ' : `${outfits.length} outfit`} to={ROUTES.wardrobes} />
      </section>
    </section>
  )
}

function Shortcut({ label, value, to }: { label: string; value: string; to: string }) {
  return (
    <Link
      to={to}
      className="rounded-lg border border-[#E3E2E2] bg-white p-5 transition hover:border-[#777] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1B1B]"
    >
      <p className="text-sm font-semibold text-[#1C1B1B]">{label}</p>
      <p className="mt-2 text-sm text-[#5E5F5D]">{value}</p>
    </Link>
  )
}
