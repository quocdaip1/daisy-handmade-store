interface SearchBarProps { value: string; onChange: (value: string) => void }

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <label className="catalog-search">
      <span className="sr-only">Tìm kiếm sản phẩm</span>
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
      <input type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Tìm trâm, vòng tay, hoa tai..." />
      {value ? <button type="button" onClick={() => onChange('')} aria-label="Xóa nội dung tìm kiếm">×</button> : null}
    </label>
  )
}
