import { createContext } from 'react'
import type { AuthUser } from '../services/auth'

export interface AuthSession {
  token: string
  user: AuthUser
}

export interface AuthContextValue {
  session: AuthSession | null
  startSession: (session: AuthSession) => void
  refreshSession: () => Promise<AuthSession | null>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
