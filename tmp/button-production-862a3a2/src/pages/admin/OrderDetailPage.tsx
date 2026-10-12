import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { AdminOrderRequestError, fetchAdminOrder, updateAdminOrder } from '../../services/admin/orders'
import type { AdminOrder, OrderStatus } from '../../types/admin-order'
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from '../../types/admin-order'
import { formatCurrency } from '../../utils/formatCurrency'
import './order-management.css'

export function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const { session } = useAuth()
  const numericOrderId = Number(orderId)
  const hasValidOrderId = Number.isInteger(numericOrderId) && numericOrderId > 0
  const [order, setOrder] = useState<AdminOrder | null>(null)
  const [status, setStatus] = useState<OrderStatus>('pending')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let active = true
    if (!session || !hasValidOrderId) return
    void fetchAdminOrder(session.token, numericOrderId)
      .then((result) => { if (active) { setOrder(result); setStatus(result.status); setTrackingNumber(result.trackingNumber); setError(''); setIsLoading(false) } })
      .catch((requestError: unknown) => { if (active) { setError(requestError instanceof Error ? requestError.message : 'Không thể tải chi tiết đơn hàng.'); setIsLoading(false) } })
    return () => { active = false }
  }, [hasValidOrderId, numericOrderId, session])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!session || !order) return
    if (trackingNumber.length > 100) { setFieldErrors({ tracking_number: 'Mã vận đơn tối đa 100 ký tự.' }); return }
    setIsSubmitting(true)
    setFieldErrors({})
    setSuccess('')
    try {
      const updated = await updateAdminOrder(session.token, order.id, { status, trackingNumber })
      setOrder(updated)
      setStatus(updated.status)
      setTrackingNumber(updated.trackingNumber)
      setError('')
      setSuccess('Đã cập nhật đơn hàng.')
    } catch (requestError) {
      if (requestError instanceof AdminOrderRequestError) {
        setFieldErrors(Object.fromEntries(Object.entries(requestError.errors).map(([field, messages]) => [field, messages[0]])))
        if (!Object.keys(requestError.errors).length) setError(requestError.message)
      } else {
        setError(requestError instanceof Error ? requestError.message : 'Không thể cập nhật đơn hàng.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!hasValidOrderId) return <div className="admin-orders-error" role="alert">Mã đơn hàng không hợp lệ.<Link to="/admin/orders">Về danh sách</Link></div>
  if (isLoading) return <div className="admin-order-state" aria-live="polite">Đang tải chi tiết đơn hàng...</div>
  if (!order) return <div className="admin-orders-error" role="alert">{error || 'Không tìm thấy đơn hàng.'}<Link to="/admin/orders">Về danh sách</Link></div>

  return (
    <section className="admin-order-detail-page">
      <nav className="admin-order-breadcrumb"><Link to="/admin/orders">Đơn hàng</Link><span>/</span><span>{order.number}</span></nav>
      <header className="admin-order-detail-heading"><div><p>Chi tiết đơn hàng</p><h1>{order.number}</h1><span>{new Date(order.createdAt).toLocaleString('vi-VN')}</span></div><span className={`admin-order-status is-${order.status}`}>{ORDER_STATUS_LABELS[order.status]}</span></header>
      {error ? <div className="admin-orders-error" role="alert">{error}</div> : null}
      {success ? <div className="admin-orders-success" role="status">{success}</div> : null}
      <div className="admin-order-detail-grid">
        <div className="admin-order-detail-main">
          <section className="admin-order-card"><h2>Sản phẩm</h2>{order.items.map((item) => <div className="admin-order-item" key={item.id}><div><strong>{item.productName}</strong><small>{item.productSku || 'Không có SKU'} · {item.quantity} × {formatCurrency(item.price)}</small></div><strong>{formatCurrency(item.total)}</strong></div>)}<div className="admin-order-totals"><div><span>Tạm tính</span><strong>{formatCurrency(order.subtotal)}</strong></div><div><span>Giảm giá</span><strong>{formatCurrency(order.discount)}</strong></div><div><span>Vận chuyển</span><strong>{formatCurrency(order.shippingFee)}</strong></div><div className="is-total"><span>Tổng cộng</span><strong>{formatCurrency(order.total)}</strong></div></div></section>
          <section className="admin-order-card"><h2>Khách hàng và giao nhận</h2><dl><div><dt>Khách hàng</dt><dd>{order.customerName}</dd></div><div><dt>Email</dt><dd>{order.customerEmail}</dd></div><div><dt>Điện thoại</dt><dd>{order.customerPhone}</dd></div><div><dt>Địa chỉ</dt><dd>{order.shippingAddress}</dd></div><div><dt>Thanh toán</dt><dd>{order.paymentMethod} · {order.paymentStatus}</dd></div></dl></section>
        </div>
        <aside className="admin-order-card admin-order-update-card"><h2>Cập nhật xử lý</h2><form onSubmit={(event) => { void submit(event) }} noValidate><label><span>Trạng thái</span><select value={status} onChange={(event) => setStatus(event.target.value as OrderStatus)}>{ORDER_STATUSES.map((value) => <option key={value} value={value}>{ORDER_STATUS_LABELS[value]}</option>)}</select>{fieldErrors.status ? <small role="alert">{fieldErrors.status}</small> : null}</label><label><span>Mã vận đơn</span><input value={trackingNumber} maxLength={100} onChange={(event) => setTrackingNumber(event.target.value)} placeholder="Ví dụ: GHN123456" />{fieldErrors.tracking_number ? <small role="alert">{fieldErrors.tracking_number}</small> : null}</label><button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}</button></form></aside>
      </div>
    </section>
  )
}
