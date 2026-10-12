export type CouponType = 'percent' | 'fixed'

export interface AdminCoupon {
  id: number
  code: string
  type: CouponType
  value: number
  minimumAmount: number
  startsAt?: string
  expiresAt?: string
  usageLimit?: number
  perUserLimit?: number
  usedCount: number
  usagesCount: number
  active: boolean
  createdAt: string
}

export interface AdminCouponFormValues {
  code: string
  type: CouponType
  value: number
  minimumAmount: number
  startsAt: string
  expiresAt: string
  usageLimit?: number
  perUserLimit?: number
  active: boolean
}

export interface AdminCouponCatalog {
  coupons: AdminCoupon[]
  currentPage: number
  lastPage: number
  total: number
}
