import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AUTH_TOKEN_KEY, fetchMe, logoutUser, type AuthUser } from '../services/auth'

export function ProfilePage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [error, setError] = useState('')
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) { navigate('/dang-nhap', { replace: true }); return }
    let active = true
    void fetchMe(token).then((response) => { if (active) setUser(response.user) }).catch((loadError) => {
      if (!active) return
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải hồ sơ.')
      window.localStorage.removeItem(AUTH_TOKEN_KEY)
    })
    return () => { active = false }
  }, [navigate])

  const logout = async () => {
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) { navigate('/dang-nhap', { replace: true }); return }
    setIsLoggingOut(true); setError('')
    try { await logoutUser(token) } catch (logoutError) { setError(logoutError instanceof Error ? logoutError.message : 'Đăng xuất thất bại.'); setIsLoggingOut(false); return }
    window.localStorage.removeItem(AUTH_TOKEN_KEY)
    navigate('/dang-nhap', { replace: true })
  }

  if (!user && !error) return <div className="detail-loading-copy" aria-label="Đang tải hồ sơ" aria-live="polite"><span /><span /><span /></div>

  return <section className="content-page"><p className="eyebrow">Tài khoản Daisy</p><h1>Hồ sơ của bạn</h1>{error ? <p className="error-box" role="alert">{error}</p> : null}{user ? <div className="info-card"><h2>{user.name}</h2><p><strong>Email:</strong> {user.email}</p><div className="hero-actions"><Link to="/don-hang" className="button button-primary">Lịch sử đơn hàng</Link><button type="button" className="button" onClick={() => void logout()} disabled={isLoggingOut}>{isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}</button></div></div> : <Link to="/dang-nhap" className="button button-primary">Đăng nhập lại</Link>}</section>
}
