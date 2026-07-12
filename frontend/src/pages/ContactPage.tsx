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

  return (
    <section className="content-page contact-page" aria-labelledby="contact-title">
      <header className="contact-heading">
        <p className="eyebrow">Daisy Handmade Store</p>
        <h1 id="contact-title">Kết nối cùng Daisy</h1>
        <p>Chúng mình luôn sẵn lòng lắng nghe và tư vấn món trang sức phù hợp với câu chuyện của bạn.</p>
      </header>

      <div className="contact-layout">
        <aside className="contact-info" aria-labelledby="contact-info-title">
          <div>
            <p className="contact-kicker">Ghé thăm chúng mình</p>
            <h2 id="contact-info-title">Thông tin cửa hàng</h2>
            <p className="contact-intro">Bạn có thể gọi điện hoặc ghé cửa hàng để được tư vấn trực tiếp.</p>
          </div>

          <div className="contact-details">
            <div className="contact-detail"><span aria-hidden="true">⌖</span><p><small>Địa chỉ</small><address>Khu phố Hương Phước, phường Phước Tân, thành phố Đồng Nai</address></p></div>
            <div className="contact-detail"><span aria-hidden="true">☎</span><p><small>Điện thoại</small><a href="tel:0349671134">0349 671 134</a></p></div>
            <div className="contact-detail"><span aria-hidden="true">◷</span><p><small>Giờ mở cửa</small><strong>Thứ 2 – Chủ nhật, 8:00 – 21:00</strong></p></div>
          </div>

          <p className="contact-note">Mỗi lời nhắn thường được phản hồi trong giờ làm việc.</p>
        </aside>

        <form className="contact-form checkout-fields" onSubmit={submit} noValidate>
          <div className="contact-form-heading"><p className="eyebrow">Gửi lời nhắn</p><h2>Chúng mình có thể giúp gì cho bạn?</h2><p>Điền thông tin bên dưới, Daisy sẽ liên hệ lại sớm nhất có thể.</p></div>
          {status ? <p className={Object.values(errors).some(Boolean) ? 'error-box' : 'success-box'} role="status">{status}</p> : null}
          <div className="contact-form-grid">
            <label><span>Họ và tên *</span><input autoComplete="name" placeholder="Nguyễn Văn A" value={form.name} onChange={(event) => update('name', event.target.value)} aria-invalid={Boolean(errors.name)} />{errors.name ? <small>{errors.name}</small> : null}</label>
            <label><span>Email *</span><input type="email" autoComplete="email" placeholder="ban@example.com" value={form.email} onChange={(event) => update('email', event.target.value)} aria-invalid={Boolean(errors.email)} />{errors.email ? <small>{errors.email}</small> : null}</label>
            <label><span>Số điện thoại</span><input type="tel" autoComplete="tel" placeholder="09xx xxx xxx" value={form.phone} onChange={(event) => update('phone', event.target.value)} aria-invalid={Boolean(errors.phone)} />{errors.phone ? <small>{errors.phone}</small> : null}</label>
            <label><span>Chủ đề *</span><input placeholder="Tư vấn sản phẩm" value={form.subject} onChange={(event) => update('subject', event.target.value)} aria-invalid={Boolean(errors.subject)} />{errors.subject ? <small>{errors.subject}</small> : null}</label>
            <label className="contact-message-field"><span>Nội dung *</span><textarea rows={6} placeholder="Bạn đang quan tâm đến sản phẩm hoặc cần Daisy hỗ trợ điều gì?" value={form.message} onChange={(event) => update('message', event.target.value)} aria-invalid={Boolean(errors.message)} />{errors.message ? <small>{errors.message}</small> : null}</label>
          </div>
          <button type="submit" className="button button-primary contact-submit" disabled={isSubmitting}>{isSubmitting ? 'Đang gửi lời nhắn...' : 'Gửi lời nhắn'}<span aria-hidden="true">→</span></button>
        </form>
      </div>
    </section>
  )
}
