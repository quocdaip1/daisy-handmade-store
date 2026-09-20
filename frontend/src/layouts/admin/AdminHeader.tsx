import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'

export function AdminHeader() {
  const { session, signOut } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setError('')
    setIsSigningOut(true)
    try {
      await signOut()
      navigate('/dang-nhap', { replace: true })
    } catch {
      setError('Không thể đăng xuất. Vui lòng thử lại.')
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <header className="admin-header">
      <div><p>Khu vực quản trị</p><strong>{session?.user.name}</strong></div>
      <div className="admin-header-actions">
        {error ? <span role="alert">{error}</span> : null}
        <button type="button" onClick={() => { void handleSignOut() }} disabled={isSigningOut}>
          {isSigningOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
        </button>
      </div>
    </header>
  )
}
