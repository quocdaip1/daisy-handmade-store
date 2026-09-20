import type { OrderStatus } from './admin-order'

export interface AdminCustomerAddress {
  id: number
  name: string
  phone: string
  city: string
  district: string
  address: string
  isDefault: boolean
}

export interface AdminCustomerOrder {
  id: number
  number: string
  status: OrderStatus
  paymentStatus: string
  total: number
  trackingNumber: string
  createdAt: string
}

export interface AdminCustomer {
  id: number
  name: string
  email: string
  emailVerifiedAt?: string
  ordersCount: number
  addresses: AdminCustomerAddress[]
  orders: AdminCustomerOrder[]
  createdAt: string
}

export interface AdminCustomerCatalog {
  customers: AdminCustomer[]
  currentPage: number
  lastPage: number
  total: number
}
