import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchOrderDetail, fetchOrders, type CustomerOrder } from '../services/account'
import { AUTH_TOKEN_KEY } from '../services/auth'
import { formatCurrency } from '../utils/formatCurrency'

export function OrderHistoryPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [detail, setDetail] = useState<CustomerOrder | null>(null)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [loadedRequest, setLoadedRequest] = useState('')
  const [error, setError] = useState('')
  const requestKey = orderId ? `order:${orderId}` : `page:${page}`

  useEffect(() => {
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) { navigate('/dang-nhap', { replace: true }); return }
    let active = true
    const request = orderId ? fetchOrderDetail(token, Number(orderId)) : fetchOrders(token, page)
    void request.then((response) => {
      if (!active) return
      if ('data' in response) { setOrders(response.data); setLastPage(response.meta.last_page) } else setDetail(response)
      setError('')
      setLoadedRequest(requestKey)
    }).catch((loadError) => { if (active) { setError(loadError instanceof Error ? loadError.message : 'Không thể tải đơn hàng.'); setLoadedRequest(requestKey) } })
    return () => { active = false }
  }, [navigate, orderId, page, requestKey])

  if (loadedRequest !== requestKey) return <div className="detail-loading-copy" aria-label="Đang tải đơn hàng" aria-live="polite"><span /><span /><span /></div>
  if (error) return <div className="empty-state" role="alert"><h1>Chưa thể tải đơn hàng</h1><p>{error}</p><Link to="/tai-khoan" className="button button-primary">Về tài khoản</Link></div>

  if (orderId && detail) return <section className="content-page"><nav className="detail-breadcrumb"><Link to="/tai-khoan">Tài khoản</Link><span>/</span><Link to="/don-hang">Đơn hàng</Link><span>/</span><span>{detail.number}</span></nav><h1>Đơn hàng {detail.number}</h1><div className="info-card"><p><strong>Trạng thái:</strong> {detail.status}</p><p><strong>Thanh toán:</strong> {detail.payment_status}</p><p><strong>Địa chỉ:</strong> {detail.shipping_address}</p><p><strong>Ngày tạo:</strong> {new Date(detail.created_at).toLocaleDateString('vi-VN')}</p></div><div className="info-card"><h2>Sản phẩm</h2>{detail.items.map((item) => <div key={item.id} className="summary-lines"><div><span>{item.product_name} × {item.quantity}</span><strong>{formatCurrency(item.total)}</strong></div></div>)}<div className="summary-lines"><div><span>Tạm tính</span><strong>{formatCurrency(detail.subtotal)}</strong></div><div><span>Giảm giá</span><strong>{formatCurrency(detail.discount)}</strong></div><div><span>Vận chuyển</span><strong>{formatCurrency(detail.shipping_fee)}</strong></div></div><div className="summary-total"><span>Tổng cộng</span><strong>{formatCurrency(detail.total)}</strong></div></div></section>

  return <section className="content-page"><p className="eyebrow">Tài khoản Daisy</p><h1>Lịch sử đơn hàng</h1>{orders.length ? <div>{orders.map((order) => <article key={order.id} className="info-card"><h2>{order.number}</h2><p>{new Date(order.created_at).toLocaleDateString('vi-VN')} · {order.status}</p><p><strong>{formatCurrency(order.total)}</strong></p><Link to={`/don-hang/${order.id}`} className="section-link">Xem chi tiết →</Link></article>)}</div> : <div className="empty-state"><p>Bạn chưa có đơn hàng nào.</p><Link to="/san-pham" className="button button-primary">Khám phá sản phẩm</Link></div>}{lastPage > 1 ? <nav className="catalog-pagination" aria-label="Phân trang đơn hàng"><button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>←</button><span>Trang {page}/{lastPage}</span><button type="button" disabled={page === lastPage} onClick={() => setPage((current) => current + 1)}>→</button></nav> : null}</section>
}
