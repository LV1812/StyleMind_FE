import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { useAuth } from '@/features/auth'
import {
  identityApi,
  identityErrorMessage,
  type AddressPatchPayload,
  type AddressPayload,
  type IdentityAddress,
  type Province,
  type Ward,
} from '@/shared/api/identityApi'
import { Button } from '@/shared/ui'

import { AddressCard } from '../components/AddressCard'
import { AddressForm, type AddressFormValue } from '../components/AddressForm'

export function AddressBookPage() {
  const { currentUser } = useAuth()
  const [addresses, setAddresses] = useState<IdentityAddress[]>([])
  const [provinces, setProvinces] = useState<Province[]>([])
  const [wards, setWards] = useState<Ward[]>([])
  const [editingAddress, setEditingAddress] = useState<IdentityAddress | null>(null)
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [wardLoading, setWardLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageIsError, setMessageIsError] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    void Promise.all([identityApi.listAddresses(), identityApi.listProvinces()])
      .then(([addressResponse, provinceResponse]) => {
        if (!active) return
        setAddresses(addressResponse.addresses)
        setProvinces(provinceResponse.provinces)
      })
      .catch(error => {
        if (active) {
          setMessage(identityErrorMessage(error, 'Không thể tải sổ địa chỉ.'))
          setMessageIsError(true)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  if (!currentUser) return null

  const handleProvinceChange = async (provinceCode: string) => {
    setWards([])
    if (!provinceCode) return
    setWardLoading(true)
    try {
      const response = await identityApi.listWards(provinceCode)
      setWards(response.wards)
    } catch (error) {
      setMessage(identityErrorMessage(error, 'Không thể tải danh sách phường/xã.'))
      setMessageIsError(true)
    } finally {
      setWardLoading(false)
    }
  }

  const handleSubmit = async (value: AddressFormValue) => {
    setSaving(true)
    setMessage('')
    try {
      if (editingAddress) {
        const payload: AddressPatchPayload = {
          label: value.label.trim() || null,
          recipient_name: value.recipientName.trim(),
          recipient_phone: value.recipientPhone.trim(),
          address_line: value.addressLine.trim(),
        }
        if (value.wardCode !== undefined) payload.ward_code = value.wardCode
        const updated = await identityApi.patchAddress(editingAddress.address_id, payload)
        setAddresses(current => current.map(address => address.address_id === updated.address_id ? updated : address))
        setMessage('Đã cập nhật địa chỉ.')
      } else {
        const payload: AddressPayload = {
          label: value.label.trim() || null,
          recipient_name: value.recipientName.trim(),
          recipient_phone: value.recipientPhone.trim(),
          address_line: value.addressLine.trim(),
          ward_code: value.wardCode ?? null,
        }
        const created = await identityApi.createAddress(payload)
        setAddresses(current => [...current, created].sort((a, b) => Number(b.is_default) - Number(a.is_default)))
        setMessage('Đã thêm địa chỉ.')
      }
      setMessageIsError(false)
      setCreating(false)
      setEditingAddress(null)
      setWards([])
    } catch (error) {
      setMessage(identityErrorMessage(error, 'Không thể lưu địa chỉ.'))
      setMessageIsError(true)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (address: IdentityAddress) => {
    setMessage('')
    try {
      await identityApi.deleteAddress(address.address_id)
      setAddresses(current => current.filter(item => item.address_id !== address.address_id))
      setMessage('Đã xóa địa chỉ.')
      setMessageIsError(false)
    } catch (error) {
      setMessage(identityErrorMessage(error, 'Không thể xóa địa chỉ.'))
      setMessageIsError(true)
    }
  }

  const handleSetDefault = async (address: IdentityAddress) => {
    setMessage('')
    try {
      const updated = await identityApi.setDefaultAddress(address.address_id)
      setAddresses(current => current.map(item => item.address_id === updated.address_id ? updated : { ...item, is_default: false }))
      setMessage('Đã cập nhật địa chỉ mặc định.')
      setMessageIsError(false)
    } catch (error) {
      setMessage(identityErrorMessage(error, 'Không thể thay đổi địa chỉ mặc định.'))
      setMessageIsError(true)
    }
  }

  const showForm = creating || Boolean(editingAddress)

  return (
    <section className="mx-auto grid max-w-[var(--container-wide)] gap-8 px-5 py-8 md:px-8 md:py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Link to={ROUTES.account} className="text-sm font-semibold text-[#684B5A] hover:underline">Tài khoản</Link>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-[#222222]">Địa chỉ</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6F6B67]">
            Lưu địa chỉ giao hàng, tra cứu mã tỉnh/phường và chọn địa chỉ mặc định.
          </p>
        </div>
        {!showForm && (
          <Button type="button" onClick={() => { setCreating(true); setEditingAddress(null); setMessage(''); setWards([]) }}>
            Thêm địa chỉ
          </Button>
        )}
      </div>

      {message && (
        <p className={`rounded-lg border px-4 py-3 text-sm font-semibold ${messageIsError ? 'border-[#E7BBBB] bg-[#FCEAEA] text-[#A94B4B]' : 'border-[#B7D3BF] bg-[#EAF2EC] text-[#294C36]'}`} role="status">
          {message}
        </p>
      )}

      {showForm && (
        <AddressForm
          key={editingAddress?.address_id ?? 'new-address'}
          initialAddress={editingAddress ?? undefined}
          provinces={provinces}
          wards={wards}
          wardLoading={wardLoading}
          saving={saving}
          onProvinceChange={handleProvinceChange}
          onSubmit={handleSubmit}
          onCancel={() => { setCreating(false); setEditingAddress(null); setWards([]) }}
        />
      )}

      {loading ? (
        <p className="text-sm text-[#6F6B67]" role="status">Đang tải địa chỉ…</p>
      ) : addresses.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map(address => (
            <AddressCard
              key={address.address_id}
              address={address}
              onEdit={addressToEdit => { setEditingAddress(addressToEdit); setCreating(false); setMessage(''); setWards([]) }}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      ) : (
        <section className="rounded-lg border border-dashed border-[#D8D0C6] bg-white p-8">
          <h2 className="font-display text-2xl font-semibold text-[#222222]">Chưa có địa chỉ</h2>
          <p className="mt-2 text-sm leading-6 text-[#6F6B67]">
            Thêm địa chỉ giao hàng. Địa chỉ đầu tiên sẽ được đặt làm mặc định tự động.
          </p>
        </section>
      )}
    </section>
  )
}
