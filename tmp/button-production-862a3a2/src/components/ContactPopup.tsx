import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { fetchContactPopup } from '../services/contact-popup'
import type { ContactPopupSettings } from '../types/contact-popup'
import './contact-popup.css'

export function ContactPopup() {
  const { pathname } = useLocation()
  const [settings, setSettings] = useState<ContactPopupSettings | null>(null)
  const [openPathname, setOpenPathname] = useState<string | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const toggleButtonRef = useRef<HTMLButtonElement>(null)
  const isOpen = openPathname === pathname

  useEffect(() => {
    let active = true
    void fetchContactPopup()
      .then((result) => { if (active) setSettings(result) })
      .catch(() => { if (active) setSettings(null) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    closeButtonRef.current?.focus()
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenPathname(null)
        toggleButtonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [isOpen])

  if (!settings) return null
  const facebookVisible = Boolean(settings.facebook.enabled && settings.facebook.link.trim())
  const zaloVisible = Boolean(settings.zalo.enabled && settings.zalo.link.trim())
  if (!facebookVisible && !zaloVisible) return null

  const closePopup = () => {
    setOpenPathname(null)
    toggleButtonRef.current?.focus()
  }

  return (
    <div className={`contact-popup-root ${isOpen ? 'is-open' : ''}`}>
      {isOpen ? <button type="button" className="contact-popup-backdrop" aria-label="Đóng cửa sổ hỗ trợ" onClick={closePopup} /> : null}
      {isOpen ? <section id="contact-support-popup" className="contact-popup-panel" role="dialog" aria-labelledby="contact-popup-title">
        <header><div><span>Hỗ trợ Daisy</span><h2 id="contact-popup-title">Bạn cần hỗ trợ?</h2></div><button ref={closeButtonRef} type="button" aria-label="Đóng" onClick={closePopup}>×</button></header>
        <div className="contact-popup-options">
          {facebookVisible ? <a href={settings.facebook.link} target="_blank" rel="noopener noreferrer" onClick={() => setOpenPathname(null)}><span className="contact-channel-icon is-facebook" aria-hidden="true">f</span><span><strong>Nhắn tin qua Facebook</strong><small>{settings.facebook.displayName || 'Facebook'}</small></span><i aria-hidden="true">→</i></a> : null}
          {zaloVisible ? <a href={settings.zalo.link} target="_blank" rel="noopener noreferrer" onClick={() => setOpenPathname(null)}><span className="contact-channel-icon is-zalo" aria-hidden="true">Z</span><span><strong>Nhắn tin qua Zalo</strong><small>{settings.zalo.displayName || settings.zalo.phone || 'Zalo'}</small></span><i aria-hidden="true">→</i></a> : null}
        </div>
      </section> : null}
      <button ref={toggleButtonRef} type="button" className="contact-popup-toggle" aria-label={isOpen ? 'Đóng cửa sổ hỗ trợ' : 'Mở cửa sổ hỗ trợ'} aria-expanded={isOpen} aria-controls="contact-support-popup" onClick={() => setOpenPathname(isOpen ? null : pathname)}>
        {isOpen ? <span aria-hidden="true">×</span> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.4a7.8 7.8 0 0 1-8 7.6 8.5 8.5 0 0 1-3.4-.7L4 20l1.4-4A7.3 7.3 0 0 1 4 11.4 7.8 7.8 0 0 1 12 4a7.8 7.8 0 0 1 8 7.4Z" /><path d="M8.5 11.5h.1m3.3 0h.1m3.3 0h.1" /></svg>}
      </button>
    </div>
  )
}
