import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { fetchAdminCustomer } from '../../services/admin/customers'
import type { AdminCustomer } from '../../types/admin-customer'
import { ORDER_STATUS_LABELS } from '../../types/admin-order'
import { formatCurrency } from '../../utils/formatCurrency'
import './customer-management.css'

export function CustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>()
  const { session } = useAuth()
  const numericCustomerId = Number(customerId)
  const hasValidCustomerId = Number.isInteger(numericCustomerId) && numericCustomerId > 0
  const [customer, setCustomer] = useState<AdminCustomer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    if (!session || !hasValidCustomerId) return
    void fetchAdminCustomer(session.token, numericCustomerId)
      .then((result) => { if (active) { setCustomer(result); setError(''); setIsLoading(false) } })
      .catch((requestError: unknown) => { if (active) { setError(requestError instanceof Error ? requestError.message : 'Không thể tải hồ sơ khách hàng.'); setIsLoading(false) } })
    return () => { active = false }
  }, [hasValidCustomerId, numericCustomerId, session])

  if (!hasValidCustomerId) return <div className="admin-customers-error" role="alert">Mã khách hàng không hợp lệ.<Link to="/admin/customers">Về danh sách</Link></div>
  if (isLoading) return <div className="admin-customer-state" aria-live="polite">Đang tải hồ sơ khách hàng...</div>
  if (!customer) return <div className="admin-customers-error" role="alert">{error || 'Không tìm thấy khách hàng.'}<Link to="/admin/customers">Về danh sách</Link></div>

  return (
    <section className="admin-customer-detail-page">
      <nav className="admin-customer-breadcrumb"><Link to="/admin/customers">Khách hàng</Link><span>/</span><span>{customer.name}</span></nav>
      <header className="admin-customer-detail-heading"><div className="admin-customer-profile-title"><span aria-hidden="true">{customer.name.trim().charAt(0).toUpperCase()}</span><div><p>Hồ sơ khách hàng</p><h1>{customer.name}</h1><small>Tham gia {new Date(customer.createdAt).toLocaleDateString('vi-VN')}</small></div></div><strong>{customer.ordersCount} đơn hàng</strong></header>
      <div className="admin-customer-detail-grid">
        <div className="admin-customer-detail-main">
          <section className="admin-customer-card"><h2>Lịch sử đơn hàng</h2>{customer.orders.length ? <div className="admin-customer-orders"><div className="admin-customer-order-row is-heading"><span>Đơn hàng</span><span>Ngày</span><span>Trạng thái</span><span>Tổng tiền</span></div>{customer.orders.map((order) => <Link to={`/admin/orders/${order.id}`} className="admin-customer-order-row" key={order.id}><strong>{order.number}</strong><span>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span><span>{ORDER_STATUS_LABELS[order.status]}</span><strong>{formatCurrency(order.total)}</strong></Link>)}</div> : <p className="admin-customer-empty">Khách hàng chưa có đơn hàng.</p>}</section>
        </div>
        <aside className="admin-customer-side">
          <section className="admin-customer-card"><h2>Thông tin liên hệ</h2><dl><div><dt>Họ tên</dt><dd>{customer.name}</dd></div><div><dt>Email</dt><dd>{customer.email}</dd></div><div><dt>Xác minh email</dt><dd>{customer.emailVerifiedAt ? 'Đã xác minh' : 'Chưa xác minh'}</dd></div></dl><p className="admin-customer-readonly">Hồ sơ chỉ đọc. Phase này không cho phép chỉnh sửa password.</p></section>
          <section className="admin-customer-card"><h2>Sổ địa chỉ</h2>{customer.addresses.length ? <div className="admin-customer-addresses">{customer.addresses.map((address) => <article key={address.id}><strong>{address.name}{address.isDefault ? <small>Mặc định</small> : null}</strong><span>{address.phone}</span><p>{address.address}, {address.district}, {address.city}</p></article>)}</div> : <p className="admin-customer-empty">Khách hàng chưa lưu địa chỉ.</p>}</section>
        </aside>
      </div>
    </section>
  )
}
