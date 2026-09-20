import { apiUrl } from '../../config/api'
import type { AdminProduct, AdminProductCatalog, AdminProductFormValues, ProductStatus } from '../../types/admin-product'

interface ApiProduct {
  id: number
  name: string
  slug: string
  sku?: string | null
  category_id: number
  description: string
  short_description?: string | null
  price: number | string
  original_price?: number | string | null
  material: string
  color: string
  stock: number
  images?: string[]
  featured: boolean
  is_new: boolean
  rating: number | string
  status: ProductStatus
  created_at?: string
  updated_at?: string
}

interface ErrorResponse { message?: string; errors?: Record<string, string[]> }
interface ProductResponse { data: ApiProduct }

export class AdminProductRequestError extends Error {
  readonly status: number
  readonly errors: Record<string, string[]>

  constructor(status: number, response: ErrorResponse, fallback: string) {
    super(response.message || fallback)
    this.status = status
    this.errors = response.errors ?? {}
  }
}

function mapProduct(product: ApiProduct): AdminProduct {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku ?? undefined,
    categoryId: product.category_id,
    description: product.description,
    shortDescription: product.short_description ?? '',
    price: Number(product.price),
    originalPrice: product.original_price == null ? undefined : Number(product.original_price),
    material: product.material,
    color: product.color,
    stock: product.stock,
    images: product.images ?? [],
    featured: product.featured,
    isNew: product.is_new,
    rating: Number(product.rating),
    status: product.status,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  }
}

async function request<T>(token: string, path: string, options: RequestInit, fallback: string): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
  })
  const contentType = response.headers.get('content-type') ?? ''
  const data = contentType.includes('application/json') ? await response.json() as T & ErrorResponse : {} as T & ErrorResponse
  if (!response.ok) throw new AdminProductRequestError(response.status, data, fallback)
  return data
}

function productPayload(values: AdminProductFormValues) {
  return {
    category_id: values.categoryId,
    name: values.name.trim(),
    slug: values.slug.trim(),
    sku: values.sku.trim() || null,
    description: values.description.trim(),
    short_description: values.shortDescription.trim() || null,
    price: values.price,
    original_price: values.originalPrice ?? null,
    material: values.material.trim(),
    color: values.color.trim(),
    stock: values.stock,
    images: values.images,
    featured: values.featured,
    is_new: values.isNew,
    status: values.status,
    rating: values.rating,
  }
}

export async function listAdminProducts(token: string, query: { search: string; status: ProductStatus | 'all'; page: number }) {
  const parameters = new URLSearchParams({ page: String(query.page), per_page: '15' })
  if (query.search) parameters.set('search', query.search)
  if (query.status !== 'all') parameters.set('status', query.status)
  const response = await request<{ data: ApiProduct[]; meta: { current_page: number; last_page: number; total: number } }>(token, `/admin/products?${parameters}`, {}, 'Không thể tải danh sách sản phẩm.')
  return {
    products: response.data.map(mapProduct),
    currentPage: response.meta.current_page,
    lastPage: response.meta.last_page,
    total: response.meta.total,
  } satisfies AdminProductCatalog
}

export async function createAdminProduct(token: string, values: AdminProductFormValues) {
  const response = await request<ProductResponse>(token, '/admin/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productPayload(values)),
  }, 'Không thể tạo sản phẩm.')
  return mapProduct(response.data)
}

export async function updateAdminProduct(token: string, id: number, values: AdminProductFormValues) {
  const response = await request<ProductResponse>(token, `/admin/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productPayload(values)),
  }, 'Không thể cập nhật sản phẩm.')
  return mapProduct(response.data)
}

export function deactivateAdminProduct(token: string, id: number) {
  return request<{ message: string }>(token, `/admin/products/${id}`, { method: 'DELETE' }, 'Không thể ngừng kinh doanh sản phẩm.')
}

export function uploadAdminProductImages(token: string, id: number, images: File[]) {
  const body = new FormData()
  images.forEach((image) => body.append('images[]', image))
  return request<{ data: string[] }>(token, `/admin/products/${id}/images`, { method: 'POST', body }, 'Không thể tải ảnh sản phẩm.')
}
