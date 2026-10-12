import type { AdminProduct, AdminProductFormValues } from '../types/admin-product'
import { MAX_PRODUCT_IMAGES, MAX_IMAGE_BYTES, PRODUCT_IMAGE_TYPES } from './productGallery'

export type FieldErrors = Partial<Record<keyof AdminProductFormValues | 'newImages', string>>


export function initialProductValues(product: AdminProduct | null): AdminProductFormValues {
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
    inventoryMode: product?.inventoryMode ?? 'shared',
    variants: product?.variants ?? [],
    confirmStockAdjustment: false,
    coverImage: product?.coverImage,
    images: product?.images ?? [],
    featured: product?.featured ?? false,
    isNew: product?.isNew ?? false,
    status: product?.status ?? 'draft',
    rating: product?.rating ?? 0,
  }
}

export function validateProductForm(values: AdminProductFormValues, files: File[]): FieldErrors {
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
  if (values.images.length + files.length > MAX_PRODUCT_IMAGES) errors.newImages = `Mỗi sản phẩm có tối đa ${MAX_PRODUCT_IMAGES} ảnh.`
  else if (files.some((file) => !PRODUCT_IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_BYTES)) errors.newImages = 'Ảnh phải là JPG, PNG hoặc WebP và không quá 5 MB.'
  if (values.variants.some((variant) => !variant.colorName.trim() || variant.colorName.length > 100 || (variant.stock !== null && (!Number.isInteger(variant.stock) || variant.stock < 0)))) errors.variants = 'Tên màu và tồn màu chưa hợp lệ.'
  if (new Set(values.variants.map((variant) => variant.colorName.trim().toLocaleLowerCase())).size !== values.variants.length) errors.variants = 'Tên màu không được trùng.'
  if (values.inventoryMode === 'variant' && (!values.variants.some((variant) => variant.active) || values.variants.some((variant) => variant.active && variant.stock === null))) errors.variants = 'Nhập tồn cho tất cả màu đang bán.'
  return errors
}

export const productServerFields: Record<keyof AdminProductFormValues, string> = {
  categoryId: 'category_id', name: 'name', slug: 'slug', sku: 'sku', description: 'description', shortDescription: 'short_description', price: 'price', originalPrice: 'original_price', material: 'material', color: 'color', stock: 'stock', images: 'images', featured: 'featured', isNew: 'is_new', status: 'status', rating: 'rating', coverImage: 'cover_image', inventoryMode: 'inventory_mode', variants: 'variants', confirmStockAdjustment: 'confirm_stock_adjustment',
}

