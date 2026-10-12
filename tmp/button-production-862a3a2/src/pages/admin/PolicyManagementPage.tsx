import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../auth/useAuth'
import { AdminContentRequestError, listAdminPolicies, saveAdminPolicy } from '../../services/admin/content'
import type { AdminPolicy, AdminPolicyFormValues } from '../../types/admin-content'
import './content-management.css'

const emptyValues: AdminPolicyFormValues = { title: '', slug: '', content: '', version: 1, published: false }

export function PolicyManagementPage() {
  const { session } = useAuth()
  const [policies, setPolicies] = useState<AdminPolicy[]>([])
  const [editor, setEditor] = useState<AdminPolicy | null | undefined>(undefined)
  const [values, setValues] = useState(emptyValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    if (!session) return
    void listAdminPolicies(session.token).then((result) => { if (active) { setPolicies(result); setError(''); setIsLoading(false) } }).catch((requestError: unknown) => { if (active) { setError(requestError instanceof Error ? requestError.message : 'Không thể tải chính sách.'); setIsLoading(false) } })
    return () => { active = false }
  }, [reloadKey, session])

  const openEditor = (policy: AdminPolicy | null) => { setEditor(policy); setValues(policy ? { title: policy.title, slug: policy.slug, content: policy.content, version: policy.version, published: policy.published } : emptyValues); setErrors({}) }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!values.title.trim()) nextErrors.title = 'Tiêu đề là bắt buộc.'
    if (!values.slug.trim()) nextErrors.slug = 'Slug là bắt buộc.'
    if (!values.content.trim()) nextErrors.content = 'Nội dung là bắt buộc.'
    if (!Number.isInteger(values.version) || values.version < 1) nextErrors.version = 'Phiên bản phải là số nguyên từ 1.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length || !session) return
    setIsSubmitting(true)
    try { await saveAdminPolicy(session.token, editor?.id ?? null, values); setEditor(undefined); setIsLoading(true); setReloadKey((key) => key + 1) }
    catch (requestError) { if (requestError instanceof AdminContentRequestError) setErrors(Object.fromEntries(Object.entries(requestError.errors).map(([field, messages]) => [field, messages[0]]))); else setError(requestError instanceof Error ? requestError.message : 'Không thể lưu chính sách.') }
    finally { setIsSubmitting(false) }
  }
  const toggle = async (policy: AdminPolicy) => {
    if (!session) return
    try { await saveAdminPolicy(session.token, policy.id, { title: policy.title, slug: policy.slug, content: policy.content, version: policy.version, published: !policy.published }); setIsLoading(true); setReloadKey((key) => key + 1) }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Không thể cập nhật chính sách.') }
  }

  return <section className="admin-content-page"><header className="admin-content-heading"><div><p>Admin / Nội dung</p><h1>Policy Management</h1><span>{policies.length} chính sách</span></div><button type="button" onClick={() => openEditor(null)}>Tạo chính sách</button></header>{error ? <div className="admin-content-error">{error}</div> : null}{isLoading ? <div className="admin-content-state">Đang tải chính sách...</div> : !policies.length ? <div className="admin-content-state">Chưa có chính sách.</div> : <div className="admin-content-table-wrap"><table className="admin-content-table"><thead><tr><th>Chính sách</th><th>Phiên bản</th><th>Cập nhật</th><th>Trạng thái</th><th><span className="sr-only">Thao tác</span></th></tr></thead><tbody>{policies.map((policy) => <tr key={policy.id}><td><div className="admin-content-stack"><strong>{policy.title}</strong><small>{policy.slug}</small></div></td><td>v{policy.version}</td><td>{new Date(policy.updatedAt).toLocaleDateString('vi-VN')}</td><td><span className={`admin-content-status is-${policy.published ? 'active' : 'inactive'}`}>{policy.published ? 'Đã xuất bản' : 'Bản nháp'}</span></td><td><div className="admin-content-actions"><button type="button" onClick={() => openEditor(policy)}>Sửa</button><button type="button" onClick={() => { void toggle(policy) }}>{policy.published ? 'Ẩn' : 'Xuất bản'}</button></div></td></tr>)}</tbody></table></div>}{editor !== undefined ? <div className="admin-content-form-layer" role="presentation" onMouseDown={() => { if (!isSubmitting) setEditor(undefined) }}><section className="admin-content-form-panel is-wide" role="dialog" aria-modal="true" aria-labelledby="policy-form-title" onMouseDown={(event) => event.stopPropagation()}><header><h2 id="policy-form-title">{editor ? 'Sửa chính sách' : 'Tạo chính sách'}</h2><button type="button" onClick={() => setEditor(undefined)}>×</button></header><form onSubmit={(event) => { void submit(event) }} noValidate><div className="admin-content-form-grid"><label><span>Tiêu đề *</span><input maxLength={255} value={values.title} onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))} />{errors.title ? <small>{errors.title}</small> : null}</label><label><span>Slug *</span><input maxLength={255} value={values.slug} onChange={(event) => setValues((current) => ({ ...current, slug: event.target.value }))} />{errors.slug ? <small>{errors.slug}</small> : null}</label><label><span>Phiên bản *</span><input type="number" min="1" step="1" value={values.version} onChange={(event) => setValues((current) => ({ ...current, version: Number(event.target.value) }))} />{errors.version ? <small>{errors.version}</small> : null}</label></div><label><span>Nội dung thuần văn bản *</span><textarea rows={18} maxLength={50000} value={values.content} onChange={(event) => setValues((current) => ({ ...current, content: event.target.value }))} />{errors.content ? <small>{errors.content}</small> : null}</label><label className="admin-content-check"><input type="checkbox" checked={values.published} onChange={(event) => setValues((current) => ({ ...current, published: event.target.checked }))} /><span>Đã xuất bản</span></label><p className="admin-content-note">Trình soạn thảo văn bản đơn giản; không có Page Builder hoặc block layout.</p><footer><button type="button" onClick={() => setEditor(undefined)} disabled={isSubmitting}>Hủy</button><button className="is-primary" disabled={isSubmitting}>{isSubmitting ? 'Đang lưu...' : 'Lưu chính sách'}</button></footer></form></section></div> : null}</section>
}
