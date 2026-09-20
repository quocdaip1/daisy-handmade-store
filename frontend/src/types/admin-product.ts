import type { Product } from './product'

export type ProductStatus = 'draft' | 'published' | 'inactive'

export interface AdminProduct extends Product {
  sku?: string
  status: ProductStatus
  createdAt?: string
  updatedAt?: string
}

export interface AdminProductFormValues {
  categoryId: number
  name: string
  slug: string
  sku: string
  description: string
  shortDescription: string
  price: number
  originalPrice?: number
  material: string
  color: string
  stock: number
  images: string[]
  featured: boolean
  isNew: boolean
  status: ProductStatus
  rating: number
}

export interface AdminProductCatalog {
  products: AdminProduct[]
  currentPage: number
  lastPage: number
  total: number
}
