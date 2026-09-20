import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { listAdminCustomers } from '../../services/admin/customers'
import type { AdminCustomerCatalog } from '../../types/admin-customer'
import './customer-management.css'

const emptyCatalog: AdminCustomerCatalog = { customers: [], currentPage: 1, lastPage: 1, total: 0 }

export function CustomerListPage() {
  const { session } = useAuth()
  const [catalog, setCatalog] = useState(emptyCatalog)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    if (!session) return
    void listAdminCustomers(session.token, { search, page })
      .then((result) => { if (active) { setCatalog(result); setError(''); setIsLoading(false) } })
      .catch((requestError: unknown) => { if (active) { setError(requestError instanceof Error ? requestError.message : 'Không thể tải danh sách khách hàng.'); setIsLoading(false) } })
    return () => { active = false }
  }, [page, reloadKey, search, session])

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    setPage(1)
    setSearch(searchInput.trim())
    setReloadKey((key) => key + 1)
  }

  return (
    <section className="admin-customers-page">
      <header className="admin-customers-heading"><div><p>Admin / Khách hàng</p><h1>Quản lý khách hàng</h1><span>{catalog.total} khách hàng</span></div></header>
      <div className="admin-customers-toolbar"><form onSubmit={submitSearch}><label htmlFor="admin-customer-search">Tìm kiếm khách hàng</label><div><input id="admin-customer-search" value={searchInput} maxLength={100} placeholder="Tên hoặc email" onChange={(event) => setSearchInput(event.target.value)} /><button type="submit">Tìm</button></div></form></div>
      {error ? <div className="admin-customers-error" role="alert">{error}<button type="button" onClick={() => { setError(''); setIsLoading(true); setReloadKey((key) => key + 1) }}>Thử lại</button></div> : null}
      {isLoading ? <div className="admin-customer-state" aria-live="polite">Đang tải khách hàng...</div> : null}
      {!isLoading && !catalog.customers.length ? <div className="admin-customer-state">Không tìm thấy khách hàng phù hợp.</div> : null}
      {!isLoading && catalog.customers.length ? <div className="admin-customer-table-wrap"><table className="admin-customer-table"><thead><tr><th>Khách hàng</th><th>Email</th><th>Đơn hàng</th><th>Ngày tham gia</th><th><span className="sr-only">Thao tác</span></th></tr></thead><tbody>{catalog.customers.map((customer) => <tr key={customer.id}><td><div className="admin-customer-identity"><span aria-hidden="true">{customer.name.trim().charAt(0).toUpperCase()}</span><strong>{customer.name}</strong></div></td><td>{customer.email}</td><td>{customer.ordersCount}</td><td>{new Date(customer.createdAt).toLocaleDateString('vi-VN')}</td><td><Link className="admin-customer-detail-link" to={`/admin/customers/${customer.id}`}>Xem hồ sơ</Link></td></tr>)}</tbody></table></div> : null}
      <nav className="admin-customer-pagination" aria-label="Phân trang khách hàng"><button type="button" disabled={isLoading || catalog.currentPage <= 1} onClick={() => { setIsLoading(true); setPage((value) => value - 1) }}>Trang trước</button><span>Trang {catalog.currentPage}/{catalog.lastPage}</span><button type="button" disabled={isLoading || catalog.currentPage >= catalog.lastPage} onClick={() => { setIsLoading(true); setPage((value) => value + 1) }}>Trang sau</button></nav>
    </section>
  )
}
