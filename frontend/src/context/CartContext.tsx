import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { CartItem } from '../types/cart'
import type { Product } from '../types/product'
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

  const addToCart = (product: Product, quantity = 1) => {
    if (product.stock <= 0 || quantity <= 0 || !Number.isFinite(quantity)) {
      return
    }

    const safeQuantity = Math.min(Math.floor(quantity), product.stock)
    setCartItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.product.id === product.id)

      if (existingItem) {
        return currentItems.map((item) =>
          item.product.id === product.id
            ? { ...item, product, quantity: Math.min(item.quantity + safeQuantity, product.stock) }
            : item,
        )
      }

      return [...currentItems, { product, quantity: safeQuantity }]
    })
  }

  const removeFromCart = (productId: number) => {
    setCartItems((currentItems) => currentItems.filter((item) => item.product.id !== productId))
  }

  const updateQuantity = (productId: number, quantity: number) => {
    setCartItems((currentItems) =>
      currentItems.flatMap((item) => {
        if (item.product.id !== productId) {
          return [item]
        }

        const nextQuantity = Math.max(0, Math.min(quantity, item.product.stock))
        return nextQuantity > 0 ? [{ ...item, quantity: nextQuantity }] : []
      }),
    )
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
