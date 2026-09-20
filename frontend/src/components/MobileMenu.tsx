import { useState } from 'react'
import { Link } from 'react-router-dom'

interface MobileMenuProps {
  isAuthenticated: boolean
  canAccessAdmin: boolean
}

export function MobileMenu({ isAuthenticated, canAccessAdmin }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const close = () => setIsOpen(false)
  return (
    <div className="mobile-menu">
      <button type="button" className="header-icon-button mobile-toggle" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen} aria-controls="mobile-navigation" aria-label={isOpen ? 'Đóng menu' : 'Mở menu'}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={isOpen ? 'M6 6l12 12M18 6 6 18' : 'M4 7h16M4 12h16M4 17h16'} /></svg>
      </button>
      {isOpen ? (
        <nav id="mobile-navigation" className="mobile-nav" aria-label="Menu di động">
          <Link to="/" onClick={close}>Trang chủ</Link><Link to="/san-pham" onClick={close}>Sản phẩm</Link>
          <Link to="/gioi-thieu" onClick={close}>Giới thiệu</Link><Link to="/lien-he" onClick={close}>Liên hệ</Link>
          <Link to={isAuthenticated ? '/tai-khoan' : '/dang-nhap'} onClick={close}>{isAuthenticated ? 'Tài khoản' : 'Đăng nhập'}</Link>
          {canAccessAdmin ? <Link to="/admin" className="mobile-admin-switch" onClick={close}>Vào trang quản trị</Link> : null}
        </nav>
      ) : null}
    </div>
  )
}
