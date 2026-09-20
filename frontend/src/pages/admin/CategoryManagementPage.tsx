import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../auth/useAuth'
import { AdminCategoryRequestError, createAdminCategory, deleteAdminCategory, listAdminCategories, updateAdminCategory } from '../../services/admin/categories'
import type { AdminCategory, AdminCategoryFormValues } from '../../types/admin-category'
import './category-management.css'

type FieldErrors = Partial<Record<keyof AdminCategoryFormValues, string>>

const emptyValues: AdminCategoryFormValues = { name: '', slug: '', description: '', active: true }

function validate(values: AdminCategoryFormValues): FieldErrors {
  const errors: FieldErrors = {}
  if (!values.name.trim()) errors.name = 'Tên danh mục là bắt buộc.'
  else if (values.name.length > 255) errors.name = 'Tên tối đa 255 ký tự.'
  if (!values.slug.trim()) errors.slug = 'Slug là bắt buộc.'
  else if (values.slug.length > 255) errors.slug = 'Slug tối đa 255 ký tự.'
  if (values.description.length > 3000) errors.description = 'Mô tả tối đa 3.000 ký tự.'
  return errors
}

export function CategoryManagementPage() {
  const { session } = useAuth()
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [error, setError] = useState('')
  const [editor, setEditor] = useState<AdminCategory | null | undefined>(undefined)
  const [values, setValues] = useState<AdminCategoryFormValues>(emptyValues)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [backendErrors, setBackendErrors] = useState<Record<string, string[]>>({})

  useEffect(() => {
    let active = true
    if (!session) return
    void listAdminCategories(session.token)
      .then((result) => { if (active) { setCategories(result); setError(''); setIsLoading(false) } })
      .catch((requestError: unknown) => { if (active) { setError(requestError instanceof Error ? requestError.message : 'Không thể tải danh sách danh mục.'); setIsLoading(false) } })
    return () => { active = false }
  }, [reloadKey, session])

  const openEditor = (category: AdminCategory | null) => {
    setEditor(category)
    setValues(category ? {
      name: category.name,
      slug: category.slug,
      description: category.description,
      active: category.active,
    } : emptyValues)
    setFieldErrors({})
    setBackendErrors({})
  }

  const closeEditor = () => {
    if (!isSubmitting) setEditor(undefined)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const nextErrors = validate(values)
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length || !session) return
    setIsSubmitting(true)
    setBackendErrors({})
    try {
      if (editor) await updateAdminCategory(session.token, editor.id, values)
      else await createAdminCategory(session.token, values)
      setEditor(undefined)
      setIsLoading(true)
      setReloadKey((key) => key + 1)
    } catch (requestError) {
      if (requestError instanceof AdminCategoryRequestError) {
        setBackendErrors(requestError.errors)
        if (!Object.keys(requestError.errors).length) setError(requestError.message)
      } else {
        setError(requestError instanceof Error ? requestError.message : 'Không thể lưu danh mục.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleStatus = async (category: AdminCategory) => {
    if (!session) return
    try {
      await updateAdminCategory(session.token, category.id, {
        name: category.name,
        slug: category.slug,
        description: category.description,
        active: !category.active,
      })
      setIsLoading(true)
      setReloadKey((key) => key + 1)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể cập nhật trạng thái danh mục.')
    }
  }

  const removeCategory = async (category: AdminCategory) => {
    if (!session || category.productsCount > 0 || !window.confirm(`Xóa danh mục “${category.name}”?`)) return
    try {
      await deleteAdminCategory(session.token, category.id)
      setIsLoading(true)
      setReloadKey((key) => key + 1)
    } catch (requestError) {
      if (requestError instanceof AdminCategoryRequestError) {
        setError(requestError.errors.category?.[0] ?? requestError.message)
      } else {
        setError(requestError instanceof Error ? requestError.message : 'Không thể xóa danh mục.')
      }
    }
  }

  const change = <K extends keyof AdminCategoryFormValues>(field: K, value: AdminCategoryFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }))
  }
  const errorFor = (field: keyof AdminCategoryFormValues) => fieldErrors[field] || backendErrors[field]?.[0]

  return (
    <section className="admin-categories-page">
      <header className="admin-categories-heading">
        <div><p>Admin / Danh mục</p><h1>Quản lý danh mục</h1><span>{categories.length} danh mục</span></div>
        <button type="button" onClick={() => openEditor(null)}>Tạo danh mục</button>
      </header>

      {error ? <div className="admin-categories-error" role="alert">{error}<button type="button" onClick={() => { setError(''); setIsLoading(true); setReloadKey((key) => key + 1) }}>Thử lại</button></div> : null}

      {isLoading ? <div className="admin-category-state" aria-live="polite">Đang tải danh mục...</div> : null}
      {!isLoading && !categories.length ? <div className="admin-category-state">Chưa có danh mục.</div> : null}
      {!isLoading && categories.length ? (
        <div className="admin-category-table-wrap">
          <table className="admin-category-table">
            <thead><tr><th>Danh mục</th><th>Sản phẩm</th><th>Trạng thái</th><th><span className="sr-only">Thao tác</span></th></tr></thead>
            <tbody>{categories.map((category) => (
              <tr key={category.id}>
                <td><div className="admin-category-identity"><strong>{category.name}</strong><small>{category.slug}</small><p>{category.description || 'Chưa có mô tả.'}</p></div></td>
                <td>{category.productsCount}</td>
                <td><span className={`admin-category-status is-${category.active ? 'active' : 'inactive'}`}>{category.active ? 'Đang hoạt động' : 'Ngừng hoạt động'}</span></td>
                <td><div className="admin-category-actions"><button type="button" onClick={() => openEditor(category)}>Sửa</button><button type="button" onClick={() => { void toggleStatus(category) }}>{category.active ? 'Ngừng' : 'Kích hoạt'}</button><button type="button" disabled={category.productsCount > 0} title={category.productsCount > 0 ? 'Không thể xóa danh mục đang có sản phẩm.' : undefined} onClick={() => { void removeCategory(category) }}>Xóa</button></div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : null}

      {editor !== undefined ? (
        <div className="admin-category-form-layer" role="presentation" onMouseDown={closeEditor}>
          <section className="admin-category-form-panel" role="dialog" aria-modal="true" aria-labelledby="admin-category-form-title" onMouseDown={(event) => event.stopPropagation()}>
            <header><div><p>{editor ? 'Chỉnh sửa' : 'Tạo mới'}</p><h2 id="admin-category-form-title">{editor?.name ?? 'Danh mục mới'}</h2></div><button type="button" onClick={closeEditor} aria-label="Đóng form">×</button></header>
            <form onSubmit={(event) => { void submit(event) }} noValidate>
              <label><span>Tên danh mục *</span><input value={values.name} maxLength={255} onChange={(event) => change('name', event.target.value)} />{errorFor('name') ? <small role="alert">{errorFor('name')}</small> : null}</label>
              <label><span>Slug *</span><input value={values.slug} maxLength={255} onChange={(event) => change('slug', event.target.value)} />{errorFor('slug') ? <small role="alert">{errorFor('slug')}</small> : null}</label>
              <label><span>Mô tả</span><textarea value={values.description} maxLength={3000} rows={6} onChange={(event) => change('description', event.target.value)} />{errorFor('description') ? <small role="alert">{errorFor('description')}</small> : null}</label>
              <label className="admin-category-active"><input type="checkbox" checked={values.active} onChange={(event) => change('active', event.target.checked)} /><span>Danh mục đang hoạt động</span></label>
              <footer><button type="button" onClick={closeEditor} disabled={isSubmitting}>Hủy</button><button className="is-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Đang lưu...' : 'Lưu danh mục'}</button></footer>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  )
}
