import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AUTH_TOKEN_KEY, AuthRequestError, loginUser } from '../services/auth'

interface LoginFormErrors { email?: string; password?: string }

export function LoginPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<LoginFormErrors>({})
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors: LoginFormErrors = {}
    if (!formData.email.trim()) nextErrors.email = 'Vui lòng nhập email.'
    if (formData.password.length < 6) nextErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setIsSubmitting(true); setError('')
    try {
      const response = await loginUser({ email: formData.email.trim(), password: formData.password })
      window.localStorage.setItem(AUTH_TOKEN_KEY, response.token)
      navigate('/tai-khoan', { replace: true })
    } catch (submitError) {
      if (submitError instanceof AuthRequestError) {
        setErrors({ email: submitError.errors.email?.[0], password: submitError.errors.password?.[0] })
        setError(submitError.message)
      } else setError('Đăng nhập thất bại.')
    } finally { setIsSubmitting(false) }
  }

  return <section className="content-page auth-page" aria-labelledby="login-title"><div className="auth-card"><h1 id="login-title">Đăng nhập</h1><p>Đăng nhập an toàn bằng tài khoản Daisy của bạn.</p><form onSubmit={handleSubmit} noValidate>{error ? <p className="error-box" role="alert">{error}</p> : null}<label><span>Email</span><input type="email" autoComplete="email" value={formData.email} onChange={(event) => { setFormData({ ...formData, email: event.target.value }); setErrors({ ...errors, email: undefined }) }} aria-invalid={Boolean(errors.email)} />{errors.email ? <small>{errors.email}</small> : null}</label><label><span>Mật khẩu</span><span className={`password-field${formData.password ? ' has-value' : ''}`}><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={formData.password} onChange={(event) => { setFormData({ ...formData, password: event.target.value }); setErrors({ ...errors, password: undefined }) }} aria-invalid={Boolean(errors.password)} />{formData.password ? <button type="button" className="password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={showPassword}>{showPassword ? 'Ẩn' : 'Hiện'}</button> : null}</span>{errors.password ? <small>{errors.password}</small> : null}</label><button type="submit" className="button button-primary" disabled={isSubmitting}>{isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}</button></form><p>Chưa có tài khoản? <Link to="/dang-ky">Đăng ký ngay</Link></p></div></section>
}
