import { apiUrl } from '../../config/api'
import type { AdminDashboardStatistics } from '../../types/admin-dashboard'

interface ApiBestSeller {
  product_id?: number | null
  name: string
  sku?: string | null
  quantity_sold: number | string
  revenue: number | string
}

interface ApiDashboardStatistics {
  revenue: number | string
  orders: number
  customers: number
  products: number
  best_sellers: ApiBestSeller[]
}

interface ErrorResponse { message?: string }
interface DashboardResponse extends ErrorResponse { data?: ApiDashboardStatistics }

export async function fetchAdminDashboard(token: string): Promise<AdminDashboardStatistics> {
  const response = await fetch(apiUrl('/admin/dashboard'), {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  })
  const contentType = response.headers.get('content-type') ?? ''
  const payload: DashboardResponse = contentType.includes('application/json')
    ? await response.json() as DashboardResponse
    : {}

  if (!response.ok || !payload.data) {
    throw new Error(payload.message || 'Không thể tải số liệu tổng quan.')
  }

  return {
    revenue: Number(payload.data.revenue),
    orders: payload.data.orders,
    customers: payload.data.customers,
    products: payload.data.products,
    bestSellers: payload.data.best_sellers.map((item) => ({
      productId: item.product_id ?? undefined,
      name: item.name,
      sku: item.sku ?? '—',
      quantitySold: Number(item.quantity_sold),
      revenue: Number(item.revenue),
    })),
  }
}
