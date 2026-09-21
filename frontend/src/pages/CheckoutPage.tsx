import { useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import { CartContext } from '../context/CartContext'
import { CheckoutRequestError, createOrder, previewCheckout, validateCoupon, type CheckoutPreview, type CreateOrderResponse } from '../services/orders'
import { formatCurrency } from '../utils/formatCurrency'

interface FormErrors { fullName?: string; phone?: string; email?: string; city?: string; district?: string; address?: string; coupon?: string }

export function CheckoutPage() {
  const { cartItems, totalItems, totalPrice, clearCart } = useContext(CartContext)
  const [error, setError] = useState('')
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [formData, setFormData] = useState({ fullName: '', phone: '', email: '', city: '', district: '', address: '', note: '' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [couponCode, setCouponCode] = useState('')
  const [couponMessage, setCouponMessage] = useState('')
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false)
  const [preview, setPreview] = useState<CheckoutPreview | null>(null)
  const [previewCartSignature, setPreviewCartSignature] = useState('')
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [orderResult, setOrderResult] = useState<CreateOrderResponse | null>(null)
  const [qrImageFailed, setQrImageFailed] = useState(false)

  const cartSignature = cartItems.map((item) => `${item.product.id}:${item.quantity}`).sort().join('|')
  const activePreview = previewCartSignature === cartSignature ? preview : null

  const invalidatePreview = () => {
    setPreview(null)
    setPreviewCartSignature('')
    setCouponMessage('')
    setError('')
  }

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }))
    invalidatePreview()
    if (field in errors) setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const focusFirstError = () => {
    window.requestAnimationFrame(() => {
      const field = document.querySelector<HTMLInputElement | HTMLTextAreaElement>('.modern-checkout [aria-invalid="true"]')
      field?.focus({ preventScroll: true })
      field?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  const validate = () => {
    const nextErrors: FormErrors = {}
    if (!formData.fullName.trim()) nextErrors.fullName = 'Vui lòng nhập họ và tên.'
    if (!formData.phone.trim()) nextErrors.phone = 'Vui lòng nhập số điện thoại.'
    else if (!/^[0-9+() .-]{8,20}$/.test(formData.phone.trim())) nextErrors.phone = 'Số điện thoại không hợp lệ.'
    if (!formData.email.trim()) nextErrors.email = 'Vui lòng nhập email.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) nextErrors.email = 'Email không hợp lệ.'
    if (!formData.city.trim()) nextErrors.city = 'Vui lòng nhập tỉnh/thành phố.'
    if (!formData.district.trim()) nextErrors.district = 'Vui lòng nhập quận/huyện.'
    if (!formData.address.trim()) nextErrors.address = 'Vui lòng nhập địa chỉ cụ thể.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) focusFirstError()
    return Object.keys(nextErrors).length === 0
  }

  const mapBackendErrors = (requestError: CheckoutRequestError) => {
    const backend = requestError.errors
    setErrors((current) => ({
      ...current,
      fullName: backend['address.name']?.[0] ?? backend.customer_name?.[0],
      phone: backend['address.phone']?.[0] ?? backend.customer_phone?.[0],
      email: backend.customer_email?.[0],
      city: backend['address.city']?.[0],
      district: backend['address.district']?.[0],
      address: backend['address.address']?.[0] ?? backend.shipping_address?.[0],
      coupon: backend.coupon_code?.[0],
    }))
    if (requestError.status === 401) return 'Vui lòng đăng nhập để tiếp tục thanh toán.'
    return backend.preview_id?.[0] ?? backend.cart?.[0] ?? backend.items?.[0] ?? requestError.message
  }

  const checkCoupon = async () => {
    if (!couponCode.trim()) return
    setIsCheckingCoupon(true)
    setCouponMessage('')
    setErrors((current) => ({ ...current, coupon: undefined }))
    invalidatePreview()
    try {
      const token = window.localStorage.getItem('viet-ngoc-auth-token') ?? undefined
      const result = await validateCoupon(couponCode, totalPrice, token)
      setCouponCode(result.code)
      setCouponMessage(`Mã hợp lệ, giảm dự kiến ${formatCurrency(result.discount)}. Tổng cuối sẽ được xác nhận khi preview.`)
    } catch (couponError) {
      const message = couponError instanceof CheckoutRequestError ? couponError.errors.coupon_code?.[0] ?? couponError.message : 'Chưa thể kiểm tra mã ưu đãi.'
      setErrors((current) => ({ ...current, coupon: message }))
    } finally { setIsCheckingCoupon(false) }
  }

  const checkoutAddress = () => ({
    name: formData.fullName.trim(),
    phone: formData.phone.trim(),
    city: formData.city.trim(),
    district: formData.district.trim(),
    address: formData.address.trim(),
  })

  const handlePreview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isPreviewing || !validate()) return
    const token = window.localStorage.getItem('viet-ngoc-auth-token') ?? ''
    if (!token) { setError('Vui lòng đăng nhập để kiểm tra thanh toán.'); return }
    setIsPreviewing(true)
    setError('')
    setErrors((current) => ({ ...current, coupon: undefined }))
    try {
      const result = await previewCheckout({
        items: cartItems.map((item) => ({ product_id: item.product.id, quantity: item.quantity })),
        address: checkoutAddress(),
        customer_email: formData.email.trim(),
        payment_method: 'bank_transfer',
        ...(formData.note.trim() ? { note: formData.note.trim() } : {}),
        ...(couponCode.trim() ? { coupon_code: couponCode.trim() } : {}),
      }, token)
      setPreview(result)
      setPreviewCartSignature(cartSignature)
      setCouponMessage(result.coupon ? `Mã ${result.coupon.code} đã được áp dụng. Bạn được giảm ${formatCurrency(result.coupon.discount)}.` : '')
    } catch (previewError) {
      invalidatePreview()
      setError(previewError instanceof CheckoutRequestError ? mapBackendErrors(previewError) : 'Chưa thể kiểm tra thanh toán lúc này.')
      focusFirstError()
    } finally { setIsPreviewing(false) }
  }

  const handleCreateOrder = async () => {
    if (!activePreview || isCreatingOrder || !validate()) return
    const token = window.localStorage.getItem('viet-ngoc-auth-token') ?? ''
    if (!token) { setError('Vui lòng đăng nhập để đặt hàng.'); return }
    setIsCreatingOrder(true)
    setError('')
    try {
      const result = await createOrder({
        preview_id: activePreview.preview_id,
        items: cartItems.map((item) => ({ product_id: item.product.id, quantity: item.quantity })),
        customer_name: formData.fullName.trim(),
        customer_email: formData.email.trim(),
        customer_phone: formData.phone.trim(),
        shipping_address: `${formData.address.trim()}, ${formData.district.trim()}, ${formData.city.trim()}`,
        payment_method: 'bank_transfer',
        ...(couponCode.trim() ? { coupon_code: couponCode.trim() } : {}),
        ...(formData.note.trim() ? { note: formData.note.trim() } : {}),
      }, token)
      setOrderResult(result)
      clearCart()
    } catch (orderError) {
      if (orderError instanceof CheckoutRequestError) {
        if (orderError.errors.preview_id || orderError.errors.cart || orderError.errors.items) invalidatePreview()
        setError(mapBackendErrors(orderError))
        focusFirstError()
      } else setError('Không thể tạo đơn hàng lúc này. Vui lòng thử lại.')
    } finally { setIsCreatingOrder(false) }
  }

  if (orderResult) return <div className="empty-state checkout-success"><span aria-hidden="true">✓</span><p className="eyebrow">Daisy Handmade Store</p><h1>Thông tin chuyển khoản</h1><p>Đơn hàng <strong>{orderResult.order.number}</strong> đã được tạo. Vui lòng chuyển khoản theo thông tin bên dưới.</p><div className="qr-transfer-layout"><div className={`qr-transfer-image ${orderResult.payment.qr_image_url && !qrImageFailed ? '' : 'is-empty'}`}>{orderResult.payment.qr_image_url && !qrImageFailed ? <img src={orderResult.payment.qr_image_url} alt="Mã QR chuyển khoản đơn hàng Daisy" onError={() => setQrImageFailed(true)} /> : <div><span aria-hidden="true">▣</span><strong>Chưa có mã QR thanh toán</strong><small>Vui lòng chuyển khoản bằng thông tin tài khoản bên cạnh.</small></div>}</div><div className="qr-transfer-details"><p className="eyebrow">Chi tiết thanh toán</p><dl><div><dt>Mã đơn hàng</dt><dd>{orderResult.order.number}</dd></div><div><dt>Ngân hàng</dt><dd>{orderResult.payment.bank_name}</dd></div><div><dt>Số tài khoản</dt><dd>{orderResult.payment.account_number}</dd></div><div><dt>Chủ tài khoản</dt><dd>{orderResult.payment.account_owner}</dd></div><div><dt>Số tiền</dt><dd>{formatCurrency(orderResult.payment.amount)}</dd></div><div><dt>Nội dung</dt><dd>{orderResult.payment.transfer_content}</dd></div></dl><small>Đơn hàng sẽ được xác nhận sau khi Daisy kiểm tra thanh toán.</small></div></div><Link to="/san-pham" className="button button-primary">Tiếp tục mua sắm</Link></div>

  if (cartItems.length === 0) return <div className="empty-state checkout-empty"><span aria-hidden="true">✿</span><h1>Giỏ hàng đang trống</h1><p>Vui lòng thêm sản phẩm trước khi thanh toán.</p><Link to="/san-pham" className="button button-primary">Quay lại cửa hàng</Link></div>

  const displayedSubtotal = activePreview?.subtotal ?? totalPrice
  const displayedDiscount = activePreview?.discount ?? 0
  const displayedTotal = activePreview?.total ?? totalPrice

  return (
    <section className="modern-checkout">
      <nav className="checkout-steps" aria-label="Tiến trình mua hàng"><span><b>1</b>Giỏ hàng</span><i /><span className="active"><b>2</b>Kiểm tra thanh toán</span><i /><span><b>3</b>Đặt hàng</span></nav>
      <header className="checkout-heading"><p className="eyebrow">Daisy Handmade Store</p><h1>Hoàn tất đơn hàng</h1><p>Kiểm tra tổng tiền với backend trước khi xác nhận đặt hàng.</p></header>

      <form className="checkout-layout" onSubmit={handlePreview} noValidate>
        <div className="checkout-form-column">
          <section className="checkout-panel"><div className="checkout-panel-title"><span>01</span><div><h2>Thông tin khách hàng</h2><p>Thông tin dùng để xác nhận đơn và địa chỉ nhận hàng.</p></div></div><div className="checkout-fields two-columns">
            <label className={errors.fullName ? 'has-error' : ''}><span>Họ và tên <b>*</b></span><input autoComplete="name" value={formData.fullName} onChange={(event) => updateField('fullName', event.target.value)} aria-invalid={Boolean(errors.fullName)} />{errors.fullName ? <small>{errors.fullName}</small> : null}</label>
            <label className={errors.phone ? 'has-error' : ''}><span>Số điện thoại <b>*</b></span><input type="tel" autoComplete="tel" value={formData.phone} onChange={(event) => updateField('phone', event.target.value)} aria-invalid={Boolean(errors.phone)} />{errors.phone ? <small>{errors.phone}</small> : null}</label>
            <label className={`full-field ${errors.email ? 'has-error' : ''}`}><span>Email <b>*</b></span><input type="email" autoComplete="email" value={formData.email} onChange={(event) => updateField('email', event.target.value)} aria-invalid={Boolean(errors.email)} />{errors.email ? <small>{errors.email}</small> : null}</label>
          </div></section>

          <section className="checkout-panel"><div className="checkout-panel-title"><span>02</span><div><h2>Địa chỉ giao hàng</h2><p>Thông tin sẽ được backend kiểm tra khi tính tổng.</p></div></div><div className="checkout-fields two-columns">
            <label className={errors.city ? 'has-error' : ''}><span>Tỉnh / Thành phố <b>*</b></span><input autoComplete="address-level1" value={formData.city} onChange={(event) => updateField('city', event.target.value)} aria-invalid={Boolean(errors.city)} />{errors.city ? <small>{errors.city}</small> : null}</label>
            <label className={errors.district ? 'has-error' : ''}><span>Quận / Huyện <b>*</b></span><input autoComplete="address-level2" value={formData.district} onChange={(event) => updateField('district', event.target.value)} aria-invalid={Boolean(errors.district)} />{errors.district ? <small>{errors.district}</small> : null}</label>
            <label className={`full-field ${errors.address ? 'has-error' : ''}`}><span>Địa chỉ cụ thể <b>*</b></span><input autoComplete="street-address" value={formData.address} onChange={(event) => updateField('address', event.target.value)} aria-invalid={Boolean(errors.address)} />{errors.address ? <small>{errors.address}</small> : null}</label>
            <label className="full-field"><span>Ghi chú <i>(tùy chọn)</i></span><textarea rows={3} value={formData.note} onChange={(event) => updateField('note', event.target.value)} /></label>
          </div></section>

          <section className="checkout-panel"><div className="checkout-panel-title"><span>03</span><div><h2>Ưu đãi</h2><p>Mã được backend kiểm tra lại với giá sản phẩm hiện tại.</p></div></div><div className="voucher-box"><label htmlFor="checkout-coupon">Mã ưu đãi</label><div><input id="checkout-coupon" value={couponCode} aria-invalid={Boolean(errors.coupon)} onChange={(event) => { setCouponCode(event.target.value); invalidatePreview(); setErrors((current) => ({ ...current, coupon: undefined })) }} maxLength={50} /><button type="button" onClick={() => void checkCoupon()} disabled={!couponCode.trim() || isCheckingCoupon}>{isCheckingCoupon ? 'Đang kiểm tra' : 'Kiểm tra'}</button></div>{couponMessage ? <small className="success">{couponMessage}</small> : null}{errors.coupon ? <small className="invalid">{errors.coupon}</small> : null}</div></section>

          <section className="checkout-panel"><div className="checkout-panel-title"><span>04</span><div><h2>Phương thức thanh toán</h2><p>Website hiện chỉ nhận thanh toán bằng chuyển khoản ngân hàng.</p></div></div><div className="payment-options"><label className="selected"><input type="radio" name="payment" checked readOnly /><span className="payment-icon">▣</span><div><strong>Chuyển khoản ngân hàng</strong><small>Thông tin tài khoản và QR chỉ hiển thị sau khi tạo đơn thành công.</small></div><i>✓</i></label></div></section>
          {error ? <p className="checkout-error" role="alert">{error}</p> : null}
        </div>

        <aside className="checkout-summary"><h2>Tóm tắt đơn hàng</h2><div className="checkout-products">{(activePreview?.items ?? cartItems.map((item) => ({ product_id: item.product.id, name: item.product.name, quantity: item.quantity, unit_price: item.product.price, line_total: item.product.price * item.quantity }))).map((item) => { const cartItem = cartItems.find((candidate) => candidate.product.id === item.product_id); return <div key={item.product_id}><span>{cartItem?.product.images[0] ? <img src={cartItem.product.images[0]} alt="" /> : '✿'}<b>{item.quantity}</b></span><p><strong>{item.name}</strong><small>{cartItem?.product.material}</small></p><em>{formatCurrency(item.line_total)}</em></div> })}</div><div className="summary-lines"><div><span>Tạm tính ({totalItems} món)</span><strong>{formatCurrency(displayedSubtotal)}</strong></div><div><span>Giảm giá</span><strong>{displayedDiscount > 0 ? `-${formatCurrency(displayedDiscount)}` : formatCurrency(0)}</strong></div><div><span>Phí giao hàng</span><strong>{formatCurrency(activePreview?.shipping_fee ?? 0)}</strong></div></div><div className="checkout-grand-total"><span>Tổng thanh toán</span><strong>{formatCurrency(displayedTotal)}</strong></div>{activePreview ? <button type="button" className="button button-primary checkout-submit" disabled={isCreatingOrder} onClick={() => void handleCreateOrder()}>{isCreatingOrder ? 'Đang đặt hàng...' : 'Đặt hàng'} <span aria-hidden="true">→</span></button> : <button type="submit" className={`button button-primary checkout-submit ${isPreviewing ? 'is-loading' : ''}`} disabled={isPreviewing}>{isPreviewing ? <><i className="checkout-spinner" aria-hidden="true" />Đang tính tổng...</> : 'Xem tổng thanh toán'} <span aria-hidden="true">→</span></button>}<p className="checkout-terms">Tổng tiền do backend xác nhận; preview hết hạn sau 15 phút hoặc khi thông tin thay đổi.</p><div className="summary-assurance"><span>✓ Backend xác nhận lại giá và tồn kho</span><span>✓ Transaction bảo vệ order và stock</span></div></aside>
      </form>
    </section>
  )
}
