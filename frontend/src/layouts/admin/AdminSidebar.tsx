import { NavLink } from 'react-router-dom'

export function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <span aria-hidden="true">✿</span>
        <div><strong>Daisy Admin</strong><small>Quản trị cửa hàng</small></div>
      </div>
      <nav aria-label="Điều hướng quản trị">
        <NavLink to="/admin" end>Tổng quan</NavLink>
        <NavLink to="/admin/products">Sản phẩm</NavLink>
        <NavLink to="/admin/categories">Danh mục</NavLink>
        <NavLink to="/admin/orders">Đơn hàng</NavLink>
        <NavLink to="/admin/customers">Khách hàng</NavLink>
        <NavLink to="/admin/coupons">Mã giảm giá</NavLink>
        <NavLink to="/admin/content/banners">Banner</NavLink>
        <NavLink to="/admin/content/contacts">Liên hệ</NavLink>
        <NavLink to="/admin/content/policies">Chính sách</NavLink>
        <NavLink to="/admin/settings">Cài đặt</NavLink>
      </nav>
      <NavLink className="admin-store-link" to="/">Về cửa hàng</NavLink>
    </aside>
  )
}
