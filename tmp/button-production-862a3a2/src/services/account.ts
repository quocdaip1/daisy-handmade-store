import { apiUrl } from '../config/api'
import type { OrderPayment } from './orders'

export interface CustomerOrder {
  id: number
  number: string
  status: string
  payment_method: 'cod' | 'bank_transfer'
  payment_status: string
  customer_name: string
  customer_email: string
  customer_phone: string
  shipping_address: string
  subtotal: number
  discount: number
  shipping_fee: number
  total: number
  tracking_number: string | null
  items: Array<{ id: number; product_id: number | null; product_name: string; quantity: number; price: number; total: number }>
  payment?: OrderPayment
  created_at: string
}

interface OrderPage { data: CustomerOrder[]; meta: { current_page: number; last_page: number; total: number } }

async function getAuthenticated<T>(path: string, token: string): Promise<T> {
  const response = await fetch(apiUrl(path), { headers: { Authorization: `Bearer ${token}` } })
  const data = await response.json() as T & { message?: string }
  if (!response.ok) throw new Error(response.status === 401 ? 'Phiên đăng nhập đã hết hạn.' : data.message || 'Không thể tải dữ liệu tài khoản.')
  return data
}

export function fetchOrders(token: string, page = 1): Promise<OrderPage> {
  return getAuthenticated<OrderPage>(`/orders?page=${page}&per_page=10`, token)
}

export async function fetchOrderDetail(token: string, orderId: number): Promise<CustomerOrder> {
  const response = await getAuthenticated<{ data: CustomerOrder }>(`/orders/${orderId}`, token)
  return response.data
}
