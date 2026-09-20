import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { fetchAdminContact, listAdminContacts } from '../../services/admin/content'
import type { AdminContact, AdminContactCatalog } from '../../types/admin-content'
import './content-management.css'

const emptyCatalog: AdminContactCatalog = { contacts: [], currentPage: 1, lastPage: 1, total: 0 }

export function ContactManagementPage() {
  const { session } = useAuth()
  const [catalog, setCatalog] = useState(emptyCatalog)
  const [detail, setDetail] = useState<AdminContact | null>(null)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    if (!session) return
    void listAdminContacts(session.token, page).then((result) => { if (active) { setCatalog(result); setError(''); setIsLoading(false) } }).catch((requestError: unknown) => { if (active) { setError(requestError instanceof Error ? requestError.message : 'Không thể tải liên hệ.'); setIsLoading(false) } })
    return () => { active = false }
  }, [page, session])

  const openDetail = async (contact: AdminContact) => {
    if (!session) return
    try { setDetail(await fetchAdminContact(session.token, contact.id)) }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Không thể tải chi tiết liên hệ.') }
  }

  return <section className="admin-content-page"><header className="admin-content-heading"><div><p>Admin / Nội dung</p><h1>Contact Management</h1><span>{catalog.total} lời nhắn</span></div></header>{error ? <div className="admin-content-error" role="alert">{error}</div> : null}{isLoading ? <div className="admin-content-state">Đang tải liên hệ...</div> : !catalog.contacts.length ? <div className="admin-content-state">Chưa có lời nhắn.</div> : <div className="admin-content-table-wrap"><table className="admin-content-table"><thead><tr><th>Người gửi</th><th>Chủ đề</th><th>Thông tin</th><th>Ngày gửi</th><th><span className="sr-only">Thao tác</span></th></tr></thead><tbody>{catalog.contacts.map((contact) => <tr key={contact.id}><td><strong>{contact.name}</strong></td><td>{contact.subject}</td><td><div className="admin-content-stack"><span>{contact.email}</span><small>{contact.phone || 'Không có SĐT'}</small></div></td><td>{new Date(contact.createdAt).toLocaleString('vi-VN')}</td><td><button type="button" onClick={() => { void openDetail(contact) }}>Xem</button></td></tr>)}</tbody></table></div>}<nav className="admin-content-pagination"><button type="button" disabled={isLoading || catalog.currentPage <= 1} onClick={() => { setIsLoading(true); setPage((value) => value - 1) }}>Trang trước</button><span>Trang {catalog.currentPage}/{catalog.lastPage}</span><button type="button" disabled={isLoading || catalog.currentPage >= catalog.lastPage} onClick={() => { setIsLoading(true); setPage((value) => value + 1) }}>Trang sau</button></nav>{detail ? <div className="admin-content-form-layer" role="presentation" onMouseDown={() => setDetail(null)}><section className="admin-content-form-panel admin-contact-detail" role="dialog" aria-modal="true" aria-labelledby="contact-detail-title" onMouseDown={(event) => event.stopPropagation()}><header><h2 id="contact-detail-title">{detail.subject}</h2><button type="button" onClick={() => setDetail(null)}>×</button></header><dl><div><dt>Người gửi</dt><dd>{detail.name}</dd></div><div><dt>Email</dt><dd><a href={`mailto:${detail.email}`}>{detail.email}</a></dd></div><div><dt>Điện thoại</dt><dd>{detail.phone || 'Không cung cấp'}</dd></div><div><dt>Ngày gửi</dt><dd>{new Date(detail.createdAt).toLocaleString('vi-VN')}</dd></div><div><dt>Nội dung</dt><dd className="admin-contact-message">{detail.message}</dd></div></dl><p className="admin-content-note">Thông tin chỉ đọc; Phase 7 không tạo CRM workflow.</p></section></div> : null}</section>
}
