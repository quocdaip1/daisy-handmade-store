import type { CartItem } from '../types/cart'
import type { Product, ProductVariant } from '../types/product'

export function productSelectionKey(productId: number, variantId?: number | null): string {
  return `${productId}:${variantId ?? 'shared'}`
}

export function selectedStock(product: Product, variant?: ProductVariant): number {
  if (product.inventoryMode !== 'variant') return product.stock
  return variant?.active ? variant.stock ?? 0 : 0
}

export function cartItemStock(item: CartItem): number {
  return selectedStock(item.product, item.product.variants?.find((variant) => variant.id === item.variantId))
}

export function cartItemImage(item: CartItem): string | undefined {
  const variant = item.product.variants?.find((candidate) => candidate.id === item.variantId)
  return variant?.images[0] ?? item.product.coverImage ?? item.product.images[0]
}
