import { useCallback, useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingSkeleton } from '../components/HomeSectionState'
import { ProductGrid } from '../components/ProductGrid'
import { SupportBar } from '../components/SupportBar'
import { CartContext } from '../context/CartContext'
import { featuredCollection } from '../data/homepage'
import { fetchBestSellers, fetchHomepageCategories, fetchNewArrivals } from '../services/api'
import type { Category } from '../types/category'
import type { Product } from '../types/product'

type LoadStatus = 'loading' | 'ready' | 'error'

const categoryImages: Record<string, string> = {
  'hoa-tai': '/categories/hoa-tai.jpg',
  'kieng-co': '/categories/kieng-co.jpg',
  nhan: '/categories/nhan.jpg',
  'phu-kien-ao': '/categories/phu-kien-ao.jpg',
  'tram-cai-toc': '/categories/tram-cai-toc.jpg',
  'vong-tay': '/categories/vong-tay.jpg',
}

function requestHomepageData() {
  return Promise.all([
    fetchHomepageCategories(),
    fetchNewArrivals(),
    fetchBestSellers(),
  ])
}

export function HomePage() {
  const { addToCart } = useContext(CartContext)
  const [newArrivals, setNewArrivals] = useState<Product[]>([])
  const [bestSellers, setBestSellers] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [status, setStatus] = useState<LoadStatus>('loading')

  const loadHomepage = useCallback(async () => {
    setStatus('loading')
    try {
      const [fetchedCategories, fetchedNewArrivals, fetchedBestSellers] = await requestHomepageData()
      setCategories(fetchedCategories)
      setNewArrivals(fetchedNewArrivals)
      setBestSellers(fetchedBestSellers)
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void requestHomepageData().then(([fetchedCategories, fetchedNewArrivals, fetchedBestSellers]) => {
      setCategories(fetchedCategories)
      setNewArrivals(fetchedNewArrivals)
      setBestSellers(fetchedBestSellers)
      setStatus('ready')
    }).catch(() => { setStatus('error') })
  }, [])

  const categoryImage = (category: Category) => categoryImages[category.slug]
  const dataState = (items: Product[], emptyMessage: string) => {
    if (status === 'loading') return <LoadingSkeleton />
    if (status === 'error') return <ErrorState onRetry={() => { void loadHomepage() }} />
    return items.length ? <ProductGrid products={items} onAddToCart={addToCart} /> : <EmptyState message={emptyMessage} />
  }

  return (
    <div className="home-page daisy-home">
      <section className="hero-section">
        <div className="hero-content">
          <p className="eyebrow">Trang sức cổ phục · Chế tác thủ công</p>
          <h1>Nét Việt dịu dàng,<br /><em>gửi trong từng món nhỏ</em></h1>
          <p className="hero-description">Những thiết kế lấy cảm hứng từ hoa cỏ và cổ phục Việt, được làm bằng đôi tay tỉ mỉ dành cho bạn yêu vẻ đẹp truyền thống theo cách riêng.</p>
          <div className="hero-actions"><Link to="/san-pham" className="button button-primary">Khám phá bộ sưu tập</Link><Link to="/gioi-thieu" className="hero-text-link">Câu chuyện Daisy <span aria-hidden="true">→</span></Link></div>
          <div className="hero-highlights" aria-label="Cam kết của Daisy"><span><b>100%</b> thủ công</span><span><b>Đậm nét</b> Việt phục</span><span><b>Tỉ mỉ</b> từng chi tiết</span></div>
        </div>
        <div className="hero-art" aria-hidden="true"><span className="hero-orbit hero-orbit-one" /><span className="hero-orbit hero-orbit-two" /><div className="hero-flower-mark"><span>✿</span><small>Daisy</small></div></div>
      </section>

      <SupportBar />

      <section className="home-section" aria-labelledby="featured-categories-title">
        <div className="home-section-heading"><div><p className="eyebrow">Chọn theo phong cách</p><h2 id="featured-categories-title">Danh mục nổi bật</h2></div><Link to="/san-pham" className="section-link">Xem tất cả <span aria-hidden="true">→</span></Link></div>
        {status === 'loading' ? <LoadingSkeleton /> : status === 'error' ? <ErrorState onRetry={() => { void loadHomepage() }} /> : categories.length ? (
          <div className="category-showcase">
            {categories.slice(0, 6).map((category, index) => {
              const image = categoryImage(category)
              return <Link to={`/san-pham?category=${category.id}`} key={category.id} className="category-tile">
                <div className="category-image">{image ? <img src={image} alt={`Trang sức thuộc danh mục ${category.name}`} loading="lazy" decoding="async" /> : <span aria-hidden="true">✿</span>}</div>
                <div><span className="category-number">{String(index + 1).padStart(2, '0')}</span><h3>{category.name}</h3><p>{category.description}</p><span className="category-cta">Khám phá <span aria-hidden="true">→</span></span></div>
              </Link>
            })}
          </div>
        ) : <EmptyState message="Danh mục đang được Daisy cập nhật." />}
      </section>

      <section className="home-section" aria-labelledby="new-arrivals-title">
        <div className="home-section-heading"><div><p className="eyebrow">Vừa chạm ngõ Daisy</p><h2 id="new-arrivals-title">Sản phẩm mới</h2><p>Những thiết kế mới nhất, mang nét duyên Việt vào phong cách hôm nay.</p></div><Link to="/san-pham" className="section-link">Xem tất cả <span aria-hidden="true">→</span></Link></div>
        {dataState(newArrivals, 'Daisy chưa có sản phẩm mới để giới thiệu.')}
      </section>

      <section className="home-section best-seller-section" aria-labelledby="best-seller-title">
        <div className="home-section-heading"><div><p className="eyebrow">Daisy tuyển chọn</p><h2 id="best-seller-title">Sản phẩm nổi bật</h2><p>Những thiết kế được Daisy đánh dấu nổi bật và nhận đánh giá tốt trong dữ liệu hiện tại.</p></div><Link to="/san-pham" className="section-link">Khám phá thêm <span aria-hidden="true">→</span></Link></div>
        {dataState(bestSellers, 'Chưa có sản phẩm nổi bật trong dữ liệu hiện tại.')}
      </section>

      <section className="collection-feature" aria-labelledby="collection-title">
        <div className="collection-visual"><img src={featuredCollection.image} alt={featuredCollection.imageAlt} loading="lazy" decoding="async" /></div>
        <div className="collection-content"><p className="eyebrow">{featuredCollection.eyebrow}</p><h2 id="collection-title">{featuredCollection.title}</h2><p>{featuredCollection.description}</p><ul>{featuredCollection.highlights.map((item) => <li key={item}>{item}</li>)}</ul><Link to="/san-pham" className="button button-primary">Xem bộ sưu tập</Link></div>
      </section>

      <section className="brand-story-section" aria-labelledby="brand-story-title">
        <div className="brand-story-mark" aria-hidden="true"><span>D</span><i>✿</i></div>
        <div className="brand-story-copy"><p className="eyebrow">Câu chuyện Daisy</p><h2 id="brand-story-title">Gìn giữ một nét xưa bằng đôi tay hôm nay</h2><p>Daisy bắt đầu từ tình yêu với cổ phục và những hoa văn Việt. Mỗi thiết kế không chỉ là món trang sức, mà còn là một nhịp cầu nhỏ đưa di sản đến gần hơn với đời sống trẻ.</p><blockquote>“Vẻ đẹp truyền thống luôn có một cách rất riêng để nở hoa trong hiện tại.”</blockquote><Link to="/gioi-thieu" className="section-link">Đọc câu chuyện của Daisy <span aria-hidden="true">→</span></Link></div>
      </section>

      <section className="voucher-section" aria-labelledby="voucher-title">
        <div className="voucher-copy"><p className="eyebrow">Ưu đãi từ Daisy</p><h2 id="voucher-title">Một món quà nhỏ cho nét duyên riêng</h2><p>Các chương trình ưu đãi sẽ được xác nhận theo điều kiện thực tế khi bạn mua hàng.</p></div>
        <div className="voucher-note"><strong>Ưu đãi thanh lịch</strong><small>Không áp dụng giảm giá giả hoặc mã chưa được xác nhận.</small></div>
        <Link to="/san-pham" className="button voucher-button">Khám phá sản phẩm</Link>
      </section>
    </div>
  )
}
