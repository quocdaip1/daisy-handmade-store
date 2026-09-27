import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { ContactSocialSettings } from '../../components/admin/ContactSocialSettings'
import { AdminSettingsRequestError, deleteBankQr, fetchAdminSettings, updateAdminSettings, uploadBankQr } from '../../services/admin/settings'
import type { AdminSettings } from '../../types/admin-settings'
import './contact-popup-settings.css'
import './settings.css'

function isHttpUrl(value: string) {
  if (!value.trim()) return true
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const phonePattern = /^[0-9+().\s-]{8,20}$/

export function SettingsPage() {
  const { session } = useAuth()
  const { hash } = useLocation()
  const [settings, setSettings] = useState<AdminSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [reloadKey, setReloadKey] = useState(0)
  const [selectedQrFile, setSelectedQrFile] = useState<File | null>(null)
  const [selectedQrPreview, setSelectedQrPreview] = useState('')
  const [removeQrRequested, setRemoveQrRequested] = useState(false)
  const qrPreviewRef = useRef('')
  const hashScrollHandledRef = useRef(false)

  useEffect(() => {
    let active = true
    if (!session) return
    void fetchAdminSettings(session.token)
      .then((result) => { if (active) { setSettings(result); setMessage(''); setIsError(false); setIsLoading(false) } })
      .catch((error: unknown) => { if (active) { setMessage(error instanceof Error ? error.message : 'Không thể tải cấu hình cửa hàng.'); setIsError(true); setIsLoading(false) } })
    return () => { active = false }
  }, [reloadKey, session])

  useEffect(() => {
    if (!settings || hash !== '#contact-social' || hashScrollHandledRef.current) return
    hashScrollHandledRef.current = true
    window.requestAnimationFrame(() => document.getElementById('contact-social')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }, [hash, settings])

  useEffect(() => () => {
    if (qrPreviewRef.current) URL.revokeObjectURL(qrPreviewRef.current)
  }, [])

  const fieldError = (name: string) => errors[name]?.[0]
  const validate = (current: AdminSettings) => {
    const next: Record<string, string[]> = {}
    const { facebook, zalo } = current.socialLinks.contactPopup
    if (!current.shopInformation.name.trim()) next['shop_information.name'] = ['Vui lòng nhập tên cửa hàng.']
    if (current.shopInformation.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(current.shopInformation.email.trim())) next['shop_information.email'] = ['Email cửa hàng không hợp lệ.']
    if (current.shopInformation.phone.trim() && !phonePattern.test(current.shopInformation.phone.trim())) next['shop_information.phone'] = ['Số điện thoại cửa hàng không hợp lệ.']
    if (!current.bankAccount.bankName.trim()) next['bank_account.bank_name'] = ['Vui lòng nhập tên ngân hàng.']
    if (!current.bankAccount.accountNumber.trim()) next['bank_account.account_number'] = ['Vui lòng nhập số tài khoản.']
    if (!current.bankAccount.accountOwner.trim()) next['bank_account.account_owner'] = ['Vui lòng nhập chủ tài khoản.']
    if (!current.bankAccount.transferPrefix.trim()) next['bank_account.transfer_prefix'] = ['Vui lòng nhập tiền tố chuyển khoản.']
    if (facebook.enabled && !facebook.displayName.trim()) next['social_links.contact_popup.facebook.display_name'] = ['Vui lòng nhập tên hiển thị Facebook.']
    if (facebook.enabled && !facebook.link.trim()) next['social_links.contact_popup.facebook.link'] = ['Vui lòng nhập link Facebook hoặc Messenger.']
    else if (!isHttpUrl(facebook.link)) next['social_links.contact_popup.facebook.link'] = ['Link Facebook hoặc Messenger không hợp lệ.']
    if (zalo.enabled && !zalo.displayName.trim()) next['social_links.contact_popup.zalo.display_name'] = ['Vui lòng nhập tên hiển thị Zalo.']
    if (zalo.enabled && !zalo.phone.trim() && !zalo.link.trim()) next['social_links.contact_popup.zalo.phone'] = ['Vui lòng nhập số điện thoại hoặc link Zalo.']
    if (zalo.phone.trim() && !phonePattern.test(zalo.phone.trim())) next['social_links.contact_popup.zalo.phone'] = ['Số điện thoại Zalo không hợp lệ.']
    if (!isHttpUrl(zalo.link)) next['social_links.contact_popup.zalo.link'] = ['Link Zalo không hợp lệ.']
    for (const network of ['instagram', 'tiktok', 'youtube'] as const) if (!isHttpUrl(current.socialLinks[network])) next[`social_links.${network}`] = ['Đường dẫn mạng xã hội không hợp lệ.']
    if (!current.seoDefaults.title.trim()) next['seo_defaults.title'] = ['Vui lòng nhập tiêu đề SEO.']
    if (!isHttpUrl(current.seoDefaults.ogImageUrl)) next['seo_defaults.og_image_url'] = ['URL ảnh chia sẻ không hợp lệ.']
    return next
  }

  const resetPendingQr = () => {
    if (qrPreviewRef.current) URL.revokeObjectURL(qrPreviewRef.current)
    qrPreviewRef.current = ''
    setSelectedQrFile(null)
    setSelectedQrPreview('')
    setRemoveQrRequested(false)
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
      let result = await updateAdminSettings(session.token, settings)
      if (selectedQrFile) result = await uploadBankQr(session.token, selectedQrFile)
      else if (removeQrRequested) result = await deleteBankQr(session.token)
      setSettings(result)
      setErrors({})
      resetPendingQr()
      setMessage('Đã lưu cấu hình cửa hàng.')
    } catch (error) {
      if (error instanceof AdminSettingsRequestError) setErrors(error.errors)
      setMessage(error instanceof Error ? error.message : 'Không thể lưu cấu hình cửa hàng.')
      setIsError(true)
    } finally {
      setIsSaving(false)
    }
  }

  const changeQr = (file?: File) => {
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setMessage('Mã QR phải là ảnh PNG, JPG hoặc WebP.')
      setIsError(true)
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      setMessage('Ảnh mã QR không được lớn hơn 4 MB.')
      setIsError(true)
      return
    }
    if (qrPreviewRef.current) URL.revokeObjectURL(qrPreviewRef.current)
    qrPreviewRef.current = URL.createObjectURL(file)
    setSelectedQrFile(file)
    setSelectedQrPreview(qrPreviewRef.current)
    setRemoveQrRequested(false)
    setMessage('Ảnh QR mới đã được chọn. Nhấn “Lưu cấu hình” để cập nhật.')
    setIsError(false)
  }

  const removeQr = () => {
    if (qrPreviewRef.current) URL.revokeObjectURL(qrPreviewRef.current)
    qrPreviewRef.current = ''
    setSelectedQrFile(null)
    setSelectedQrPreview('')
    setRemoveQrRequested(true)
    setMessage('Ảnh QR sẽ được xóa khi bạn nhấn “Lưu cấu hình”.')
    setIsError(false)
  }

  if (isLoading) return <div className="admin-settings-state" aria-live="polite">Đang tải cấu hình...</div>
  if (!settings) return <div className="admin-settings-state" role="alert">{message}<button type="button" onClick={() => { setIsLoading(true); setReloadKey((key) => key + 1) }}>Thử lại</button></div>

  const displayedQr = removeQrRequested ? '' : selectedQrPreview || settings.bankAccount.qrImageUrl

  return (
    <section className="admin-settings-page">
      <header><div><p>Admin / Cài đặt</p><h1>Cấu hình cửa hàng</h1></div><span>Quản lý thông tin hiển thị và thanh toán của cửa hàng</span></header>
      {message ? <div className={`admin-settings-message ${isError ? 'is-error' : ''}`} role="status">{message}</div> : null}
      <form onSubmit={submit} noValidate>
        <fieldset><legend>Thông tin cửa hàng</legend><div className="admin-settings-grid">
          <label>Tên cửa hàng<input value={settings.shopInformation.name} maxLength={255} onChange={(event) => setSettings({ ...settings, shopInformation: { ...settings.shopInformation, name: event.target.value } })} />{fieldError('shop_information.name') ? <small>{fieldError('shop_information.name')}</small> : null}</label>
          <label>Email<input type="email" value={settings.shopInformation.email} maxLength={255} onChange={(event) => setSettings({ ...settings, shopInformation: { ...settings.shopInformation, email: event.target.value } })} />{fieldError('shop_information.email') ? <small>{fieldError('shop_information.email')}</small> : null}</label>
          <label>Điện thoại<input type="tel" value={settings.shopInformation.phone} maxLength={20} onChange={(event) => setSettings({ ...settings, shopInformation: { ...settings.shopInformation, phone: event.target.value } })} />{fieldError('shop_information.phone') ? <small>{fieldError('shop_information.phone')}</small> : null}</label>
          <label>Giờ mở cửa<input value={settings.shopInformation.openingHours} maxLength={255} onChange={(event) => setSettings({ ...settings, shopInformation: { ...settings.shopInformation, openingHours: event.target.value } })} /></label>
          <label className="admin-settings-wide">Địa chỉ<textarea value={settings.shopInformation.address} maxLength={1000} rows={3} onChange={(event) => setSettings({ ...settings, shopInformation: { ...settings.shopInformation, address: event.target.value } })} /></label>
        </div></fieldset>

        <fieldset><legend>Tài khoản ngân hàng và mã QR thanh toán</legend><div className="admin-settings-grid">
          <label>Ngân hàng<input value={settings.bankAccount.bankName} maxLength={100} onChange={(event) => setSettings({ ...settings, bankAccount: { ...settings.bankAccount, bankName: event.target.value } })} />{fieldError('bank_account.bank_name') ? <small>{fieldError('bank_account.bank_name')}</small> : null}</label>
          <label>Số tài khoản<input value={settings.bankAccount.accountNumber} maxLength={50} onChange={(event) => setSettings({ ...settings, bankAccount: { ...settings.bankAccount, accountNumber: event.target.value } })} />{fieldError('bank_account.account_number') ? <small>{fieldError('bank_account.account_number')}</small> : null}</label>
          <label>Chủ tài khoản<input value={settings.bankAccount.accountOwner} maxLength={255} onChange={(event) => setSettings({ ...settings, bankAccount: { ...settings.bankAccount, accountOwner: event.target.value } })} />{fieldError('bank_account.account_owner') ? <small>{fieldError('bank_account.account_owner')}</small> : null}</label>
          <label>Tiền tố nội dung<input value={settings.bankAccount.transferPrefix} maxLength={30} onChange={(event) => setSettings({ ...settings, bankAccount: { ...settings.bankAccount, transferPrefix: event.target.value } })} />{fieldError('bank_account.transfer_prefix') ? <small>{fieldError('bank_account.transfer_prefix')}</small> : null}</label>
          <div className="admin-settings-wide admin-bank-qr"><div className="admin-bank-qr-preview">{displayedQr ? <img src={displayedQr} alt="Mã QR thanh toán ngân hàng hiện tại" /> : <div><span aria-hidden="true">▣</span><strong>Chưa có mã QR</strong><small>Khách hàng sẽ thấy thông báo hướng dẫn chuyển khoản thủ công.</small></div>}</div><div className="admin-bank-qr-actions"><strong>Ảnh mã QR thanh toán</strong><p>Dùng ảnh PNG, JPG hoặc WebP, tối đa 4 MB. Ảnh sẽ được cập nhật cùng các cấu hình khác khi bạn lưu.</p><label className="admin-settings-upload">{displayedQr ? 'Thay ảnh QR' : 'Thêm ảnh QR'}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { changeQr(event.target.files?.[0]); event.currentTarget.value = '' }} /></label>{displayedQr ? <button type="button" className="admin-settings-delete-qr" onClick={removeQr}>Xóa ảnh QR</button> : null}</div></div>
        </div></fieldset>

        <fieldset id="contact-social"><legend>Liên hệ &amp; mạng xã hội</legend><ContactSocialSettings settings={settings.socialLinks} errors={errors} onChange={(socialLinks) => setSettings({ ...settings, socialLinks })} /></fieldset>

        <fieldset><legend>SEO mặc định</legend><div className="admin-settings-grid">
          <label className="admin-settings-wide">Tiêu đề mặc định<input value={settings.seoDefaults.title} maxLength={60} onChange={(event) => setSettings({ ...settings, seoDefaults: { ...settings.seoDefaults, title: event.target.value } })} />{fieldError('seo_defaults.title') ? <small>{fieldError('seo_defaults.title')}</small> : null}</label>
          <label className="admin-settings-wide">Mô tả mặc định<textarea value={settings.seoDefaults.description} maxLength={160} rows={3} onChange={(event) => setSettings({ ...settings, seoDefaults: { ...settings.seoDefaults, description: event.target.value } })} />{fieldError('seo_defaults.description') ? <small>{fieldError('seo_defaults.description')}</small> : null}</label>
          <label>Từ khóa<input value={settings.seoDefaults.keywords} maxLength={255} onChange={(event) => setSettings({ ...settings, seoDefaults: { ...settings.seoDefaults, keywords: event.target.value } })} /></label>
          <label>URL ảnh chia sẻ<input type="url" value={settings.seoDefaults.ogImageUrl} maxLength={2048} onChange={(event) => setSettings({ ...settings, seoDefaults: { ...settings.seoDefaults, ogImageUrl: event.target.value } })} />{fieldError('seo_defaults.og_image_url') ? <small>{fieldError('seo_defaults.og_image_url')}</small> : null}</label>
        </div></fieldset>
        <div className="admin-settings-actions"><button type="submit" disabled={isSaving}>{isSaving ? 'Đang lưu...' : 'Lưu cấu hình'}</button></div>
      </form>
    </section>
  )
}
