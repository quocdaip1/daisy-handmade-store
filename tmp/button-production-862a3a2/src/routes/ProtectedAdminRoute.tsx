import { useCallback, useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { AuthRequestError, verifyAdminAccess } from '../services/auth'

type AccessStatus = 'checking' | 'allowed' | 'unauthenticated' | 'unauthorized' | 'error'

export function ProtectedAdminRoute() {
  const { refreshSession } = useAuth()
  const [status, setStatus] = useState<AccessStatus>('checking')

  const resolveAccess = useCallback(async (): Promise<AccessStatus> => {
    try {
      const session = await refreshSession()
      if (!session) return 'unauthenticated'

      await verifyAdminAccess(session.token)
      return 'allowed'
    } catch (error) {
      if (error instanceof AuthRequestError) {
        return error.status === 401 ? 'unauthenticated' : error.status === 403 ? 'unauthorized' : 'error'
      }
      return 'error'
    }
  }, [refreshSession])

  useEffect(() => {
    let active = true
    void resolveAccess().then((nextStatus) => {
      if (active) setStatus(nextStatus)
    })
    return () => { active = false }
  }, [resolveAccess])

  if (status === 'unauthenticated') return <Navigate to="/dang-nhap" replace />
  if (status === 'unauthorized') return <Navigate to="/" replace />
  if (status === 'allowed') return <Outlet />

  if (status === 'error') {
    return (
      <main className="admin-access-state" role="alert">
        <h1>Không thể kiểm tra quyền quản trị</h1>
        <p>Vui lòng kiểm tra kết nối và thử lại.</p>
        <button type="button" onClick={() => {
          setStatus('checking')
          void resolveAccess().then(setStatus)
        }}>Thử lại</button>
      </main>
    )
  }

  return <main className="admin-access-state" aria-live="polite">Đang kiểm tra quyền quản trị...</main>
}
