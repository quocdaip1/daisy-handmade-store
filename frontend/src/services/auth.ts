import { apiUrl } from '../config/api'

export const AUTH_TOKEN_KEY = 'viet-ngoc-auth-token'

export interface AuthUser {
  id: number
  name: string
  email: string
}

interface LoginPayload { email: string; password: string }
interface RegisterPayload { name: string; email: string; password: string }
interface ErrorResponse { message?: string; errors?: Record<string, string[]> }

export class AuthRequestError extends Error {
  readonly status: number
  readonly errors: Record<string, string[]>

  constructor(status: number, response: ErrorResponse, fallback: string) {
    super(response.message || fallback)
    this.status = status
    this.errors = response.errors ?? {}
  }
}

async function request<T>(path: string, options: RequestInit, fallback: string): Promise<T> {
  const response = await fetch(apiUrl(path), options)
  const contentType = response.headers.get('content-type') ?? ''
  const data = contentType.includes('application/json')
    ? await response.json() as T & ErrorResponse
    : {} as T & ErrorResponse
  if (!response.ok) throw new AuthRequestError(response.status, data, fallback)
  if (!contentType.includes('application/json')) {
    throw new AuthRequestError(response.status, {}, fallback)
  }
  return data
}

const jsonHeaders = { 'Content-Type': 'application/json' }

export function loginUser(payload: LoginPayload) {
  return request<{ user: AuthUser; token: string }>('/login', { method: 'POST', headers: jsonHeaders, body: JSON.stringify(payload) }, 'Đăng nhập thất bại.')
}

export function registerUser(payload: RegisterPayload) {
  return request<{ user: AuthUser; token: string }>('/register', { method: 'POST', headers: jsonHeaders, body: JSON.stringify(payload) }, 'Đăng ký thất bại.')
}

export function fetchMe(token: string) {
  return request<{ user: AuthUser }>('/me', { headers: { Authorization: `Bearer ${token}` } }, 'Không thể lấy thông tin người dùng.')
}

export function logoutUser(token: string) {
  return request<{ message: string }>('/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }, 'Đăng xuất thất bại.')
}
