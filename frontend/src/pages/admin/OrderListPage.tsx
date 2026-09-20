import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { listAdminOrders } from '../../services/admin/orders'
import type { AdminOrderCatalog, OrderStatus } from '../../types/admin-order'
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from '../../types/admin-order'
import { formatCurrency } from '../../utils/formatCurrency'
import './order-management.css'

const emptyCatalog: AdminOrderCatalog = { orders: [], currentPage: 1, lastPage: 1, total: 0 }

export function OrderListPage() {
  const { session } = useAuth()
  const [catalog, setCatalog] = useState(emptyCatalog)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<OrderStatus | 'all'>('all')
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    if (!session) return
    void listAdminOrders(session.token, { search, status, page })
      .then((result) => { if (active) { setCatalog(result); setError(''); setIsLoading(false) } })
      .catch((requestError: unknown) => { if (active) { setError(requestError instanceof Error ? requestError.message : 'Không thể tải danh sách đơn hàng.'); setIsLoading(false) } })
    return () => { active = false }
  }, [page, reloadKey, search, session, status])

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    setPage(1)
    setSearch(searchInput.trim())
    setReloadKey((key) => key + 1)
  }

  return (
    <section className="admin-orders-page">
      <header className="admin-orders-heading"><div><p>Admin / Đơn hàng</p><h1>Quản lý đơn hàng</h1><span>{catalog.total} đơn hàng</span></div></header>
      <div className="admin-orders-toolbar">
        <form onSubmit={submitSearch}><label htmlFor="admin-order-search">Tìm kiếm</label><div><input id="admin-order-search" value={searchInput} maxLength={100} placeholder="Mã đơn, khách hàng, email, SĐT, tracking" onChange={(event) => setSearchInput(event.target.value)} /><button type="submit">Tìm</button></div></form>
        <label><span>Trạng thái</span><select value={status} onChange={(event) => { setIsLoading(true); setPage(1); setStatus(event.target.value as OrderStatus | 'all') }}><option value="all">Tất cả</option>{ORDER_STATUSES.map((value) => <option key={value} value={value}>{ORDER_STATUS_LABELS[value]}</option>)}</select></label>
      </div>
      {error ? <div className="admin-orders-error" role="alert">{error}<button type="button" onClick={() => { setError(''); setIsLoading(true); setReloadKey((key) => key + 1) }}>Thử lại</button></div> : null}
      {isLoading ? <div className="admin-order-state" aria-live="polite">Đang tải đơn hàng...</div> : null}
      {!isLoading && !catalog.orders.length ? <div className="admin-order-state">Không tìm thấy đơn hàng phù hợp.</div> : null}
      {!isLoading && catalog.orders.length ? <div className="admin-order-table-wrap"><table className="admin-order-table"><thead><tr><th>Đơn hàng</th><th>Khách hàng</th><th>Tổng tiền</th><th>Trạng thái</th><th>Tracking</th><th><span className="sr-only">Thao tác</span></th></tr></thead><tbody>{catalog.orders.map((order) => <tr key={order.id}><td><div className="admin-order-identity"><strong>{order.number}</strong><small>{new Date(order.createdAt).toLocaleString('vi-VN')}</small></div></td><td><div className="admin-order-identity"><strong>{order.customerName}</strong><small>{order.customerPhone}</small></div></td><td>{formatCurrency(order.total)}</td><td><span className={`admin-order-status is-${order.status}`}>{ORDER_STATUS_LABELS[order.status]}</span></td><td>{order.trackingNumber || '—'}</td><td><Link className="admin-order-detail-link" to={`/admin/orders/${order.id}`}>Chi tiết</Link></td></tr>)}</tbody></table></div> : null}
      <nav className="admin-order-pagination" aria-label="Phân trang đơn hàng"><button type="button" disabled={isLoading || catalog.currentPage <= 1} onClick={() => { setIsLoading(true); setPage((value) => value - 1) }}>Trang trước</button><span>Trang {catalog.currentPage}/{catalog.lastPage}</span><button type="button" disabled={isLoading || catalog.currentPage >= catalog.lastPage} onClick={() => { setIsLoading(true); setPage((value) => value + 1) }}>Trang sau</button></nav>
    </section>
  )
}
