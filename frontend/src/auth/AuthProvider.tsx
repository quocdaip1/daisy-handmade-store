import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { AUTH_TOKEN_KEY, fetchMe, logoutUser } from '../services/auth'
import { AuthContext, type AuthSession } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)

  const startSession = useCallback((nextSession: AuthSession) => {
    localStorage.setItem(AUTH_TOKEN_KEY, nextSession.token)
    setSession(nextSession)
  }, [])

  const refreshSession = useCallback(async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      setSession(null)
      return null
    }

    try {
      const response = await fetchMe(token)
      const nextSession = { token, user: response.user }
      setSession(nextSession)
      return nextSession
    } catch (error) {
      if (error instanceof Error && 'status' in error && error.status === 401) {
        localStorage.removeItem(AUTH_TOKEN_KEY)
      }
      setSession(null)
      throw error
    }
  }, [])

  const signOut = useCallback(async () => {
    const token = session?.token ?? localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      setSession(null)
      return
    }

    await logoutUser(token)
    localStorage.removeItem(AUTH_TOKEN_KEY)
    setSession(null)
  }, [session])

  const value = useMemo(() => ({ session, startSession, refreshSession, signOut }), [refreshSession, session, signOut, startSession])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
