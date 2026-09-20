export const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'shipping', 'completed', 'cancelled', 'returned'] as const

export type OrderStatus = typeof ORDER_STATUSES[number]

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  preparing: 'Đang chuẩn bị',
  shipping: 'Đang giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  returned: 'Đã trả hàng',
}

export interface AdminOrderItem {
  id: number
  productId?: number
  productName: string
  productSku?: string
  quantity: number
  price: number
  total: number
}

export interface AdminOrder {
  id: number
  number: string
  status: OrderStatus
  paymentMethod: string
  paymentStatus: string
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: string
  subtotal: number
  discount: number
  shippingFee: number
  total: number
  trackingNumber: string
  items: AdminOrderItem[]
  createdAt: string
}

export interface AdminOrderCatalog {
  orders: AdminOrder[]
  currentPage: number
  lastPage: number
  total: number
}
