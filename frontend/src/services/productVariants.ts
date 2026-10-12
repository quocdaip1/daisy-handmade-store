import { productImageUrl } from '../config/api'
import type { ProductVariant } from '../types/product'

export interface ApiProductVariant {
  id: number
  color_name: string
  stock: number | null
  images: string[]
  active: boolean
}

export function mapProductVariant(variant: ApiProductVariant): ProductVariant {
  return { id: variant.id, colorName: variant.color_name, stock: variant.stock, images: variant.images.map(productImageUrl), active: variant.active }
}
