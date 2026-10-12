import type { InventoryMode, ProductVariant } from '../types/product'

interface Props {
  variants: ProductVariant[]
  mode: InventoryMode
  selectedId?: number
  onSelect: (id?: number) => void
}

export function ProductColorSelector({ variants, mode, selectedId, onSelect }: Props) {
  if (!variants.length) return null
  return <fieldset className="product-color-selector">
    <legend>Màu sắc</legend>
    <div><button type="button" aria-pressed={selectedId === undefined} onClick={() => onSelect(undefined)}>Xem tất cả màu</button>
      {variants.filter((variant) => variant.active).map((variant) => <button type="button" key={variant.id} aria-pressed={selectedId === variant.id} onClick={() => onSelect(variant.id)}>
        {variant.colorName}<small>{mode === 'shared' ? 'Tồn chung' : variant.stock === null ? 'Chưa nhập tồn' : variant.stock === 0 ? 'Hết hàng' : `Còn ${variant.stock}`}</small>
      </button>)}
    </div>
    {mode === 'variant' && selectedId === undefined && <p>Vui lòng chọn màu trước khi thêm vào giỏ hàng.</p>}
  </fieldset>
}
