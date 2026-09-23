import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../auth/useAuth'
import { AdminContactPopupRequestError, fetchAdminContactPopup, updateAdminContactPopup } from '../../services/admin/contact-popup'
import type { ContactPopupSettings } from '../../types/contact-popup'
import './contact-popup-settings.css'

function isHttpUrl(value: string) {
  if (!value.trim()) return true
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function ContactPopupSettingsPage() {
  const { session } = useAuth()
  const [settings, setSettings] = useState<ContactPopupSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    if (!session) return
    void fetchAdminContactPopup(session.token)
      .then((result) => { if (active) { setSettings(result); setMessage(''); setIsError(false); setIsLoading(false) } })
      .catch((error: unknown) => { if (active) { setMessage(error instanceof Error ? error.message : 'Không thể tải thông tin liên hệ.'); setIsError(true); setIsLoading(false) } })
    return () => { active = false }
  }, [reloadKey, session])

  const fieldError = (name: string) => errors[name]?.[0]

  const validate = (current: ContactPopupSettings) => {
    const next: Record<string, string[]> = {}
    if (current.facebook.enabled && !current.facebook.displayName.trim()) next['facebook.display_name'] = ['Vui lòng nhập tên hiển thị Facebook.']
    if (current.facebook.enabled && !current.facebook.link.trim()) next['facebook.link'] = ['Vui lòng nhập link Facebook hoặc Messenger.']
    else if (!isHttpUrl(current.facebook.link)) next['facebook.link'] = ['Link Facebook hoặc Messenger không hợp lệ.']
    if (current.zalo.enabled && !current.zalo.displayName.trim()) next['zalo.display_name'] = ['Vui lòng nhập tên hiển thị Zalo.']
    if (current.zalo.enabled && !current.zalo.phone.trim() && !current.zalo.link.trim()) next['zalo.phone'] = ['Vui lòng nhập số điện thoại hoặc link Zalo.']
    if (current.zalo.phone.trim() && !/^[0-9+().\s-]{8,20}$/.test(current.zalo.phone.trim())) next['zalo.phone'] = ['Số điện thoại Zalo không hợp lệ.']
    if (!isHttpUrl(current.zalo.link)) next['zalo.link'] = ['Link Zalo không hợp lệ.']
    return next
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!session || !settings) return
    const validationErrors = validate(settings)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length) {
      setMessage('Vui lòng kiểm tra lại thông tin đã nhập.')
      setIsError(true)
      return
    }

    setIsSaving(true)
    setMessage('')
    setIsError(false)
    try {
      const result = await updateAdminContactPopup(session.token, settings)
      setSettings(result.settings)
      setErrors({})
      setMessage(result.message || 'Đã cập nhật thông tin liên hệ.')
    } catch (error) {
      if (error instanceof AdminContactPopupRequestError) setErrors(error.errors)
      setMessage(error instanceof Error ? error.message : 'Không thể lưu thông tin liên hệ.')
      setIsError(true)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <div className="admin-contact-settings-state" aria-live="polite">Đang tải thông tin liên hệ...</div>
  if (!settings) return <div className="admin-contact-settings-state is-error" role="alert">{message}<button type="button" onClick={() => { setIsLoading(true); setReloadKey((key) => key + 1) }}>Thử lại</button></div>

  const facebookPreviewVisible = settings.facebook.enabled && Boolean(settings.facebook.link.trim())
  const zaloPreviewVisible = settings.zalo.enabled && Boolean(settings.zalo.link.trim() || settings.zalo.phone.trim())

  return (
    <section className="admin-contact-settings-page">
      <header><div><p>Admin / Cài đặt</p><h1>Liên hệ Facebook &amp; Zalo</h1></div><span>Cấu hình nút hỗ trợ hiển thị trên website</span></header>
      {message ? <div className={`admin-contact-settings-message ${isError ? 'is-error' : ''}`} role="status">{message}</div> : null}
      <div className="admin-contact-settings-layout">
        <form onSubmit={submit} noValidate>
          <fieldset><legend><span className="contact-settings-brand is-facebook" aria-hidden="true">f</span>Facebook</legend><div className="admin-contact-settings-grid">
            <label>Tên hiển thị<input value={settings.facebook.displayName} maxLength={100} placeholder="Daisy Shop" onChange={(event) => setSettings({ ...settings, facebook: { ...settings.facebook, displayName: event.target.value } })} />{fieldError('facebook.display_name') ? <small>{fieldError('facebook.display_name')}</small> : null}</label>
            <label>Link Facebook / Messenger<input type="url" value={settings.facebook.link} maxLength={2048} placeholder="https://m.me/daisy" onChange={(event) => setSettings({ ...settings, facebook: { ...settings.facebook, link: event.target.value } })} />{fieldError('facebook.link') ? <small>{fieldError('facebook.link')}</small> : null}</label>
            <label className="admin-contact-settings-switch"><span>Trạng thái</span><button type="button" role="switch" aria-checked={settings.facebook.enabled} className={settings.facebook.enabled ? 'is-enabled' : ''} onClick={() => setSettings({ ...settings, facebook: { ...settings.facebook, enabled: !settings.facebook.enabled } })}><i aria-hidden="true" /><b>{settings.facebook.enabled ? 'Bật' : 'Tắt'}</b></button></label>
          </div></fieldset>

          <fieldset><legend><span className="contact-settings-brand is-zalo" aria-hidden="true">Z</span>Zalo</legend><div className="admin-contact-settings-grid">
            <label>Tên hiển thị<input value={settings.zalo.displayName} maxLength={100} placeholder="Daisy Shop" onChange={(event) => setSettings({ ...settings, zalo: { ...settings.zalo, displayName: event.target.value } })} />{fieldError('zalo.display_name') ? <small>{fieldError('zalo.display_name')}</small> : null}</label>
            <label>Số điện thoại Zalo<input type="tel" value={settings.zalo.phone} maxLength={20} placeholder="0901234567" onChange={(event) => setSettings({ ...settings, zalo: { ...settings.zalo, phone: event.target.value } })} />{fieldError('zalo.phone') ? <small>{fieldError('zalo.phone')}</small> : null}</label>
            <label>Link Zalo <i>(nếu có)</i><input type="url" value={settings.zalo.link} maxLength={2048} placeholder="https://zalo.me/0901234567" onChange={(event) => setSettings({ ...settings, zalo: { ...settings.zalo, link: event.target.value } })} />{fieldError('zalo.link') ? <small>{fieldError('zalo.link')}</small> : null}</label>
            <label className="admin-contact-settings-switch"><span>Trạng thái</span><button type="button" role="switch" aria-checked={settings.zalo.enabled} className={settings.zalo.enabled ? 'is-enabled' : ''} onClick={() => setSettings({ ...settings, zalo: { ...settings.zalo, enabled: !settings.zalo.enabled } })}><i aria-hidden="true" /><b>{settings.zalo.enabled ? 'Bật' : 'Tắt'}</b></button></label>
          </div></fieldset>

          <div className="admin-contact-settings-actions"><button type="submit" disabled={isSaving}>{isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</button></div>
        </form>

        <aside className="admin-contact-preview" aria-label="Xem trước popup liên hệ"><p>Xem trước</p><div><header><span>Hỗ trợ Daisy</span><h2>Bạn cần hỗ trợ?</h2></header>{facebookPreviewVisible || zaloPreviewVisible ? <section>
          {facebookPreviewVisible ? <article><span className="contact-settings-brand is-facebook" aria-hidden="true">f</span><div><strong>Facebook</strong><small>{settings.facebook.displayName || 'Daisy Shop'}</small></div></article> : null}
          {zaloPreviewVisible ? <article><span className="contact-settings-brand is-zalo" aria-hidden="true">Z</span><div><strong>Zalo</strong><small>{settings.zalo.displayName || settings.zalo.phone || 'Daisy Shop'}</small></div></article> : null}
        </section> : <em>Bật ít nhất một kênh có thông tin liên hệ để hiển thị nút hỗ trợ.</em>}</div></aside>
      </div>
    </section>
  )
}
