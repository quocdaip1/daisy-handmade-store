import { useState } from 'react'
import { apiUrl } from '../config/api'

interface ContactErrors { name?: string; email?: string; phone?: string; subject?: string; message?: string }

export function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [errors, setErrors] = useState<ContactErrors>({})
  const [status, setStatus] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const update = (field: keyof typeof form, value: string) => { setForm((current) => ({ ...current, [field]: value })); setErrors((current) => ({ ...current, [field]: undefined })); setStatus('') }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true); setStatus(''); setErrors({})
    try {
      const response = await fetch(apiUrl('/contacts'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await response.json() as { message?: string; errors?: Record<string, string[]> }
      if (!response.ok) {
        setErrors({ name: data.errors?.name?.[0], email: data.errors?.email?.[0], phone: data.errors?.phone?.[0], subject: data.errors?.subject?.[0], message: data.errors?.message?.[0] })
        setStatus(data.message || 'Chưa thể gửi liên hệ.')
        return
      }
      setStatus(data.message || 'Daisy đã nhận được liên hệ của bạn.')
      setForm({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch { setStatus('Kết nối đang gián đoạn. Bạn vui lòng thử lại.') }
    finally { setIsSubmitting(false) }
  }

  return <section className="content-page"><p className="eyebrow">Daisy Handmade Store</p><h1>Liên hệ với Daisy</h1><p>Chúng mình sẵn lòng tư vấn trang sức phù hợp với áo dài, Việt phục và món quà bạn đang tìm kiếm.</p><div className="info-card"><h2>Thông tin cửa hàng</h2><address>Khu phố Hương Phước, phường Phước Tân, thành phố Đồng Nai.</address><p><a href="tel:0349671134">0349 671 134</a></p><p>Thứ 2 – Chủ nhật: 8:00 – 21:00</p><p>Facebook và Messenger chính thức đang được cập nhật.</p></div><form className="checkout-panel checkout-fields" onSubmit={submit} noValidate><h2>Gửi lời nhắn</h2>{status ? <p className={Object.values(errors).some(Boolean) ? 'error-box' : 'success-box'} role="status">{status}</p> : null}<label><span>Họ và tên *</span><input autoComplete="name" value={form.name} onChange={(event) => update('name', event.target.value)} aria-invalid={Boolean(errors.name)} />{errors.name ? <small>{errors.name}</small> : null}</label><label><span>Email *</span><input type="email" autoComplete="email" value={form.email} onChange={(event) => update('email', event.target.value)} aria-invalid={Boolean(errors.email)} />{errors.email ? <small>{errors.email}</small> : null}</label><label><span>Số điện thoại</span><input type="tel" autoComplete="tel" value={form.phone} onChange={(event) => update('phone', event.target.value)} aria-invalid={Boolean(errors.phone)} />{errors.phone ? <small>{errors.phone}</small> : null}</label><label><span>Chủ đề *</span><input value={form.subject} onChange={(event) => update('subject', event.target.value)} aria-invalid={Boolean(errors.subject)} />{errors.subject ? <small>{errors.subject}</small> : null}</label><label><span>Nội dung *</span><textarea rows={5} value={form.message} onChange={(event) => update('message', event.target.value)} aria-invalid={Boolean(errors.message)} />{errors.message ? <small>{errors.message}</small> : null}</label><button type="submit" className="button button-primary" disabled={isSubmitting}>{isSubmitting ? 'Đang gửi...' : 'Gửi liên hệ'}</button></form></section>
}
