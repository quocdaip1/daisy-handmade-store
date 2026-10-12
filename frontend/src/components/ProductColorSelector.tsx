import type { InventoryMode, ProductVariant } from '../types/product'

interface Props {
  variants: ProductVariant[]
  mode: InventoryMode
  selectedId?: number
  onSelect: (id?: number) => void
}

export function ProductColorSelector({ variants, mode, selectedId, onSelect }: Props) {
  const activeVariants = variants.filter((variant) => variant.active)
  if (!activeVariants.length) return null
  return <fieldset className="product-color-selector">
    <legend>Màu sắc</legend>
    <div>
      {activeVariants.map((variant) => <button type="button" key={variant.id} aria-pressed={selectedId === variant.id} onClick={() => onSelect(variant.id)}>
        {variant.colorName}{mode === 'variant' && (variant.stock === null || variant.stock === 0) ? <small>{variant.stock === null ? 'Chưa nhập tồn' : 'Hết hàng'}</small> : null}
      </button>)}
    </div>
    {mode === 'variant' && selectedId === undefined && <p>Vui lòng chọn màu trước khi thêm vào giỏ hàng.</p>}
  </fieldset>
}
