import { useEffect, useState, type FormEvent } from 'react'
import { ProductForm } from '../../components/admin/ProductForm'
import { ProductTable } from '../../components/admin/ProductTable'
import { useAuth } from '../../auth/useAuth'
import { fetchCategories } from '../../services/api'
import { AdminProductRequestError, createAdminProduct, deactivateAdminProduct, listAdminProducts, updateAdminProduct, uploadAdminProductImages } from '../../services/admin/products'
import type { Category } from '../../types/category'
import type { AdminProduct, AdminProductCatalog, AdminProductFormValues, ProductStatus } from '../../types/admin-product'
import './product-management.css'

const emptyCatalog: AdminProductCatalog = { products: [], currentPage: 1, lastPage: 1, total: 0 }

export function ProductManagementPage() {
  const { session } = useAuth()
  const [catalog, setCatalog] = useState(emptyCatalog)
  const [categories, setCategories] = useState<Category[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ProductStatus | 'all'>('all')
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [editor, setEditor] = useState<{ product: AdminProduct | null; key: number } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [backendErrors, setBackendErrors] = useState<Record<string, string[]>>({})

  useEffect(() => {
    let active = true
    if (!session) return
    void listAdminProducts(session.token, { search, status, page })
      .then((result) => { if (active) { setCatalog(result); setError(''); setIsLoading(false) } })
      .catch((requestError: unknown) => { if (active) { setError(requestError instanceof Error ? requestError.message : 'Không thể tải danh sách sản phẩm.'); setIsLoading(false) } })
    return () => { active = false }
  }, [page, reloadKey, search, session, status])

  useEffect(() => {
    let active = true
    void fetchCategories().then((result) => { if (active) setCategories(result) }).catch(() => { if (active) setCategories([]) })
    return () => { active = false }
  }, [])

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    setPage(1)
    setSearch(searchInput.trim())
    setReloadKey((key) => key + 1)
  }

  const openEditor = (product: AdminProduct | null) => {
    setBackendErrors({})
    setEditor({ product, key: Date.now() })
  }

  const saveProduct = async (values: AdminProductFormValues, images: File[]) => {
    if (!session) return
    setIsSubmitting(true)
    setBackendErrors({})
    let savedProduct: AdminProduct | null = null
    try {
      savedProduct = editor?.product
        ? await updateAdminProduct(session.token, editor.product.id, values)
        : await createAdminProduct(session.token, values)
      if (images.length) await uploadAdminProductImages(session.token, savedProduct.id, images)
      setEditor(null)
      setError('')
      setIsLoading(true)
      setReloadKey((key) => key + 1)
    } catch (requestError) {
      if (savedProduct) setEditor({ product: savedProduct, key: Date.now() })
      if (requestError instanceof AdminProductRequestError) {
        setBackendErrors(requestError.errors)
        if (!Object.keys(requestError.errors).length) setError(requestError.message)
      } else {
        setError(requestError instanceof Error ? requestError.message : 'Không thể lưu sản phẩm.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const deactivate = async (product: AdminProduct) => {
    if (!session || !window.confirm(`Ngừng kinh doanh “${product.name}”?`)) return
    try {
      await deactivateAdminProduct(session.token, product.id)
      setIsLoading(true)
      setReloadKey((key) => key + 1)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể ngừng kinh doanh sản phẩm.')
    }
  }

  return (
    <section className="admin-products-page">
      <header className="admin-products-heading"><div><p>Admin / Sản phẩm</p><h1>Quản lý sản phẩm</h1><span>{catalog.total} sản phẩm</span></div><button type="button" onClick={() => openEditor(null)}>Tạo sản phẩm</button></header>
      <div className="admin-products-toolbar">
        <form onSubmit={submitSearch}><label htmlFor="admin-product-search">Tìm kiếm</label><div><input id="admin-product-search" value={searchInput} maxLength={100} placeholder="Tên sản phẩm" onChange={(event) => setSearchInput(event.target.value)} /><button type="submit">Tìm</button></div></form>
        <label><span>Trạng thái</span><select value={status} onChange={(event) => { setIsLoading(true); setPage(1); setStatus(event.target.value as ProductStatus | 'all') }}><option value="all">Tất cả</option><option value="published">Đang bán</option><option value="draft">Bản nháp</option><option value="inactive">Ngừng bán</option></select></label>
      </div>
      {error ? <div className="admin-products-error" role="alert">{error}<button type="button" onClick={() => { setError(''); setIsLoading(true); setReloadKey((key) => key + 1) }}>Thử lại</button></div> : null}
      <ProductTable products={catalog.products} isLoading={isLoading} onEdit={openEditor} onDeactivate={(product) => { void deactivate(product) }} />
      <nav className="admin-product-pagination" aria-label="Phân trang sản phẩm"><button type="button" disabled={isLoading || catalog.currentPage <= 1} onClick={() => { setIsLoading(true); setPage((value) => value - 1) }}>Trang trước</button><span>Trang {catalog.currentPage}/{catalog.lastPage}</span><button type="button" disabled={isLoading || catalog.currentPage >= catalog.lastPage} onClick={() => { setIsLoading(true); setPage((value) => value + 1) }}>Trang sau</button></nav>
      {editor ? <ProductForm key={editor.key} product={editor.product} categories={categories} backendErrors={backendErrors} isSubmitting={isSubmitting} onCancel={() => setEditor(null)} onSubmit={saveProduct} /> : null}
    </section>
  )
}
