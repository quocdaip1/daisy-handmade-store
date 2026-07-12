import { useContext, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ProductGrid } from '../components/ProductGrid'
import { CartContext } from '../context/CartContext'
import { fetchProductDetail, fetchRelatedProducts } from '../services/api'
import type { Product } from '../types/product'
import { formatCurrency } from '../utils/formatCurrency'

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { addToCart } = useContext(CartContext)
  const [quantity, setQuantity] = useState(1)
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [selectedImage, setSelectedImage] = useState(0)
  const [isZoomOpen, setIsZoomOpen] = useState(false)
  const [loadedSlug, setLoadedSlug] = useState<string | null>(null)
  const [errorSlug, setErrorSlug] = useState<string | null>(null)
  const [relatedError, setRelatedError] = useState(false)
  const [isRelatedLoading, setIsRelatedLoading] = useState(true)
  const [retryKey, setRetryKey] = useState(0)
  const [relatedRetryKey, setRelatedRetryKey] = useState(0)

  useEffect(() => {
    if (!slug) return
    let active = true
    void fetchProductDetail(slug).then((fetchedProduct) => {
      if (!active) return
      setProduct(fetchedProduct)
      setSelectedImage(0)
      setQuantity(1)
      setIsZoomOpen(false)
      setRelatedProducts([])
      setRelatedError(false)
      setIsRelatedLoading(Boolean(fetchedProduct))
      setErrorSlug(null)
      setLoadedSlug(slug)
    }).catch(() => {
      if (!active) return
      setProduct(null)
      setErrorSlug(slug)
      setLoadedSlug(slug)
    })
    return () => { active = false }
  }, [retryKey, slug])

  useEffect(() => {
    if (!slug || loadedSlug !== slug || !product) return
    let active = true
    void fetchRelatedProducts(slug, 4).then((items) => {
      if (!active) return
      setRelatedProducts(items)
      setRelatedError(false)
    }).catch(() => {
      if (!active) return
      setRelatedProducts([])
      setRelatedError(true)
    }).finally(() => { if (active) setIsRelatedLoading(false) })
    return () => { active = false }
  }, [loadedSlug, product, relatedRetryKey, slug])

  useEffect(() => {
    if (!isZoomOpen) return
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setIsZoomOpen(false) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isZoomOpen])

  if (loadedSlug !== slug) {
    return <div className="detail-loading" aria-label="Đang tải sản phẩm" aria-live="polite"><div className="detail-loading-image" /><div className="detail-loading-copy"><span /><span /><span /><span /></div></div>
  }

  if (errorSlug === slug) {
    return <div className="empty-state" role="alert"><h1>Chưa thể tải sản phẩm</h1><p>Kết nối tới Daisy đang gián đoạn. Bạn vui lòng thử lại.</p><button type="button" className="button button-primary" onClick={() => { setLoadedSlug(null); setRetryKey((key) => key + 1) }}>Thử lại</button><Link to="/san-pham" className="section-link">Quay lại cửa hàng</Link></div>
  }

  if (!product) {
    return <div className="empty-state"><h1>Không tìm thấy sản phẩm</h1><p>Sản phẩm có thể đã ngừng kinh doanh hoặc đường dẫn không còn tồn tại.</p><Link to="/san-pham" className="button button-primary">Quay lại cửa hàng</Link></div>
  }

  const images = product.images.length ? product.images : ['']
  const currentImage = images[Math.min(selectedImage, images.length - 1)]
  const hasDiscount = Boolean(product.originalPrice && product.originalPrice > product.price)
  const discount = hasDiscount && product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0
  const inStock = product.stock > 0
  const changeQuantity = (next: number) => setQuantity(Math.min(product.stock, Math.max(1, next)))
  const buyNow = () => { addToCart(product, quantity); navigate('/thanh-toan') }

  return (
    <article className="product-detail-page daisy-product-detail">
      <nav className="detail-breadcrumb" aria-label="Đường dẫn"><Link to="/">Trang chủ</Link><span>/</span><Link to="/san-pham">Sản phẩm</Link><span>/</span><span>{product.name}</span></nav>

      <div className="product-detail-layout">
        <section className="product-gallery" aria-label={`Hình ảnh ${product.name}`}>
          <div className="thumbnail-gallery" aria-label="Chọn ảnh sản phẩm">
            {images.map((image, index) => <button type="button" key={`${image}-${index}`} className={selectedImage === index ? 'active' : ''} onClick={() => setSelectedImage(index)} aria-label={`Xem ảnh ${index + 1} trên ${images.length}`} aria-pressed={selectedImage === index}>{image ? <img src={image} alt="" loading="lazy" decoding="async" /> : <span>✿</span>}</button>)}
          </div>
          <button type="button" className="main-product-image" onClick={() => { if (currentImage) setIsZoomOpen(true) }} aria-label={currentImage ? 'Phóng to ảnh sản phẩm' : 'Sản phẩm chưa có ảnh'} disabled={!currentImage}>
            {currentImage ? <img src={currentImage} alt={product.name} loading="eager" decoding="async" fetchPriority="high" /> : <span className="detail-image-fallback">✿</span>}
            {currentImage ? <span className="zoom-hint"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4M11 8v6M8 11h6" /></svg>Phóng to</span> : null}
          </button>
        </section>

        <section className="product-detail-info">
          <div className="detail-heading-row"><p className="eyebrow">{product.material}</p>{product.isNew ? <span className="detail-new-badge">Mới</span> : null}</div>
          <h1>{product.name}</h1>
          <div className="detail-rating"><span aria-hidden="true">★★★★★</span><strong>{product.rating.toFixed(1)}</strong><small>Điểm đánh giá</small></div>
          <p className="detail-description">{product.description}</p>

          <div className="detail-price-section"><div><strong>{formatCurrency(product.price)}</strong>{hasDiscount && product.originalPrice ? <span>{formatCurrency(product.originalPrice)}</span> : null}</div>{discount > 0 ? <b>Tiết kiệm {discount}%</b> : null}</div>
          <div className={`inventory-status ${inStock ? 'in-stock' : 'out-of-stock'}`}><i aria-hidden="true" /><div><strong>{inStock ? 'Còn hàng' : 'Tạm hết hàng'}</strong><small>{inStock ? `Còn ${product.stock} sản phẩm · Sẵn sàng giao` : 'Liên hệ Daisy để được thông báo khi có hàng'}</small></div></div>
          <dl className="detail-specifications"><div><dt>Chất liệu</dt><dd>{product.material}</dd></div><div><dt>Màu sắc</dt><dd>{product.color}</dd></div><div><dt>Chế tác</dt><dd>Hoàn thiện thủ công</dd></div></dl>

          <div className="detail-purchase-area">
            <div className="detail-quantity"><span>Số lượng</span><div><button type="button" onClick={() => changeQuantity(quantity - 1)} disabled={quantity <= 1} aria-label="Giảm số lượng">−</button><input aria-label="Số lượng sản phẩm" type="number" min="1" max={Math.max(1, product.stock)} value={quantity} disabled={!inStock} onChange={(event) => changeQuantity(Number(event.target.value) || 1)} /><button type="button" onClick={() => changeQuantity(quantity + 1)} disabled={!inStock || quantity >= product.stock} aria-label="Tăng số lượng">+</button></div></div>
            <div className="detail-actions"><button type="button" className="button detail-add-cart" onClick={() => addToCart(product, quantity)} disabled={!inStock}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h2l2.3 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 7H6M12 9v4M10 11h4" /></svg>{inStock ? 'Thêm vào giỏ hàng' : 'Tạm hết hàng'}</button><button type="button" className="button button-primary detail-buy-now" onClick={buyNow} disabled={!inStock}>Mua ngay</button></div>
          </div>
          <div className="detail-assurances"><span>✦ Đổi trả trong 7 ngày</span><span>✦ Đóng gói quà tặng</span><span>✦ Tư vấn tận tâm</span></div>
        </section>
      </div>

      <section className="related-products-section" aria-labelledby="related-products-title"><div className="home-section-heading"><div><p className="eyebrow">Có thể bạn cũng thích</p><h2 id="related-products-title">Sản phẩm liên quan</h2></div><Link to="/san-pham" className="section-link">Xem tất cả <span aria-hidden="true">→</span></Link></div>{isRelatedLoading ? <div className="detail-loading-copy" aria-label="Đang tải sản phẩm liên quan" aria-live="polite"><span /><span /><span /></div> : relatedError ? <div className="empty-state" role="alert"><p>Chưa thể tải sản phẩm liên quan.</p><button type="button" className="section-link" onClick={() => { setIsRelatedLoading(true); setRelatedRetryKey((key) => key + 1) }}>Thử lại</button></div> : relatedProducts.length ? <ProductGrid products={relatedProducts} onAddToCart={addToCart} /> : <div className="empty-state"><p>Chưa có sản phẩm liên quan trong cùng danh mục.</p></div>}</section>

      {isZoomOpen && currentImage ? <div className="image-zoom-overlay" role="dialog" aria-modal="true" aria-label={`Ảnh phóng to ${product.name}`} onMouseDown={() => setIsZoomOpen(false)}><button type="button" onClick={() => setIsZoomOpen(false)} aria-label="Đóng ảnh phóng to">×</button><img src={currentImage} alt={product.name} onMouseDown={(event) => event.stopPropagation()} /></div> : null}
    </article>
  )
}
