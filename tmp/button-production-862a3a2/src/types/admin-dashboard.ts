export interface AdminBestSeller {
  productId?: number
  name: string
  sku: string
  quantitySold: number
  revenue: number
}

export interface AdminDashboardStatistics {
  revenue: number
  orders: number
  customers: number
  products: number
  bestSellers: AdminBestSeller[]
}
