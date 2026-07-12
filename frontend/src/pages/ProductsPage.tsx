import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { ProductFilter } from '../components/ProductFilter'
import { ProductGrid } from '../components/ProductGrid'
import { SearchBar } from '../components/SearchBar'
import { CartContext } from '../context/CartContext'
import { fetchHomepageCategories, fetchProductCatalog } from '../services/api'
import type { Category } from '../types/category'
import type { Product, ProductCatalogQuery, ProductSort } from '../types/product'

const PAGE_SIZE = 8

const priceRanges: Record<string, Pick<ProductCatalogQuery, 'minPrice' | 'maxPrice'>> = {
  all: {},
  'under-1m': { maxPrice: 999999 },
  '1m-2m': { minPrice: 1000000, maxPrice: 2000000 },
  'over-2m': { minPrice: 2000001 },
}

export function ProductsPage() {
  const { addToCart } = useContext(CartContext)
  const requestSequence = useRef(0)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all')
  const [priceFilter, setPriceFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState<ProductSort>('featured')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    void fetchHomepageCategories().then(setCategories).catch(() => setCategories([]))
  }, [])

  const query = useMemo<ProductCatalogQuery>(() => ({
    search: debouncedSearch || undefined,
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    ...priceRanges[priceFilter],
    sort: sortOrder,
    page: currentPage,
    perPage: PAGE_SIZE,
  }), [currentPage, debouncedSearch, priceFilter, selectedCategory, sortOrder])

  useEffect(() => {
    const sequence = ++requestSequence.current
    void fetchProductCatalog(query).then((catalog) => {
      if (sequence !== requestSequence.current) return
      setProducts(catalog.products)
      setCurrentPage(catalog.currentPage)
      setLastPage(catalog.lastPage)
      setTotal(catalog.total)
      setError(null)
    }).catch(() => {
      if (sequence !== requestSequence.current) return
      setProducts([])
      setTotal(0)
      setError('Daisy chưa thể tải bộ sưu tập lúc này. Bạn vui lòng thử lại nhé.')
    }).finally(() => {
      if (sequence === requestSequence.current) setIsLoading(false)
    })
  }, [query, retryKey])

  const activeFilterCount = Number(selectedCategory !== 'all') + Number(priceFilter !== 'all')
  const prepareReload = () => { requestSequence.current += 1; setIsLoading(true); setError(null) }
  const resetFilters = () => { prepareReload(); setSelectedCategory('all'); setPriceFilter('all'); setSearch(''); setCurrentPage(1) }
  const changeSearch = (value: string) => { prepareReload(); setSearch(value); setCurrentPage(1) }
  const changeCategory = (value: number | 'all') => { prepareReload(); setSelectedCategory(value); setCurrentPage(1) }
  const changePrice = (value: string) => { prepareReload(); setPriceFilter(value); setCurrentPage(1) }
  const changeSort = (value: ProductSort) => { prepareReload(); setSortOrder(value); setCurrentPage(1) }
  const changePage = (page: number) => { prepareReload(); setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const retry = () => { prepareReload(); setRetryKey((key) => key + 1) }

  return (
    <div className="products-page catalog-page">
      <header className="catalog-hero"><p className="eyebrow">Daisy Handmade Store</p><h1>Bộ sưu tập trang sức Việt</h1><p>Tìm món trang sức kể câu chuyện riêng của bạn, từ những đường nét thủ công mang cảm hứng cổ phục.</p></header>

      <div className="catalog-toolbar">
        <SearchBar value={search} onChange={changeSearch} />
        <button type="button" className="mobile-filter-button" onClick={() => setIsFilterOpen(true)} aria-label={`Mở bộ lọc${activeFilterCount ? `, ${activeFilterCount} bộ lọc đang áp dụng` : ''}`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M7 12h10M10 17h4" /></svg>Bộ lọc{activeFilterCount ? <span>{activeFilterCount}</span> : null}</button>
        <label className="catalog-sort"><span>Sắp xếp</span><select value={sortOrder} onChange={(event) => changeSort(event.target.value as ProductSort)}><option value="featured">Nổi bật</option><option value="newest">Mới nhất</option><option value="price_asc">Giá thấp đến cao</option><option value="price_desc">Giá cao đến thấp</option></select></label>
      </div>

      <div className="catalog-layout">
        <aside className="catalog-sidebar" aria-label="Bộ lọc sản phẩm"><ProductFilter categories={categories} selectedCategory={selectedCategory} onCategoryChange={changeCategory} priceFilter={priceFilter} onPriceChange={changePrice} onReset={resetFilters} /></aside>
        <main className="catalog-results" aria-busy={isLoading}>
          <div className="catalog-result-meta"><p><strong>{total}</strong> sản phẩm</p>{debouncedSearch ? <span>Kết quả cho “{debouncedSearch}”</span> : null}</div>
          {isLoading ? <div className="catalog-skeleton-grid" aria-label="Đang tải sản phẩm" aria-live="polite">{Array.from({ length: PAGE_SIZE }, (_, index) => <div className="product-skeleton" key={index}><span /><i /><i /><i /></div>)}</div> : null}
          {!isLoading && error ? <div className="catalog-state" role="alert"><span aria-hidden="true">✿</span><h2>Chưa thể tải sản phẩm</h2><p>{error}</p><button type="button" className="button button-primary" onClick={retry}>Thử lại</button></div> : null}
          {!isLoading && !error && total === 0 ? <div className="catalog-state"><span aria-hidden="true">✿</span><h2>Chưa tìm thấy món phù hợp</h2><p>Thử một từ khóa khác hoặc xóa bộ lọc để khám phá toàn bộ bộ sưu tập Daisy.</p><button type="button" className="button button-primary" onClick={resetFilters}>Xóa bộ lọc</button></div> : null}
          {!isLoading && !error && products.length > 0 ? <><ProductGrid products={products} onAddToCart={addToCart} />{lastPage > 1 ? <nav className="catalog-pagination" aria-label="Phân trang sản phẩm"><button type="button" onClick={() => changePage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} aria-label="Trang trước">←</button>{Array.from({ length: lastPage }, (_, index) => index + 1).map((page) => <button type="button" key={page} className={page === currentPage ? 'active' : ''} onClick={() => changePage(page)} aria-current={page === currentPage ? 'page' : undefined}>{page}</button>)}<button type="button" onClick={() => changePage(Math.min(lastPage, currentPage + 1))} disabled={currentPage === lastPage} aria-label="Trang sau">→</button></nav> : null}</> : null}
        </main>
      </div>

      {isFilterOpen ? <div className="filter-drawer-layer" role="presentation" onMouseDown={() => setIsFilterOpen(false)}><aside className="filter-drawer" role="dialog" aria-modal="true" aria-label="Bộ lọc sản phẩm" onMouseDown={(event) => event.stopPropagation()}><div className="filter-drawer-header"><strong>Lọc sản phẩm</strong><button type="button" onClick={() => setIsFilterOpen(false)} aria-label="Đóng bộ lọc">×</button></div><ProductFilter categories={categories} selectedCategory={selectedCategory} onCategoryChange={changeCategory} priceFilter={priceFilter} onPriceChange={changePrice} onReset={resetFilters} /><button type="button" className="button button-primary filter-apply-button" onClick={() => setIsFilterOpen(false)}>Xem {total} sản phẩm</button></aside></div> : null}
    </div>
  )
}
