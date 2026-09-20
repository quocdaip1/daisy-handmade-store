import { useContext, useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import logo from '../assets/daisy-logo.webp'
import { useAuth } from '../auth/useAuth'
import { CartContext } from '../context/CartContext'
import { verifyAdminAccess } from '../services/auth'
import { MobileMenu } from './MobileMenu'

export function Header() {
  const { totalItems } = useContext(CartContext)
  const { pathname } = useLocation()
  const { session, refreshSession } = useAuth()
  const [adminToken, setAdminToken] = useState<string | null>(null)
  const canAccessAdmin = Boolean(session && adminToken === session.token)

  useEffect(() => {
    if (!session) void refreshSession().catch(() => undefined)
  }, [refreshSession, session])

  useEffect(() => {
    let active = true
    if (!session) return () => { active = false }

    void verifyAdminAccess(session.token)
      .then(() => { if (active) setAdminToken(session.token) })
      .catch(() => { if (active) setAdminToken(null) })

    return () => { active = false }
  }, [session])

  return (
    <header className="site-header-shell">
      <div className="site-header">
        <Link to="/" className="brand-link" aria-label="Daisy Handmade Store - Trang chủ">
          <img src={logo} alt="" className="brand-logo" width="72" height="72" loading="eager" decoding="async" fetchPriority="high" />
          <span className="brand-copy"><strong>Daisy</strong><small>Handmade Store</small></span>
        </Link>
        <nav className="main-nav" aria-label="Điều hướng chính">
          <NavLink to="/" end>Trang chủ</NavLink><NavLink to="/san-pham">Sản phẩm</NavLink>
          <NavLink to="/gioi-thieu">Giới thiệu</NavLink><NavLink to="/lien-he">Liên hệ</NavLink>
        </nav>
        <div className="header-actions">
          {canAccessAdmin && !pathname.startsWith('/admin') ? <Link to="/admin" className="admin-switch-link">Vào quản trị</Link> : null}
          <Link to={session ? '/tai-khoan' : '/dang-nhap'} className="header-icon-button" aria-label={session ? `Tài khoản của ${session.user.name}` : 'Đăng nhập'}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" /></svg>
          </Link>
          <Link to="/gio-hang" className="header-icon-button cart-link" aria-label={`Giỏ hàng, ${totalItems} sản phẩm`}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h2l2.3 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 7H6M10 20h.01M17 20h.01" /></svg>
            {totalItems > 0 ? <span className="badge">{totalItems > 99 ? '99+' : totalItems}</span> : null}
          </Link>
          <MobileMenu isAuthenticated={Boolean(session)} canAccessAdmin={canAccessAdmin} />
        </div>
      </div>
    </header>
  )
}
