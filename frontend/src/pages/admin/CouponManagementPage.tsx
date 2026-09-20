import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../auth/useAuth'
import { AdminCouponRequestError, createAdminCoupon, listAdminCoupons, updateAdminCoupon } from '../../services/admin/coupons'
import type { AdminCoupon, AdminCouponCatalog, AdminCouponFormValues, CouponType } from '../../types/admin-coupon'
import { formatCurrency } from '../../utils/formatCurrency'
import './coupon-management.css'

type FieldErrors = Partial<Record<keyof AdminCouponFormValues, string>>

const emptyCatalog: AdminCouponCatalog = { coupons: [], currentPage: 1, lastPage: 1, total: 0 }
const emptyValues: AdminCouponFormValues = { code: '', type: 'percent', value: 1, minimumAmount: 0, startsAt: '', expiresAt: '', active: true }

function toLocalInput(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

function formValues(coupon: AdminCoupon | null): AdminCouponFormValues {
  return coupon ? {
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    minimumAmount: coupon.minimumAmount,
    startsAt: toLocalInput(coupon.startsAt),
    expiresAt: toLocalInput(coupon.expiresAt),
    usageLimit: coupon.usageLimit,
    perUserLimit: coupon.perUserLimit,
    active: coupon.active,
  } : emptyValues
}

function validate(values: AdminCouponFormValues): FieldErrors {
  const errors: FieldErrors = {}
  if (!values.code.trim()) errors.code = 'Mã giảm giá là bắt buộc.'
  else if (values.code.length > 50) errors.code = 'Mã giảm giá tối đa 50 ký tự.'
  if (!Number.isInteger(values.value) || values.value < 1) errors.value = 'Giá trị phải là số nguyên từ 1.'
  else if (values.type === 'percent' && values.value > 100) errors.value = 'Phần trăm giảm không được vượt quá 100.'
  if (!Number.isInteger(values.minimumAmount) || values.minimumAmount < 0) errors.minimumAmount = 'Đơn hàng tối thiểu phải là số nguyên không âm.'
  if (values.usageLimit != null && (!Number.isInteger(values.usageLimit) || values.usageLimit < 1)) errors.usageLimit = 'Giới hạn sử dụng phải là số nguyên từ 1.'
  if (values.perUserLimit != null && (!Number.isInteger(values.perUserLimit) || values.perUserLimit < 1)) errors.perUserLimit = 'Giới hạn mỗi khách phải là số nguyên từ 1.'
  if (values.startsAt && values.expiresAt && new Date(values.expiresAt) <= new Date(values.startsAt)) errors.expiresAt = 'Thời gian kết thúc phải sau thời gian bắt đầu.'
  return errors
}

const serverFieldMap: Record<keyof AdminCouponFormValues, string> = {
  code: 'code', type: 'type', value: 'value', minimumAmount: 'minimum_amount', startsAt: 'starts_at', expiresAt: 'expires_at', usageLimit: 'usage_limit', perUserLimit: 'per_user_limit', active: 'active',
}

export function CouponManagementPage() {
  const { session } = useAuth()
  const [catalog, setCatalog] = useState(emptyCatalog)
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [editor, setEditor] = useState<AdminCoupon | null | undefined>(undefined)
  const [values, setValues] = useState<AdminCouponFormValues>(emptyValues)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [backendErrors, setBackendErrors] = useState<Record<string, string[]>>({})

  useEffect(() => {
    let active = true
    if (!session) return
    void listAdminCoupons(session.token, page)
      .then((result) => { if (active) { setCatalog(result); setError(''); setIsLoading(false) } })
      .catch((requestError: unknown) => { if (active) { setError(requestError instanceof Error ? requestError.message : 'Không thể tải danh sách mã giảm giá.'); setIsLoading(false) } })
    return () => { active = false }
  }, [page, reloadKey, session])

  const openEditor = (coupon: AdminCoupon | null) => {
    setEditor(coupon)
    setValues(formValues(coupon))
    setFieldErrors({})
    setBackendErrors({})
  }

  const closeEditor = () => { if (!isSubmitting) setEditor(undefined) }
  const change = <K extends keyof AdminCouponFormValues>(field: K, value: AdminCouponFormValues[K]) => setValues((current) => ({ ...current, [field]: value }))
  const errorFor = (field: keyof AdminCouponFormValues) => fieldErrors[field] || backendErrors[serverFieldMap[field]]?.[0]

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const nextErrors = validate(values)
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length || !session) return
    setIsSubmitting(true)
    setBackendErrors({})
    try {
      if (editor) await updateAdminCoupon(session.token, editor.id, values)
      else await createAdminCoupon(session.token, values)
      setEditor(undefined)
      setIsLoading(true)
      setReloadKey((key) => key + 1)
    } catch (requestError) {
      if (requestError instanceof AdminCouponRequestError) {
        setBackendErrors(requestError.errors)
        if (!Object.keys(requestError.errors).length) setError(requestError.message)
      } else {
        setError(requestError instanceof Error ? requestError.message : 'Không thể lưu mã giảm giá.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleCoupon = async (coupon: AdminCoupon) => {
    if (!session) return
    try {
      await updateAdminCoupon(session.token, coupon.id, { ...formValues(coupon), active: !coupon.active })
      setIsLoading(true)
      setReloadKey((key) => key + 1)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể cập nhật trạng thái mã giảm giá.')
    }
  }

  return (
    <section className="admin-coupons-page">
      <header className="admin-coupons-heading"><div><p>Admin / Mã giảm giá</p><h1>Quản lý mã giảm giá</h1><span>{catalog.total} mã giảm giá</span></div><button type="button" onClick={() => openEditor(null)}>Tạo mã giảm giá</button></header>
      {error ? <div className="admin-coupons-error" role="alert">{error}<button type="button" onClick={() => { setError(''); setIsLoading(true); setReloadKey((key) => key + 1) }}>Thử lại</button></div> : null}
      {isLoading ? <div className="admin-coupon-state" aria-live="polite">Đang tải mã giảm giá...</div> : null}
      {!isLoading && !catalog.coupons.length ? <div className="admin-coupon-state">Chưa có mã giảm giá.</div> : null}
      {!isLoading && catalog.coupons.length ? <div className="admin-coupon-table-wrap"><table className="admin-coupon-table"><thead><tr><th>Mã</th><th>Giá trị</th><th>Điều kiện</th><th>Thời hạn</th><th>Sử dụng</th><th>Trạng thái</th><th><span className="sr-only">Thao tác</span></th></tr></thead><tbody>{catalog.coupons.map((coupon) => <tr key={coupon.id}><td><strong className="admin-coupon-code">{coupon.code}</strong></td><td>{coupon.type === 'percent' ? `${coupon.value}%` : formatCurrency(coupon.value)}</td><td><div className="admin-coupon-stack"><span>Tối thiểu {formatCurrency(coupon.minimumAmount)}</span><small>{coupon.perUserLimit ? `${coupon.perUserLimit} lần/khách` : 'Không giới hạn mỗi khách'}</small></div></td><td><div className="admin-coupon-stack"><span>{coupon.startsAt ? new Date(coupon.startsAt).toLocaleDateString('vi-VN') : 'Bắt đầu ngay'}</span><small>{coupon.expiresAt ? `Đến ${new Date(coupon.expiresAt).toLocaleDateString('vi-VN')}` : 'Không hết hạn'}</small></div></td><td><div className="admin-coupon-stack"><strong>{coupon.usedCount}{coupon.usageLimit ? `/${coupon.usageLimit}` : ''}</strong><small>{coupon.usagesCount} lượt ghi nhận</small></div></td><td><span className={`admin-coupon-status is-${coupon.active ? 'active' : 'inactive'}`}>{coupon.active ? 'Đang bật' : 'Đã tắt'}</span></td><td><div className="admin-coupon-actions"><button type="button" onClick={() => openEditor(coupon)}>Sửa</button><button type="button" onClick={() => { void toggleCoupon(coupon) }}>{coupon.active ? 'Tắt' : 'Bật'}</button></div></td></tr>)}</tbody></table></div> : null}
      <nav className="admin-coupon-pagination" aria-label="Phân trang mã giảm giá"><button type="button" disabled={isLoading || catalog.currentPage <= 1} onClick={() => { setIsLoading(true); setPage((value) => value - 1) }}>Trang trước</button><span>Trang {catalog.currentPage}/{catalog.lastPage}</span><button type="button" disabled={isLoading || catalog.currentPage >= catalog.lastPage} onClick={() => { setIsLoading(true); setPage((value) => value + 1) }}>Trang sau</button></nav>

      {editor !== undefined ? <div className="admin-coupon-form-layer" role="presentation" onMouseDown={closeEditor}><section className="admin-coupon-form-panel" role="dialog" aria-modal="true" aria-labelledby="admin-coupon-form-title" onMouseDown={(event) => event.stopPropagation()}><header><div><p>{editor ? 'Chỉnh sửa' : 'Tạo mới'}</p><h2 id="admin-coupon-form-title">{editor?.code ?? 'Mã giảm giá mới'}</h2></div><button type="button" onClick={closeEditor} aria-label="Đóng form">×</button></header><form onSubmit={(event) => { void submit(event) }} noValidate><div className="admin-coupon-form-grid"><label><span>Mã giảm giá *</span><input value={values.code} maxLength={50} onChange={(event) => change('code', event.target.value.toUpperCase())} />{errorFor('code') ? <small role="alert">{errorFor('code')}</small> : null}</label><label><span>Loại giảm giá *</span><select value={values.type} onChange={(event) => change('type', event.target.value as CouponType)}><option value="percent">Phần trăm</option><option value="fixed">Số tiền cố định</option></select></label><label><span>Giá trị *</span><input type="number" min="1" step="1" value={values.value} onChange={(event) => change('value', Number(event.target.value))} />{errorFor('value') ? <small role="alert">{errorFor('value')}</small> : null}</label><label><span>Đơn hàng tối thiểu</span><input type="number" min="0" step="1" value={values.minimumAmount} onChange={(event) => change('minimumAmount', Number(event.target.value))} />{errorFor('minimumAmount') ? <small role="alert">{errorFor('minimumAmount')}</small> : null}</label><label><span>Bắt đầu</span><input type="datetime-local" value={values.startsAt} onChange={(event) => change('startsAt', event.target.value)} />{errorFor('startsAt') ? <small role="alert">{errorFor('startsAt')}</small> : null}</label><label><span>Kết thúc</span><input type="datetime-local" value={values.expiresAt} onChange={(event) => change('expiresAt', event.target.value)} />{errorFor('expiresAt') ? <small role="alert">{errorFor('expiresAt')}</small> : null}</label><label><span>Giới hạn tổng lượt</span><input type="number" min="1" step="1" value={values.usageLimit ?? ''} onChange={(event) => change('usageLimit', event.target.value === '' ? undefined : Number(event.target.value))} />{errorFor('usageLimit') ? <small role="alert">{errorFor('usageLimit')}</small> : null}</label><label><span>Giới hạn mỗi khách</span><input type="number" min="1" step="1" value={values.perUserLimit ?? ''} onChange={(event) => change('perUserLimit', event.target.value === '' ? undefined : Number(event.target.value))} />{errorFor('perUserLimit') ? <small role="alert">{errorFor('perUserLimit')}</small> : null}</label></div><label className="admin-coupon-active"><input type="checkbox" checked={values.active} onChange={(event) => change('active', event.target.checked)} /><span>Mã giảm giá đang bật</span></label><footer><button type="button" onClick={closeEditor} disabled={isSubmitting}>Hủy</button><button className="is-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Đang lưu...' : 'Lưu mã giảm giá'}</button></footer></form></section></div> : null}
    </section>
  )
}
