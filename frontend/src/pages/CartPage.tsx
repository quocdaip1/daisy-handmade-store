import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { CartContext } from '../context/CartContext'
import { formatCurrency } from '../utils/formatCurrency'

export function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useContext(CartContext)

  if (cartItems.length === 0) {
    return <section className="empty-state cart-empty-state"><span className="empty-state-icon" aria-hidden="true">✿</span><h1>Giỏ hàng của bạn đang trống</h1><p>Khám phá những món trang sức thủ công mang nét duyên Việt cùng Daisy nhé.</p><Link to="/san-pham" className="button button-primary">Khám phá sản phẩm</Link></section>
  }

  return (
    <section className="cart-section modern-cart">
      <nav className="checkout-steps" aria-label="Tiến trình mua hàng"><span className="active"><b>1</b>Giỏ hàng</span><i /><span><b>2</b>Thanh toán</span><i /><span><b>3</b>Hoàn tất</span></nav>
      <header className="cart-heading"><div><p className="eyebrow">Daisy Handmade Store</p><h1>Giỏ hàng của bạn</h1><p>{totalItems} món đã chọn</p></div><button type="button" className="cart-clear-button" onClick={clearCart} aria-label={`Xóa toàn bộ ${totalItems} món khỏi giỏ hàng`}>Xóa tất cả</button></header>

      <div className="free-shipping-card" role="note"><div><span aria-hidden="true">✦</span><p>Giá sản phẩm, ưu đãi và phí vận chuyển sẽ được backend kiểm tra lại trước khi bạn xác nhận đặt hàng.</p></div></div>

      <div className="cart-page">
        <div className="cart-list">
          {cartItems.map((item) => {
            const image = item.product.images[0]
            const atMaximum = item.quantity >= item.product.stock
            return <article key={item.product.id} className="cart-item modern-cart-item">
              <Link to={`/san-pham/${item.product.slug}`} className="cart-item-image-link">{image ? <img src={image} alt={item.product.name} className="cart-item-image" loading="lazy" decoding="async" /> : <span className="cart-image-placeholder" aria-hidden="true">✿</span>}</Link>
              <div className="cart-item-info">
                <p className="product-meta">{item.product.material}</p>
                <Link to={`/san-pham/${item.product.slug}`} className="cart-item-name">{item.product.name}</Link>
                <p className="cart-unit-price">{formatCurrency(item.product.price)} / món</p>
                <div className="cart-controls" aria-label={`Số lượng ${item.product.name}`}>
                  <button type="button" onClick={() => updateQuantity(item.product.id, item.quantity - 1)} aria-label={`Giảm số lượng ${item.product.name}`}>−</button>
                  <span aria-live="polite">{item.quantity}</span>
                  <button type="button" onClick={() => updateQuantity(item.product.id, item.quantity + 1)} disabled={atMaximum} aria-label={`Tăng số lượng ${item.product.name}`}>+</button>
                </div>
                {atMaximum ? <small>Đã đạt số lượng tối đa theo dữ liệu tồn kho hiện tại</small> : null}
              </div>
              <div className="cart-item-total"><strong>{formatCurrency(item.product.price * item.quantity)}</strong><button type="button" onClick={() => removeFromCart(item.product.id)} aria-label={`Xóa ${item.product.name} khỏi giỏ hàng`}>Xóa</button></div>
            </article>
          })}
          <Link to="/san-pham" className="cart-continue-link">← Tiếp tục mua sắm</Link>
        </div>

        <aside className="summary-card modern-summary-card" aria-label="Tóm tắt giỏ hàng">
          <h2>Tóm tắt giỏ hàng</h2>
          <div className="summary-lines">
            <div><span>Số lượng</span><strong>{totalItems} món</strong></div>
            <div><span>Tạm tính theo giỏ hàng</span><strong>{formatCurrency(totalPrice)}</strong></div>
            <div><span>Ưu đãi</span><strong>Xác nhận ở bước sau</strong></div>
            <div><span>Phí vận chuyển</span><strong>Xác nhận ở bước sau</strong></div>
          </div>
          <div className="summary-total"><span>Tạm tính</span><div><strong>{formatCurrency(totalPrice)}</strong><small>Chưa phải tổng thanh toán cuối cùng</small></div></div>
          <Link to="/thanh-toan" className="button button-primary summary-checkout-button">Tiến hành thanh toán <span aria-hidden="true">→</span></Link>
          <div className="summary-assurance"><span>✓ Backend xác nhận giá và tồn kho</span><span>✓ Đổi trả trong 7 ngày</span><span>✓ Đóng gói quà tặng</span></div>
        </aside>
      </div>
    </section>
  )
}
