import type { InventoryMode, ProductVariantDraft } from '../../types/product'
import { moveGalleryItem } from '../../utils/productGallery'

interface Props {
  variants: ProductVariantDraft[]
  images: string[]
  mode: InventoryMode
  stock: number
  confirmed: boolean
  error?: string
  onVariantsChange: (variants: ProductVariantDraft[]) => void
  onModeChange: (mode: InventoryMode) => void
  onConfirmChange: (confirmed: boolean) => void
}

export function ProductVariantEditor({ variants, images, mode, stock, confirmed, error, onVariantsChange, onModeChange, onConfirmChange }: Props) {
  const update = (index: number, fields: Partial<ProductVariantDraft>) => onVariantsChange(variants.map((variant, i) => i === index ? { ...variant, ...fields } : variant))
  const total = variants.filter((variant) => variant.active).reduce((sum, variant) => sum + (variant.stock ?? 0), 0)
  return <fieldset className="admin-variant-editor">
    <legend>Màu và tồn kho</legend>
    <label>Chế độ tồn <select value={mode} onChange={(event) => { onModeChange(event.target.value as InventoryMode); onConfirmChange(false) }}><option value="shared">Tồn chung</option><option value="variant">Tồn theo màu</option></select></label>
    <p>Tồn hiện tại: {stock}. Tổng tồn màu đang bán: {total}. Ô trống là chưa nhập; 0 là hết hàng.</p>
    {variants.map((variant, index) => <section className="admin-variant-row" key={variant.id ?? `new-${index}`}>
      <label>Tên màu <input value={variant.colorName} maxLength={100} onChange={(event) => update(index, { colorName: event.target.value })} /></label>
      <label>Tồn màu <input type="number" min="0" step="1" value={variant.stock ?? ''} onChange={(event) => update(index, { stock: event.target.value === '' ? null : Number(event.target.value) })} /></label>
      <label><input type="checkbox" checked={variant.active} onChange={(event) => update(index, { active: event.target.checked })} /> Màu đang bán</label>
      <div className="admin-variant-images">{images.map((image, imageIndex) => <label key={image}><img src={image} alt={`Ảnh ${imageIndex + 1}`} /><input type="checkbox" checked={variant.images.includes(image)} onChange={(event) => update(index, { images: event.target.checked ? [...variant.images, image] : variant.images.filter((item) => item !== image) })} />Gắn ảnh {imageIndex + 1}</label>)}</div>
      <div className="admin-variant-images">{variant.images.map((image, imageIndex) => <div key={image}><img src={image} alt={`Ảnh màu ${imageIndex + 1}`} /><button type="button" disabled={imageIndex === 0} onClick={() => update(index, { images: moveGalleryItem(variant.images, imageIndex, -1) })}>Ảnh màu lên</button><button type="button" disabled={imageIndex === variant.images.length - 1} onClick={() => update(index, { images: moveGalleryItem(variant.images, imageIndex, 1) })}>Ảnh màu xuống</button></div>)}</div>
      {!variant.id && <button type="button" onClick={() => onVariantsChange(variants.filter((_, i) => i !== index))}>Bỏ màu chưa lưu</button>}
    </section>)}
    <button type="button" onClick={() => onVariantsChange([...variants, { colorName: '', stock: null, images: [], active: true }])}>Thêm màu</button>
    <label><input type="checkbox" checked={confirmed} onChange={(event) => onConfirmChange(event.target.checked)} /> Tôi xác nhận điều chỉnh tổng tồn khi chuyển chế độ nếu có chênh lệch.</label>
    <p>Màu đã lưu được ngừng bán thay vì xóa để giữ lịch sử. Ảnh mới upload có thể gắn màu sau khi lưu.</p>
    {error && <small role="alert">{error}</small>}
  </fieldset>
}
