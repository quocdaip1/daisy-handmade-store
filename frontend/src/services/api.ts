import { categories as fallbackCategories } from '../data/categories'
import { products as fallbackProducts } from '../data/products'
import { apiUrl } from '../config/api'
import type { Category } from '../types/category'
import type { Product, ProductCatalog, ProductCatalogQuery } from '../types/product'

type ApiListResponse<T> = { data: T[] }
type ApiItemResponse<T> = { data: T }
type ApiPaginatedResponse<T> = {
  data: T[]
  meta: { current_page: number; last_page: number; per_page: number; total: number }
}

function buildUrl(path: string) {
  return apiUrl(path)
}

async function requestJson<T>(path: string): Promise<T> {
  const response = await fetch(buildUrl(path))

  if (!response.ok) {
    throw new ApiRequestError(response.status)
  }

  return response.json() as Promise<T>
}

interface ApiProduct {
  id: number; name: string; slug: string; category_id?: number; categoryId?: number
  description: string; short_description?: string; shortDescription?: string; price: number
  original_price?: number; originalPrice?: number; material: string; color: string; stock: number
  images?: string[]; featured?: boolean; is_new?: boolean; isNew?: boolean; rating: number
}

class ApiRequestError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`Request failed: ${status}`)
    this.status = status
  }
}

async function fetchProductCollection(path: string): Promise<Product[]> {
  const payload = await requestJson<ApiListResponse<ApiProduct>>(path)
  return (payload.data ?? []).map(mapProduct)
}

interface ApiCategory {
  id: number; name: string; slug: string; description: string; accent?: string
}

function mapProduct(item: ApiProduct): Product {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    categoryId: item.category_id ?? item.categoryId ?? 0,
    description: item.description,
    shortDescription: item.short_description ?? item.shortDescription ?? '',
    price: item.price,
    originalPrice: item.original_price ?? item.originalPrice,
    material: item.material,
    color: item.color,
    stock: item.stock,
    images: item.images ?? [],
    featured: Boolean(item.featured),
    isNew: Boolean(item.is_new ?? item.isNew),
    rating: item.rating,
  }
}

function mapCategory(item: ApiCategory): Category {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    description: item.description,
    accent: item.accent ?? '#8B1E2D',
  }
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    const payload = await requestJson<ApiListResponse<ApiProduct>>('/products')
    return (payload.data ?? []).map(mapProduct)
  } catch {
    return fallbackProducts
  }
}

export async function fetchProductCatalog(query: ProductCatalogQuery): Promise<ProductCatalog> {
  const parameters = new URLSearchParams({
    sort: query.sort,
    page: String(query.page),
    per_page: String(query.perPage),
  })
  if (query.search?.trim()) parameters.set('search', query.search.trim())
  if (query.category) parameters.set('category', String(query.category))
  if (query.minPrice !== undefined) parameters.set('min_price', String(query.minPrice))
  if (query.maxPrice !== undefined) parameters.set('max_price', String(query.maxPrice))

  const payload = await requestJson<ApiPaginatedResponse<ApiProduct>>(`/products?${parameters.toString()}`)
  return {
    products: (payload.data ?? []).map(mapProduct),
    currentPage: payload.meta.current_page,
    lastPage: payload.meta.last_page,
    perPage: payload.meta.per_page,
    total: payload.meta.total,
  }
}

export function fetchHomepageProducts(): Promise<Product[]> {
  return fetchProductCollection('/products')
}

export function fetchNewArrivals(): Promise<Product[]> {
  return fetchProductCollection('/products/new-arrivals?per_page=4')
}

export function fetchBestSellers(): Promise<Product[]> {
  return fetchProductCollection('/products/best-sellers?per_page=4')
}

export async function fetchHomepageCategories(): Promise<Category[]> {
  const payload = await requestJson<ApiListResponse<ApiCategory>>('/categories')
  return (payload.data ?? []).map(mapCategory)
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  try {
    const payload = await requestJson<ApiItemResponse<ApiProduct>>(`/products/${slug}`)
    return payload.data ? mapProduct(payload.data) : null
  } catch {
    return fallbackProducts.find((product) => product.slug === slug) ?? null
  }
}

export async function fetchProductDetail(slug: string): Promise<Product | null> {
  try {
    const payload = await requestJson<ApiItemResponse<ApiProduct>>(`/products/${encodeURIComponent(slug)}`)
    return payload.data ? mapProduct(payload.data) : null
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) return null
    throw error
  }
}

export function fetchRelatedProducts(slug: string, limit = 4): Promise<Product[]> {
  const safeLimit = Math.min(20, Math.max(1, limit))
  return fetchProductCollection(`/products/${encodeURIComponent(slug)}/related?limit=${safeLimit}`)
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const payload = await requestJson<ApiListResponse<ApiCategory>>('/categories')
    return (payload.data ?? []).map(mapCategory)
  } catch {
    return fallbackCategories
  }
}
