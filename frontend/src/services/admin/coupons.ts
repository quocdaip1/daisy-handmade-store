import { apiUrl } from '../../config/api'
import type { AdminCoupon, AdminCouponCatalog, AdminCouponFormValues, CouponType } from '../../types/admin-coupon'

interface ApiCoupon {
  id: number
  code: string
  type: CouponType
  value: number | string
  minimum_amount: number | string
  starts_at?: string | null
  expires_at?: string | null
  usage_limit?: number | null
  per_user_limit?: number | null
  used_count: number
  usages_count?: number
  active: boolean
  created_at: string
}

interface ErrorResponse { message?: string; errors?: Record<string, string[]> }

export class AdminCouponRequestError extends Error {
  readonly status: number
  readonly errors: Record<string, string[]>

  constructor(status: number, response: ErrorResponse, fallback: string) {
    super(response.message || fallback)
    this.status = status
    this.errors = response.errors ?? {}
  }
}

function mapCoupon(coupon: ApiCoupon): AdminCoupon {
  return {
    id: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value: Number(coupon.value),
    minimumAmount: Number(coupon.minimum_amount),
    startsAt: coupon.starts_at ?? undefined,
    expiresAt: coupon.expires_at ?? undefined,
    usageLimit: coupon.usage_limit ?? undefined,
    perUserLimit: coupon.per_user_limit ?? undefined,
    usedCount: coupon.used_count,
    usagesCount: coupon.usages_count ?? coupon.used_count,
    active: coupon.active,
    createdAt: coupon.created_at,
  }
}

async function request<T>(token: string, path: string, options: RequestInit, fallback: string): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
  })
  const contentType = response.headers.get('content-type') ?? ''
  const data = contentType.includes('application/json') ? await response.json() as T & ErrorResponse : {} as T & ErrorResponse
  if (!response.ok) throw new AdminCouponRequestError(response.status, data, fallback)
  return data
}

function couponPayload(values: AdminCouponFormValues) {
  return {
    code: values.code.trim(),
    type: values.type,
    value: values.value,
    minimum_amount: values.minimumAmount,
    starts_at: values.startsAt || null,
    expires_at: values.expiresAt || null,
    usage_limit: values.usageLimit ?? null,
    per_user_limit: values.perUserLimit ?? null,
    active: values.active,
  }
}

export async function listAdminCoupons(token: string, page: number) {
  const response = await request<{ data: ApiCoupon[]; current_page: number; last_page: number; total: number }>(token, `/admin/coupons?page=${page}&per_page=15`, {}, 'Không thể tải danh sách mã giảm giá.')
  return {
    coupons: response.data.map(mapCoupon),
    currentPage: response.current_page,
    lastPage: response.last_page,
    total: response.total,
  } satisfies AdminCouponCatalog
}

export async function createAdminCoupon(token: string, values: AdminCouponFormValues) {
  const response = await request<{ data: ApiCoupon }>(token, '/admin/coupons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(couponPayload(values)),
  }, 'Không thể tạo mã giảm giá.')
  return mapCoupon(response.data)
}

export async function updateAdminCoupon(token: string, id: number, values: AdminCouponFormValues) {
  const response = await request<{ data: ApiCoupon }>(token, `/admin/coupons/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(couponPayload(values)),
  }, 'Không thể cập nhật mã giảm giá.')
  return mapCoupon(response.data)
}
