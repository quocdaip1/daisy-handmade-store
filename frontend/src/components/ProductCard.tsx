import { Link } from 'react-router-dom'
import type { Product } from '../types/product'
import { formatCurrency } from '../utils/formatCurrency'

interface ProductCardProps { product: Product; onAddToCart: (product: Product) => void }

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const hasDiscount = Boolean(product.originalPrice && product.originalPrice > product.price)
  const discount = hasDiscount && product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0
  const image = product.images[0]
  return (
    <article className="product-card">
      <Link to={`/san-pham/${product.slug}`} className="product-image-wrap" aria-label={`Xem ${product.name}`}>
        {image ? <img src={image} alt={product.name} className="product-image" loading="lazy" decoding="async" fetchPriority="low" /> : <span className="product-image product-image-fallback" aria-hidden="true">✿</span>}
        <div className="product-badges" aria-label="Trạng thái sản phẩm">
          {product.isNew ? <span className="badge-pill new">Mới</span> : null}
          {hasDiscount ? <span className="badge-pill discount">−{discount}%</span> : null}
        </div>
        <span className="product-quick-view">Xem chi tiết</span>
      </Link>
      <div className="product-info">
        <p className="product-meta">{product.material}</p>
        <Link to={`/san-pham/${product.slug}`} className="product-name"><h3>{product.name}</h3></Link>
        <div className="product-rating" aria-label={`${product.rating} trên 5 sao`}><span aria-hidden="true">★★★★★</span><small>{product.rating.toFixed(1)}</small></div>
        <p className="product-description">{product.shortDescription}</p>
        <div className="product-price-row">
          <strong>{formatCurrency(product.price)}</strong>
          {product.originalPrice ? <span className="old-price">{formatCurrency(product.originalPrice)}</span> : null}
        </div>
        <button type="button" className="button button-primary product-add-button" onClick={() => onAddToCart(product)} disabled={product.stock === 0}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h2l2.3 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 7H6M12 9v4M10 11h4" /></svg>
          {product.stock > 0 ? 'Thêm vào giỏ' : 'Tạm hết hàng'}
        </button>
      </div>
    </article>
  )
}
