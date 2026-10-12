import { createContext } from 'react'
import type { CartContextValue } from '../types/cart'

const defaultValue: CartContextValue = {
  cartItems: [],
  addToCart: () => undefined,
  removeFromCart: () => undefined,
  updateQuantity: () => undefined,
  clearCart: () => undefined,
  totalItems: 0,
  totalPrice: 0,
}

export const CartContext = createContext<CartContextValue>(defaultValue)
