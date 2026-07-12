import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AUTH_TOKEN_KEY, AuthRequestError, registerUser } from '../services/auth'

interface RegisterFormErrors { fullName?: string; email?: string; password?: string; confirmPassword?: string }

export function RegisterPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<RegisterFormErrors>({})
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors: RegisterFormErrors = {}
    if (formData.fullName.trim().length < 2) nextErrors.fullName = 'Họ và tên phải có ít nhất 2 ký tự.'
    if (!formData.email.trim()) nextErrors.email = 'Vui lòng nhập email.'
    if (formData.password.length < 6) nextErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự.'
    if (formData.confirmPassword !== formData.password) nextErrors.confirmPassword = 'Mật khẩu xác nhận không khớp.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setIsSubmitting(true); setError('')
    try {
      const response = await registerUser({ name: formData.fullName.trim(), email: formData.email.trim(), password: formData.password })
      window.localStorage.setItem(AUTH_TOKEN_KEY, response.token)
      navigate('/tai-khoan', { replace: true })
    } catch (submitError) {
      if (submitError instanceof AuthRequestError) {
        setErrors((current) => ({ ...current, fullName: submitError.errors.name?.[0], email: submitError.errors.email?.[0], password: submitError.errors.password?.[0] }))
        setError(submitError.message)
      } else setError('Đăng ký thất bại.')
    } finally { setIsSubmitting(false) }
  }

  const update = (field: keyof typeof formData, value: string) => { setFormData((current) => ({ ...current, [field]: value })); setErrors((current) => ({ ...current, [field]: undefined })) }

  return <section className="content-page auth-page" aria-labelledby="register-title"><div className="auth-card"><h1 id="register-title">Đăng ký</h1><p>Tạo tài khoản Daisy để theo dõi đơn hàng của bạn.</p><form onSubmit={handleSubmit} noValidate>{error ? <p className="error-box" role="alert">{error}</p> : null}<label><span>Họ và tên</span><input autoComplete="name" value={formData.fullName} onChange={(event) => update('fullName', event.target.value)} aria-invalid={Boolean(errors.fullName)} />{errors.fullName ? <small>{errors.fullName}</small> : null}</label><label><span>Email</span><input type="email" autoComplete="email" value={formData.email} onChange={(event) => update('email', event.target.value)} aria-invalid={Boolean(errors.email)} />{errors.email ? <small>{errors.email}</small> : null}</label><label><span>Mật khẩu</span><span className={`password-field${formData.password ? ' has-value' : ''}`}><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={formData.password} onChange={(event) => update('password', event.target.value)} aria-invalid={Boolean(errors.password)} />{formData.password ? <button type="button" className="password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={showPassword}>{showPassword ? 'Ẩn' : 'Hiện'}</button> : null}</span>{errors.password ? <small>{errors.password}</small> : null}</label><label><span>Nhập lại mật khẩu</span><span className={`password-field${formData.confirmPassword ? ' has-value' : ''}`}><input type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" value={formData.confirmPassword} onChange={(event) => update('confirmPassword', event.target.value)} aria-invalid={Boolean(errors.confirmPassword)} />{formData.confirmPassword ? <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword((current) => !current)} aria-label={showConfirmPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'} aria-pressed={showConfirmPassword}>{showConfirmPassword ? 'Ẩn' : 'Hiện'}</button> : null}</span>{errors.confirmPassword ? <small>{errors.confirmPassword}</small> : null}</label><button type="submit" className="button button-primary" disabled={isSubmitting}>{isSubmitting ? 'Đang tạo tài khoản...' : 'Đăng ký'}</button></form><p>Đã có tài khoản? <Link to="/dang-nhap">Đăng nhập</Link></p></div></section>
}
