import type { Product } from './product'

export interface CartItem {
  product: Product
  quantity: number
  variantId?: number
  colorName?: string
}

export interface CartContextValue {
  cartItems: CartItem[]
  addToCart: (product: Product, quantity?: number, variantId?: number) => void
  removeFromCart: (productId: number, variantId?: number) => void
  updateQuantity: (productId: number, quantity: number, variantId?: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}
