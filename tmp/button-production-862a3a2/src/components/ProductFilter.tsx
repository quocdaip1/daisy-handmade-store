import type { Category } from '../types/category'

interface ProductFilterProps {
  categories: Category[]; selectedCategory: number | 'all'; onCategoryChange: (category: number | 'all') => void
  priceFilter: string; onPriceChange: (value: string) => void; onReset: () => void
}

const priceOptions = [
  { value: 'all', label: 'Tất cả mức giá' }, { value: 'under-1m', label: 'Dưới 1 triệu' },
  { value: '1m-2m', label: 'Từ 1 – 2 triệu' }, { value: 'over-2m', label: 'Trên 2 triệu' },
]

export function ProductFilter({ categories, selectedCategory, onCategoryChange, priceFilter, onPriceChange, onReset }: ProductFilterProps) {
  return (
    <div className="catalog-filter-content">
      <div className="filter-title-row"><h2>Bộ lọc</h2><button type="button" onClick={onReset}>Đặt lại</button></div>
      <fieldset className="filter-group">
        <legend>Danh mục</legend>
        <label className="filter-option"><input type="radio" name="category" checked={selectedCategory === 'all'} onChange={() => onCategoryChange('all')} /><span>Tất cả sản phẩm</span></label>
        {categories.map((category) => <label className="filter-option" key={category.id}><input type="radio" name="category" checked={selectedCategory === category.id} onChange={() => onCategoryChange(category.id)} /><span>{category.name}</span></label>)}
      </fieldset>
      <fieldset className="filter-group">
        <legend>Khoảng giá</legend>
        {priceOptions.map((option) => <label className="filter-option" key={option.value}><input type="radio" name="price" checked={priceFilter === option.value} onChange={() => onPriceChange(option.value)} /><span>{option.label}</span></label>)}
      </fieldset>
      <div className="filter-note"><span aria-hidden="true">✿</span><p>Mỗi món trang sức Daisy đều được hoàn thiện thủ công.</p></div>
    </div>
  )
}
