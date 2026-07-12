import { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CartContext } from '../context/CartContext'
import { CheckoutRequestError, createOrder, fetchShippingMethods, previewCheckout, validateCoupon, type CheckoutPreview, type CreateOrderResponse, type ShippingMethod } from '../services/orders'
import { formatCurrency } from '../utils/formatCurrency'

interface FormErrors { fullName?: string; phone?: string; email?: string; city?: string; district?: string; address?: string; shipping?: string; coupon?: string }
type PaymentMethod = 'cod' | 'bank_transfer'

export function CheckoutPage() {
  const { cartItems, totalItems, totalPrice, clearCart } = useContext(CartContext)
  const [error, setError] = useState('')
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod')
  const [formData, setFormData] = useState({ fullName: '', phone: '', email: '', city: '', district: '', address: '', note: '' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([])
  const [shippingMethodId, setShippingMethodId] = useState<number | null>(null)
  const [shippingError, setShippingError] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponMessage, setCouponMessage] = useState('')
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false)
  const [preview, setPreview] = useState<CheckoutPreview | null>(null)
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [orderResult, setOrderResult] = useState<CreateOrderResponse | null>(null)

  useEffect(() => {
    let active = true
    void fetchShippingMethods(totalPrice).then((methods) => {
      if (!active) return
      setShippingMethods(methods)
      setShippingMethodId((current) => current && methods.some((method) => method.id === current) ? current : methods[0]?.id ?? null)
      setShippingError(methods.length ? '' : 'Chưa có phương thức vận chuyển khả dụng.')
    }).catch(() => { if (active) setShippingError('Chưa thể tải phương thức vận chuyển.') })
    return () => { active = false }
  }, [totalPrice])

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }))
    setPreview(null)
    if (field in errors) setErrors((current) => ({ ...current, [field]: undefined }))
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
    if (!shippingMethodId) nextErrors.shipping = 'Vui lòng chọn phương thức vận chuyển.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const mapBackendErrors = (requestError: CheckoutRequestError) => {
    const backend = requestError.errors
    setErrors((current) => ({
      ...current,
      fullName: backend['address.name']?.[0],
      phone: backend['address.phone']?.[0],
      city: backend['address.city']?.[0],
      district: backend['address.district']?.[0],
      address: backend['address.address']?.[0],
      shipping: backend.shipping_method_id?.[0],
      coupon: backend.coupon_code?.[0],
    }))
    if (requestError.status === 401) return 'Vui lòng đăng nhập để kiểm tra thanh toán.'
    return backend.cart?.[0] ?? requestError.message
  }

  const checkCoupon = async () => {
    if (!couponCode.trim()) return
    setIsCheckingCoupon(true); setCouponMessage(''); setErrors((current) => ({ ...current, coupon: undefined }))
    try {
      const token = window.localStorage.getItem('viet-ngoc-auth-token') ?? undefined
      const result = await validateCoupon(couponCode, totalPrice, token)
      setCouponCode(result.code)
      setCouponMessage(`Mã hợp lệ, giảm dự kiến ${formatCurrency(result.discount)}. Tổng cuối sẽ được xác nhận khi preview.`)
      setPreview(null)
    } catch (couponError) {
      const message = couponError instanceof CheckoutRequestError ? couponError.message : 'Chưa thể kiểm tra mã ưu đãi.'
      setErrors((current) => ({ ...current, coupon: message }))
    } finally { setIsCheckingCoupon(false) }
  }

  const handlePreview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validate() || !shippingMethodId) return
    const token = window.localStorage.getItem('viet-ngoc-auth-token') ?? ''
    if (!token) { setError('Vui lòng đăng nhập để kiểm tra thanh toán.'); return }
    setIsPreviewing(true); setError(''); setErrors((current) => ({ ...current, coupon: undefined, shipping: undefined }))
    try {
      const result = await previewCheckout({
        items: cartItems.map((item) => ({ product_id: item.product.id, quantity: item.quantity })),
        address: { name: formData.fullName.trim(), phone: formData.phone.trim(), city: formData.city.trim(), district: formData.district.trim(), address: formData.address.trim() },
        shipping_method_id: shippingMethodId,
        ...(couponCode.trim() ? { coupon_code: couponCode.trim() } : {}),
      }, token)
      setPreview(result)
      setCouponMessage(result.coupon ? `Đã áp dụng mã ${result.coupon.code}.` : '')
    } catch (previewError) {
      setPreview(null)
      setError(previewError instanceof CheckoutRequestError ? mapBackendErrors(previewError) : 'Chưa thể kiểm tra thanh toán lúc này.')
    } finally { setIsPreviewing(false) }
  }

  const handleCreateOrder = async () => {
    if (!preview || !shippingMethodId || !validate()) return
    const token = window.localStorage.getItem('viet-ngoc-auth-token') ?? ''
    if (!token) { setError('Vui lòng đăng nhập để đặt hàng.'); return }
    setIsCreatingOrder(true); setError('')
    try {
      const result = await createOrder({
        items: cartItems.map((item) => ({ product_id: item.product.id, quantity: item.quantity })),
        customer_name: formData.fullName.trim(),
        customer_email: formData.email.trim(),
        customer_phone: formData.phone.trim(),
        shipping_address: `${formData.address.trim()}, ${formData.district.trim()}, ${formData.city.trim()}`,
        shipping_method_id: shippingMethodId,
        payment_method: paymentMethod,
        ...(couponCode.trim() ? { coupon_code: couponCode.trim() } : {}),
        ...(formData.note.trim() ? { note: formData.note.trim() } : {}),
      }, token)
      setOrderResult(result)
      clearCart()
    } catch (orderError) {
      if (orderError instanceof CheckoutRequestError) {
        const backend = orderError.errors
        setErrors((current) => ({
          ...current,
          fullName: backend.customer_name?.[0],
          email: backend.customer_email?.[0],
          phone: backend.customer_phone?.[0],
          shipping: backend.shipping_method_id?.[0],
          coupon: backend.coupon_code?.[0],
        }))
        setError(orderError.status === 401 ? 'Vui lòng đăng nhập để đặt hàng.' : backend.items?.[0] ?? orderError.message)
      } else setError('Chưa thể tạo đơn hàng lúc này.')
    } finally { setIsCreatingOrder(false) }
  }

  if (orderResult) return <div className="empty-state checkout-success"><span aria-hidden="true">✓</span><p className="eyebrow">Daisy Handmade Store</p><h1>Đặt hàng thành công!</h1><p>{orderResult.message} Tổng thanh toán: <strong>{formatCurrency(orderResult.order.total)}</strong>.</p>{orderResult.payment.method === 'bank_transfer' ? <div className="qr-transfer-layout">{orderResult.payment.qr_image_url ? <img src={orderResult.payment.qr_image_url} alt="Mã QR chuyển khoản đơn hàng Daisy" /> : <div className="payment-icon" aria-hidden="true">▣</div>}<div><p className="eyebrow">Thông tin chuyển khoản</p><dl><div><dt>Ngân hàng</dt><dd>{orderResult.payment.bank_name}</dd></div><div><dt>Số tài khoản</dt><dd>{orderResult.payment.account_number}</dd></div><div><dt>Chủ tài khoản</dt><dd>{orderResult.payment.account_owner}</dd></div><div><dt>Nội dung</dt><dd>{orderResult.payment.transfer_content}</dd></div></dl><small>Đơn hàng sẽ được xác nhận sau khi Daisy kiểm tra thanh toán.</small></div></div> : <p>Phương thức: Thanh toán khi nhận hàng (COD).</p>}<Link to="/san-pham" className="button button-primary">Tiếp tục mua sắm</Link></div>

  if (cartItems.length === 0) return <div className="empty-state checkout-empty"><span aria-hidden="true">✿</span><h1>Giỏ hàng đang trống</h1><p>Vui lòng thêm sản phẩm trước khi thanh toán.</p><Link to="/san-pham" className="button button-primary">Quay lại cửa hàng</Link></div>

  const displayedSubtotal = preview?.subtotal ?? totalPrice

  return (
    <section className="modern-checkout">
      <nav className="checkout-steps" aria-label="Tiến trình mua hàng"><span><b>1</b>Giỏ hàng</span><i /><span className="active"><b>2</b>Kiểm tra thanh toán</span><i /><span><b>3</b>Đặt hàng</span></nav>
      <header className="checkout-heading"><p className="eyebrow">Daisy Handmade Store</p><h1>Hoàn tất đơn hàng</h1><p>Kiểm tra tổng tiền với backend trước khi xác nhận đặt hàng.</p></header>

      <form className="checkout-layout" onSubmit={handlePreview} noValidate>
        <div className="checkout-form-column">
          <section className="checkout-panel"><div className="checkout-panel-title"><span>01</span><div><h2>Thông tin khách hàng</h2><p>Thông tin dùng để kiểm tra địa chỉ giao hàng.</p></div></div><div className="checkout-fields two-columns">
            <label className={errors.fullName ? 'has-error' : ''}><span>Họ và tên <b>*</b></span><input autoComplete="name" value={formData.fullName} onChange={(event) => updateField('fullName', event.target.value)} aria-invalid={Boolean(errors.fullName)} />{errors.fullName ? <small>{errors.fullName}</small> : null}</label>
            <label className={errors.phone ? 'has-error' : ''}><span>Số điện thoại <b>*</b></span><input type="tel" autoComplete="tel" value={formData.phone} onChange={(event) => updateField('phone', event.target.value)} aria-invalid={Boolean(errors.phone)} />{errors.phone ? <small>{errors.phone}</small> : null}</label>
            <label className={`full-field ${errors.email ? 'has-error' : ''}`}><span>Email <b>*</b></span><input type="email" autoComplete="email" value={formData.email} onChange={(event) => updateField('email', event.target.value)} aria-invalid={Boolean(errors.email)} />{errors.email ? <small>{errors.email}</small> : null}</label>
          </div></section>

          <section className="checkout-panel"><div className="checkout-panel-title"><span>02</span><div><h2>Địa chỉ giao hàng</h2><p>Validation được đồng bộ với checkout preview backend.</p></div></div><div className="checkout-fields two-columns">
            <label className={errors.city ? 'has-error' : ''}><span>Tỉnh / Thành phố <b>*</b></span><input autoComplete="address-level1" value={formData.city} onChange={(event) => updateField('city', event.target.value)} aria-invalid={Boolean(errors.city)} />{errors.city ? <small>{errors.city}</small> : null}</label>
            <label className={errors.district ? 'has-error' : ''}><span>Quận / Huyện <b>*</b></span><input autoComplete="address-level2" value={formData.district} onChange={(event) => updateField('district', event.target.value)} aria-invalid={Boolean(errors.district)} />{errors.district ? <small>{errors.district}</small> : null}</label>
            <label className={`full-field ${errors.address ? 'has-error' : ''}`}><span>Địa chỉ cụ thể <b>*</b></span><input autoComplete="street-address" value={formData.address} onChange={(event) => updateField('address', event.target.value)} aria-invalid={Boolean(errors.address)} />{errors.address ? <small>{errors.address}</small> : null}</label>
            <label className="full-field"><span>Ghi chú <i>(chưa gửi trong preview)</i></span><textarea rows={3} value={formData.note} onChange={(event) => updateField('note', event.target.value)} /></label>
          </div></section>

          <section className="checkout-panel"><div className="checkout-panel-title"><span>03</span><div><h2>Vận chuyển</h2><p>Chọn phương thức đang hoạt động từ backend.</p></div></div><div className="payment-options">{shippingMethods.map((method) => <label key={method.id} className={shippingMethodId === method.id ? 'selected' : ''}><input type="radio" name="shipping" checked={shippingMethodId === method.id} onChange={() => { setShippingMethodId(method.id); setPreview(null); setErrors((current) => ({ ...current, shipping: undefined })) }} /><span className="payment-icon">✦</span><div><strong>{method.name}</strong><small>Phí tham khảo: {formatCurrency(method.fee)}</small></div><i>✓</i></label>)}</div>{shippingError || errors.shipping ? <p className="checkout-error" role="alert">{errors.shipping ?? shippingError}</p> : null}</section>

          <section className="checkout-panel"><div className="checkout-panel-title"><span>04</span><div><h2>Ưu đãi</h2><p>Mã sẽ được backend kiểm tra lại cùng subtotal thực tế.</p></div></div><div className="voucher-box"><label htmlFor="checkout-coupon">Mã ưu đãi</label><div><input id="checkout-coupon" value={couponCode} onChange={(event) => { setCouponCode(event.target.value); setCouponMessage(''); setPreview(null); setErrors((current) => ({ ...current, coupon: undefined })) }} maxLength={50} /><button type="button" onClick={() => void checkCoupon()} disabled={!couponCode.trim() || isCheckingCoupon}>{isCheckingCoupon ? 'Đang kiểm tra' : 'Kiểm tra'}</button></div>{couponMessage ? <small className="success">{couponMessage}</small> : null}{errors.coupon ? <small className="invalid">{errors.coupon}</small> : null}</div></section>

          <section className="checkout-panel"><div className="checkout-panel-title"><span>05</span><div><h2>Phương thức thanh toán</h2><p>Backend lưu đúng phương thức và trạng thái thanh toán.</p></div></div><div className="payment-options">
            <label className={paymentMethod === 'cod' ? 'selected' : ''}><input type="radio" name="payment" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} /><span className="payment-icon">₫</span><div><strong>Thanh toán khi nhận hàng (COD)</strong><small>Trạng thái ban đầu: chưa thanh toán.</small></div><i>✓</i></label>
            <label className={paymentMethod === 'bank_transfer' ? 'selected' : ''}><input type="radio" name="payment" checked={paymentMethod === 'bank_transfer'} onChange={() => setPaymentMethod('bank_transfer')} /><span className="payment-icon">▣</span><div><strong>Chuyển khoản ngân hàng</strong><small>Backend trả thông tin và nội dung chuyển khoản sau khi tạo đơn.</small></div><i>✓</i></label>
          </div></section>
          {error ? <p className="checkout-error" role="alert">{error}</p> : null}
        </div>

        <aside className="checkout-summary"><h2>Tóm tắt đơn hàng</h2><div className="checkout-products">{cartItems.map((item) => <div key={item.product.id}><span>{item.product.images[0] ? <img src={item.product.images[0]} alt="" /> : '✿'}<b>{item.quantity}</b></span><p><strong>{item.product.name}</strong><small>{item.product.material}</small></p><em>{formatCurrency(item.product.price * item.quantity)}</em></div>)}</div><div className="summary-lines"><div><span>Tạm tính ({totalItems} món)</span><strong>{formatCurrency(displayedSubtotal)}</strong></div><div><span>Giảm giá</span><strong>{preview ? formatCurrency(preview.discount) : 'Chờ preview'}</strong></div><div><span>Phí vận chuyển</span><strong>{preview ? formatCurrency(preview.shipping_fee) : 'Chờ preview'}</strong></div></div><div className="checkout-grand-total"><span>{preview ? 'Tổng backend xác nhận' : 'Tạm tính local'}</span><strong>{formatCurrency(preview?.grand_total ?? totalPrice)}</strong></div>{preview ? <button type="button" className="button button-primary checkout-submit" disabled={isCreatingOrder} onClick={() => void handleCreateOrder()}>{isCreatingOrder ? 'Đang tạo đơn...' : paymentMethod === 'cod' ? 'Đặt hàng COD' : 'Tạo đơn chuyển khoản'} <span aria-hidden="true">→</span></button> : <button type="submit" className="button button-primary checkout-submit" disabled={isPreviewing || !shippingMethodId}>{isPreviewing ? 'Đang kiểm tra...' : 'Xem tổng thanh toán'} <span aria-hidden="true">→</span></button>}<p className="checkout-terms">Giỏ hàng chỉ được xóa sau khi backend xác nhận tạo order thành công.</p><div className="summary-assurance"><span>✓ Backend xác nhận lại giá và tồn kho</span><span>✓ Transaction bảo vệ order và stock</span></div></aside>
      </form>
    </section>
  )
}
