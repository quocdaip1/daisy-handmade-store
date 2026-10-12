export interface Product {
  id: number
  name: string
  slug: string
  categoryId: number
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
  rating: number
}

export type ProductSort = 'featured' | 'newest' | 'price_asc' | 'price_desc'

export interface ProductCatalogQuery {
  search?: string
  category?: number
  minPrice?: number
  maxPrice?: number
  sort: ProductSort
  page: number
  perPage: number
}

export interface ProductCatalog {
  products: Product[]
  currentPage: number
  lastPage: number
  perPage: number
  total: number
}
