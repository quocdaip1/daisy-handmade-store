import { apiUrl } from '../../config/api'
import type { AdminOrder, AdminOrderCatalog, OrderStatus } from '../../types/admin-order'

interface ApiOrderItem {
  id: number
  product_id?: number | null
  product_name: string
  product_sku?: string | null
  quantity: number
  price: number | string
  total: number | string
}

interface ApiOrder {
  id: number
  number: string
  status: OrderStatus
  payment_method: string
  payment_status: string
  customer_name: string
  customer_email: string
  customer_phone: string
  shipping_address: string
  subtotal: number | string
  discount: number | string
  shipping_fee: number | string
  total: number | string
  tracking_number?: string | null
  items?: ApiOrderItem[]
  created_at: string
}

interface ErrorResponse { message?: string; errors?: Record<string, string[]> }

export class AdminOrderRequestError extends Error {
  readonly status: number
  readonly errors: Record<string, string[]>

  constructor(status: number, response: ErrorResponse, fallback: string) {
    super(response.message || fallback)
    this.status = status
    this.errors = response.errors ?? {}
  }
}

function mapOrder(order: ApiOrder): AdminOrder {
  return {
    id: order.id,
    number: order.number,
    status: order.status,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    shippingAddress: order.shipping_address,
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    shippingFee: Number(order.shipping_fee),
    total: Number(order.total),
    trackingNumber: order.tracking_number ?? '',
    items: (order.items ?? []).map((item) => ({
      id: item.id,
      productId: item.product_id ?? undefined,
      productName: item.product_name,
      productSku: item.product_sku ?? undefined,
      quantity: item.quantity,
      price: Number(item.price),
      total: Number(item.total),
    })),
    createdAt: order.created_at,
  }
}

async function request<T>(token: string, path: string, options: RequestInit, fallback: string): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
  })
  const contentType = response.headers.get('content-type') ?? ''
  const data = contentType.includes('application/json') ? await response.json() as T & ErrorResponse : {} as T & ErrorResponse
  if (!response.ok) throw new AdminOrderRequestError(response.status, data, fallback)
  return data
}

export async function listAdminOrders(token: string, query: { search: string; status: OrderStatus | 'all'; page: number }) {
  const parameters = new URLSearchParams({ page: String(query.page), per_page: '15' })
  if (query.search) parameters.set('search', query.search)
  if (query.status !== 'all') parameters.set('status', query.status)
  const response = await request<{ data: ApiOrder[]; current_page: number; last_page: number; total: number }>(token, `/admin/orders?${parameters}`, {}, 'Không thể tải danh sách đơn hàng.')
  return {
    orders: response.data.map(mapOrder),
    currentPage: response.current_page,
    lastPage: response.last_page,
    total: response.total,
  } satisfies AdminOrderCatalog
}

export async function fetchAdminOrder(token: string, id: number) {
  const response = await request<{ data: ApiOrder }>(token, `/admin/orders/${id}`, {}, 'Không thể tải chi tiết đơn hàng.')
  return mapOrder(response.data)
}

export async function updateAdminOrder(token: string, id: number, values: { status: OrderStatus; trackingNumber: string }) {
  const response = await request<{ data: ApiOrder }>(token, `/admin/orders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: values.status, tracking_number: values.trackingNumber.trim() || null }),
  }, 'Không thể cập nhật đơn hàng.')
  return mapOrder(response.data)
}
