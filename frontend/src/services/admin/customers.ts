import { apiUrl } from '../../config/api'
import type { AdminCustomer, AdminCustomerCatalog } from '../../types/admin-customer'
import type { OrderStatus } from '../../types/admin-order'

interface ApiAddress {
  id: number
  name: string
  phone: string
  city: string
  district: string
  address: string
  is_default: boolean
}

interface ApiCustomerOrder {
  id: number
  number: string
  status: OrderStatus
  payment_status: string
  total: number | string
  tracking_number?: string | null
  created_at: string
}

interface ApiCustomer {
  id: number
  name: string
  email: string
  email_verified_at?: string | null
  orders_count?: number
  addresses?: ApiAddress[]
  orders?: ApiCustomerOrder[]
  created_at: string
}

interface ErrorResponse { message?: string }

export class AdminCustomerRequestError extends Error {
  readonly status: number

  constructor(status: number, response: ErrorResponse, fallback: string) {
    super(response.message || fallback)
    this.status = status
  }
}

function mapCustomer(customer: ApiCustomer): AdminCustomer {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    emailVerifiedAt: customer.email_verified_at ?? undefined,
    ordersCount: customer.orders_count ?? 0,
    addresses: (customer.addresses ?? []).map((address) => ({
      id: address.id,
      name: address.name,
      phone: address.phone,
      city: address.city,
      district: address.district,
      address: address.address,
      isDefault: address.is_default,
    })),
    orders: (customer.orders ?? []).map((order) => ({
      id: order.id,
      number: order.number,
      status: order.status,
      paymentStatus: order.payment_status,
      total: Number(order.total),
      trackingNumber: order.tracking_number ?? '',
      createdAt: order.created_at,
    })),
    createdAt: customer.created_at,
  }
}

async function request<T>(token: string, path: string, fallback: string): Promise<T> {
  const response = await fetch(apiUrl(path), {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  })
  const contentType = response.headers.get('content-type') ?? ''
  const data = contentType.includes('application/json') ? await response.json() as T & ErrorResponse : {} as T & ErrorResponse
  if (!response.ok) throw new AdminCustomerRequestError(response.status, data, fallback)
  return data
}

export async function listAdminCustomers(token: string, query: { search: string; page: number }) {
  const parameters = new URLSearchParams({ page: String(query.page), per_page: '15' })
  if (query.search) parameters.set('search', query.search)
  const response = await request<{ data: ApiCustomer[]; current_page: number; last_page: number; total: number }>(token, `/admin/customers?${parameters}`, 'Không thể tải danh sách khách hàng.')
  return {
    customers: response.data.map(mapCustomer),
    currentPage: response.current_page,
    lastPage: response.last_page,
    total: response.total,
  } satisfies AdminCustomerCatalog
}

export async function fetchAdminCustomer(token: string, id: number) {
  const response = await request<{ data: ApiCustomer }>(token, `/admin/customers/${id}`, 'Không thể tải hồ sơ khách hàng.')
  return mapCustomer(response.data)
}
