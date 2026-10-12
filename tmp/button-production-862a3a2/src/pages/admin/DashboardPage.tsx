import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { fetchAdminDashboard } from '../../services/admin/dashboard'
import type { AdminDashboardStatistics } from '../../types/admin-dashboard'
import './dashboard.css'

const currencyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
const numberFormatter = new Intl.NumberFormat('vi-VN')

export function DashboardPage() {
  const { session } = useAuth()
  const [statistics, setStatistics] = useState<AdminDashboardStatistics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    if (!session) return

    void fetchAdminDashboard(session.token)
      .then((result) => {
        if (active) {
          setStatistics(result)
          setError('')
          setIsLoading(false)
        }
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : 'Không thể tải số liệu tổng quan.')
          setIsLoading(false)
        }
      })

    return () => { active = false }
  }, [reloadKey, session])

  return (
    <section className="admin-dashboard-page">
      <header className="admin-dashboard-heading">
        <div><p>Admin / Tổng quan</p><h1>Dashboard</h1></div>
        <span>Số liệu cập nhật từ hệ thống bán hàng</span>
      </header>

      {error ? <div className="admin-dashboard-error" role="alert">{error}<button type="button" onClick={() => { setError(''); setIsLoading(true); setReloadKey((key) => key + 1) }}>Thử lại</button></div> : null}
      {isLoading ? <div className="admin-dashboard-state" aria-live="polite">Đang tải số liệu...</div> : null}

      {!isLoading && statistics ? <>
        <div className="admin-dashboard-cards" aria-label="Chỉ số kinh doanh">
          <article><span>Doanh thu đã thanh toán</span><strong>{currencyFormatter.format(statistics.revenue)}</strong></article>
          <article><span>Đơn hàng</span><strong>{numberFormatter.format(statistics.orders)}</strong></article>
          <article><span>Khách hàng</span><strong>{numberFormatter.format(statistics.customers)}</strong></article>
          <article><span>Sản phẩm</span><strong>{numberFormatter.format(statistics.products)}</strong></article>
        </div>

        <section className="admin-dashboard-best-sellers">
          <div><p>Hiệu quả sản phẩm</p><h2>Sản phẩm bán chạy</h2></div>
          {statistics.bestSellers.length ? <div className="admin-dashboard-table-wrap"><table><thead><tr><th>Sản phẩm</th><th>SKU</th><th>Đã bán</th><th>Doanh thu</th></tr></thead><tbody>{statistics.bestSellers.map((product, index) => <tr key={`${product.productId ?? product.name}-${index}`}><td><span className="admin-dashboard-rank">{index + 1}</span><strong>{product.name}</strong></td><td>{product.sku}</td><td>{numberFormatter.format(product.quantitySold)}</td><td>{currencyFormatter.format(product.revenue)}</td></tr>)}</tbody></table></div> : <div className="admin-dashboard-empty">Chưa có sản phẩm từ đơn hàng đã thanh toán.</div>}
        </section>
      </> : null}
    </section>
  )
}
