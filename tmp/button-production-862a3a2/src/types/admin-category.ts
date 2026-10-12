import type { Category } from './category'

export interface AdminCategory extends Omit<Category, 'accent'> {
  active: boolean
  productsCount: number
  createdAt?: string
  updatedAt?: string
}

export interface AdminCategoryFormValues {
  name: string
  slug: string
  description: string
  active: boolean
}
