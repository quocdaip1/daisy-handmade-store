import { apiUrl } from '../../config/api'
import type { AdminCategory, AdminCategoryFormValues } from '../../types/admin-category'

interface ApiCategory {
  id: number
  name: string
  slug: string
  description?: string | null
  active: boolean
  products_count?: number
  created_at?: string
  updated_at?: string
}

interface ErrorResponse {
  message?: string
  errors?: Record<string, string[]>
}

export class AdminCategoryRequestError extends Error {
  readonly status: number
  readonly errors: Record<string, string[]>

  constructor(status: number, response: ErrorResponse, fallback: string) {
    super(response.message || fallback)
    this.status = status
    this.errors = response.errors ?? {}
  }
}

function mapCategory(category: ApiCategory): AdminCategory {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? '',
    active: category.active,
    productsCount: category.products_count ?? 0,
    createdAt: category.created_at,
    updatedAt: category.updated_at,
  }
}

async function request<T>(token: string, path: string, options: RequestInit, fallback: string): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
  })
  const contentType = response.headers.get('content-type') ?? ''
  const data = contentType.includes('application/json') ? await response.json() as T & ErrorResponse : {} as T & ErrorResponse
  if (!response.ok) throw new AdminCategoryRequestError(response.status, data, fallback)
  return data
}

function categoryPayload(values: AdminCategoryFormValues) {
  return {
    name: values.name.trim(),
    slug: values.slug.trim(),
    description: values.description.trim() || null,
    active: values.active,
  }
}

export async function listAdminCategories(token: string) {
  const response = await request<{ data: ApiCategory[] }>(token, '/admin/categories', {}, 'Không thể tải danh sách danh mục.')
  return response.data.map(mapCategory)
}

export async function createAdminCategory(token: string, values: AdminCategoryFormValues) {
  const response = await request<{ data: ApiCategory }>(token, '/admin/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(categoryPayload(values)),
  }, 'Không thể tạo danh mục.')
  return mapCategory(response.data)
}

export async function updateAdminCategory(token: string, id: number, values: AdminCategoryFormValues) {
  const response = await request<{ data: ApiCategory }>(token, `/admin/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(categoryPayload(values)),
  }, 'Không thể cập nhật danh mục.')
  return mapCategory(response.data)
}

export function deleteAdminCategory(token: string, id: number) {
  return request<{ message: string }>(token, `/admin/categories/${id}`, { method: 'DELETE' }, 'Không thể xóa danh mục.')
}
