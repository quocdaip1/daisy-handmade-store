import { apiUrl } from '../config/api'

export interface CheckoutAddress {
  name: string
  phone: string
  city: string
  district: string
  address: string
}

export interface ShippingMethod {
  id: number
  name: string
  code: string
  fee: number
}

export interface CheckoutPreviewPayload {
  items: Array<{ product_id: number; quantity: number }>
  address: CheckoutAddress
  shipping_method_id: number
  coupon_code?: string
}

export interface CheckoutPreview {
  items: Array<{ product_id: number; name: string; quantity: number; unit_price: number; line_total: number }>
  address: CheckoutAddress
  shipping_method: Pick<ShippingMethod, 'id' | 'name' | 'code'>
  coupon: { code: string } | null
  subtotal: number
  discount: number
  shipping_fee: number
  grand_total: number
}

export interface CreateOrderPayload {
  items: Array<{ product_id: number; quantity: number }>
  customer_name: string
  customer_email: string
  customer_phone: string
  shipping_address: string
  shipping_method_id: number
  payment_method: 'cod' | 'bank_transfer'
  coupon_code?: string
  note?: string
}

export interface OrderPayment {
  method: 'cod' | 'bank_transfer'
  status: 'unpaid' | 'pending_verification'
  amount: number
  bank_name?: string
  account_number?: string
  account_owner?: string
  transfer_content?: string
  qr_image_url?: string | null
}

export interface CreateOrderResponse {
  message: string
  order: {
    customer_name: string
    customer_email: string
    customer_phone: string
    shipping_address: string
    total: number
    items: Array<{ product_id: number; quantity: number; price: number }>
  }
  payment: OrderPayment
}

interface ValidationResponse {
  message?: string
  errors?: Record<string, string[]>
}

export class CheckoutRequestError extends Error {
  readonly status: number
  readonly errors: Record<string, string[]>

  constructor(status: number, response: ValidationResponse) {
    super(response.message || 'Không thể kiểm tra thanh toán.')
    this.status = status
    this.errors = response.errors ?? {}
  }
}

async function postJson<T>(path: string, payload: object, token?: string): Promise<T> {
  const response = await fetch(apiUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  })
  const data = await response.json() as T & ValidationResponse
  if (!response.ok) throw new CheckoutRequestError(response.status, data)
  return data
}

export async function fetchShippingMethods(subtotal: number): Promise<ShippingMethod[]> {
  const response = await postJson<{ data: ShippingMethod[] }>('/shipping/quote', { subtotal })
  return response.data
}

export async function validateCoupon(code: string, subtotal: number, token?: string): Promise<{ code: string; discount: number }> {
  const response = await postJson<{ data: { code: string; discount: number } }>('/coupons/validate', { code, subtotal }, token)
  return response.data
}

export async function previewCheckout(payload: CheckoutPreviewPayload, token: string): Promise<CheckoutPreview> {
  const response = await postJson<{ data: CheckoutPreview }>('/checkout/preview', payload, token)
  return response.data
}

export function createOrder(payload: CreateOrderPayload, token: string): Promise<CreateOrderResponse> {
  return postJson<CreateOrderResponse>('/orders', payload, token)
}
