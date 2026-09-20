import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../auth/useAuth'
import { AdminContentRequestError, listAdminBanners, saveAdminBanner } from '../../services/admin/content'
import type { AdminBanner, AdminBannerFormValues, BannerPosition } from '../../types/admin-content'
import './content-management.css'

const emptyValues: AdminBannerFormValues = { title: '', image: '', link: '', position: 0, active: true }
const slotLabels: Record<BannerPosition, string> = { 0: 'Homepage Banner', 1: 'Collection Banner' }

export function BannerManagementPage() {
  const { session } = useAuth()
  const [banners, setBanners] = useState<AdminBanner[]>([])
  const [editor, setEditor] = useState<AdminBanner | null | undefined>(undefined)
  const [values, setValues] = useState(emptyValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    if (!session) return
    void listAdminBanners(session.token).then((result) => { if (active) { setBanners(result); setError(''); setIsLoading(false) } }).catch((requestError: unknown) => { if (active) { setError(requestError instanceof Error ? requestError.message : 'Không thể tải banner.'); setIsLoading(false) } })
    return () => { active = false }
  }, [reloadKey, session])

  const openEditor = (banner: AdminBanner | null) => {
    setEditor(banner)
    setValues(banner ? { title: banner.title, image: banner.image, link: banner.link, position: banner.position, active: banner.active } : emptyValues)
    setErrors({})
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!values.title.trim()) nextErrors.title = 'Tiêu đề là bắt buộc.'
    if (!values.image.trim()) nextErrors.image = 'Đường dẫn ảnh là bắt buộc.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length || !session) return
    setIsSubmitting(true)
    try {
      await saveAdminBanner(session.token, editor?.id ?? null, values)
      setEditor(undefined); setIsLoading(true); setReloadKey((key) => key + 1)
    } catch (requestError) {
      if (requestError instanceof AdminContentRequestError) setErrors(Object.fromEntries(Object.entries(requestError.errors).map(([field, messages]) => [field, messages[0]])))
      else setError(requestError instanceof Error ? requestError.message : 'Không thể lưu banner.')
    } finally { setIsSubmitting(false) }
  }

  const toggle = async (banner: AdminBanner) => {
    if (!session) return
    try { await saveAdminBanner(session.token, banner.id, { title: banner.title, image: banner.image, link: banner.link, position: banner.position, active: !banner.active }); setIsLoading(true); setReloadKey((key) => key + 1) }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Không thể cập nhật banner.') }
  }

  return <section className="admin-content-page"><header className="admin-content-heading"><div><p>Admin / Nội dung</p><h1>Banner Management</h1><span>{banners.length} banner</span></div><button type="button" onClick={() => openEditor(null)}>Tạo banner</button></header>{error ? <div className="admin-content-error" role="alert">{error}</div> : null}{isLoading ? <div className="admin-content-state">Đang tải banner...</div> : !banners.length ? <div className="admin-content-state">Chưa có banner.</div> : <div className="admin-banner-grid">{banners.map((banner) => <article className="admin-content-card admin-banner-card" key={banner.id}><div className="admin-banner-preview"><img src={banner.image} alt="" /></div><div><span className="admin-content-badge">{slotLabels[banner.position]}</span><h2>{banner.title}</h2><p>{banner.link || 'Không có liên kết'}</p><span className={`admin-content-status is-${banner.active ? 'active' : 'inactive'}`}>{banner.active ? 'Đang hiển thị' : 'Đã ẩn'}</span></div><footer><button type="button" onClick={() => openEditor(banner)}>Sửa</button><button type="button" onClick={() => { void toggle(banner) }}>{banner.active ? 'Ẩn' : 'Hiện'}</button></footer></article>)}</div>}{editor !== undefined ? <div className="admin-content-form-layer" role="presentation" onMouseDown={() => { if (!isSubmitting) setEditor(undefined) }}><section className="admin-content-form-panel" role="dialog" aria-modal="true" aria-labelledby="banner-form-title" onMouseDown={(event) => event.stopPropagation()}><header><h2 id="banner-form-title">{editor ? 'Sửa banner' : 'Tạo banner'}</h2><button type="button" onClick={() => setEditor(undefined)}>×</button></header><form onSubmit={(event) => { void submit(event) }} noValidate><label><span>Vị trí</span><select value={values.position} onChange={(event) => setValues((current) => ({ ...current, position: Number(event.target.value) as BannerPosition }))}><option value={0}>Homepage Banner</option><option value={1}>Collection Banner</option></select></label><label><span>Tiêu đề *</span><input maxLength={255} value={values.title} onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))} />{errors.title ? <small>{errors.title}</small> : null}</label><label><span>Đường dẫn ảnh *</span><input maxLength={2048} value={values.image} onChange={(event) => setValues((current) => ({ ...current, image: event.target.value }))} placeholder="/banners/home.webp" />{errors.image ? <small>{errors.image}</small> : null}</label><label><span>Liên kết</span><input maxLength={2048} value={values.link} onChange={(event) => setValues((current) => ({ ...current, link: event.target.value }))} placeholder="/san-pham" />{errors.link ? <small>{errors.link}</small> : null}</label><label className="admin-content-check"><input type="checkbox" checked={values.active} onChange={(event) => setValues((current) => ({ ...current, active: event.target.checked }))} /><span>Đang hiển thị</span></label><footer><button type="button" onClick={() => setEditor(undefined)} disabled={isSubmitting}>Hủy</button><button className="is-primary" disabled={isSubmitting}>{isSubmitting ? 'Đang lưu...' : 'Lưu banner'}</button></footer></form></section></div> : null}</section>
}
