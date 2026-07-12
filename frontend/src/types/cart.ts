import type { Product } from './product'

export interface CartItem {
  product: Product
  quantity: number
}

export interface CartContextValue {
  cartItems: CartItem[]
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}
