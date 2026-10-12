import type { SocialLinkSettings } from '../../types/admin-settings'

interface ContactSocialSettingsProps {
  settings: SocialLinkSettings
  errors: Record<string, string[]>
  onChange: (settings: SocialLinkSettings) => void
}

export function ContactSocialSettings({ settings, errors, onChange }: ContactSocialSettingsProps) {
  const fieldError = (name: string) => errors[name]?.[0]
  const facebook = settings.contactPopup.facebook
  const zalo = settings.contactPopup.zalo
  const facebookPreviewVisible = facebook.enabled && Boolean(facebook.link.trim())
  const zaloPreviewVisible = zalo.enabled && Boolean(zalo.link.trim() || zalo.phone.trim())

  return <div className="admin-contact-settings-layout admin-settings-contact-layout">
    <div className="admin-settings-contact-fields">
      <section aria-labelledby="facebook-settings-heading">
        <h2 id="facebook-settings-heading"><span className="contact-settings-brand is-facebook" aria-hidden="true">f</span>Facebook</h2>
        <div className="admin-settings-grid">
          <label>Tên hiển thị<input value={facebook.displayName} maxLength={100} placeholder="Daisy Shop" onChange={(event) => onChange({ ...settings, contactPopup: { ...settings.contactPopup, facebook: { ...facebook, displayName: event.target.value } } })} />{fieldError('social_links.contact_popup.facebook.display_name') ? <small>{fieldError('social_links.contact_popup.facebook.display_name')}</small> : null}</label>
          <label>Link Facebook / Messenger<input type="url" value={facebook.link} maxLength={2048} placeholder="https://m.me/daisy" onChange={(event) => onChange({ ...settings, contactPopup: { ...settings.contactPopup, facebook: { ...facebook, link: event.target.value } } })} />{fieldError('social_links.contact_popup.facebook.link') ? <small>{fieldError('social_links.contact_popup.facebook.link')}</small> : null}</label>
          <label className="admin-contact-settings-switch"><span>Trạng thái</span><button type="button" role="switch" aria-checked={facebook.enabled} className={facebook.enabled ? 'is-enabled' : ''} onClick={() => onChange({ ...settings, contactPopup: { ...settings.contactPopup, facebook: { ...facebook, enabled: !facebook.enabled } } })}><i aria-hidden="true" /><b>{facebook.enabled ? 'Bật' : 'Tắt'}</b></button></label>
        </div>
      </section>

      <section aria-labelledby="zalo-settings-heading">
        <h2 id="zalo-settings-heading"><span className="contact-settings-brand is-zalo" aria-hidden="true">Z</span>Zalo</h2>
        <div className="admin-settings-grid">
          <label>Tên hiển thị<input value={zalo.displayName} maxLength={100} placeholder="Daisy Shop" onChange={(event) => onChange({ ...settings, contactPopup: { ...settings.contactPopup, zalo: { ...zalo, displayName: event.target.value } } })} />{fieldError('social_links.contact_popup.zalo.display_name') ? <small>{fieldError('social_links.contact_popup.zalo.display_name')}</small> : null}</label>
          <label>Số điện thoại Zalo<input type="tel" value={zalo.phone} maxLength={20} placeholder="0901234567" onChange={(event) => onChange({ ...settings, contactPopup: { ...settings.contactPopup, zalo: { ...zalo, phone: event.target.value } } })} />{fieldError('social_links.contact_popup.zalo.phone') ? <small>{fieldError('social_links.contact_popup.zalo.phone')}</small> : null}</label>
          <label>Link Zalo <i>(nếu có)</i><input type="url" value={zalo.link} maxLength={2048} placeholder="https://zalo.me/0901234567" onChange={(event) => onChange({ ...settings, contactPopup: { ...settings.contactPopup, zalo: { ...zalo, link: event.target.value } } })} />{fieldError('social_links.contact_popup.zalo.link') ? <small>{fieldError('social_links.contact_popup.zalo.link')}</small> : null}</label>
          <label className="admin-contact-settings-switch"><span>Trạng thái</span><button type="button" role="switch" aria-checked={zalo.enabled} className={zalo.enabled ? 'is-enabled' : ''} onClick={() => onChange({ ...settings, contactPopup: { ...settings.contactPopup, zalo: { ...zalo, enabled: !zalo.enabled } } })}><i aria-hidden="true" /><b>{zalo.enabled ? 'Bật' : 'Tắt'}</b></button></label>
        </div>
      </section>

      <section aria-labelledby="social-settings-heading">
        <h2 id="social-settings-heading">Mạng xã hội khác</h2>
        <div className="admin-settings-grid">{(['instagram', 'tiktok', 'youtube'] as const).map((network) => <label key={network}>{network.charAt(0).toUpperCase() + network.slice(1)}<input type="url" value={settings[network]} maxLength={2048} onChange={(event) => onChange({ ...settings, [network]: event.target.value })} />{fieldError(`social_links.${network}`) ? <small>{fieldError(`social_links.${network}`)}</small> : null}</label>)}</div>
      </section>
    </div>

    <aside className="admin-contact-preview" aria-label="Xem trước popup liên hệ"><p>Xem trước</p><div><header><span>Hỗ trợ Daisy</span><h2>Bạn cần hỗ trợ?</h2></header>{facebookPreviewVisible || zaloPreviewVisible ? <section>
      {facebookPreviewVisible ? <article><span className="contact-settings-brand is-facebook" aria-hidden="true">f</span><div><strong>Facebook</strong><small>{facebook.displayName || 'Daisy Shop'}</small></div></article> : null}
      {zaloPreviewVisible ? <article><span className="contact-settings-brand is-zalo" aria-hidden="true">Z</span><div><strong>Zalo</strong><small>{zalo.displayName || zalo.phone || 'Daisy Shop'}</small></div></article> : null}
    </section> : <em>Bật ít nhất một kênh có thông tin liên hệ để hiển thị nút hỗ trợ.</em>}</div></aside>
  </div>
}
