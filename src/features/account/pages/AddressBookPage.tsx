import { useState } from 'react'
import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { useDemoStore } from '@/app/store/DemoStoreProvider'
import type { Address } from '@/entities/address/model/types'
import { useAuth } from '@/features/auth'

import { AddressCard } from '../components/AddressCard'
import { AddressForm } from '../components/AddressForm'

export function AddressBookPage() {
  const { state, dispatch } = useDemoStore()
  const { currentUser } = useAuth()
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState('')

  if (!currentUser) return null

  const addresses = state.addresses
    .filter(address => address.userId === currentUser.id)
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
  const showForm = creating || editingAddress

  const handleSubmit = (address: Address) => {
    dispatch({ type: 'address/upserted', payload: address })
    setMessage('Đã lưu địa chỉ')
    setCreating(false)
    setEditingAddress(null)
  }

  const handleDelete = (address: Address) => {
    if (addresses.length <= 1) {
      setMessage('Cần ít nhất một địa chỉ để thanh toán.')
      return
    }

    dispatch({ type: 'address/deleted', payload: { addressId: address.id } })
    setMessage('Đã xóa địa chỉ')
  }

  const handleSetDefault = (address: Address) => {
    dispatch({ type: 'address/defaultChanged', payload: { addressId: address.id } })
    setMessage('Đã cập nhật địa chỉ mặc định')
  }

  return (
    <section className="mx-auto grid max-w-[var(--container-wide)] gap-8 px-5 py-8 md:px-8 md:py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Link to={ROUTES.account} className="text-sm font-semibold text-[#684B5A] hover:underline">
            Tài khoản
          </Link>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-[#222222]">Địa chỉ</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6F6B67]">
            Chọn địa chỉ mặc định để thanh toán nhanh và giữ thông tin giao hàng rõ ràng.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#EEE8E1] px-4 text-sm font-semibold text-[#222222]"
          onClick={() => {
            setCreating(true)
            setEditingAddress(null)
            setMessage('')
          }}
        >
          Thêm địa chỉ
        </button>
      </div>

      {message && (
        <p className="rounded-lg border border-[#E3DAD0] bg-white px-4 py-3 text-sm font-semibold text-[#3A3632]">
          {message}
        </p>
      )}

      {showForm && (
        <AddressForm
          initialAddress={editingAddress ?? undefined}
          userId={currentUser.id}
          makeDefault={addresses.length === 0}
          onSubmit={handleSubmit}
          onCancel={() => {
            setCreating(false)
            setEditingAddress(null)
          }}
        />
      )}

      {addresses.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map(address => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={addressToEdit => {
                setEditingAddress(addressToEdit)
                setCreating(false)
                setMessage('')
              }}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      ) : (
        <section className="rounded-lg border border-dashed border-[#D8D0C6] bg-white p-8">
          <h2 className="font-display text-2xl font-semibold text-[#222222]">Chưa có địa chỉ</h2>
          <p className="mt-2 text-sm leading-6 text-[#6F6B67]">
            Thêm địa chỉ trước khi thanh toán để đơn hàng có nơi giao rõ ràng.
          </p>
        </section>
      )}
    </section>
  )
}
