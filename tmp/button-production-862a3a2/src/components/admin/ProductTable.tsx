import type { AdminProduct } from '../../types/admin-product'
import { formatCurrency } from '../../utils/formatCurrency'

interface ProductTableProps {
  products: AdminProduct[]
  isLoading: boolean
  onEdit: (product: AdminProduct) => void
  onDeactivate: (product: AdminProduct) => void
}

const statusLabels = { draft: 'Bản nháp', published: 'Đang bán', inactive: 'Ngừng bán' }

export function ProductTable({ products, isLoading, onEdit, onDeactivate }: ProductTableProps) {
  if (isLoading) return <div className="admin-product-state" aria-live="polite">Đang tải sản phẩm...</div>
  if (!products.length) return <div className="admin-product-state">Không tìm thấy sản phẩm phù hợp.</div>

  return (
    <div className="admin-product-table-wrap">
      <table className="admin-product-table">
        <thead><tr><th>Sản phẩm</th><th>SKU</th><th>Giá</th><th>Tồn kho</th><th>Trạng thái</th><th><span className="sr-only">Thao tác</span></th></tr></thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td><div className="admin-product-identity">{product.images[0] ? <img src={product.images[0]} alt="" /> : <span aria-hidden="true">✿</span>}<div><strong>{product.name}</strong><small>{product.slug}</small></div></div></td>
              <td>{product.sku || '—'}</td>
              <td>{formatCurrency(product.price)}</td>
              <td>{product.stock}</td>
              <td><span className={`admin-product-status is-${product.status}`}>{statusLabels[product.status]}</span></td>
              <td><div className="admin-product-actions"><button type="button" onClick={() => onEdit(product)}>Sửa</button><button type="button" disabled={product.status === 'inactive'} onClick={() => onDeactivate(product)}>Ngừng bán</button></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
