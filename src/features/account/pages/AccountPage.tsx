import { useState } from 'react'
import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { useDemoStore } from '@/app/store/DemoStoreProvider'
import { useAuth } from '@/features/auth'

import { BodyInfoForm } from '../components/BodyInfoForm'
import { ProfileForm } from '../components/ProfileForm'
import { hasErrors, validateProfileInput, type FieldErrors, type ProfileInput } from '../model/validators'

function profileDraftFromUser(user: NonNullable<ReturnType<typeof useAuth>['currentUser']>): ProfileInput {
  return {
    fullName: user.fullName,
    phone: user.phone ?? '',
    heightCm: user.heightCm ? String(user.heightCm) : '',
    weightKg: user.weightKg ? String(user.weightKg) : '',
  }
}

export function AccountPage() {
  const { state, dispatch } = useDemoStore()
  const { currentUser } = useAuth()
  const [savedMessage, setSavedMessage] = useState('')
  const [errors, setErrors] = useState<FieldErrors<ProfileInput>>({})
  const [draft, setDraft] = useState<ProfileInput>(() =>
    currentUser
      ? profileDraftFromUser(currentUser)
      : {
          fullName: '',
          phone: '',
          heightCm: '',
          weightKg: '',
        },
  )

  if (!currentUser) return null

  const addresses = state.addresses.filter(address => address.userId === currentUser.id)
  const orders = state.orders.filter(order => order.userId === currentUser.id)
  const outfits = state.outfits.filter(outfit => outfit.ownerId === currentUser.id)
  const unreadCount = state.notifications.filter(item => item.userId === currentUser.id && !item.read).length

  const handleSave = () => {
    const nextErrors = validateProfileInput(draft)
    setErrors(nextErrors)
    if (hasErrors(nextErrors)) return

    dispatch({
      type: 'user/profileUpdated',
      payload: {
        userId: currentUser.id,
        fullName: draft.fullName.trim(),
        phone: draft.phone.trim(),
        heightCm: draft.heightCm ? Number(draft.heightCm) : undefined,
        weightKg: draft.weightKg ? Number(draft.weightKg) : undefined,
      },
    })
    setSavedMessage('Đã cập nhật tài khoản')
  }

  return (
    <section className="mx-auto grid max-w-[var(--container-wide)] gap-8 px-5 py-8 md:px-8 md:py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#684B5A]">StyleMind</p>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-[#222222]">Tài khoản</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6F6B67]">
            Quản lý hồ sơ, số đo cơ bản, địa chỉ giao hàng và các lối tắt mua sắm của bạn.
          </p>
        </div>
        <Link
          to={ROUTES.addresses}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#684B5A] px-4 text-sm font-semibold text-white transition hover:bg-[#593f4d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A]"
        >
          Quản lý địa chỉ
        </Link>
      </div>

      <form
        className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]"
        onSubmit={event => {
          event.preventDefault()
          handleSave()
        }}
      >
        <ProfileForm value={draft} errors={errors} onChange={setDraft} />
        <BodyInfoForm value={draft} errors={errors} onChange={setDraft} />
        <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#684B5A] px-4 text-sm font-semibold text-white"
          >
            Lưu hồ sơ
          </button>
          {savedMessage && <p className="text-sm font-semibold text-[#2F7D4E]">{savedMessage}</p>}
        </div>
      </form>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Shortcut label="Địa chỉ" value={`${addresses.length} địa chỉ`} to={ROUTES.addresses} />
        <Shortcut label="Đơn hàng" value={`${orders.length} đơn`} to={ROUTES.orders} />
        <Shortcut label="Thông báo" value={`${unreadCount} chưa đọc`} to={ROUTES.notifications} />
        <Shortcut label="Tủ đồ" value={`${outfits.length} outfit`} to={ROUTES.wardrobes} />
      </section>
    </section>
  )
}

function Shortcut({ label, value, to }: { label: string; value: string; to: string }) {
  return (
    <Link
      to={to}
      className="rounded-lg border border-[#E3DAD0] bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A]"
    >
      <p className="text-sm font-semibold text-[#684B5A]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#222222]">{value}</p>
    </Link>
  )
}
