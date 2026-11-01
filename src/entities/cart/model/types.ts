export interface CartLine {
  id: string
  productId: string
  variantId: string
  quantity: number
  source: 'shop' | 'ai'
}

export type AddCartLineInput = Omit<CartLine, 'id'>
