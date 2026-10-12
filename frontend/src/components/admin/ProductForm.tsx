import { useState, type FormEvent } from 'react'
import { ProductVariantEditor } from './ProductVariantEditor'
import { ProductGalleryEditor } from './ProductGalleryEditor'
import { initialProductValues, validateProductForm, productServerFields, type FieldErrors } from '../../utils/adminProductForm'
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

export function ProductForm({ product, categories, backendErrors, isSubmitting, onCancel, onSubmit }: ProductFormProps) {
  const [values, setValues] = useState(() => initialProductValues(product))
  const [newImages, setNewImages] = useState<File[]>([])
  const [errors, setErrors] = useState<FieldErrors>({})

  const change = <K extends keyof AdminProductFormValues>(field: K, value: AdminProductFormValues[K]) => setValues((current) => ({ ...current, [field]: value }))
  const errorFor = (field: keyof AdminProductFormValues) => errors[field] || backendErrors[productServerFields[field]]?.[0]
  const imageServerError = backendErrors.images?.[0] || Object.entries(backendErrors).find(([field]) => field.startsWith('images.'))?.[1][0]

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const nextErrors = validateProductForm(values, newImages)
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
            <label><span>Tồn kho *</span><input disabled={values.inventoryMode === 'variant'} type="number" min="0" step="1" value={values.stock} onChange={(event) => change('stock', Number(event.target.value))} />{errorFor('stock') ? <small role="alert">{errorFor('stock')}</small> : null}</label>
            <label><span>Trạng thái</span><select value={values.status} onChange={(event) => change('status', event.target.value as ProductStatus)}><option value="draft">Bản nháp</option><option value="published">Đang bán</option><option value="inactive">Ngừng bán</option></select></label>
            <label><span>Đánh giá</span><input type="number" min="0" max="5" step="0.1" value={values.rating} onChange={(event) => change('rating', Number(event.target.value))} />{errorFor('rating') ? <small role="alert">{errorFor('rating')}</small> : null}</label>
          </div>
          <label className="admin-form-wide"><span>Mô tả ngắn</span><textarea value={values.shortDescription} maxLength={1000} rows={3} onChange={(event) => change('shortDescription', event.target.value)} />{errorFor('shortDescription') ? <small role="alert">{errorFor('shortDescription')}</small> : null}</label>
          <label className="admin-form-wide"><span>Mô tả *</span><textarea value={values.description} maxLength={10000} rows={6} onChange={(event) => change('description', event.target.value)} />{errorFor('description') ? <small role="alert">{errorFor('description')}</small> : null}</label>
          <fieldset className="admin-form-checks"><legend>Hiển thị</legend><label><input type="checkbox" checked={values.featured} onChange={(event) => change('featured', event.target.checked)} /> Sản phẩm nổi bật</label><label><input type="checkbox" checked={values.isNew} onChange={(event) => change('isNew', event.target.checked)} /> Sản phẩm mới</label></fieldset>
          <ProductGalleryEditor images={values.images} coverImage={values.coverImage} files={newImages} error={errors.newImages || imageServerError || errorFor('coverImage')} onImagesChange={(images) => setValues((current) => ({ ...current, images, variants: current.variants.map((variant) => ({ ...variant, images: variant.images.filter((image) => images.includes(image)) })) }))} onCoverChange={(image) => change('coverImage', image)} onFilesChange={setNewImages} />
          <ProductVariantEditor variants={values.variants} images={values.images} mode={values.inventoryMode} stock={product?.stock ?? values.stock} confirmed={values.confirmStockAdjustment} error={errorFor('variants') || errorFor('inventoryMode') || errorFor('confirmStockAdjustment') || Object.entries(backendErrors).find(([field]) => field.startsWith('variants.'))?.[1][0]} onVariantsChange={(variants) => { change('variants', variants); change('confirmStockAdjustment', false) }} onModeChange={(mode) => change('inventoryMode', mode)} onConfirmChange={(confirmed) => change('confirmStockAdjustment', confirmed)} />
          <footer><button type="button" onClick={onCancel} disabled={isSubmitting}>Hủy</button><button className="is-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Đang lưu...' : 'Lưu sản phẩm'}</button></footer>
        </form>
      </section>
    </div>
  )
}
