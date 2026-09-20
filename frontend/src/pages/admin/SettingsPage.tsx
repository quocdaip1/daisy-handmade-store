import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../auth/useAuth'
import { AdminSettingsRequestError, deleteBankQr, fetchAdminSettings, updateAdminSettings, uploadBankQr } from '../../services/admin/settings'
import type { AdminSettings } from '../../types/admin-settings'
import './settings.css'

export function SettingsPage() {
  const { session } = useAuth()
  const [settings, setSettings] = useState<AdminSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUpdatingQr, setIsUpdatingQr] = useState(false)
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    if (!session) return
    void fetchAdminSettings(session.token)
      .then((result) => { if (active) { setSettings(result); setMessage(''); setIsLoading(false) } })
      .catch((error: unknown) => { if (active) { setMessage(error instanceof Error ? error.message : 'Không thể tải cấu hình cửa hàng.'); setIsLoading(false) } })
    return () => { active = false }
  }, [reloadKey, session])

  const fieldError = (name: string) => errors[name]?.[0]
  const validate = (current: AdminSettings) => {
    const next: Record<string, string[]> = {}
    if (!current.shopInformation.name.trim()) next['shop_information.name'] = ['Vui lòng nhập tên cửa hàng.']
    if (!current.bankAccount.bankName.trim()) next['bank_account.bank_name'] = ['Vui lòng nhập tên ngân hàng.']
    if (!current.bankAccount.accountNumber.trim()) next['bank_account.account_number'] = ['Vui lòng nhập số tài khoản.']
    if (!current.bankAccount.accountOwner.trim()) next['bank_account.account_owner'] = ['Vui lòng nhập chủ tài khoản.']
    if (!current.bankAccount.transferPrefix.trim()) next['bank_account.transfer_prefix'] = ['Vui lòng nhập tiền tố chuyển khoản.']
    if (!current.seoDefaults.title.trim()) next['seo_defaults.title'] = ['Vui lòng nhập tiêu đề SEO.']
    return next
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!session || !settings) return
    const validationErrors = validate(settings)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length) return
    setIsSaving(true)
    setMessage('')
    try {
      const result = await updateAdminSettings(session.token, settings)
      setSettings(result)
      setErrors({})
      setMessage('Đã lưu cấu hình cửa hàng.')
    } catch (error) {
      if (error instanceof AdminSettingsRequestError) setErrors(error.errors)
      setMessage(error instanceof Error ? error.message : 'Không thể lưu cấu hình cửa hàng.')
    } finally {
      setIsSaving(false)
    }
  }

  const changeQr = async (file?: File) => {
    if (!session || !file) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setMessage('Mã QR phải là ảnh PNG, JPG hoặc WebP.')
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      setMessage('Ảnh mã QR không được lớn hơn 4 MB.')
      return
    }

    setIsUpdatingQr(true)
    setMessage('')
    try {
      setSettings(await uploadBankQr(session.token, file))
      setMessage('Đã lưu ảnh mã QR thanh toán.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể tải ảnh mã QR lên.')
    } finally {
      setIsUpdatingQr(false)
    }
  }

  const removeQr = async () => {
    if (!session) return
    setIsUpdatingQr(true)
    setMessage('')
    try {
      setSettings(await deleteBankQr(session.token))
      setMessage('Đã xóa ảnh mã QR thanh toán.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể xóa ảnh mã QR.')
    } finally {
      setIsUpdatingQr(false)
    }
  }

  if (isLoading) return <div className="admin-settings-state" aria-live="polite">Đang tải cấu hình...</div>
  if (!settings) return <div className="admin-settings-state" role="alert">{message}<button type="button" onClick={() => { setIsLoading(true); setReloadKey((key) => key + 1) }}>Thử lại</button></div>

  return (
    <section className="admin-settings-page">
      <header><div><p>Admin / Cài đặt</p><h1>Cấu hình cửa hàng</h1></div><span>Mọi giá trị được lưu và đọc từ backend.</span></header>
      {message ? <div className={`admin-settings-message ${Object.keys(errors).length ? 'is-error' : ''}`} role="status">{message}</div> : null}
      <form onSubmit={submit} noValidate>
        <fieldset><legend>Thông tin cửa hàng</legend><div className="admin-settings-grid">
          <label>Tên cửa hàng<input value={settings.shopInformation.name} maxLength={255} onChange={(event) => setSettings({ ...settings, shopInformation: { ...settings.shopInformation, name: event.target.value } })} />{fieldError('shop_information.name') ? <small>{fieldError('shop_information.name')}</small> : null}</label>
          <label>Email<input type="email" value={settings.shopInformation.email} maxLength={255} onChange={(event) => setSettings({ ...settings, shopInformation: { ...settings.shopInformation, email: event.target.value } })} />{fieldError('shop_information.email') ? <small>{fieldError('shop_information.email')}</small> : null}</label>
          <label>Điện thoại<input value={settings.shopInformation.phone} maxLength={20} onChange={(event) => setSettings({ ...settings, shopInformation: { ...settings.shopInformation, phone: event.target.value } })} /></label>
          <label>Giờ mở cửa<input value={settings.shopInformation.openingHours} maxLength={255} onChange={(event) => setSettings({ ...settings, shopInformation: { ...settings.shopInformation, openingHours: event.target.value } })} /></label>
          <label className="admin-settings-wide">Địa chỉ<textarea value={settings.shopInformation.address} maxLength={1000} rows={3} onChange={(event) => setSettings({ ...settings, shopInformation: { ...settings.shopInformation, address: event.target.value } })} /></label>
        </div></fieldset>

        <fieldset><legend>Tài khoản ngân hàng</legend><div className="admin-settings-grid">
          <label>Ngân hàng<input value={settings.bankAccount.bankName} maxLength={100} onChange={(event) => setSettings({ ...settings, bankAccount: { ...settings.bankAccount, bankName: event.target.value } })} />{fieldError('bank_account.bank_name') ? <small>{fieldError('bank_account.bank_name')}</small> : null}</label>
          <label>Số tài khoản<input value={settings.bankAccount.accountNumber} maxLength={50} onChange={(event) => setSettings({ ...settings, bankAccount: { ...settings.bankAccount, accountNumber: event.target.value } })} />{fieldError('bank_account.account_number') ? <small>{fieldError('bank_account.account_number')}</small> : null}</label>
          <label>Chủ tài khoản<input value={settings.bankAccount.accountOwner} maxLength={255} onChange={(event) => setSettings({ ...settings, bankAccount: { ...settings.bankAccount, accountOwner: event.target.value } })} />{fieldError('bank_account.account_owner') ? <small>{fieldError('bank_account.account_owner')}</small> : null}</label>
          <label>Tiền tố nội dung<input value={settings.bankAccount.transferPrefix} maxLength={30} onChange={(event) => setSettings({ ...settings, bankAccount: { ...settings.bankAccount, transferPrefix: event.target.value } })} />{fieldError('bank_account.transfer_prefix') ? <small>{fieldError('bank_account.transfer_prefix')}</small> : null}</label>
          <div className="admin-settings-wide admin-bank-qr"><div className="admin-bank-qr-preview">{settings.bankAccount.qrImageUrl ? <img src={settings.bankAccount.qrImageUrl} alt="Mã QR thanh toán ngân hàng hiện tại" /> : <div><span aria-hidden="true">▣</span><strong>Chưa có mã QR</strong><small>Khách hàng sẽ thấy thông báo hướng dẫn chuyển khoản thủ công.</small></div>}</div><div className="admin-bank-qr-actions"><strong>Ảnh mã QR thanh toán</strong><p>Dùng ảnh PNG, JPG hoặc WebP, tối đa 4 MB. Ảnh mới sẽ thay thế ảnh hiện tại.</p><label className="admin-settings-upload">{isUpdatingQr ? 'Đang xử lý...' : settings.bankAccount.qrImageUrl ? 'Thay ảnh QR' : 'Thêm ảnh QR'}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={isUpdatingQr} onChange={(event) => { void changeQr(event.target.files?.[0]); event.currentTarget.value = '' }} /></label>{settings.bankAccount.qrImageUrl ? <button type="button" className="admin-settings-delete-qr" disabled={isUpdatingQr} onClick={() => void removeQr()}>Xóa ảnh QR</button> : null}</div></div>
        </div></fieldset>

        <fieldset><legend>Liên kết mạng xã hội</legend><div className="admin-settings-grid">{(['facebook', 'instagram', 'tiktok', 'youtube', 'messenger'] as const).map((network) => <label key={network}>{network.charAt(0).toUpperCase() + network.slice(1)}<input type="url" value={settings.socialLinks[network]} maxLength={2048} onChange={(event) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, [network]: event.target.value } })} />{fieldError(`social_links.${network}`) ? <small>{fieldError(`social_links.${network}`)}</small> : null}</label>)}</div></fieldset>

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
