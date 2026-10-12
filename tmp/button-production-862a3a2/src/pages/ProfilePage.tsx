import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export function ProfilePage() {
  const navigate = useNavigate()
  const { session, refreshSession, signOut } = useAuth()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    let active = true
    void refreshSession()
      .then((nextSession) => { if (active) { setIsLoading(false); if (!nextSession) navigate('/dang-nhap', { replace: true }) } })
      .catch((loadError) => { if (active) { setIsLoading(false); setError(loadError instanceof Error ? loadError.message : 'Không thể tải hồ sơ.') } })
    return () => { active = false }
  }, [navigate, refreshSession])

  const logout = async () => {
    setIsLoggingOut(true); setError('')
    try { await signOut() } catch (logoutError) { setError(logoutError instanceof Error ? logoutError.message : 'Đăng xuất thất bại.'); setIsLoggingOut(false); return }
    navigate('/dang-nhap', { replace: true })
  }

  if (isLoading && !error) return <div className="detail-loading-copy" aria-label="Đang tải hồ sơ" aria-live="polite"><span /><span /><span /></div>

  return <section className="content-page"><p className="eyebrow">Tài khoản Daisy</p><h1>Hồ sơ của bạn</h1>{error ? <p className="error-box" role="alert">{error}</p> : null}{session ? <div className="info-card"><h2>{session.user.name}</h2><p><strong>Email:</strong> {session.user.email}</p><div className="hero-actions"><Link to="/don-hang" className="button button-primary">Lịch sử đơn hàng</Link><button type="button" className="button" onClick={() => void logout()} disabled={isLoggingOut}>{isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}</button></div></div> : <Link to="/dang-nhap" className="button button-primary">Đăng nhập lại</Link>}</section>
}
