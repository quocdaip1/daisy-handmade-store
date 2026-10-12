import { useState, type FormEvent } from 'react'
import type { Category } from '../../types/category'
import type { AdminProduct, AdminProductFormValues, ProductStatus } from '../../types/admin-product'

interface ProductFormProps {
  product: AdminProduct | null
  categories: Category[]
  backendErrors: Record<string, string[]>
  isSubmitting: boolean
  onCancel: () => void
  onSubmit: (values: AdminProductFormValues, images: File[]) => Promise<void>
}

type FieldErrors = Partial<Record<keyof AdminProductFormValues | 'newImages', string>>
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp']

function initialValues(product: AdminProduct | null): AdminProductFormValues {
  return {
    categoryId: product?.categoryId ?? 0,
    name: product?.name ?? '',
    slug: product?.slug ?? '',
    sku: product?.sku ?? '',
    description: product?.description ?? '',
    shortDescription: product?.shortDescription ?? '',
    price: product?.price ?? 0,
    originalPrice: product?.originalPrice,
    material: product?.material ?? '',
    color: product?.color ?? '',
    stock: product?.stock ?? 0,
    images: product?.images ?? [],
    featured: product?.featured ?? false,
    isNew: product?.isNew ?? false,
    status: product?.status ?? 'draft',
    rating: product?.rating ?? 0,
  }
}

function validate(values: AdminProductFormValues, files: File[]): FieldErrors {
  const errors: FieldErrors = {}
  if (!values.categoryId) errors.categoryId = 'Vui lòng chọn danh mục.'
  if (!values.name.trim()) errors.name = 'Tên sản phẩm là bắt buộc.'
  else if (values.name.length > 255) errors.name = 'Tên tối đa 255 ký tự.'
  if (!values.slug.trim()) errors.slug = 'Slug là bắt buộc.'
  else if (values.slug.length > 255) errors.slug = 'Slug tối đa 255 ký tự.'
  if (values.sku.length > 100) errors.sku = 'SKU tối đa 100 ký tự.'
  if (!values.description.trim()) errors.description = 'Mô tả là bắt buộc.'
  else if (values.description.length > 10000) errors.description = 'Mô tả tối đa 10.000 ký tự.'
  if (values.shortDescription.length > 1000) errors.shortDescription = 'Mô tả ngắn tối đa 1.000 ký tự.'
  if (!Number.isInteger(values.price) || values.price < 0) errors.price = 'Giá phải là số nguyên không âm.'
  if (values.originalPrice != null && (!Number.isInteger(values.originalPrice) || values.originalPrice < values.price)) errors.originalPrice = 'Giá gốc phải là số nguyên và không thấp hơn giá bán.'
  if (!values.material.trim()) errors.material = 'Chất liệu là bắt buộc.'
  if (!values.color.trim()) errors.color = 'Màu sắc là bắt buộc.'
  if (!Number.isInteger(values.stock) || values.stock < 0) errors.stock = 'Tồn kho phải là số nguyên không âm.'
  if (values.rating < 0 || values.rating > 5) errors.rating = 'Đánh giá phải từ 0 đến 5.'
  if (values.images.length + files.length > 8) errors.newImages = 'Mỗi sản phẩm có tối đa 8 ảnh.'
  else if (files.some((file) => !allowedImageTypes.includes(file.type) || file.size > 5 * 1024 * 1024)) errors.newImages = 'Ảnh phải là JPG, PNG hoặc WebP và không quá 5 MB.'
  return errors
}

const serverFieldMap: Record<keyof AdminProductFormValues, string> = {
  categoryId: 'category_id', name: 'name', slug: 'slug', sku: 'sku', description: 'description', shortDescription: 'short_description', price: 'price', originalPrice: 'original_price', material: 'material', color: 'color', stock: 'stock', images: 'images', featured: 'featured', isNew: 'is_new', status: 'status', rating: 'rating',
}

export function ProductForm({ product, categories, backendErrors, isSubmitting, onCancel, onSubmit }: ProductFormProps) {
  const [values, setValues] = useState(() => initialValues(product))
  const [newImages, setNewImages] = useState<File[]>([])
  const [errors, setErrors] = useState<FieldErrors>({})

  const change = <K extends keyof AdminProductFormValues>(field: K, value: AdminProductFormValues[K]) => setValues((current) => ({ ...current, [field]: value }))
  const errorFor = (field: keyof AdminProductFormValues) => errors[field] || backendErrors[serverFieldMap[field]]?.[0]
  const imageServerError = backendErrors.images?.[0] || Object.entries(backendErrors).find(([field]) => field.startsWith('images.'))?.[1][0]

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const nextErrors = validate(values, newImages)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    void onSubmit(values, newImages)
  }

  return (
    <div className="admin-product-form-layer" role="presentation" onMouseDown={onCancel}>
      <section className="admin-product-form-panel" role="dialog" aria-modal="true" aria-labelledby="admin-product-form-title" onMouseDown={(event) => event.stopPropagation()}>
        <header><div><p>{product ? 'Chỉnh sửa' : 'Tạo mới'}</p><h2 id="admin-product-form-title">{product?.name ?? 'Sản phẩm mới'}</h2></div><button type="button" onClick={onCancel} aria-label="Đóng form">×</button></header>
        <form onSubmit={submit} noValidate>
          <div className="admin-form-grid">
            <label><span>Tên sản phẩm *</span><input value={values.name} maxLength={255} onChange={(event) => change('name', event.target.value)} />{errorFor('name') ? <small role="alert">{errorFor('name')}</small> : null}</label>
            <label><span>Slug *</span><input value={values.slug} maxLength={255} onChange={(event) => change('slug', event.target.value)} />{errorFor('slug') ? <small role="alert">{errorFor('slug')}</small> : null}</label>
            <label><span>Danh mục *</span><select value={values.categoryId} onChange={(event) => change('categoryId', Number(event.target.value))}><option value={0}>Chọn danh mục</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>{errorFor('categoryId') ? <small role="alert">{errorFor('categoryId')}</small> : null}</label>
            <label><span>SKU</span><input value={values.sku} maxLength={100} onChange={(event) => change('sku', event.target.value)} />{errorFor('sku') ? <small role="alert">{errorFor('sku')}</small> : null}</label>
            <label><span>Giá bán *</span><input type="number" min="0" step="1" value={values.price} onChange={(event) => change('price', Number(event.target.value))} />{errorFor('price') ? <small role="alert">{errorFor('price')}</small> : null}</label>
            <label><span>Giá gốc</span><input type="number" min="0" step="1" value={values.originalPrice ?? ''} onChange={(event) => change('originalPrice', event.target.value === '' ? undefined : Number(event.target.value))} />{errorFor('originalPrice') ? <small role="alert">{errorFor('originalPrice')}</small> : null}</label>
            <label><span>Chất liệu *</span><input value={values.material} maxLength={255} onChange={(event) => change('material', event.target.value)} />{errorFor('material') ? <small role="alert">{errorFor('material')}</small> : null}</label>
            <label><span>Màu sắc *</span><input value={values.color} maxLength={255} onChange={(event) => change('color', event.target.value)} />{errorFor('color') ? <small role="alert">{errorFor('color')}</small> : null}</label>
            <label><span>Tồn kho *</span><input type="number" min="0" step="1" value={values.stock} onChange={(event) => change('stock', Number(event.target.value))} />{errorFor('stock') ? <small role="alert">{errorFor('stock')}</small> : null}</label>
            <label><span>Trạng thái</span><select value={values.status} onChange={(event) => change('status', event.target.value as ProductStatus)}><option value="draft">Bản nháp</option><option value="published">Đang bán</option><option value="inactive">Ngừng bán</option></select></label>
            <label><span>Đánh giá</span><input type="number" min="0" max="5" step="0.1" value={values.rating} onChange={(event) => change('rating', Number(event.target.value))} />{errorFor('rating') ? <small role="alert">{errorFor('rating')}</small> : null}</label>
          </div>
          <label className="admin-form-wide"><span>Mô tả ngắn</span><textarea value={values.shortDescription} maxLength={1000} rows={3} onChange={(event) => change('shortDescription', event.target.value)} />{errorFor('shortDescription') ? <small role="alert">{errorFor('shortDescription')}</small> : null}</label>
          <label className="admin-form-wide"><span>Mô tả *</span><textarea value={values.description} maxLength={10000} rows={6} onChange={(event) => change('description', event.target.value)} />{errorFor('description') ? <small role="alert">{errorFor('description')}</small> : null}</label>
          <fieldset className="admin-form-checks"><legend>Hiển thị</legend><label><input type="checkbox" checked={values.featured} onChange={(event) => change('featured', event.target.checked)} /> Sản phẩm nổi bật</label><label><input type="checkbox" checked={values.isNew} onChange={(event) => change('isNew', event.target.checked)} /> Sản phẩm mới</label></fieldset>
          <fieldset className="admin-image-manager"><legend>Ảnh sản phẩm</legend>{values.images.length ? <div className="admin-current-images">{values.images.map((image) => <div key={image}><img src={image} alt="" /><button type="button" onClick={() => change('images', values.images.filter((item) => item !== image))}>Gỡ ảnh</button></div>)}</div> : <p>Chưa có ảnh.</p>}<label><span>Thêm ảnh JPG, PNG hoặc WebP (tối đa 5 MB/ảnh)</span><input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => setNewImages(Array.from(event.target.files ?? []))} /></label>{newImages.length ? <small>{newImages.map((file) => file.name).join(', ')}</small> : null}{errors.newImages || imageServerError ? <small role="alert">{errors.newImages || imageServerError}</small> : null}</fieldset>
          <footer><button type="button" onClick={onCancel} disabled={isSubmitting}>Hủy</button><button className="is-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Đang lưu...' : 'Lưu sản phẩm'}</button></footer>
        </form>
      </section>
    </div>
  )
}
