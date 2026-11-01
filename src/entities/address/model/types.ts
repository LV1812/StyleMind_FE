export interface Address {
  id: string
  userId: string
  recipientName: string
  phone: string
  line1: string
  ward: string
  district: string
  province: string
  isDefault: boolean
}

export type AddressSnapshot = Omit<Address, 'userId' | 'isDefault'>
