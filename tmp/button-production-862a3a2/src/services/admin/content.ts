import { apiUrl } from '../../config/api'
import type { AdminBanner, AdminBannerFormValues, AdminContact, AdminContactCatalog, AdminPolicy, AdminPolicyFormValues, BannerPosition } from '../../types/admin-content'

interface ApiBanner { id: number; title: string; image: string; link?: string | null; position: BannerPosition; active: boolean }
interface ApiContact { id: number; name: string; email: string; phone?: string | null; subject: string; message: string; status: string; created_at: string }
interface ApiPolicy { id: number; title: string; slug: string; content: string; version: number; published: boolean; updated_at: string }
interface ErrorResponse { message?: string; errors?: Record<string, string[]> }

export class AdminContentRequestError extends Error {
  readonly status: number
  readonly errors: Record<string, string[]>

  constructor(status: number, response: ErrorResponse, fallback: string) {
    super(response.message || fallback)
    this.status = status
    this.errors = response.errors ?? {}
  }
}

async function request<T>(token: string, path: string, options: RequestInit, fallback: string): Promise<T> {
  const response = await fetch(apiUrl(path), { ...options, headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, ...options.headers } })
  const contentType = response.headers.get('content-type') ?? ''
  const data = contentType.includes('application/json') ? await response.json() as T & ErrorResponse : {} as T & ErrorResponse
  if (!response.ok) throw new AdminContentRequestError(response.status, data, fallback)
  return data
}

const mapBanner = (banner: ApiBanner): AdminBanner => ({ id: banner.id, title: banner.title, image: banner.image, link: banner.link ?? '', position: banner.position, active: banner.active })
const mapContact = (contact: ApiContact): AdminContact => ({ id: contact.id, name: contact.name, email: contact.email, phone: contact.phone ?? '', subject: contact.subject, message: contact.message, status: contact.status, createdAt: contact.created_at })
const mapPolicy = (policy: ApiPolicy): AdminPolicy => ({ id: policy.id, title: policy.title, slug: policy.slug, content: policy.content, version: policy.version, published: policy.published, updatedAt: policy.updated_at })

export async function listAdminBanners(token: string) {
  const response = await request<{ data: ApiBanner[] }>(token, '/admin/banners', {}, 'Không thể tải banner.')
  return response.data.map(mapBanner)
}

export async function saveAdminBanner(token: string, id: number | null, values: AdminBannerFormValues) {
  const response = await request<{ data: ApiBanner }>(token, id ? `/admin/banners/${id}` : '/admin/banners', {
    method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...values, title: values.title.trim(), image: values.image.trim(), link: values.link.trim() || null }),
  }, 'Không thể lưu banner.')
  return mapBanner(response.data)
}

export async function listAdminContacts(token: string, page: number) {
  const response = await request<{ data: ApiContact[]; current_page: number; last_page: number; total: number }>(token, `/admin/contacts?page=${page}&per_page=15`, {}, 'Không thể tải thông tin liên hệ.')
  return { contacts: response.data.map(mapContact), currentPage: response.current_page, lastPage: response.last_page, total: response.total } satisfies AdminContactCatalog
}

export async function fetchAdminContact(token: string, id: number) {
  const response = await request<{ data: ApiContact }>(token, `/admin/contacts/${id}`, {}, 'Không thể tải chi tiết liên hệ.')
  return mapContact(response.data)
}

export async function listAdminPolicies(token: string) {
  const response = await request<{ data: ApiPolicy[] }>(token, '/admin/policies', {}, 'Không thể tải chính sách.')
  return response.data.map(mapPolicy)
}

export async function saveAdminPolicy(token: string, id: number | null, values: AdminPolicyFormValues) {
  const response = await request<{ data: ApiPolicy }>(token, id ? `/admin/policies/${id}` : '/admin/policies', {
    method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...values, title: values.title.trim(), slug: values.slug.trim(), content: values.content.trim() }),
  }, 'Không thể lưu chính sách.')
  return mapPolicy(response.data)
}
