import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { CartItem } from '../types/cart'
import type { Product } from '../types/product'
import { cartItemStock, selectedStock, productSelectionKey } from '../utils/productSelection'
import { CartContext } from './CartContext'

const CART_STORAGE_KEY = 'viet-ngoc-cart'

interface CartProviderProps {
  children: ReactNode
}

export function CartProvider({ children }: CartProviderProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') {
      return []
    }

    const stored = window.localStorage.getItem(CART_STORAGE_KEY)
    if (!stored) {
      return []
    }

    try {
      const parsed = JSON.parse(stored) as CartItem[]
      return parsed.filter(
        (item) =>
          item?.product &&
          Number.isFinite(item.product.id) &&
          Number.isFinite(item.quantity) &&
          item.quantity > 0 &&
          item.product.stock > 0,
      )
    } catch {
      return []
    }
  })

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems))
  }, [cartItems])

  const addToCart = (product: Product, quantity = 1, variantId?: number) => {
    const variant = product.variants?.find((item) => item.id === variantId)
    const stock = selectedStock(product, variant)
    if ((variantId !== undefined && !variant?.active) || stock <= 0 || quantity <= 0 || !Number.isFinite(quantity)) return
    const safeQuantity = Math.min(Math.floor(quantity), stock)
    const key = productSelectionKey(product.id, variantId)
    setCartItems((currentItems) => {
      const existing = currentItems.find((item) => productSelectionKey(item.product.id, item.variantId) === key)
      const otherQuantity = product.inventoryMode === 'variant' ? 0 : currentItems.filter((item) => item.product.id === product.id && productSelectionKey(item.product.id, item.variantId) !== key).reduce((sum, item) => sum + item.quantity, 0)
      const nextQuantity = Math.min((existing?.quantity ?? 0) + safeQuantity, Math.max(0, stock - otherQuantity))
      if (!nextQuantity) return currentItems
      const next = { product, quantity: nextQuantity, variantId, colorName: variant?.colorName }
      return existing ? currentItems.map((item) => productSelectionKey(item.product.id, item.variantId) === key ? next : item) : [...currentItems, next]
    })
  }

  const removeFromCart = (productId: number, variantId?: number) => {
    const key = productSelectionKey(productId, variantId)
    setCartItems((items) => items.filter((item) => productSelectionKey(item.product.id, item.variantId) !== key))
  }

  const updateQuantity = (productId: number, quantity: number, variantId?: number) => {
    if (!Number.isFinite(quantity)) return
    const key = productSelectionKey(productId, variantId)
    setCartItems((items) => items.flatMap((item) => {
      if (productSelectionKey(item.product.id, item.variantId) !== key) return [item]
      const others = item.product.inventoryMode === 'variant' ? 0 : items.filter((other) => other.product.id === productId && productSelectionKey(other.product.id, other.variantId) !== key).reduce((sum, other) => sum + other.quantity, 0)
      const nextQuantity = Math.max(0, Math.min(Math.floor(quantity), cartItemStock(item) - others))
      return nextQuantity > 0 ? [{ ...item, quantity: nextQuantity }] : []
    }))
  }

  const clearCart = () => {
    setCartItems([])
  }

  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  )

  const totalPrice = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cartItems],
  )

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
